// Utilities
import { defineStore } from 'pinia'
import axios from 'axios'

const prefix = 'http://127.0.0.1:8000/'

export const useAppStore = defineStore('app', {
  state: () => ({
    //Arrays:
    meals: null,
    exercises: null,
    ingredients: null,
    ingredientUnits: null,

    //Booleans:
    loading: false,

    //Filters: 
    searchTerm: null,
    selectedMealType: null,
    portions: 1,

    //Select values:
    mealTypeMap: ['Frokost', 'Lunsj', 'Middag', 'Kveldsmat'],

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
    saveMeal(item) {
      axios.put(prefix+'add_meals', item)
        .then(response => {
          console.log(response.data);
        })
        .catch(error => {
          console.error(error);
        });
    },
    async fetchMeals() {
      try {
        const response = await axios.get(prefix+ 'all_meals', {
          params: {
            portions: this.portions
          }
        })

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

    //Deletes
    async deleteMeal(id) {
      try {
        const response = await axios.delete(prefix + 'meals/' + id)
        console.log(response.data)
  
        // Optionally remove the deleted meal from the local list
        this.meals = this.meals.filter(meal => meal.id !== id)
      } catch (error) {
        console.error('Error deleting meal:', error)
      }
    },




    //Distincts
    async fetchIngredients() {
      try {
        const response = await axios.get(prefix+ 'ingredients')
        this.ingredients = response.data
      } catch (error) {
        console.error('Error fetching meals:', error)
      }
    },
    async fetchIngredientUnits() {
      try {
        const response = await axios.get(prefix+ 'ingredient_unit')
        this.ingredientUnits = response.data
      } catch (error) {
        console.error('Error fetching units:', error)
      }
    },
  }
})
