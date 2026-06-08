// Utilities
import { defineStore } from 'pinia'
import { auth, isFirebaseConfigured } from '../services/firebase'
import {
  fetchAuditThresholdsFromFirestore,
  fetchIngredientCatalogFromFirestore,
  deleteMealFromFirestore,
  fetchMealsFromFirestore,
  fetchUserPlannerStateFromFirestore,
  saveAuditThresholdsToFirestore,
  saveIngredientCatalogToFirestore,
  saveMealToFirestore,
  saveUserPlannerStateToFirestore,
} from '../services/firestoreData'
import { AUDIT_DELTA_THRESHOLDS, buildNutritionAuditReport } from '../services/nutritionAudit'

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

function toMealCategoryName(value, mealTypeMap) {
  if (typeof value === 'number') {
    return mealTypeMap[value] || ''
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''

    const numeric = Number(trimmed)
    if (Number.isInteger(numeric) && mealTypeMap[numeric]) {
      return mealTypeMap[numeric]
    }

    return trimmed
  }

  return ''
}

function toMealCategories(meal, mealTypeMap) {
  if (Array.isArray(meal.meal_category)) {
    const categories = meal.meal_category
      .map((value) => toMealCategoryName(value, mealTypeMap))
      .filter(Boolean)
    if (categories.length) return categories
  }

  if (Array.isArray(meal.meal_type)) {
    const categories = meal.meal_type
      .map((value) => toMealCategoryName(value, mealTypeMap))
      .filter(Boolean)
    if (categories.length) return categories
  }

  if (typeof meal.meal_category === 'string' && meal.meal_category) {
    const category = toMealCategoryName(meal.meal_category, mealTypeMap)
    if (category) return [category]
  }

  return []
}

function scaledMeal(meal, portions, mealTypeMap) {
  const targetPortions = Math.max(1, Number(portions) || 1)
  const basePortions = Math.max(1, Number(meal.portions) || 1)
  const scale = targetPortions / basePortions

  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : []
  const proteinAddons = Array.isArray(meal.protein_addons) ? meal.protein_addons : []
  const nutrients = meal.nutrients || {}

  return {
    ...meal,
    portions: targetPortions,
    meal_category: toMealCategories(meal, mealTypeMap),
    ingredients: ingredients.map((ingredient) => ({
      ...ingredient,
      grams: round2(ingredient.grams * scale),
      number: round2(ingredient.number * scale),
    })),
    protein_addons: proteinAddons.map((addon) => ({
      ...addon,
      grams: round2(addon.grams * scale),
      number: round2(addon.number * scale),
    })),
    nutrients: {
      ...nutrients,
      calories: round2(nutrients.calories * scale),
      protein: round2(nutrients.protein * scale),
      carbs: round2(nutrients.carbs * scale),
      fat: round2(nutrients.fat * scale),
      fibre: round2(nutrients.fibre * scale),
    },
  }
}

function isoDateFromOffset(offset) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + offset)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function normalizeConversionText(value) {
  return normalizeKey(value)
}

function normalizeConversionUnit(value) {
  return normalizeKey(value)
}

function conversionKey(text, unit) {
  return `${normalizeConversionText(text)}__${normalizeConversionUnit(unit)}`
}

function toConversionEntry(entry = {}) {
  const text = String(entry.text || '').trim()
  const unit = String(entry.unit || entry.type || '').trim()
  const gramsPerUnit = round2(Number(entry.gramsPerUnit || 0))
  if (!text || !unit || !(gramsPerUnit > 0)) return null

  return {
    id: entry.id || conversionKey(text, unit),
    text,
    unit,
    gramsPerUnit,
    source: entry.source || 'manual',
    note: entry.note || '',
    count: Number(entry.count || 0),
  }
}

