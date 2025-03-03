// Utilities
import { defineStore } from 'pinia'
import axios from 'axios'

export const useAppStore = defineStore('app', {
  state: () => ({
    //Arrays:
    meals: null,
    exercises: null,

    //Booleans:
    loading: false,

    //Filters: 
    searchTerm: null,
    selectedMealType: null,

    //Select values:
    mealTypeMap:  ['Frokost', 'Lunsj', 'Middag', 'Kveldsmat'],

    //Dialogs:
    addMealDialog: false,

    //Login
    username: "",
    password: ""

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
    async fetchExcerises() {
      try {
        const response = await axios.get('/excercise.json')
        this.exercises = response.data
        console.log(this.meals)
      } catch (error) {
        console.error('Error fetching meals:', error)
      }
    },
  }
})
