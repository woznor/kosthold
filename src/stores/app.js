// Utilities
import { defineStore } from 'pinia'
import axios from 'axios'

export const useAppStore = defineStore('app', {
  state: () => ({
    meals: null,
    loadng: false,
    selection: 1,
    searchTerm: null,
    selectedMealType: null,
    mealTypeMap:  ['Frokost', 'Lunsj', 'Middag', 'Kveldsmat']

    //
  }),
  getters: {
    filteredMeals(state) {
      // If no meals, return nothing
      if (!state.meals) return []

      let filtered = state.meals

      // 1. Filter by searchTerm (name)
      if (state.searchTerm) {
        const lowerSearchTerm = state.searchTerm.toLowerCase()
        filtered = filtered.filter(meal =>
          meal.name.toLowerCase().includes(lowerSearchTerm)
        )
      }

      // 2. Filter by selectedMealType
      if (state.selectedMealType) {
        filtered = filtered.filter(meal =>
          Array.isArray(meal.meal_category) &&
          meal.meal_category.includes(state.selectedMealType)
        )
      }

      return filtered
    }
  },
  actions: {
    async fetchMeals() {
      try {
        const response = await axios.get('/meals.json')
        // If you're removing the first item:
        response.data.shift()
    
        // Loop directly over each object in response.data
        response.data.forEach(meal => {
          if (Array.isArray(meal.meal_type)) {
            meal.meal_category = meal.meal_type.map(num => this.mealTypeMap[num])
          }
        })
    
        this.meals = response.data
        console.log(this.meals)
      } catch (error) {
        console.error('Error fetching meals:', error)
      }
    },

    reserve() {
      this.loading = true

      setTimeout(() => (this.loading = false), 2000)
    },

  }
})
