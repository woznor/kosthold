function round1(value) {
  return Math.round((Number(value) || 0) * 10) / 10
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

export function createNutritionAuditEngine(foods, matching) {
  const aliasEntries = Object.entries(matching.aliases || {}).map(([key, value]) => [normalizeIngredient(key), value])
  const manualEntries = Object.entries(matching.manual || {}).map(([key, value]) => [normalizeIngredient(key), value])

  for (const [key, ref] of Object.entries(matching.sameAsAlias || {})) {
    const normalizedRef = normalizeIngredient(ref)
    const aliased = aliasEntries.find(([entryKey]) => entryKey === normalizedRef)
    if (aliased) {
      aliasEntries.push([normalizeIngredient(key), aliased[1]])
    }
  }

  for (const [key, ref] of Object.entries(matching.sameAsManual || {})) {
    const normalizedRef = normalizeIngredient(ref)
    const manual = manualEntries.find(([entryKey]) => entryKey === normalizedRef)
    if (manual) {
      manualEntries.push([normalizeIngredient(key), manual[1]])
    }
  }

  const aliasMap = new Map(aliasEntries)
  const manualMap = new Map(manualEntries)
  const skipSet = new Set((matching.skip || []).map(normalizeIngredient))
  const searchable = (foods || []).map((food) => ({
    food,
    normalizedName: normalizeIngredient(food.foodName),
  }))

  function getFoodByName(name) {
    const normalized = normalizeIngredient(name)
    return searchable.find((entry) => entry.normalizedName === normalized) || null
  }

  function findFood(rawName) {
    const normalized = normalizeIngredient(rawName)

    if (skipSet.has(normalized)) {
      return { matchType: 'ignored', entry: null }
    }

    if (manualMap.has(normalized)) {
      return { matchType: 'manual', entry: manualMap.get(normalized) }
    }

    const alias = aliasMap.get(normalized)
    if (alias) {
      const aliasHit = getFoodByName(alias)
      if (aliasHit) return { matchType: 'alias', entry: aliasHit }
    }

    const exactHit = getFoodByName(rawName)
    if (exactHit) return { matchType: 'exact', entry: exactHit }

    if (normalized.length >= 5) {
      const startsWithHits = searchable.filter((entry) => entry.normalizedName.startsWith(normalized))
      if (startsWithHits.length === 1) {
        return { matchType: 'single-prefix', entry: startsWithHits[0] }
      }

      const partialHits = searchable.filter(
        (entry) =>
          entry.normalizedName.includes(normalized) || normalized.includes(entry.normalizedName),
      )
      if (partialHits.length === 1) {
        return { matchType: 'single-partial', entry: partialHits[0] }
      }
    }

    return null
  }

  function buildMealAudit(meal) {
    const items = [...(meal.ingredients || []), ...(meal.protein_addons || [])]
    const matched = []
    const unmatched = []
    const ignored = []
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 }

    for (const item of items) {
      const match = findFood(item.text)

      if (!match) {
        unmatched.push(item.text)
        continue
      }

      if (match.matchType === 'ignored') {
        ignored.push(item.text)
        continue
      }

      if (match.matchType === 'manual' && !match.entry?.per100g) {
        unmatched.push(`${item.text} (manual)`)
        continue
      }

      const grams = Number(item.grams || 0)
      const contribution = {}
      for (const key of Object.keys(totals)) {
        if (match.matchType === 'manual') {
          contribution[key] = round1(Number(match.entry.per100g?.[key] || 0) * (grams / 100))
        } else {
          contribution[key] = round1(nutrientValue(match.entry.food, key) * (grams / 100))
        }
        totals[key] += contribution[key]
      }

      matched.push({
        ingredient: item.text,
        grams,
        matchedFood: match.matchType === 'manual'
          ? match.entry.label || 'Manual entry'
          : match.entry.food.foodName,
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
      fullyVerified: unmatched.length === 0,
    }
  }

  return {
    findFood,
    buildMealAudit,
  }
}

export function buildNutritionAuditReport(meals, foods, matching) {
  const engine = createNutritionAuditEngine(foods, matching)
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
      fullyVerified: mealResults.filter((meal) => meal.fullyVerified).length,
    },
    mealResults,
    unresolved: [...unresolvedCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'nb'))
      .map(([ingredient, count]) => ({ ingredient, count })),
  }
}
