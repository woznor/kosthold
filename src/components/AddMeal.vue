<template>
  <v-dialog v-model="store.addMealDialog" max-width="980" transition="dialog-transition">
    <v-card class="add-meal-card">
      <v-card-title class="dialog-title">
        <div>
          <p class="kicker">Nytt måltid</p>
          <h2>Legg til måltid</h2>
        </div>
      </v-card-title>

      <v-card-text class="dialog-body">
        <div class="grid two-col">
          <v-text-field
            v-model="meal.name"
            label="Navn"
            variant="outlined"
            density="comfortable"
          />

          <v-text-field
            v-model="meal.image"
            label="Bilde-URL eller /meal-images/..."
            variant="outlined"
            density="comfortable"
          />

          <div class="rating-wrap">
            <span>Vurdering</span>
            <v-rating v-model.number="meal.rating" hover :length="5" :size="28" active-color="var(--app-accent)" />
          </div>

          <v-text-field
            v-model.number="meal.portions"
            label="Porsjoner"
            type="number"
            min="1"
            variant="outlined"
            density="comfortable"
          />

          <v-combobox
            v-model="meal.meal_category"
            :items="store.mealTypeMap"
            label="Måltidstype"
            variant="outlined"
            density="comfortable"
            multiple
            chips
            clearable
          />

          <v-text-field
            v-model="meal.meal_category_icon"
            label="Ikon (f.eks. mdi-pasta)"
            variant="outlined"
            density="comfortable"
          />
        </div>

        <div class="toggles">
          <v-checkbox v-model="meal.protein_powder" label="Har ekstra proteinpulver" density="compact" hide-details />
          <v-checkbox v-model="meal.heatable" label="Kan varmes" density="compact" hide-details />
          <v-checkbox v-model="meal.must_be_heated" label="M? varmes" density="compact" hide-details />
        </div>

        <section class="section">
          <h3>Fremgangsm?te</h3>
          <q-editor v-model="meal.procedure" class="editor" min-height="130px" />
        </section>

        <section class="section">
          <div class="section-head">
            <h3>Ingredienser</h3>
            <v-btn color="var(--app-primary)" variant="tonal" prepend-icon="mdi-plus" @click="addIngredient">
              Legg til
            </v-btn>
          </div>

          <div v-for="(ingredient, i) in meal.ingredients" :key="i" class="item-row">
            <div class="grid ingredient-grid">
              <v-autocomplete
                v-model="ingredient.text"
                label="Ingrediens"
                :items="store.ingredients"
                auto-select-first
                variant="outlined"
                density="comfortable"
              />
              <v-autocomplete
                v-model="ingredient.type"
                label="Type (ss, dl, g)"
                :items="store.ingredientUnits"
                auto-select-first
                variant="outlined"
                density="comfortable"
              />
              <v-text-field v-model.number="ingredient.number" label="Antall" type="number" variant="outlined" density="comfortable" />
              <v-text-field v-model.number="ingredient.grams" label="Gram" type="number" variant="outlined" density="comfortable" />
            </div>
            <v-btn color="#ba3d25" variant="text" prepend-icon="mdi-delete-outline" @click="removeIngredient(i)">Fjern</v-btn>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h3>Ekstra proteinkilder</h3>
            <v-btn color="var(--app-primary)" variant="tonal" prepend-icon="mdi-plus" @click="addProteinAddon">
              Legg til
            </v-btn>
          </div>

          <div v-for="(addon, i) in meal.protein_addons" :key="i" class="item-row">
            <div class="grid ingredient-grid">
              <v-text-field v-model="addon.text" label="Navn" variant="outlined" density="comfortable" />
              <v-text-field v-model="addon.type" label="Type (ss, dl, g)" variant="outlined" density="comfortable" />
              <v-text-field v-model.number="addon.number" label="Antall" type="number" variant="outlined" density="comfortable" />
              <v-text-field v-model.number="addon.grams" label="Gram" type="number" variant="outlined" density="comfortable" />
            </div>
            <v-btn color="#ba3d25" variant="text" prepend-icon="mdi-delete-outline" @click="removeProteinAddon(i)">Fjern</v-btn>
          </div>
        </section>

        <section class="section">
          <h3>N?ringsstoffer</h3>
          <div class="grid nutrients-grid">
            <v-text-field v-model.number="meal.nutrients.calories" label="Kalorier" type="number" variant="outlined" density="comfortable" />
            <v-text-field v-model.number="meal.nutrients.protein" label="Protein" type="number" variant="outlined" density="comfortable" />
            <v-text-field v-model.number="meal.nutrients.carbs" label="Karbohydrater" type="number" variant="outlined" density="comfortable" />
            <v-text-field v-model.number="meal.nutrients.fat" label="Fett" type="number" variant="outlined" density="comfortable" />
            <v-text-field v-model.number="meal.nutrients.fibre" label="Fiber" type="number" variant="outlined" density="comfortable" />
          </div>
        </section>
      </v-card-text>

      <v-card-actions class="dialog-actions">
        <v-btn color="var(--app-primary)" variant="flat" rounded="pill" @click="onSave">Lagre m?ltid</v-btn>
        <v-btn color="#ba3d25" variant="text" rounded="pill" @click="store.addMealDialog = false">Lukk</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { QEditor } from 'quasar'