function foodNutrientValue(food, key) {
  if (!food || typeof food !== 'object') return 0
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

function normalizeIngredientDefinition(entry = {}) {
  const name = String(entry.name || entry.text || '').trim()
  if (!name) return null

  const units = Array.isArray(entry.units)
    ? entry.units
        .map((unitEntry) => {
          const unit = String(unitEntry?.unit || unitEntry?.type || '').trim()
          const gramsPerUnit = round2(Number(unitEntry?.gramsPerUnit || 0))
          if (!unit || !(gramsPerUnit > 0)) return null
          return {
            unit,
            gramsPerUnit,
            note: String(unitEntry?.note || '').trim(),
            source: unitEntry?.source || 'manual',
            count: Number(unitEntry?.count || 0),
          }
        })
        .filter(Boolean)
    : []

  const aliases = Array.isArray(entry.aliases)
    ? [...new Set(entry.aliases.map((value) => String(value || '').trim()).filter(Boolean))]
    : []

  const sourceType = ['matvaretabellen', 'custom', 'ignored'].includes(entry.sourceType)
    ? entry.sourceType
    : 'matvaretabellen'

  return {
    id: entry.id || normalizeKey(name),
    name,
    sourceType,
    foodName: String(entry.foodName || '').trim(),
    aliases,
    note: String(entry.note || '').trim(),
    nutrientsPer100g: {
      calories: round2(Number(entry.nutrientsPer100g?.calories || 0)),
      protein: round2(Number(entry.nutrientsPer100g?.protein || 0)),
      carbs: round2(Number(entry.nutrientsPer100g?.carbs || 0)),
      fat: round2(Number(entry.nutrientsPer100g?.fat || 0)),
      fibre: round2(Number(entry.nutrientsPer100g?.fibre || 0)),
    },
    units: units.sort((a, b) => a.unit.localeCompare(b.unit, 'nb')),
  }
}

function ingredientUnitKey(unit) {
  return normalizeConversionUnit(unit)
}

function buildIngredientCatalogFromMeals(meals = [], inferredConversions = []) {
  const definitions = new Map()

  const ensureDefinition = (name) => {
    const trimmed = String(name || '').trim()
    if (!trimmed) return null
    const key = normalizeKey(trimmed)
    if (!definitions.has(key)) {
      definitions.set(key, {
        id: key,
        name: trimmed,
        sourceType: 'custom',
        foodName: '',
        aliases: [],
        note: '',
        nutrientsPer100g: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fibre: 0,
        },
        units: [],
      })
    }
    return definitions.get(key)
  }

  ;(meals || []).forEach((meal) => {
    ;[...(meal.ingredients || []), ...(meal.protein_addons || [])].forEach((entry) => {
      const definition = ensureDefinition(entry?.text)
      const normalizedUnit = toConversionEntry({
        text: definition?.name,
        unit: entry?.type,
        gramsPerUnit: Number(entry?.number || 0) ? Number(entry?.grams || 0) / Number(entry?.number || 1) : 0,
        source: 'inferred',
      })

      if (!definition || !normalizedUnit) return
      if (!definition.units.some((unit) => ingredientUnitKey(unit.unit) === ingredientUnitKey(normalizedUnit.unit))) {
        definition.units.push({
          unit: normalizedUnit.unit,
          gramsPerUnit: normalizedUnit.gramsPerUnit,
          note: '',
          source: 'inferred',
          count: 1,
        })
      }
    })
  })

  ;(inferredConversions || []).forEach((entry) => {
    const definition = ensureDefinition(entry?.text)
    if (!definition) return
    if (!definition.units.some((unit) => ingredientUnitKey(unit.unit) === ingredientUnitKey(entry.unit))) {
      definition.units.push({
        unit: entry.unit,
        gramsPerUnit: entry.gramsPerUnit,
        note: entry.note || '',
        source: entry.source || 'inferred',
        count: Number(entry.count || 0),
      })
    }
  })

  return Array.from(definitions.values())
    .map(normalizeIngredientDefinition)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, 'nb'))
}

function deriveIngredientConversions(meals) {
  const buckets = new Map()

  const collect = (item) => {
    const text = String(item?.text || '').trim()
    const unit = String(item?.type || '').trim()
    const grams = Number(item?.grams || 0)
    const amount = Number(item?.number || 0)
    if (!text || !unit || !grams || !amount) return

    const key = conversionKey(text, unit)
    if (!buckets.has(key)) {
      buckets.set(key, {
        text,
        unit,
        values: [],
      })
    }

    buckets.get(key).values.push(grams / amount)
  }

  ;(meals || []).forEach((meal) => {
    ;(meal.ingredients || []).forEach(collect)
    ;(meal.protein_addons || []).forEach(collect)
  })

  return Array.from(buckets.entries())
    .map(([key, bucket]) => {
      const gramsPerUnit = round2(
        bucket.values.reduce((sum, value) => sum + value, 0) / bucket.values.length,
      )
      return {
        id: key,
        text: bucket.text,
        unit: bucket.unit,
        gramsPerUnit,
        source: 'inferred',
        note: '',
        count: bucket.values.length,
      }
    })
    .filter((entry) => entry.gramsPerUnit > 0)
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text, 'nb'))
}

