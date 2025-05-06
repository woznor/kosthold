<template>
  <v-dialog
    v-model="store.addMealDialog"
    width="50vw"
    transition="dialog-transition"
  >
    <v-card>
      <v-card-title class="text-h6">  </v-card-title>

      <v-card-text>
        <v-form>
          <!-- Basic Fields -->
          <v-text-field v-model="meal.name" label="Name" outlined dense />

          <v-rating
            v-model.number="meal.rating"
            hover
            :length="5"
            :size="32"
            active-color="primary"
          />
          <v-text-field
            v-model.number="meal.portions"
            label="Posjoner"
            type="number"
            outlined
            dense
          />
          <v-checkbox
            v-model="meal.protein_powder"
            label="Inneholder retten proteinpulver som tilleg?"
          />
          <v-checkbox v-model="meal.heatable" label="Kan retten varmes?" />
          <v-checkbox v-model="meal.must_be_heated" label="Må retten varmes?" />

          <v-combobox
            v-model="meal.meal_category"
            :items="store.mealTypeMap"
            label="Måltidstype"
            outlined
            dense
            multiple
          />

          <!-- <v-select
              v-model="meal.meal_category"
              :items="store.mealTypeMap"
              label="Måltidskategori"
              outlined
              dense
            /> -->
          <!-- <v-text-field
              v-model="meal.meal_category_icon"
              label="Ikon"
              outlined
              dense
            /> -->

          <div class="">
            <q-editor 
              v-model="meal.procedure" 
              dark 
              label="Veiledning"
              />
          </div>

          <v-text-field
              class="ma-2"
              v-model="meal.image"
              label="Bilde URL"
              outlined
              dense
            />

          <!-- Ingredients -->
          <div class="mt-4" style="font-size: 20px;">Ingredienser</div>
          <div
            v-for="(ingredient, i) in meal.ingredients"
            :key="i"
            class="mb-2 pa-2"
            style="border: 1px solid #ccc; border-radius: 4px"
          >
            <v-autocomplete
              label="Navn"
              :items="store.ingredients"
              outlined
              dense
              v-model="ingredient.text"
              auto-select-first
            ></v-autocomplete>
            <v-autocomplete
              label="Type (ss, dl, g)"
              :items="store.ingredientUnits"
              outlined
              dense
              v-model="ingredient.type"
              auto-select-first
            ></v-autocomplete>
            <v-text-field
              v-model.number="ingredient.grams"
              label="Gram"
              type="number"
              outlined
              dense
            />
            <v-text-field
              v-model.number="ingredient.number"
              label="Antall fra type"
              type="number"
              outlined
              dense
            />
            <v-btn
              color="error"
              @click="removeIngredient(i)"
              variant="outlined"
            >
              Fjern
            </v-btn>
          </div>
          <v-btn color="primary" variant="outlined" @click="addIngredient">
            Legg til Ingrediens
          </v-btn>

          <!-- Protein Addons -->
          <div class="mt-4" style="font-size: 20px;">Tillegsprotein</div>
          <div
            v-for="(addon, i) in meal.protein_addons"
            :key="i"
            class="mb-2 pa-2"
            style="border: 1px solid #ccc; border-radius: 4px"
          >
            <v-text-field v-model="addon.text" label="Navn" outlined dense />
            <v-text-field
              v-model="addon.type"
              label="Type (ss, dl, g)"
              outlined
              dense
            />
            <v-text-field
              v-model.number="addon.grams"
              label="Gram"
              type="number"
              outlined
              dense
            />
            <v-text-field
              v-model.number="addon.number"
              label="Antall fra type"
              type="number"
              outlined
              dense
            />
            <v-btn
              color="error"
              @click="removeProteinAddon(i)"
              variant="outlined"
            >
              Fjern
            </v-btn>
          </div>
          <v-btn color="primary" variant="outlined" @click="addProteinAddon">
            Legg til Tillegsprotein
          </v-btn>

          <!-- Nutrients -->
          <div class="mt-4" style="font-size: 20px;">Næringsstoffer</div>
          <v-text-field
            v-model.number="meal.nutrients.calories"
            label="Kalorier"
            type="number"
            outlined
            dense
          />
          <v-text-field
            v-model.number="meal.nutrients.protein"
            label="Protein"
            type="number"
            outlined
            dense
          />
          <v-text-field
            v-model.number="meal.nutrients.carbs"
            label="Karbohydrater"
            type="number"
            outlined
            dense
          />
          <v-text-field
            v-model.number="meal.nutrients.fat"
            label="Fett"
            type="number"
            outlined
            dense
          />
          <v-text-field
            v-model.number="meal.nutrients.fibre"
            label="Fiber"
            type="number"
            outlined
            dense
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-btn color="success" @click="onSave"> Lagre </v-btn>
        <v-btn color="error" @click="store.addMealDialog = false"> Lukk </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from "vue";
import { useAppStore } from "../stores/app";

import { QEditor } from "quasar";

import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/dist/quasar.css'; // Ensure this line is included
import '@quasar/extras/material-icons/material-icons.css'; // Import material icons for the toolbar



// Pinia store
const store = useAppStore();

// Basic form structure:
const meal = ref({
  name: "",
  rating: 0,
  portions: 1,
  protein_powder: false,
  heatable: false,
  must_be_heated: false,
  meal_type: [],
  meal_category: "",
  meal_category_icon: "",
  procedure: "",
  image: "",
  date_time: "",
  ingredients: [],
  protein_addons: [],
  nutrients: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fibre: 0,
  },
  // We'll store a comma-separated string for meal_type in the UI:
  meal_typeStr: "",
});

// Example initialization, if you want to prefill the fields:
function initMeal() {
  meal.value = {
    name: "Brød med hvitost og kjøttpålegg",
    rating: 3,
    portions: 1,
    protein_powder: false,
    heatable: true,
    must_be_heated: false,
    meal_type: [0, 1, 3],
    meal_category: "",
    meal_category_icon: "mdi-bread-slice-outline",
    procedure: "Kan om ønskelig varmes i ovn ...",
    image: "https://...",
    date_time: "",
    ingredients: [
      { text: "magert kjøttpålegg", type: "skiver", grams: 44, number: 4 },
      { text: "hvitost", type: "skiver", grams: 26, number: 2 },
    ],
    protein_addons: [{ text: "Skyr", type: "boks", grams: 160, number: 1 }],
    nutrients: {
      calories: 400,
      protein: 41,
      carbs: 38,
      fat: 8,
      fibre: 0,
    },
    // Display meal_type as a string
    meal_typeStr: "0,1,3",
  };
}

// initMeal() // Uncomment if you want to auto-load data

function parseMealTypeString(str) {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number);
}

// Methods to add/remove items from arrays
function addIngredient() {
  meal.value.ingredients.push({ text: "", type: "", grams: 0, number: 0 });
}

function removeIngredient(index) {
  meal.value.ingredients.splice(index, 1);
}

function addProteinAddon() {
  meal.value.protein_addons.push({ text: "", type: "", grams: 0, number: 0 });
}

function removeProteinAddon(index) {
  meal.value.protein_addons.splice(index, 1);
}

// Save method
function onSave() {
  // Convert comma-separated string to array
  meal.value.meal_type = parseMealTypeString(meal.value.meal_typeStr);
  // Call a store action that posts data to the API (example name: store.saveMeal)
  store.saveMeal(meal.value);
}
</script>

<style scoped>
.mt-4 {
  margin-top: 1.5rem;
}
.mb-2 {
  margin-bottom: 0.75rem;
}
.pa-2 {
  padding: 0.75rem;
}
</style>