import { useAppStore } from '../stores/app'

const store = useAppStore()

const emptyMeal = () => ({
  name: '',
  rating: 0,
  portions: 1,
  protein_powder: false,
  heatable: false,
  must_be_heated: false,
  meal_type: [],
  meal_category: [],
  meal_category_icon: '',
  procedure: '',
  image: '',
  date_time: '',
  ingredients: [],
  protein_addons: [],
  nutrients: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fibre: 0,
  },
})

const meal = ref(emptyMeal())

function addIngredient() {
  meal.value.ingredients.push({ text: '', type: '', grams: 0, number: 0 })
}

function removeIngredient(index) {
  meal.value.ingredients.splice(index, 1)
}

function addProteinAddon() {
  meal.value.protein_addons.push({ text: '', type: '', grams: 0, number: 0 })
}

function removeProteinAddon(index) {
  meal.value.protein_addons.splice(index, 1)
}

function onSave() {
  store.saveMeal(meal.value)
  meal.value = emptyMeal()
}
</script>

<style scoped>
.add-meal-card {
  border-radius: 20px;
  border: 1px solid var(--app-border);
  background: var(--app-card);
  color: var(--app-ink);
  max-height: min(88vh, 980px);
  overflow: auto;
}

.dialog-title {
  padding: 18px 22px 8px;
}

.kicker {
  margin: 0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--app-muted);
  font-weight: 700;
}

.dialog-title h2 {
  margin: 2px 0 0;
  font-size: 1.35rem;
  color: var(--app-ink);
}

.dialog-body {
  padding-top: 4px;
  display: grid;
  gap: 14px;
}

.dialog-body :deep(.v-field) {
  background: color-mix(in srgb, var(--app-card) 94%, transparent);
}

.dialog-body :deep(.v-field__input),
.dialog-body :deep(.v-label),
.dialog-body :deep(.v-icon),
.dialog-body :deep(.v-selection-control__wrapper),
.dialog-body :deep(.v-selection-control__input),
.dialog-body :deep(.v-selection-control .v-label) {
  color: var(--app-ink) !important;
  opacity: 1;
}

.dialog-body :deep(input::placeholder) {
  color: color-mix(in srgb, var(--app-ink) 65%, transparent);
}

.grid {
  display: grid;
  gap: 10px;
}

.two-col {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.rating-wrap {
  display: grid;
  align-content: center;
  gap: 6px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--app-bg-soft) 70%, transparent);
}

.rating-wrap span {
  font-size: 13px;
  font-weight: 700;
  color: var(--app-muted);
}

.toggles {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding: 4px 2px;
}

.section {
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 12px;
  background: color-mix(in srgb, var(--app-bg-soft) 70%, transparent);
}

.section h3 {
  margin: 0 0 10px;
  font-size: 0.95rem;
  color: var(--app-ink);
}

.editor :deep(.q-editor) {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-card);
}

.editor :deep(.q-editor__toolbar) {
  background: color-mix(in srgb, var(--app-bg-soft) 80%, transparent);
}

.editor :deep(.q-editor__content),
.editor :deep(.q-editor__toolbar .q-btn),
.editor :deep(.q-editor__toolbar .q-icon) {
  color: var(--app-ink);
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.item-row {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 10px;
  background: var(--app-card);
}

.ingredient-grid {
  grid-template-columns: 1.3fr 1fr 120px 120px;
}

.nutrients-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.dialog-actions {
  padding: 8px 22px 18px;
}

@media (max-width: 900px) {
  .two-col,
  .ingredient-grid,
  .nutrients-grid {
    grid-template-columns: 1fr;
  }
}
</style>