function sanitizeRecipeEntry(entry = {}) {
  const next = {
    ...entry,
  }
  delete next.grams_auto
  return next
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizePlannedEntry(entry) {
  if (typeof entry === 'number' || typeof entry === 'string') {
    const mealId = toNumber(entry, NaN)
    if (Number.isNaN(mealId)) return null
    return { mealId, portions: 1 }
  }

  if (!entry || typeof entry !== 'object') return null

  const mealId = toNumber(entry.mealId ?? entry.id, NaN)
  if (Number.isNaN(mealId)) return null

  return {
    mealId,
    portions: Math.max(1, toNumber(entry.portions, 1)),
  }
}

function plannedEntriesForDate(mealPlan, date) {
  const source = Array.isArray(mealPlan[date]) ? mealPlan[date] : []
  return source.map(normalizePlannedEntry).filter(Boolean)
}

function includesDinnerType(meal, mealTypeMap) {
  const categories = toMealCategories(meal, mealTypeMap)
  return categories.includes('Middag')
}

export const useAppStore = defineStore('app', {
  state: () => ({
    // Arrays:
    meals: [],
    baseMeals: [],
    ingredients: [],
    ingredientUnits: [],
    nutritionAuditByMealId: {},
    nutritionAuditFoods: [],
    nutritionAuditFoodNames: [],
    ingredientCatalog: [],
    inferredIngredientConversions: [],
    auditThresholds: { ...AUDIT_DELTA_THRESHOLDS },
    mealPlan: {},
    hiddenShoppingItems: {},
    favoriteMealIds: [],

    // Booleans:
    loading: false,
    showFavoritesOnly: false,
    showUnverifiedOnly: false,
    compactMobile: false,

    // Filters:
    searchTerm: null,
    selectedMealType: null,

    // Select values:
    mealTypeMap: ['Frokost', 'Lunsj', 'Middag', 'Kveldsmat'],

    // Dialogs:
    addMealDialog: false,
    editingMealId: null,
  }),

  getters: {
    filteredMeals(state) {
      if (!state.meals) return []

      let filtered = state.meals

      if (state.searchTerm) {
        const lowerSearchTerm = state.searchTerm.toLowerCase()
        filtered = filtered.filter((meal) =>
          meal.name.toLowerCase().includes(lowerSearchTerm)
        )
      }

      if (state.selectedMealType) {
        filtered = filtered.filter((meal) =>
          Array.isArray(meal.meal_category) &&
          meal.meal_category.includes(state.selectedMealType)
        )
      }

      if (state.showFavoritesOnly) {
        filtered = filtered.filter((meal) => state.favoriteMealIds.includes(meal.id))
      }

      if (state.showUnverifiedOnly) {
        filtered = filtered.filter((meal) => !meal.verified)
      }

      filtered = [...filtered].sort((a, b) => {
        const favA = state.favoriteMealIds.includes(a.id)
        const favB = state.favoriteMealIds.includes(b.id)
        if (favA === favB) return 0
        return favA ? -1 : 1
      })

      return filtered
    },

    upcomingTwoWeeksPlan(state) {
      const mealSource = state.baseMeals.length ? state.baseMeals : state.meals
      const mealMap = new Map(mealSource.map((meal) => [meal.id, meal]))

      return Array.from({ length: 14 }, (_, index) => {
        const date = isoDateFromOffset(index)
        const meals = plannedEntriesForDate(state.mealPlan, date)
          .map((entry) => {
            const meal = mealMap.get(entry.mealId)
            if (!meal) return null
            return {
              ...meal,
              plannedPortions: entry.portions,
            }
          })
          .filter(Boolean)

        return {
          date,
          meals,
        }
      })
    },

    shoppingList(state) {
      const mealSource = state.baseMeals.length ? state.baseMeals : state.meals
      const mealMap = new Map(mealSource.map((meal) => [meal.id, meal]))
      const aggregateMap = new Map()

      const upcomingDates = Array.from({ length: 14 }, (_, index) => isoDateFromOffset(index))

      upcomingDates.forEach((date) => {
        const plannedEntries = plannedEntriesForDate(state.mealPlan, date)
        plannedEntries.forEach((entry) => {
          const meal = mealMap.get(entry.mealId)
          if (!meal) return

          const basePortions = Math.max(1, Number(meal.portions) || 1)
          const scale = entry.portions / basePortions
          const entries = [
            ...(Array.isArray(meal.ingredients) ? meal.ingredients : []),
            ...(Array.isArray(meal.protein_addons) ? meal.protein_addons : []),
          ]

          entries.forEach((entry) => {
            const text = String(entry?.text || '').trim()
            if (!text) return

            const type = String(entry?.type || '').trim()
            const key = `${normalizeKey(text)}__${normalizeKey(type)}`
            const grams = round2((Number(entry?.grams) || 0) * scale)
            const number = round2((Number(entry?.number) || 0) * scale)

            if (!aggregateMap.has(key)) {
              aggregateMap.set(key, {
                key,
                text,
                type,
                grams: 0,
                number: 0,
              })
            }

            const aggregate = aggregateMap.get(key)
            aggregate.grams = round2(aggregate.grams + grams)
            aggregate.number = round2(aggregate.number + number)
          })
        })
      })

      return Array.from(aggregateMap.values())
        .filter((item) => !state.hiddenShoppingItems[item.key])
        .sort((a, b) => a.text.localeCompare(b.text, 'nb'))
    },

    fullyMatchedMealIds(state) {
      return Object.values(state.nutritionAuditByMealId)
        .filter((audit) => audit?.fullyMatched)
        .map((audit) => audit.id)
    },

    auditFoodOptions(state) {
      return state.nutritionAuditFoodNames
    },

    ingredientOptions(state) {
      return state.ingredientEditorEntries.map((entry) => ({
        title: entry.name,
        value: entry.id,
      }))
    },

    allIngredientConversions(state) {
      return state.ingredientCatalog.flatMap((entry) =>
        (entry.units || []).map((unit) => ({
          id: conversionKey(entry.name, unit.unit),
          text: entry.name,
          unit: unit.unit,
          gramsPerUnit: unit.gramsPerUnit,
          note: unit.note || '',
          source: unit.source || 'manual',
          count: Number(unit.count || 0),
        })),
      )
        .sort((a, b) => a.text.localeCompare(b.text, 'nb') || a.unit.localeCompare(b.unit, 'nb'))
    },

    ingredientEditorEntries(state) {
      return state.ingredientCatalog
        .map((entry) => normalizeIngredientDefinition(entry))
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name, 'nb'))
    },

    pendingIngredientLinks(state) {
      const ingredientById = new Map(
        state.ingredientCatalog
          .filter((entry) => entry?.id)
          .map((entry) => [String(entry.id), entry]),
      )
      const ingredientByName = new Map(
        state.ingredientCatalog
          .filter((entry) => entry?.name)
          .map((entry) => [normalizeKey(entry.name), entry]),
      )

      const items = []

      state.baseMeals.forEach((meal) => {
        const groups = [
          { key: 'ingredients', sourceType: 'ingredient', entries: meal.ingredients || [] },
          { key: 'protein_addons', sourceType: 'protein_addon', entries: meal.protein_addons || [] },
        ]

        groups.forEach(({ key, sourceType, entries }) => {
          entries.forEach((entry, sourceIndex) => {
            const text = String(entry?.text || '').trim()
            const ingredientId = String(entry?.ingredientId || '').trim()
            const linkedDefinition = ingredientId ? ingredientById.get(ingredientId) : null
            if (linkedDefinition) return
            if (!text) return

            const suggestion = ingredientByName.get(normalizeKey(text)) || null
            items.push({
              key: `${meal.id}:${key}:${sourceIndex}`,
              mealId: meal.id,
              mealName: meal.name,
              sourceKey: key,
              sourceType,
              sourceIndex,
              text,
              type: String(entry?.type || '').trim(),
              grams: Number(entry?.grams || 0),
              number: Number(entry?.number || 0),
              suggestionId: suggestion?.id || '',
              suggestionName: suggestion?.name || '',
            })
          })
        })
      })

      return items.sort((a, b) =>
        a.mealName.localeCompare(b.mealName, 'nb') ||
        a.text.localeCompare(b.text, 'nb'),
      )
    },

    effectiveAuditThresholds(state) {
      return {
        ...AUDIT_DELTA_THRESHOLDS,
        ...(state.auditThresholds || {}),
      }
    },
  },

  actions: {
    loadMealPlan() {
      try {
        const raw = localStorage.getItem('mealPlan')
        const parsed = raw ? JSON.parse(raw) : {}
        if (!parsed || typeof parsed !== 'object') {
          this.mealPlan = {}
          return
        }

        const normalized = {}
        Object.entries(parsed).forEach(([date, values]) => {
          const entries = Array.isArray(values)
            ? values.map(normalizePlannedEntry).filter(Boolean)
            : []
          if (entries.length) normalized[date] = entries
        })
        this.mealPlan = normalized
      } catch (error) {
        console.error('Error loading meal plan:', error)
        this.mealPlan = {}
      }
    },

    persistMealPlan() {
      localStorage.setItem('mealPlan', JSON.stringify(this.mealPlan))
    },

    loadHiddenShoppingItems() {
      return this.loadUserPlannerState()
    },

    persistHiddenShoppingItems() {
      return this.persistUserPlannerState()
    },

    loadFavorites() {
      return this.loadUserPlannerState()
    },

    async loadUserPlannerState() {
      try {
        const uid = auth?.currentUser?.uid
        if (isFirebaseConfigured && uid) {
          const payload = await fetchUserPlannerStateFromFirestore(uid).catch(() => null)
          const favoriteMealIds = Array.isArray(payload?.favoriteMealIds)
            ? payload.favoriteMealIds.map((id) => Number(id)).filter((id) => Number.isInteger(id))
            : []
          const hiddenShoppingItems = payload?.hiddenShoppingItems && typeof payload.hiddenShoppingItems === 'object'
            ? payload.hiddenShoppingItems
            : {}

          this.favoriteMealIds = favoriteMealIds
          this.hiddenShoppingItems = hiddenShoppingItems
          return
        }

        const rawFavorites = localStorage.getItem('favoriteMealIds')
        const parsedFavorites = rawFavorites ? JSON.parse(rawFavorites) : []
        this.favoriteMealIds = Array.isArray(parsedFavorites)
          ? parsedFavorites.map((id) => Number(id)).filter((id) => Number.isInteger(id))
          : []

        const rawHidden = localStorage.getItem('hiddenShoppingItems')
        const parsedHidden = rawHidden ? JSON.parse(rawHidden) : {}
        this.hiddenShoppingItems = parsedHidden && typeof parsedHidden === 'object' ? parsedHidden : {}
      } catch (error) {
        console.error('Error loading planner state:', error)
        this.favoriteMealIds = []
        this.hiddenShoppingItems = {}
      }
    },

    persistFavorites() {
      return this.persistUserPlannerState()
    },

    async persistUserPlannerState() {
      try {
        const uid = auth?.currentUser?.uid
        if (isFirebaseConfigured && uid) {
          await saveUserPlannerStateToFirestore(uid, {
            favoriteMealIds: this.favoriteMealIds,
            hiddenShoppingItems: this.hiddenShoppingItems,
          })
          return
        }

        localStorage.setItem('favoriteMealIds', JSON.stringify(this.favoriteMealIds))
        localStorage.setItem('hiddenShoppingItems', JSON.stringify(this.hiddenShoppingItems))
      } catch (error) {
        console.error('Error saving planner state:', error)
      }
    },

    toggleFavoriteMeal(mealId) {
      if (this.favoriteMealIds.includes(mealId)) {
        this.favoriteMealIds = this.favoriteMealIds.filter((id) => id !== mealId)
      } else {
        this.favoriteMealIds = [...this.favoriteMealIds, mealId]
      }
      this.persistFavorites()
    },

    isFavorite(mealId) {
      return this.favoriteMealIds.includes(mealId)
    },

    loadUiPreferences() {
      this.showFavoritesOnly = localStorage.getItem('showFavoritesOnly') === '1'
      this.showUnverifiedOnly = localStorage.getItem('showUnverifiedOnly') === '1'
      this.compactMobile = localStorage.getItem('compactMobile') === '1'
    },

    setShowFavoritesOnly(value) {
      this.showFavoritesOnly = Boolean(value)
      localStorage.setItem('showFavoritesOnly', this.showFavoritesOnly ? '1' : '0')
    },

    setShowUnverifiedOnly(value) {
      this.showUnverifiedOnly = Boolean(value)
      localStorage.setItem('showUnverifiedOnly', this.showUnverifiedOnly ? '1' : '0')
    },

    setCompactMobile(value) {
      this.compactMobile = Boolean(value)
      localStorage.setItem('compactMobile', this.compactMobile ? '1' : '0')
    },

    async loadAuditThresholds() {
      try {
        const raw = await fetchAuditThresholdsFromFirestore().catch(() => null)
        this.auditThresholds = {
          ...AUDIT_DELTA_THRESHOLDS,
          ...(raw || {}),
        }
      } catch (error) {
        console.error('Error loading audit thresholds:', error)
        this.auditThresholds = { ...AUDIT_DELTA_THRESHOLDS }
      }
    },

    async saveAuditThresholds(thresholds) {
      this.auditThresholds = {
        ...AUDIT_DELTA_THRESHOLDS,
        ...(thresholds || {}),
      }

      if (isFirebaseConfigured) {
        await saveAuditThresholdsToFirestore(this.auditThresholds)
      }

      if (this.baseMeals.length && this.nutritionAuditFoods.length && this.ingredientCatalog.length) {
        await this.loadNutritionAudit()
        this.updateRenderedMeals()
      }
    },

    rebuildIngredientConversions() {
      this.inferredIngredientConversions = deriveIngredientConversions(this.baseMeals)
    },

    async ensureIngredientMatchingLoaded() {
      if (this.nutritionAuditFoods.length && this.ingredientCatalog.length) return
      await this.fetchMeals()
    },

    async loadIngredientCatalog() {
      try {
        const payload = await fetchIngredientCatalogFromFirestore().catch(() => null)
        const rawEntries = Array.isArray(payload?.entries) ? payload.entries : []

        if (rawEntries.length) {
          this.ingredientCatalog = rawEntries
            .map(normalizeIngredientDefinition)
            .filter(Boolean)
          return
        }

        this.ingredientCatalog = buildIngredientCatalogFromMeals(
          this.baseMeals,
          this.inferredIngredientConversions,
        )

        if (isFirebaseConfigured && this.ingredientCatalog.length) {
          await saveIngredientCatalogToFirestore(
            this.ingredientCatalog.map((entry) => normalizeIngredientDefinition(entry)),
          )
        }
      } catch (error) {
        console.error('Error loading ingredient catalog:', error)
        this.ingredientCatalog = []
      }
    },

    findIngredientDefinition(name) {
      const normalized = normalizeKey(name)
      return this.ingredientCatalog.find(
        (entry) => String(entry.id || '') === String(name || '') || normalizeKey(entry.name) === normalized,
      ) || null
    },

    findIngredientConversion(text, unit) {
      const definition = this.findIngredientDefinition(text)
      if (!definition) return null

      const unitEntry = (definition.units || []).find(
        (entry) => ingredientUnitKey(entry.unit) === ingredientUnitKey(unit),
      )
      if (!unitEntry) return null

      return {
        id: conversionKey(definition.name, unitEntry.unit),
        text: definition.name,
        unit: unitEntry.unit,
        gramsPerUnit: unitEntry.gramsPerUnit,
        note: unitEntry.note || '',
        source: unitEntry.source || 'manual',
        count: Number(unitEntry.count || 0),
      }
    },

    async saveIngredientDefinition(entry) {
      const normalized = normalizeIngredientDefinition(entry)
      if (!normalized) return

      const nextEntries = [...this.ingredientCatalog]
      const existingIndex = nextEntries.findIndex(
        (item) => normalizeKey(item.name) === normalizeKey(normalized.name),
      )

      if (existingIndex >= 0) {
        nextEntries.splice(existingIndex, 1, normalized)
      } else {
        nextEntries.push(normalized)
      }

      this.ingredientCatalog = nextEntries
      this.recalculateMetadata()

      if (isFirebaseConfigured) {
        await saveIngredientCatalogToFirestore(
          nextEntries.map((item) => normalizeIngredientDefinition(item)),
        )
      }

      if (this.baseMeals.length && this.nutritionAuditFoods.length) {
        await this.loadNutritionAudit()
        this.updateRenderedMeals()
      }
    },

    async linkRecipeIngredient({ mealId, sourceKey, sourceIndex, ingredientId }) {
      const mealIndex = this.baseMeals.findIndex((meal) => meal.id === mealId)
      const definition = this.findIngredientDefinition(ingredientId)
      if (mealIndex < 0 || !definition) return

      const meal = {
        ...this.baseMeals[mealIndex],
        ingredients: Array.isArray(this.baseMeals[mealIndex].ingredients)
          ? [...this.baseMeals[mealIndex].ingredients]
          : [],
        protein_addons: Array.isArray(this.baseMeals[mealIndex].protein_addons)
          ? [...this.baseMeals[mealIndex].protein_addons]
          : [],
      }

      const targetEntries = sourceKey === 'protein_addons' ? meal.protein_addons : meal.ingredients
      if (!targetEntries[sourceIndex]) return

      targetEntries[sourceIndex] = {
        ...targetEntries[sourceIndex],
        ingredientId: definition.id,
        text: definition.name,
      }

      this.baseMeals.splice(mealIndex, 1, meal)

      if (isFirebaseConfigured) {
        await saveMealToFirestore(meal)
      }

      this.recalculateMetadata()
      await this.loadNutritionAudit()
      this.updateRenderedMeals()
    },

    async createAndLinkRecipeIngredient({ mealId, sourceKey, sourceIndex, text, type, grams, number }) {
      const name = String(text || '').trim()
      if (!name) return

      const nextDefinition = normalizeIngredientDefinition({
        id: normalizeKey(name),
        name,
        sourceType: 'custom',
        nutrientsPer100g: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fibre: 0,
        },
        units: type && number && grams
          ? [{
              unit: type,
              gramsPerUnit: round2(Number(grams || 0) / Math.max(Number(number || 1), 1)),
              note: '',
              source: 'inferred',
              count: 1,
            }]
          : [],
      })

      await this.saveIngredientDefinition(nextDefinition)
      await this.linkRecipeIngredient({
        mealId,
        sourceKey,
        sourceIndex,
        ingredientId: nextDefinition.id,
      })
    },

    async deleteIngredientDefinition(name) {
      const nextEntries = this.ingredientCatalog.filter(
        (entry) => normalizeKey(entry.name) !== normalizeKey(name),
      )
      this.ingredientCatalog = nextEntries
      this.recalculateMetadata()

      if (isFirebaseConfigured) {
        await saveIngredientCatalogToFirestore(
          nextEntries.map((item) => normalizeIngredientDefinition(item)),
        )
      }

      if (this.baseMeals.length && this.nutritionAuditFoods.length) {
        await this.loadNutritionAudit()
        this.updateRenderedMeals()
      }
    },

    openMealEditor(mealId = null) {
      this.editingMealId = mealId
      this.addMealDialog = true
    },

    closeMealEditor() {
      this.addMealDialog = false
      this.editingMealId = null
    },

    removeShoppingItem(itemKey) {
      this.hiddenShoppingItems = {
        ...this.hiddenShoppingItems,
        [itemKey]: true,
      }
      this.persistHiddenShoppingItems()
    },

    resetShoppingList() {
      this.hiddenShoppingItems = {}
      this.persistHiddenShoppingItems()
    },

    autoPlanDinnerForTwoWeeks({ overwrite = false } = {}) {
      const dinnerMeals = this.baseMeals.filter((meal) => includesDinnerType(meal, this.mealTypeMap))
      if (!dinnerMeals.length) return

      const mealMap = new Map(this.baseMeals.map((meal) => [meal.id, meal]))
      const nextMealPlan = { ...this.mealPlan }
      const startOffset = Math.floor(Math.random() * dinnerMeals.length)

      Array.from({ length: 14 }, (_, index) => {
        const date = isoDateFromOffset(index)
        const current = overwrite ? [] : plannedEntriesForDate(nextMealPlan, date)

        const hasDinner = current.some((entry) => {
          const meal = mealMap.get(entry.mealId)
          return meal ? includesDinnerType(meal, this.mealTypeMap) : false
        })

        if (hasDinner) {
          nextMealPlan[date] = current
          return
        }

        const meal = dinnerMeals[(startOffset + index) % dinnerMeals.length]
        nextMealPlan[date] = [...current, { mealId: meal.id, portions: 1 }]
      })

      this.mealPlan = nextMealPlan
      this.persistMealPlan()
    },

    addMealToPlan(mealId, date, portions = 1) {
      if (!date) return

      const current = plannedEntriesForDate(this.mealPlan, date)
      const nextPortions = Math.max(1, Number(portions) || 1)
      const existingIndex = current.findIndex((entry) => entry.mealId === mealId)

      if (existingIndex >= 0) {
        current[existingIndex] = {
          ...current[existingIndex],
          portions: nextPortions,
        }
      } else {
        current.push({ mealId, portions: nextPortions })
      }

      this.mealPlan = {
        ...this.mealPlan,
        [date]: current,
      }
      this.persistMealPlan()
    },

    removeMealFromPlan(date, mealId) {
      const current = plannedEntriesForDate(this.mealPlan, date)
      const next = current.filter((entry) => entry.mealId !== mealId)

      if (next.length === 0) {
        const updated = { ...this.mealPlan }
        delete updated[date]
        this.mealPlan = updated
      } else {
        this.mealPlan = {
          ...this.mealPlan,
          [date]: next,
        }
      }

      this.persistMealPlan()
    },

    recalculateMetadata() {
      const ingredientSet = new Set()
      const unitSet = new Set()

      this.baseMeals.forEach((meal) => {
        const entries = [
          ...(Array.isArray(meal.ingredients) ? meal.ingredients : []),
          ...(Array.isArray(meal.protein_addons) ? meal.protein_addons : []),
        ]

        entries.forEach((ingredient) => {
          if (ingredient?.text) ingredientSet.add(ingredient.text)
          if (ingredient?.type) unitSet.add(ingredient.type)
        })
      })

      this.ingredientCatalog.forEach((entry) => {
        if (entry?.name) ingredientSet.add(entry.name)
        ;(entry.units || []).forEach((unitEntry) => {
          if (unitEntry?.unit) unitSet.add(unitEntry.unit)
        })
      })

      this.ingredients = Array.from(ingredientSet).sort((a, b) => a.localeCompare(b, 'nb'))
      this.ingredientUnits = Array.from(unitSet).sort((a, b) => a.localeCompare(b, 'nb'))
      this.rebuildIngredientConversions()
    },

    updateRenderedMeals() {
      this.meals = this.baseMeals.map((meal) => ({
        ...scaledMeal(meal, meal.portions, this.mealTypeMap),
        nutritionAudit: this.nutritionAuditByMealId[meal.id] || null,
      }))
    },

    async loadNutritionAudit() {
      try {
        const foodsResponse = await fetch(`${import.meta.env.BASE_URL}matvaretabellen.json`)

        if (!foodsResponse.ok) {
          throw new Error(`Failed to load matvaretabellen.json (${foodsResponse.status})`)
        }

        const foodsPayload = await foodsResponse.json()
        const foods = Array.isArray(foodsPayload.foods) ? foodsPayload.foods : []
        this.nutritionAuditFoods = foods
        if (!this.ingredientCatalog.length) {
          await this.loadIngredientCatalog()
        }
        this.nutritionAuditFoodNames = foods
          .map((food) => food.foodName)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, 'nb'))
        const report = buildNutritionAuditReport(
          this.baseMeals,
          foods,
          this.ingredientCatalog,
          this.effectiveAuditThresholds,
        )

        this.nutritionAuditByMealId = Object.fromEntries(
          report.mealResults.map((meal) => [meal.id, meal]),
        )
      } catch (error) {
        console.error('Error loading nutrition audit:', error)
        this.nutritionAuditFoods = []
        this.nutritionAuditFoodNames = []
        this.nutritionAuditByMealId = {}
      }
    },

    previewMealAudit(meal) {
      if (!meal || !this.nutritionAuditFoods.length || !this.ingredientCatalog.length) return null
      const report = buildNutritionAuditReport(
        [meal],
        this.nutritionAuditFoods,
        this.ingredientCatalog,
        this.effectiveAuditThresholds,
      )
      return report.mealResults[0] || null
    },

    async loadMealsFromFile() {
      const firestoreMeals = await fetchMealsFromFirestore().catch(() => null)
      if (Array.isArray(firestoreMeals) && firestoreMeals.length) {
        this.baseMeals = firestoreMeals
        this.recalculateMetadata()
        return
      }

      const response = await fetch(`${import.meta.env.BASE_URL}meals.json`)
      if (!response.ok) {
        throw new Error(`Failed to load meals.json (${response.status})`)
      }

      const payload = await response.json()
      this.baseMeals = Array.isArray(payload) ? payload : []
      this.recalculateMetadata()
    },

    async saveMeal(item) {
      const currentMaxId = this.baseMeals.reduce((maxId, meal) => {
        return Math.max(maxId, Number(meal.id) || 0)
      }, 0)
      const existingId = Number(item.id)
      const nextId = Number.isInteger(existingId) && existingId > 0 ? existingId : currentMaxId + 1

      const categories = Array.isArray(item.meal_category)
        ? item.meal_category
        : item.meal_category
          ? [item.meal_category]
          : []

      const mappedMealType = categories
        .map((category) => this.mealTypeMap.indexOf(category))
        .filter((idx) => idx >= 0)

      const withIngredientIds = (entry) => {
        const definition = this.findIngredientDefinition(entry?.ingredientId || entry?.text || '')
        return sanitizeRecipeEntry({
          ...entry,
          ingredientId: definition?.id || '',
          text: definition?.name || String(entry?.text || '').trim(),
        })
      }

      const nextMeal = {
        ...item,
        id: nextId,
        meal_category: categories,
        meal_type: mappedMealType,
        ingredients: Array.isArray(item.ingredients)
          ? item.ingredients.map(withIngredientIds)
          : [],
        protein_addons: Array.isArray(item.protein_addons)
          ? item.protein_addons.map(withIngredientIds)
          : [],
        nutrients: item.nutrients || {},
        verified: Boolean(item.verified),
        verifiedAt: item.verified ? (item.verifiedAt || new Date().toISOString()) : null,
        date_time: item.date_time || new Date().toISOString(),
      }

      if (isFirebaseConfigured) {
        await saveMealToFirestore(nextMeal)
      }

      const existingIndex = this.baseMeals.findIndex((meal) => meal.id === nextMeal.id)
      if (existingIndex >= 0) {
        this.baseMeals.splice(existingIndex, 1, nextMeal)
      } else {
        this.baseMeals.push(nextMeal)
      }
      this.recalculateMetadata()
      await this.loadNutritionAudit()
      this.updateRenderedMeals()
      this.closeMealEditor()
    },

    async fetchMeals() {
      try {
        if (!this.baseMeals.length) {
          await this.loadMealsFromFile()
        }
        if (!this.ingredientCatalog.length) {
          await this.loadIngredientCatalog()
        }
        await this.loadAuditThresholds()
        await this.loadNutritionAudit()
        this.recalculateMetadata()
        this.updateRenderedMeals()
      } catch (error) {
        console.error('Error fetching meals:', error)
      }
    },

    async deleteMeal(id) {
      if (isFirebaseConfigured) {
        await deleteMealFromFirestore(id)
      }

      this.baseMeals = this.baseMeals.filter((meal) => meal.id !== id)
      this.favoriteMealIds = this.favoriteMealIds.filter((mealId) => mealId !== id)
      this.persistFavorites()
      const updatedPlan = {}

      Object.entries(this.mealPlan).forEach(([date, mealIds]) => {
        const kept = plannedEntriesForDate(this.mealPlan, date)
          .filter((entry) => entry.mealId !== id)
        if (kept.length) updatedPlan[date] = kept
      })

      this.mealPlan = updatedPlan
      this.persistMealPlan()
      this.recalculateMetadata()
      await this.loadNutritionAudit()
      this.updateRenderedMeals()
    },

    async fetchIngredients() {
      if (!this.baseMeals.length) await this.fetchMeals()
      this.recalculateMetadata()
    },

    async fetchIngredientUnits() {
      if (!this.baseMeals.length) await this.fetchMeals()
      this.recalculateMetadata()
    },
  },
})
