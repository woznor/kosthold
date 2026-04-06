// Utilities
import { defineStore } from 'pinia'

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

function toMealCategories(meal, mealTypeMap) {
  if (Array.isArray(meal.meal_category)) {
    return meal.meal_category
  }

  if (Array.isArray(meal.meal_type)) {
    return meal.meal_type
      .map((num) => mealTypeMap[num])
      .filter(Boolean)
  }

  if (typeof meal.meal_category === 'string' && meal.meal_category) {
    return [meal.meal_category]
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

export const useAppStore = defineStore('app', {
  state: () => ({
    // Arrays:
    meals: [],
    baseMeals: [],
    exercises: null,
    ingredients: [],
    ingredientUnits: [],

    // Booleans:
    loading: false,

    // Filters:
    searchTerm: null,
    selectedMealType: null,
    portions: 1,

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

      return filtered
    },
  },

  actions: {
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
        scaledMeal(meal, this.portions, this.mealTypeMap)
      )
    },

    async loadMealsFromFile() {
      const response = await fetch('/meals.json')
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
        const response = await fetch('/excercise.json')
        this.exercises = await response.json()
      } catch (error) {
        console.error('Error fetching exercises:', error)
      }
    },

    deleteMeal(id) {
      this.baseMeals = this.baseMeals.filter((meal) => meal.id !== id)
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
