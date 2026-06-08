<template>
  <v-dialog v-model="dialogModel" max-width="980" transition="dialog-transition">
    <v-card class="add-meal-card">
      <v-card-title class="dialog-title">
        <div>
          <p class="kicker">{{ isEditing ? 'Rydd oppskrift' : 'Nytt måltid' }}</p>
          <h2>{{ isEditing ? 'Rediger måltid' : 'Legg til måltid' }}</h2>
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
            <v-rating
              v-model.number="meal.rating"
              hover
              :length="5"
              :size="28"
              active-color="var(--app-accent)"
            />
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
          <v-checkbox v-model="meal.must_be_heated" label="Må varmes" density="compact" hide-details />
          <v-checkbox v-model="meal.verified" label="Verifisert av meg" density="compact" hide-details />
        </div>

        <section class="section audit-section">
          <div class="section-head">
            <h3>Matvaretabellen-kontroll</h3>
            <v-btn
              color="var(--app-primary)"
              variant="flat"
              prepend-icon="mdi-calculator-variant"
              :disabled="!draftAudit"
              @click="useCalculatedNutrients"
            >
              Bruk beregnede verdier
            </v-btn>
          </div>

          <p class="audit-copy">
            Rydd først ingrediensene og velg eventuelle overstyringer, så kan vi oppdatere lagrede næringsverdier direkte fra Matvaretabellen.
          </p>

          <div class="verification-row">
            <div class="verification-copy">
              <strong>{{ meal.verified ? 'Oppskriften er markert som verifisert' : 'Oppskriften er ikke markert som verifisert ennå' }}</strong>
              <small v-if="meal.verifiedAt">Sist verifisert {{ formatVerificationDate(meal.verifiedAt) }}</small>
            </div>
            <v-btn
              :color="meal.verified ? '#ba3d25' : 'var(--app-primary)'"
              :variant="meal.verified ? 'text' : 'flat'"
              prepend-icon="mdi-check-decagram"
              @click="toggleVerified"
            >
              {{ meal.verified ? 'Fjern verifisering' : 'Marker som verifisert' }}
            </v-btn>
          </div>

          <div v-if="draftAudit" class="audit-status">
            <span :class="['audit-pill', matchPill.className]">{{ matchPill.text }}</span>
            <span :class="['audit-pill', deviationPill.className]">{{ deviationPill.text }}</span>
          </div>

          <div v-if="draftAudit" class="audit-grid">
            <div v-for="entry in auditRows" :key="entry.key" class="audit-row">
              <span class="audit-label">{{ entry.label }}</span>
              <strong>{{ entry.calculated }} / {{ entry.saved }}</strong>
              <small :class="['audit-delta', entry.className]">{{ entry.delta }}</small>
            </div>
          </div>

          <div v-if="draftAudit?.unmatched?.length" class="audit-note is-warning">
            Mangler mapping: {{ draftAudit.unmatched.join(', ') }}
          </div>

          <div v-else-if="draftAudit && !draftAudit.isCloseToSaved" class="audit-note is-review">
            Oppskriften er fullt matchet, men noen næringsverdier avviker fortsatt mer enn ønsket toleranse.
          </div>

          <div v-else-if="draftAudit" class="audit-note is-good">
            Oppskriften er fullt matchet og ligger innenfor valgt toleranse.
          </div>
        </section>

        <section class="section">
          <h3>Fremgangsmåte</h3>
          <q-editor v-model="meal.procedure" class="editor" min-height="130px" />
        </section>

        <section class="section">
          <div class="section-head">
            <h3>Ingredienser</h3>
            <v-btn color="var(--app-primary)" variant="tonal" prepend-icon="mdi-plus" @click="addIngredient">
              Legg til
            </v-btn>
          </div>

          <div
            v-for="(ingredient, i) in meal.ingredients"
            :key="`ingredient-${i}`"
            :class="['item-row', { 'is-highlighted-off': isHighlightedEntry('ingredient', i, ingredient) }]"
          >
            <div class="item-header">
              <strong>Ingrediens {{ i + 1 }}</strong>
              <small>Antall og enhet er for matlaging. Gram brukes i næringsberegningen.</small>
            </div>

            <div v-if="isHighlightedEntry('ingredient', i, ingredient)" class="off-badge">
              {{ highlightReason('ingredient', i, ingredient) }}
            </div>

            <div class="grid ingredient-grid">
              <v-autocomplete
                :model-value="ingredient.ingredientId"
                label="Ingrediens"
                :items="store.ingredientOptions"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="comfortable"
                @update:model-value="selectIngredientDefinition(ingredient, $event)"
              />
              <v-autocomplete
                :model-value="ingredient.type"
                label="Enhet"
                :items="store.ingredientUnits"
                auto-select-first
                variant="outlined"
                density="comfortable"
                @update:model-value="updateEntryField(ingredient, 'type', $event)"
              />
              <v-text-field
                :model-value="ingredient.number"
                label="Antall"
                type="number"
                variant="outlined"
                density="comfortable"
                hint="Praktisk mengde du faktisk bruker"
                persistent-hint
                @update:model-value="updateEntryField(ingredient, 'number', $event, { autoConvert: true })"
              />
              <v-text-field
                :model-value="ingredient.grams"
                label="Gram"
                type="number"
                variant="outlined"
                density="comfortable"
                hint="Brukes til Matvaretabellen-beregning"
                persistent-hint
                @update:model-value="updateGramsField(ingredient, $event)"
              />
            </div>

            <div class="conversion-meta">
              {{ conversionSummary(ingredient) }}
            </div>

            <div class="match-meta">
              {{ ingredientAuditSummary('ingredient', i) }}
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

          <div
            v-for="(addon, i) in meal.protein_addons"
            :key="`addon-${i}`"
            :class="['item-row', { 'is-highlighted-off': isHighlightedEntry('protein_addon', i, addon) }]"
          >
            <div class="item-header">
              <strong>Proteinkilde {{ i + 1 }}</strong>
              <small>Antall og enhet er for matlaging. Gram brukes i næringsberegningen.</small>
            </div>

            <div v-if="isHighlightedEntry('protein_addon', i, addon)" class="off-badge">
              {{ highlightReason('protein_addon', i, addon) }}
            </div>

            <div class="grid ingredient-grid">
              <v-autocomplete
                :model-value="addon.ingredientId"
                label="Ingrediens"
                :items="store.ingredientOptions"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="comfortable"
                @update:model-value="selectIngredientDefinition(addon, $event)"
              />
              <v-autocomplete
                :model-value="addon.type"
                label="Enhet"
                :items="store.ingredientUnits"
                variant="outlined"
                density="comfortable"
                @update:model-value="updateEntryField(addon, 'type', $event)"
              />
              <v-text-field
                :model-value="addon.number"
                label="Antall"
                type="number"
                variant="outlined"
                density="comfortable"
                hint="Praktisk mengde du faktisk bruker"
                persistent-hint
                @update:model-value="updateEntryField(addon, 'number', $event, { autoConvert: true })"
              />
              <v-text-field
                :model-value="addon.grams"
                label="Gram"
                type="number"
                variant="outlined"
                density="comfortable"
                hint="Brukes til Matvaretabellen-beregning"
                persistent-hint
                @update:model-value="updateGramsField(addon, $event)"
              />
            </div>

            <div class="conversion-meta">
              {{ conversionSummary(addon) }}
            </div>

            <div class="match-meta">
              {{ ingredientAuditSummary('protein_addon', i) }}
            </div>

            <v-btn color="#ba3d25" variant="text" prepend-icon="mdi-delete-outline" @click="removeProteinAddon(i)">Fjern</v-btn>
          </div>
        </section>

        <section class="section">
          <h3>Næringsstoffer</h3>
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
        <v-btn color="var(--app-primary)" variant="flat" rounded="pill" @click="onSave">
          {{ isEditing ? 'Lagre endringer' : 'Lagre måltid' }}
        </v-btn>
        <v-btn color="#ba3d25" variant="text" rounded="pill" @click="closeDialog">Lukk</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { QEditor } from 'quasar'
