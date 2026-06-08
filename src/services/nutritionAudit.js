function round1(value) {
  return Math.round((Number(value) || 0) * 10) / 10
}

export const AUDIT_DELTA_THRESHOLDS = {
  calories: 60,
  protein: 7,
  carbs: 7,
  fat: 6,
}

function withThresholdDefaults(thresholds = {}) {
  return {
    ...AUDIT_DELTA_THRESHOLDS,
    ...thresholds,
  }
}

export function normalizeIngredient(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9%]+/g, ' ')
    .trim()
}

function nutrientValue(food, key) {
  if (key === 'calories') return Number(food.calories?.quantity || 0)

  const nutrientIds = {
    protein: ['Protein'],
    carbs: ['Karbo'],
    fat: ['Fett'],
    fibre: ['Kostfiber', 'Fiber'],
  }[key]

  const constituent = (food.constituents || []).find((item) => nutrientIds.includes(item.nutrientId))
  return Number(constituent?.quantity || 0)
}

function isCloseToSaved(delta, thresholds) {
  return Object.entries(thresholds).every(
    ([key, threshold]) => Math.abs(Number(delta?.[key] || 0)) <= threshold,
  )
}

function deviationLevel(delta, thresholds) {
  const worstRatio = Math.max(
    ...Object.entries(thresholds).map(([key, threshold]) => {
      const value = Math.abs(Number(delta?.[key] || 0))
      return threshold ? value / threshold : 0
    }),
  )

  if (worstRatio <= 1) return 'none'
  if (worstRatio <= 1.35) return 'small'
  if (worstRatio <= 1.75) return 'medium'
  return 'large'
}

function mismatchKeys(delta, thresholds) {
  return Object.entries(thresholds)
    .filter(([key, threshold]) => Math.abs(Number(delta?.[key] || 0)) > threshold)
    .map(([key]) => key)
}

function foodLookupByName(foods) {
  return new Map(
    (foods || [])
      .filter((food) => String(food?.foodName || '').trim())
      .map((food) => [normalizeIngredient(food.foodName), food]),
  )
}

function ingredientLookupById(ingredientCatalog) {
  return new Map(
    (ingredientCatalog || [])
      .filter((entry) => String(entry?.id || '').trim())
      .map((entry) => [String(entry.id).trim(), entry]),
  )
}

function ingredientLookupByName(ingredientCatalog) {
  return new Map(
    (ingredientCatalog || [])
      .filter((entry) => String(entry?.name || '').trim())
      .map((entry) => [normalizeIngredient(entry.name), entry]),
  )
}

export function createNutritionAuditEngine(foods, ingredientCatalog, thresholds) {
  const auditThresholds = withThresholdDefaults(thresholds)
  const foodsByName = foodLookupByName(foods)
  const ingredientsById = ingredientLookupById(ingredientCatalog)
  const ingredientsByName = ingredientLookupByName(ingredientCatalog)

  function findIngredient(item) {
    const ingredientId = String(item?.ingredientId || '').trim()
    if (ingredientId && ingredientsById.has(ingredientId)) {
      return { matchType: 'ingredient-id', entry: ingredientsById.get(ingredientId) }
    }

    const text = String(item?.text || '').trim()
    if (!text) return null

    const normalized = normalizeIngredient(text)
    if (ingredientsByName.has(normalized)) {
      return { matchType: 'ingredient-name', entry: ingredientsByName.get(normalized) }
    }

    return null
  }

  function nutrientContribution(definition, grams, key) {
    if (definition.sourceType === 'custom') {
      return round1(Number(definition.nutrientsPer100g?.[key] || 0) * (grams / 100))
    }

    if (definition.sourceType === 'matvaretabellen') {
      const food = foodsByName.get(normalizeIngredient(definition.foodName || definition.name))
      return round1(nutrientValue(food, key) * (grams / 100))
    }

    return 0
  }

  function buildMealAudit(meal) {
    const items = [
      ...(meal.ingredients || []).map((item, index) => ({
        ...item,
        sourceType: 'ingredient',
        sourceIndex: index,
      })),
      ...(meal.protein_addons || []).map((item, index) => ({
        ...item,
        sourceType: 'protein_addon',
        sourceIndex: index,
      })),
    ]
    const matched = []
    const unmatched = []
    const ignored = []
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 }

    for (const item of items) {
      const match = findIngredient(item)

      if (!match) {
        unmatched.push(item.text)
        continue
      }

      if (match.entry?.sourceType === 'ignored') {
        ignored.push(item.text)
        continue
      }

      if (match.entry?.sourceType === 'matvaretabellen' && !foodsByName.has(normalizeIngredient(match.entry.foodName || match.entry.name))) {
        unmatched.push(item.text)
        continue
      }

      const grams = Number(item.grams || 0)
      const contribution = {}
      for (const key of Object.keys(totals)) {
        contribution[key] = nutrientContribution(match.entry, grams, key)
        totals[key] += contribution[key]
      }

      matched.push({
        ingredient: item.text,
        ingredientId: match.entry?.id || '',
        grams,
        sourceType: item.sourceType,
        sourceIndex: item.sourceIndex,
        matchedFood: match.entry?.sourceType === 'custom'
          ? match.entry.name
          : match.entry?.foodName || match.entry?.name || item.text,
        matchType: match.matchType,
        contribution,
      })
    }

    const calculated = Object.fromEntries(
      Object.entries(totals).map(([key, value]) => [key, round1(value)]),
    )
    const saved = meal.nutrients || {}
    const delta = Object.fromEntries(
      Object.keys(calculated).map((key) => [key, round1(calculated[key] - Number(saved[key] || 0))]),
    )

    return {
      id: meal.id,
      name: meal.name,
      coverage: items.length ? Math.round((matched.length / items.length) * 100) : 0,
      matchedCount: matched.length,
      totalItems: items.length,
      matched,
      unmatched,
      ignored,
      calculated,
      saved,
      delta,
      fullyMatched: unmatched.length === 0,
      isCloseToSaved: isCloseToSaved(delta, auditThresholds),
      deviationLevel: deviationLevel(delta, auditThresholds),
      mismatchKeys: mismatchKeys(delta, auditThresholds),
      thresholds: auditThresholds,
    }
  }

  return {
    findIngredient,
    buildMealAudit,
  }
}

export function buildNutritionAuditReport(meals, foods, ingredientCatalog, thresholds) {
  const engine = createNutritionAuditEngine(foods, ingredientCatalog, thresholds)
  const unresolvedCounts = new Map()

  const mealResults = (meals || []).map((meal) => {
    const result = engine.buildMealAudit(meal)
    result.unmatched.forEach((ingredient) => {
      unresolvedCounts.set(ingredient, (unresolvedCounts.get(ingredient) || 0) + 1)
    })
    return result
  })

  return {
    summary: {
      totalMeals: mealResults.length,
      mealsWithAnyMatches: mealResults.filter((meal) => meal.matchedCount > 0).length,
      mealsAtLeastHalfMatched: mealResults.filter((meal) => meal.coverage >= 50).length,
      mealsAtLeast75Matched: mealResults.filter((meal) => meal.coverage >= 75).length,
      fullyMatched: mealResults.filter((meal) => meal.fullyMatched).length,
      closeToSaved: mealResults.filter((meal) => meal.isCloseToSaved).length,
    },
    mealResults,
    unresolved: [...unresolvedCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'nb'))
      .map(([ingredient, count]) => ({ ingredient, count })),
  }
}
