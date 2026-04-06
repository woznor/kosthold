// Utilities
import { defineStore } from 'pinia'

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
    exercises: null,
    ingredients: [],
    ingredientUnits: [],
    mealPlan: {},
    hiddenShoppingItems: {},
    favoriteMealIds: [],

    // Booleans:
    loading: false,
    showFavoritesOnly: false,
    compactMobile: false,

    // Filters:
    searchTerm: null,
    selectedMealType: null,

    // Select values:
    mealTypeMap: ['Frokost', 'Lunsj', 'Middag', 'Kveldsmat'],

    // Dialogs:
    addMealDialog: false,

    // Login
    username: '',
    password: '',
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
      try {
        const raw = localStorage.getItem('hiddenShoppingItems')
        const parsed = raw ? JSON.parse(raw) : {}
        this.hiddenShoppingItems = parsed && typeof parsed === 'object' ? parsed : {}
      } catch (error) {
        console.error('Error loading hidden shopping items:', error)
        this.hiddenShoppingItems = {}
      }
    },

    persistHiddenShoppingItems() {
      localStorage.setItem('hiddenShoppingItems', JSON.stringify(this.hiddenShoppingItems))
    },

    loadFavorites() {
      try {
        const raw = localStorage.getItem('favoriteMealIds')
        const parsed = raw ? JSON.parse(raw) : []
        this.favoriteMealIds = Array.isArray(parsed)
          ? parsed.map((id) => Number(id)).filter((id) => Number.isInteger(id))
          : []
      } catch (error) {
        console.error('Error loading favorite meals:', error)
        this.favoriteMealIds = []
      }
    },

    persistFavorites() {
      localStorage.setItem('favoriteMealIds', JSON.stringify(this.favoriteMealIds))
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
      this.compactMobile = localStorage.getItem('compactMobile') === '1'
    },

    setShowFavoritesOnly(value) {
      this.showFavoritesOnly = Boolean(value)
      localStorage.setItem('showFavoritesOnly', this.showFavoritesOnly ? '1' : '0')
    },

    setCompactMobile(value) {
      this.compactMobile = Boolean(value)
      localStorage.setItem('compactMobile', this.compactMobile ? '1' : '0')
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
        const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : []

        ingredients.forEach((ingredient) => {
          if (ingredient?.text) ingredientSet.add(ingredient.text)
          if (ingredient?.type) unitSet.add(ingredient.type)
        })
      })

      this.ingredients = Array.from(ingredientSet).sort((a, b) => a.localeCompare(b))
      this.ingredientUnits = Array.from(unitSet).sort((a, b) => a.localeCompare(b))
    },

    updateRenderedMeals() {
      this.meals = this.baseMeals.map((meal) =>
        scaledMeal(meal, meal.portions, this.mealTypeMap)
      )
    },

    async loadMealsFromFile() {
      const response = await fetch(`${import.meta.env.BASE_URL}meals.json`)
      if (!response.ok) {
        throw new Error(`Failed to load meals.json (${response.status})`)
      }

      const payload = await response.json()
      this.baseMeals = Array.isArray(payload) ? payload : []
      this.recalculateMetadata()
    },

    saveMeal(item) {
      const currentMaxId = this.baseMeals.reduce((maxId, meal) => {
        return Math.max(maxId, Number(meal.id) || 0)
      }, 0)

      const categories = Array.isArray(item.meal_category)
        ? item.meal_category
        : item.meal_category
          ? [item.meal_category]
          : []

      const mappedMealType = categories
        .map((category) => this.mealTypeMap.indexOf(category))
        .filter((idx) => idx >= 0)

      const nextMeal = {
        ...item,
        id: currentMaxId + 1,
        meal_category: categories,
        meal_type: mappedMealType,
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
        protein_addons: Array.isArray(item.protein_addons) ? item.protein_addons : [],
        nutrients: item.nutrients || {},
        date_time: item.date_time || new Date().toISOString(),
      }

      this.baseMeals.push(nextMeal)
      this.recalculateMetadata()
      this.updateRenderedMeals()
      this.addMealDialog = false
    },

    async fetchMeals() {
      try {
        if (!this.baseMeals.length) {
          await this.loadMealsFromFile()
        }
        this.updateRenderedMeals()
      } catch (error) {
        console.error('Error fetching meals:', error)
      }
    },

    async fetchExcerises() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}excercise.json`)
        this.exercises = await response.json()
      } catch (error) {
        console.error('Error fetching exercises:', error)
      }
    },

    deleteMeal(id) {
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