import { AUDIT_DELTA_THRESHOLDS, createNutritionAuditEngine } from '../services/nutritionAudit'
import { useAppStore } from '../stores/app'

const store = useAppStore()

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

const emptyMeal = () => ({
  id: null,
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
  verified: false,
  verifiedAt: null,
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

function cloneMeal(source) {
  return {
    ...emptyMeal(),
    ...JSON.parse(JSON.stringify(source || emptyMeal())),
    meal_category: Array.isArray(source?.meal_category) ? [...source.meal_category] : [],
    ingredients: Array.isArray(source?.ingredients)
      ? source.ingredients.map((ingredient) => ({
          ...ingredient,
          ingredientId: ingredient.ingredientId || store.findIngredientDefinition(ingredient.text)?.id || '',
          grams_auto: false,
        }))
      : [],
    protein_addons: Array.isArray(source?.protein_addons)
      ? source.protein_addons.map((addon) => ({
          ...addon,
          ingredientId: addon.ingredientId || store.findIngredientDefinition(addon.text)?.id || '',
          grams_auto: false,
        }))
      : [],
    nutrients: {
      ...emptyMeal().nutrients,
      ...(source?.nutrients || {}),
    },
  }
}

const meal = ref(emptyMeal())

const dialogModel = computed({
  get: () => store.addMealDialog,
  set: (value) => {
    if (!value) closeDialog()
  },
})

const isEditing = computed(() => Number.isInteger(store.editingMealId))

const auditEngine = computed(() => {
  if (!store.nutritionAuditFoods.length || !store.ingredientCatalog.length) return null
  return createNutritionAuditEngine(store.nutritionAuditFoods, store.ingredientCatalog)
})

const draftAudit = computed(() => {
  if (!auditEngine.value) return null
  return auditEngine.value.buildMealAudit(meal.value)
})

const matchedLookup = computed(() => {
  const lookup = new Map()
  for (const entry of draftAudit.value?.matched || []) {
    lookup.set(`${entry.sourceType}:${entry.sourceIndex}`, entry)
  }
  return lookup
})

const highlightedEntryKey = computed(() => {
  if (!draftAudit.value) return ''

  const unmatchedKey = firstUnmatchedEntryKey()
  if (unmatchedKey) return unmatchedKey

  const mismatchKeys = Array.isArray(draftAudit.value.mismatchKeys) && draftAudit.value.mismatchKeys.length
    ? draftAudit.value.mismatchKeys
    : ['calories', 'protein', 'carbs', 'fat']

  let bestKey = ''
  let bestScore = -1

  for (const entry of draftAudit.value.matched || []) {
    const score = mismatchKeys.reduce((total, key) => {
      const delta = Math.abs(Number(draftAudit.value.delta?.[key] || 0))
      const threshold = Number(draftAudit.value.thresholds?.[key] || AUDIT_DELTA_THRESHOLDS[key] || 1)
      const contribution = Number(entry.contribution?.[key] || 0)
      if (!delta || !contribution) return total
      return total + (delta / Math.max(threshold, 1)) * contribution
    }, 0)

    if (score > bestScore) {
      bestScore = score
      bestKey = `${entry.sourceType}:${entry.sourceIndex}`
    }
  }

  return bestKey
})

const matchPill = computed(() => ({
  text: draftAudit.value?.fullyMatched ? 'Fullt matchet' : 'Manglende mapping',
  className: draftAudit.value?.fullyMatched ? 'is-good' : 'is-warning',
}))

const deviationPill = computed(() => {
  if (draftAudit.value?.isCloseToSaved) {
    return { text: 'Nær lagrede verdier', className: 'is-good' }
  }

  const level = draftAudit.value?.deviationLevel
  return {
    text: {
      small: 'Lite avvik',
      medium: 'Noe avvik',
      large: 'Store avvik',
    }[level] || 'Store avvik',
    className: {
      small: 'is-small',
      medium: 'is-medium',
      large: 'is-off',
    }[level] || 'is-off',
  }
})

const auditRows = computed(() => {
  if (!draftAudit.value) return []

  return [
    { key: 'calories', label: 'Kcal' },
    { key: 'protein', label: 'Protein' },
    { key: 'carbs', label: 'Karb' },
    { key: 'fat', label: 'Fett' },
  ].map((row) => {
    const delta = Number(draftAudit.value.delta?.[row.key] || 0)
    const threshold = AUDIT_DELTA_THRESHOLDS[row.key]
    return {
      ...row,
      calculated: draftAudit.value.calculated?.[row.key] ?? 0,
      saved: draftAudit.value.saved?.[row.key] ?? 0,
      delta: `${delta > 0 ? '+' : ''}${Math.round(delta * 10) / 10} diff`,
      className: Math.abs(delta) <= threshold ? 'is-good' : 'is-off',
    }
  })
})

function ingredientAuditSummary(sourceType, sourceIndex) {
  const match = matchedLookup.value.get(`${sourceType}:${sourceIndex}`)
  if (match) {
    const label = {
      'ingredient-id': 'koblet til ingrediensregisteret',
      'ingredient-name': 'matchet via navn',
    }[match.matchType] || match.matchType
    return `Bruker ${match.matchedFood} (${label}).`
  }

  return 'Ingen sikker ingredienskobling ennå. Velg en ingrediens fra registeret.'
}

function firstUnmatchedEntryKey() {
  const sources = [
    { entries: meal.value.ingredients || [], sourceType: 'ingredient' },
    { entries: meal.value.protein_addons || [], sourceType: 'protein_addon' },
  ]

  for (const { entries, sourceType } of sources) {
    for (let index = 0; index < entries.length; index += 1) {
      const text = String(entries[index]?.text || '').trim()
      if (text && !matchedLookup.value.has(`${sourceType}:${index}`)) {
        return `${sourceType}:${index}`
      }
    }
  }

  return ''
}

function isHighlightedEntry(sourceType, sourceIndex, entry) {
  if (!draftAudit.value) return false
  if (!String(entry?.text || '').trim()) return false
  return highlightedEntryKey.value === `${sourceType}:${sourceIndex}`
}

function highlightReason(sourceType, sourceIndex) {
  const key = `${sourceType}:${sourceIndex}`
  if (!matchedLookup.value.has(key)) {
    return 'Trenger sjekk: mangler trygg mapping'
  }

  if (!draftAudit.value?.isCloseToSaved) {
    return 'Trenger sjekk: størst utslag i avviket'
  }

  return 'Viktig ingrediens i beregningen'
}

function resetMeal() {
  meal.value = emptyMeal()
}

function initializeMeal() {
  if (!store.addMealDialog) return

  const source = isEditing.value
    ? store.baseMeals.find((item) => item.id === store.editingMealId)
    : null

  meal.value = cloneMeal(source)
}

function closeDialog() {
  resetMeal()
  store.closeMealEditor()
}

function addIngredient() {
  meal.value.ingredients.push({ ingredientId: '', text: '', type: '', grams: 0, number: 0, grams_auto: false })
}

function removeIngredient(index) {
  meal.value.ingredients.splice(index, 1)
}

function addProteinAddon() {
  meal.value.protein_addons.push({ ingredientId: '', text: '', type: '', grams: 0, number: 0, grams_auto: false })
}

function removeProteinAddon(index) {
  meal.value.protein_addons.splice(index, 1)
}

function useCalculatedNutrients() {
  if (!draftAudit.value) return
  meal.value.nutrients = {
    ...meal.value.nutrients,
    ...draftAudit.value.calculated,
  }
}

function toggleVerified() {
  meal.value.verified = !meal.value.verified
  meal.value.verifiedAt = meal.value.verified ? new Date().toISOString() : null
}

function formatVerificationDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function conversionForEntry(entry) {
  return store.findIngredientConversion(entry?.ingredientId || entry?.text, entry?.type)
}

function selectIngredientDefinition(entry, ingredientId) {
  const definition = store.findIngredientDefinition(ingredientId)
  entry.ingredientId = definition?.id || ''
  entry.text = definition?.name || ''
  applyAutoConversion(entry)
}

function applyAutoConversion(entry) {
  const conversion = conversionForEntry(entry)
  const number = Number(entry?.number || 0)
  if (!conversion || !number) return

  entry.grams = round2(number * conversion.gramsPerUnit)
  entry.grams_auto = true
}

function updateEntryField(entry, field, value, { autoConvert = true } = {}) {
  if (!entry) return

  if (field === 'number') {
    entry[field] = Number(value || 0)
  } else {
    entry[field] = value
  }

  if (autoConvert && ['text', 'type', 'number'].includes(field)) {
    applyAutoConversion(entry)
  }
}

function updateGramsField(entry, value) {
  if (!entry) return
  entry.grams = Number(value || 0)
  entry.grams_auto = false
}

function conversionSummary(entry) {
  const conversion = conversionForEntry(entry)
  if (!entry?.text && !entry?.type) {
    return 'Velg ingrediens og enhet for å kunne bruke kjente antall -> gram-konverteringer.'
  }

  if (!conversion) {
    return 'Ingen kjent konvertering ennå. Du kan fortsatt skrive inn gram manuelt eller legge til en konvertering i Admin.'
  }

  const autoText = entry?.grams_auto ? ` Automatisk satt til ${entry.grams} g.` : ''
  return `Kjent konvertering: 1 ${conversion.unit} ${conversion.text} = ${conversion.gramsPerUnit} g.${autoText}`
}

async function onSave() {
  await store.saveMeal(meal.value)
  resetMeal()
}

watch(
  () => [store.addMealDialog, store.editingMealId],
  () => {
    if (store.addMealDialog) {
      initializeMeal()
    }
  },
  { immediate: true },
)
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
  gap: 14px;
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
  padding: 16px;
  background: color-mix(in srgb, var(--app-bg-soft) 70%, transparent);
}

.section h3 {
  margin: 0 0 10px;
  font-size: 0.95rem;
  color: var(--app-ink);
}

.audit-section {
  background: linear-gradient(180deg, color-mix(in srgb, var(--app-card) 65%, #f7f1df), color-mix(in srgb, var(--app-bg-soft) 75%, transparent));
}

.audit-copy {
  margin: 0 0 12px;
  color: var(--app-muted);
  font-size: 13px;
}

.verification-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: color-mix(in srgb, var(--app-card) 90%, transparent);
  margin-bottom: 12px;
}

.verification-copy {
  display: grid;
  gap: 4px;
}

.verification-copy strong {
  color: var(--app-ink);
  font-size: 13px;
}

.verification-copy small {
  color: var(--app-muted);
}

.audit-status {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.audit-pill {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.audit-pill.is-good {
  background: #e1f2e2;
  color: #24522f;
}

.audit-pill.is-warning {
  background: #f8e8bb;
  color: #815600;
}

.audit-pill.is-small {
  background: #f5edcf;
  color: #7d6511;
}

.audit-pill.is-medium {
  background: #f6dfca;
  color: #9b5c16;
}

.audit-pill.is-off {
  background: #f8ddd5;
  color: #8c3425;
}

.audit-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.audit-row {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 10px;
  background: var(--app-card);
  display: grid;
  gap: 4px;
}

.audit-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--app-muted);
  text-transform: uppercase;
}

.audit-delta.is-good {
  color: #24522f;
}

.audit-delta.is-off {
  color: #8c3425;
}

.audit-note {
  margin-top: 12px;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
}

.audit-note.is-good {
  background: #ebf7ec;
  color: #24522f;
}

.audit-note.is-review {
  background: #fff2e8;
  color: #8a4a1e;
}

.audit-note.is-warning {
  background: #fff7de;
  color: #7d6511;
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
  gap: 12px;
  margin-bottom: 10px;
}

.item-row {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 14px;
  background: var(--app-card);
}

.item-row.is-highlighted-off {
  border-color: #e7b79f;
  box-shadow: 0 0 0 2px rgba(186, 61, 37, 0.08);
  background: linear-gradient(180deg, rgba(255, 247, 242, 0.95), var(--app-card));
}

.item-header {
  display: grid;
  gap: 2px;
  margin-bottom: 10px;
}

.item-header strong {
  font-size: 13px;
  color: var(--app-ink);
}

.item-header small {
  color: var(--app-muted);
  font-size: 12px;
}

.off-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f8ddd5;
  color: #8c3425;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.03em;
  margin-bottom: 12px;
}

.ingredient-grid {
  grid-template-columns: 1.3fr 1fr 120px 120px;
}

.match-field {
  margin-top: 10px;
}

.conversion-meta,
.match-meta {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--app-muted);
  font-weight: 600;
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
  .nutrients-grid,
  .audit-grid {
    grid-template-columns: 1fr;
  }

  .section-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .verification-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
