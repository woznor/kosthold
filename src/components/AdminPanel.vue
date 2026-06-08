<template>
  <div class="admin-layout">
    <v-tabs v-model="tab" class="admin-tabs" color="var(--app-primary)">
      <v-tab value="access">Tilganger</v-tab>
      <v-tab value="ingredients">Ingredienser</v-tab>
      <v-tab value="thresholds">Avvik</v-tab>
    </v-tabs>

    <v-card v-if="tab === 'access'" class="admin-card" elevation="0">
      <v-card-item>
        <v-card-title class="admin-title">Tilganger</v-card-title>
        <v-card-subtitle>Whitelist for prosjektet</v-card-subtitle>
      </v-card-item>

      <v-card-text class="admin-body">
        <form class="email-form roomy-form" @submit.prevent="addEmail">
          <v-text-field
            v-model="emailInput"
            label="E-post"
            type="email"
            variant="outlined"
            density="comfortable"
            hide-details
          />
          <v-btn
            color="var(--app-primary)"
            variant="flat"
            prepend-icon="mdi-plus"
            :loading="loading"
            type="submit"
          >
            Legg til
          </v-btn>
        </form>

        <p v-if="error" class="admin-error">{{ error }}</p>

        <div class="allowlist">
          <div v-for="entry in allowlist" :key="entry.id" class="allowlist-item">
            <span>{{ entry.email || entry.id }}</span>
            <v-btn
              icon="mdi-delete-outline"
              size="small"
              variant="text"
              color="#ba3d25"
              :disabled="loading"
              @click="removeEmail(entry.id)"
            />
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-card v-else-if="tab === 'ingredients'" class="admin-card" elevation="0">
      <v-card-item>
        <v-card-title class="admin-title">Rediger ingredienser</v-card-title>
        <v-card-subtitle>
          Ett samlet register for Matvaretabellen-kobling, egne makroer og antall til gram
        </v-card-subtitle>
      </v-card-item>

      <v-card-text class="admin-body">
        <div class="ingredient-toolbar">
          <v-text-field
            v-model="ingredientSearch"
            label="Søk ingredienser"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            hide-details
            class="search-field"
          />

          <v-select
            v-model="ingredientSourceFilter"
            :items="ingredientSourceFilterOptions"
            label="Vis"
            variant="outlined"
            density="comfortable"
            hide-details
            class="source-filter"
          />

          <div class="ingredient-count">
            {{ filteredIngredients.length }} ingredienser
          </div>
        </div>

        <div class="ingredient-table-wrap">
          <div class="ingredient-table-actions">
            <v-btn
              color="var(--app-primary)"
              variant="tonal"
              prepend-icon="mdi-plus"
              @click="startNewIngredient"
            >
              Ny ingrediens
            </v-btn>

            <div v-if="selectedIngredientKey" class="ingredient-count">
              Valgt: {{ ingredientForm.name || 'Ingrediens' }}
            </div>
          </div>

          <v-data-table
            :headers="ingredientTableHeaders"
            :items="ingredientTableItems"
            item-value="id"
            density="comfortable"
            hover
            class="ingredient-table"
            @click:row="onIngredientRowClick"
          >
            <template #item.name="{ item }">
              <div :class="['table-main', { 'is-active': selectedIngredientKey === item.id }]">
                <strong>{{ item.name }}</strong>
              </div>
            </template>

            <template #item.sourceType="{ item }">
              <span class="table-muted">{{ sourceLabel(item.sourceType) }}</span>
            </template>

            <template #item.unitsCount="{ item }">
              <span class="table-muted">{{ item.unitsCount }}</span>
            </template>

            <template #item.foodName="{ item }">
              <span class="table-muted">{{ item.foodName || 'Egen / ignorert' }}</span>
            </template>
          </v-data-table>
        </div>

        <div class="ingredient-table-wrap migration-wrap">
          <div class="ingredient-table-actions">
            <div>
              <h3 class="migration-title">Manglende ingredienskoblinger</h3>
              <p class="helper-copy">
                Her ser du oppskriftsrader som fortsatt mangler `ingredientId`. Koble dem direkte til registeret eller opprett en egen ingrediens.
              </p>
            </div>
            <div class="ingredient-count">
              {{ pendingMigrationItems.length }} gjenstar
            </div>
          </div>

          <v-data-table
            :headers="migrationTableHeaders"
            :items="pendingMigrationItems"
            item-value="key"
            density="comfortable"
            class="ingredient-table"
          >
            <template #item.mealName="{ item }">
              <div class="table-main">
                <strong>{{ item.mealName }}</strong>
                <small class="table-muted">{{ item.sourceType === 'ingredient' ? 'Ingrediens' : 'Proteinkilde' }}</small>
              </div>
            </template>

            <template #item.text="{ item }">
              <div class="table-main">
                <strong>{{ item.text }}</strong>
                <small class="table-muted">{{ item.number || 0 }} {{ item.type || 'stk' }} · {{ item.grams || 0 }} g</small>
              </div>
            </template>

            <template #item.suggestionId="{ item }">
              <v-autocomplete
                :model-value="migrationSelections[item.key] ?? item.suggestionId"
                :items="store.ingredientOptions"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                @update:model-value="setMigrationSelection(item.key, $event)"
              />
            </template>

            <template #item.actions="{ item }">
              <div class="migration-actions">
                <v-btn
                  size="small"
                  color="var(--app-primary)"
                  variant="flat"
                  :disabled="!(migrationSelections[item.key] ?? item.suggestionId)"
                  @click="applyMigrationLink(item)"
                >
                  Koble
                </v-btn>
                <v-btn
                  size="small"
                  variant="text"
                  color="var(--app-accent)"
                  @click="createMigrationIngredient(item)"
                >
                  Opprett egen
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </div>

        <form class="ingredient-editor roomy-form" @submit.prevent="saveIngredient">
          <div class="ingredient-header">
            <div>
              <h3>{{ ingredientForm.id ? 'Rediger ingrediens' : 'Ny ingrediens' }}</h3>
              <p>Her samler vi Matvaretabellen-valg, egne makroer og enhetskonverteringer på ett sted.</p>
            </div>
          </div>

          <div class="ingredient-form-grid">
            <v-text-field
              v-model="ingredientForm.name"
              label="Ingrediensnavn"
              variant="outlined"
              density="comfortable"
              hide-details
            />

            <v-select
              v-model="ingredientForm.sourceType"
              :items="ingredientSourceOptions"
              item-title="title"
              item-value="value"
              label="Kilde"
              variant="outlined"
              density="comfortable"
              hide-details
            />

            <v-autocomplete
              v-if="ingredientForm.sourceType === 'matvaretabellen'"
              v-model="ingredientForm.foodName"
              :items="store.auditFoodOptions"
              label="Matvaretabellen-oppslag"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
            />

            <v-text-field
              v-else
              v-model="ingredientForm.note"
              :label="ingredientForm.sourceType === 'custom' ? 'Notat / visningsnavn' : 'Notat'"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </div>

          <div v-if="ingredientForm.sourceType === 'custom'" class="macro-section">
            <h4>Egne makroer per 100 g</h4>
            <div class="macro-grid">
              <v-text-field v-model.number="ingredientForm.nutrientsPer100g.calories" label="Kcal" type="number" min="0" step="0.1" variant="outlined" density="comfortable" hide-details />
              <v-text-field v-model.number="ingredientForm.nutrientsPer100g.protein" label="Protein" type="number" min="0" step="0.1" variant="outlined" density="comfortable" hide-details />
              <v-text-field v-model.number="ingredientForm.nutrientsPer100g.carbs" label="Karb" type="number" min="0" step="0.1" variant="outlined" density="comfortable" hide-details />
              <v-text-field v-model.number="ingredientForm.nutrientsPer100g.fat" label="Fett" type="number" min="0" step="0.1" variant="outlined" density="comfortable" hide-details />
              <v-text-field v-model.number="ingredientForm.nutrientsPer100g.fibre" label="Fiber" type="number" min="0" step="0.1" variant="outlined" density="comfortable" hide-details />
            </div>
          </div>

          <div class="units-section">
            <div class="section-head">
              <div>
                <h4>Antall til gram</h4>
                <p>En ingrediens kan ha flere enheter, for eksempel både `skiver` og `dl`.</p>
              </div>
              <v-btn color="var(--app-primary)" variant="tonal" prepend-icon="mdi-plus" @click="addUnit">
                Legg til enhet
              </v-btn>
            </div>

            <div v-if="ingredientForm.units.length" class="unit-list">
              <div v-for="(unit, index) in ingredientForm.units" :key="`unit-${index}`" class="unit-row">
                <v-autocomplete
                  v-model="unit.unit"
                  :items="store.ingredientUnits"
                  label="Enhet"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
                <v-text-field
                  v-model.number="unit.gramsPerUnit"
                  label="Gram per enhet"
                  type="number"
                  min="0"
                  step="0.01"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
                <v-text-field
                  v-model="unit.note"
                  label="Notat"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
                <v-btn color="#ba3d25" variant="text" prepend-icon="mdi-delete-outline" @click="removeUnit(index)">
                  Fjern
                </v-btn>
              </div>
            </div>

            <div v-else class="empty-note">
              Ingen enheter lagt inn ennå. Du kan fortsatt bruke ingrediensen, men da må gram fylles inn manuelt i oppskrifter.
            </div>
          </div>

          <div class="editor-actions">
            <v-btn color="var(--app-primary)" variant="flat" prepend-icon="mdi-content-save" type="submit">
              Lagre ingrediens
            </v-btn>
            <v-btn variant="text" @click="resetIngredientForm">Nullstill</v-btn>
            <v-btn
              v-if="ingredientForm.id"
              color="#ba3d25"
              variant="text"
              prepend-icon="mdi-delete-outline"
              @click="deleteIngredient"
            >
              Slett ingrediens
            </v-btn>
          </div>
        </form>
      </v-card-text>
    </v-card>

    <v-card v-else class="admin-card" elevation="0">
      <v-card-item>
        <v-card-title class="admin-title">Avviksterskler</v-card-title>
        <v-card-subtitle>Bestem hvor strengt måltidene skal vurderes mot Matvaretabellen</v-card-subtitle>
      </v-card-item>

      <v-card-text class="admin-body">
        <form class="threshold-form roomy-form" @submit.prevent="saveThresholds">
          <v-text-field
            v-model.number="thresholdForm.calories"
            label="Kcal"
            type="number"
            min="0"
            variant="outlined"
            density="comfortable"
            hint="Tillatt avvik i kalorier"
            persistent-hint
          />
          <v-text-field
            v-model.number="thresholdForm.protein"
            label="Protein"
            type="number"
            min="0"
            variant="outlined"
            density="comfortable"
            hint="Tillatt avvik i gram protein"
            persistent-hint
          />
          <v-text-field
            v-model.number="thresholdForm.carbs"
            label="Karb"
            type="number"
            min="0"
            variant="outlined"
            density="comfortable"
            hint="Tillatt avvik i gram karbohydrater"
            persistent-hint
          />
          <v-text-field
            v-model.number="thresholdForm.fat"
            label="Fett"
            type="number"
            min="0"
            variant="outlined"
            density="comfortable"
            hint="Tillatt avvik i gram fett"
            persistent-hint
          />
          <div class="editor-actions">
            <v-btn color="var(--app-primary)" variant="flat" prepend-icon="mdi-tune" type="submit">
              Lagre terskler
            </v-btn>
            <v-btn variant="text" @click="resetThresholdForm">Tilbakestill</v-btn>
          </div>
        </form>

        <p class="helper-copy">
          Disse tersklene styrer når et måltid får `Lite avvik`, `Noe avvik` eller `Store avvik`.
        </p>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, normalizeEmail } from '../services/firebase'
import { AUDIT_DELTA_THRESHOLDS } from '../services/nutritionAudit'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const tab = ref('access')
const emailInput = ref('')
const allowlist = ref([])
const loading = ref(false)
const error = ref('')
const ingredientSearch = ref('')
const ingredientSourceFilter = ref('all')
const selectedIngredientKey = ref('')
const ingredientSourceOptions = [
  { title: 'Matvaretabellen', value: 'matvaretabellen' },
  { title: 'Egen ingrediens', value: 'custom' },
  { title: 'Ignorer i beregning', value: 'ignored' },
]
const ingredientSourceFilterOptions = [
  { title: 'Alle', value: 'all' },
  { title: 'Matvaretabellen', value: 'matvaretabellen' },
  { title: 'Egne', value: 'custom' },
  { title: 'Ignorerte', value: 'ignored' },
]
const ingredientForm = reactive(emptyIngredientForm())
const thresholdForm = reactive({
  calories: AUDIT_DELTA_THRESHOLDS.calories,
  protein: AUDIT_DELTA_THRESHOLDS.protein,
  carbs: AUDIT_DELTA_THRESHOLDS.carbs,
  fat: AUDIT_DELTA_THRESHOLDS.fat,
})
let unsubscribe = null

function emptyIngredientForm() {
  return {
    id: '',
    name: '',
    sourceType: 'matvaretabellen',
    foodName: '',
    note: '',
    nutrientsPer100g: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fibre: 0,
    },
    units: [],
  }
}

function cloneIngredient(entry) {
  return {
    id: entry?.id || '',
    name: entry?.name || '',
    sourceType: entry?.sourceType || 'matvaretabellen',
    foodName: entry?.foodName || '',
    note: entry?.note || '',
    nutrientsPer100g: {
      calories: Number(entry?.nutrientsPer100g?.calories || 0),
      protein: Number(entry?.nutrientsPer100g?.protein || 0),
      carbs: Number(entry?.nutrientsPer100g?.carbs || 0),
      fat: Number(entry?.nutrientsPer100g?.fat || 0),
      fibre: Number(entry?.nutrientsPer100g?.fibre || 0),
    },
    units: Array.isArray(entry?.units)
      ? entry.units.map((unit) => ({
          unit: unit.unit || '',
          gramsPerUnit: Number(unit.gramsPerUnit || 0),
          note: unit.note || '',
          source: unit.source || 'manual',
          count: Number(unit.count || 0),
        }))
      : [],
  }
}

const filteredIngredients = computed(() => {
  const queryText = String(ingredientSearch.value || '').trim().toLowerCase()
  return store.ingredientEditorEntries.filter((entry) => {
    const matchesSource = ingredientSourceFilter.value === 'all' || entry.sourceType === ingredientSourceFilter.value
    if (!matchesSource) return false
    if (!queryText) return true

    return entry.name.toLowerCase().includes(queryText) ||
      entry.foodName.toLowerCase().includes(queryText) ||
      (entry.units || []).some((unit) => unit.unit.toLowerCase().includes(queryText))
  })
})

const ingredientTableHeaders = [
  { title: 'Ingrediens', key: 'name' },
  { title: 'Kilde', key: 'sourceType', width: 170 },
  { title: 'Enheter', key: 'unitsCount', width: 100, align: 'end' },
  { title: 'Matvaretabellen', key: 'foodName' },
]
const migrationSelections = reactive({})
const migrationTableHeaders = [
  { title: 'Oppskrift', key: 'mealName' },
  { title: 'Rad', key: 'text' },
  { title: 'Koble til', key: 'suggestionId', width: 280 },
  { title: '', key: 'actions', sortable: false, width: 220 },
]

const ingredientTableItems = computed(() =>
  filteredIngredients.value.map((entry) => ({
    ...entry,
    unitsCount: Array.isArray(entry.units) ? entry.units.length : 0,
  })),
)

const pendingMigrationItems = computed(() => store.pendingIngredientLinks)

function sourceLabel(value) {
  return {
    matvaretabellen: 'Matvaretabellen',
    custom: 'Egen ingrediens',
    ignored: 'Ignorert',
  }[value] || value
}

function setMigrationSelection(key, value) {
  migrationSelections[key] = value || ''
}

function syncThresholdForm() {
  thresholdForm.calories = Number(store.effectiveAuditThresholds.calories || AUDIT_DELTA_THRESHOLDS.calories)
  thresholdForm.protein = Number(store.effectiveAuditThresholds.protein || AUDIT_DELTA_THRESHOLDS.protein)
  thresholdForm.carbs = Number(store.effectiveAuditThresholds.carbs || AUDIT_DELTA_THRESHOLDS.carbs)
  thresholdForm.fat = Number(store.effectiveAuditThresholds.fat || AUDIT_DELTA_THRESHOLDS.fat)
}

function resetThresholdForm() {
  syncThresholdForm()
}

async function saveThresholds() {
  await store.saveAuditThresholds({
    calories: Number(thresholdForm.calories || 0),
    protein: Number(thresholdForm.protein || 0),
    carbs: Number(thresholdForm.carbs || 0),
    fat: Number(thresholdForm.fat || 0),
  })
  syncThresholdForm()
}

function resetIngredientForm() {
  Object.assign(ingredientForm, emptyIngredientForm())
  selectedIngredientKey.value = ''
}

function startNewIngredient() {
  resetIngredientForm()
  tab.value = 'ingredients'
}

function selectIngredient(entry) {
  selectedIngredientKey.value = entry.id
  Object.assign(ingredientForm, cloneIngredient(entry))
}

function onIngredientRowClick(_event, payload) {
  if (!payload?.item) return
  selectIngredient(payload.item)
}

function addUnit() {
  ingredientForm.units.push({
    unit: '',
    gramsPerUnit: 0,
    note: '',
    source: 'manual',
    count: 0,
  })
}

function removeUnit(index) {
  ingredientForm.units.splice(index, 1)
}

async function saveIngredient() {
  const payload = cloneIngredient(ingredientForm)
  payload.units = payload.units.filter((unit) => String(unit.unit || '').trim() && Number(unit.gramsPerUnit || 0) > 0)
  if (payload.sourceType !== 'custom') {
    payload.nutrientsPer100g = emptyIngredientForm().nutrientsPer100g
  }
  if (payload.sourceType !== 'matvaretabellen') {
    payload.foodName = ''
  }

  await store.saveIngredientDefinition(payload)

  const saved = store.findIngredientDefinition(payload.name)
  if (saved) {
    selectedIngredientKey.value = saved.id
    Object.assign(ingredientForm, cloneIngredient(saved))
  } else {
    resetIngredientForm()
  }
}

async function deleteIngredient() {
  if (!ingredientForm.name) return
  await store.deleteIngredientDefinition(ingredientForm.name)
  resetIngredientForm()
}

async function applyMigrationLink(item) {
  const ingredientId = migrationSelections[item.key] ?? item.suggestionId
  if (!ingredientId) return

  await store.linkRecipeIngredient({
    mealId: item.mealId,
    sourceKey: item.sourceKey,
    sourceIndex: item.sourceIndex,
    ingredientId,
  })

  delete migrationSelections[item.key]
}

async function createMigrationIngredient(item) {
  await store.createAndLinkRecipeIngredient({
    mealId: item.mealId,
    sourceKey: item.sourceKey,
    sourceIndex: item.sourceIndex,
    text: item.text,
    type: item.type,
    grams: item.grams,
    number: item.number,
  })

  delete migrationSelections[item.key]
}

function subscribeToAllowlist() {
  unsubscribe = onSnapshot(
    query(collection(db, 'allowlist'), orderBy('email')),
    (snapshot) => {
      allowlist.value = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...entry.data(),
      }))
    },
    (snapshotError) => {
      error.value = snapshotError.message || 'Kunne ikke laste whitelist.'
    },
  )
}

async function addEmail() {
  const email = normalizeEmail(emailInput.value)
  if (!email) return

  loading.value = true
  error.value = ''

  try {
    await setDoc(doc(db, 'allowlist', email), {
      email,
      createdAt: serverTimestamp(),
    })
    emailInput.value = ''
  } catch (saveError) {
    error.value = saveError.message || 'Kunne ikke legge til e-post.'
  } finally {
    loading.value = false
  }
}

async function removeEmail(email) {
  loading.value = true
  error.value = ''

  try {
    await deleteDoc(doc(db, 'allowlist', email))
  } catch (deleteError) {
    error.value = deleteError.message || 'Kunne ikke fjerne e-post.'
  } finally {
    loading.value = false
  }
}

watch(
  () => store.effectiveAuditThresholds,
  () => {
    syncThresholdForm()
  },
  { deep: true, immediate: true },
)

watch(
  () => ingredientForm.sourceType,
  (nextValue) => {
    if (nextValue !== 'matvaretabellen') {
      ingredientForm.foodName = ''
    }
  },
)

onMounted(async () => {
  subscribeToAllowlist()
  await store.fetchMeals()
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
.admin-layout {
  display: grid;
  gap: 14px;
}

.admin-tabs {
  position: sticky;
  top: 12px;
  z-index: 10;
  background: color-mix(in srgb, var(--app-card) 85%, transparent);
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 4px;
  backdrop-filter: blur(10px);
}

.admin-card {
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-card);
}

.admin-title {
  color: var(--app-ink);
}

.admin-body {
  display: grid;
  gap: 20px;
}

.roomy-form {
  gap: 18px;
}

.email-form,
.threshold-form {
  display: grid;
  align-items: start;
}

.email-form {
  grid-template-columns: minmax(0, 1fr) auto;
}

.threshold-form {
  grid-template-columns: repeat(4, minmax(170px, 1fr));
}

.ingredient-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 220px) auto;
  gap: 14px;
  align-items: center;
}

.search-field {
  max-width: 460px;
}

.source-filter {
  max-width: 220px;
}

.ingredient-count {
  color: var(--app-muted);
  font-size: 13px;
  font-weight: 700;
}

.ingredient-table-wrap,
.ingredient-editor,
.allowlist-item {
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: color-mix(in srgb, var(--app-bg-soft) 70%, transparent);
}

.ingredient-table-wrap {
  display: grid;
  gap: 12px;
  padding: 14px;
}

.ingredient-table-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.ingredient-header,
.conversion-main,
.table-main {
  display: grid;
  gap: 4px;
}

.ingredient-header p,
.helper-copy,
.empty-note,
.table-muted {
  color: var(--app-muted);
  font-size: 13px;
}

.migration-title {
  margin: 0 0 6px;
  color: var(--app-ink);
  font-size: 1rem;
}

.migration-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.ingredient-table {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--app-card);
}

.ingredient-table :deep(tbody tr) {
  cursor: pointer;
}

.ingredient-table :deep(tbody tr:hover) {
  background: color-mix(in srgb, var(--app-bg-soft) 82%, transparent);
}

.ingredient-table :deep(.v-data-table__td),
.ingredient-table :deep(.v-data-table-header__content) {
  color: var(--app-ink);
}

.ingredient-table :deep(.v-data-table-footer),
.ingredient-table :deep(.v-data-table-footer__items-per-page),
.ingredient-table :deep(.v-data-table-footer__info) {
  color: var(--app-ink);
}

.ingredient-table :deep(.v-btn) {
  color: var(--app-ink);
}

.ingredient-table :deep(.v-data-table-footer .v-btn) {
  background: color-mix(in srgb, var(--app-card-strong) 88%, transparent);
  border: 1px solid var(--app-border);
}

.ingredient-table :deep(.v-select .v-field) {
  background: color-mix(in srgb, var(--app-card-strong) 90%, transparent);
}

.table-main.is-active strong {
  color: var(--app-primary);
}

.ingredient-editor {
  display: grid;
  gap: 18px;
  padding: 18px;
}

.ingredient-header h3,
.macro-section h4,
.units-section h4 {
  margin: 0;
  color: var(--app-ink);
}

.ingredient-header p,
.section-head p {
  margin: 0;
}

.ingredient-form-grid {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(220px, 1fr) minmax(260px, 1.3fr);
  gap: 16px;
}

.macro-section,
.units-section {
  display: grid;
  gap: 14px;
}

.macro-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(120px, 1fr));
  gap: 14px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
}

.unit-list {
  display: grid;
  gap: 12px;
}

.unit-row {
  display: grid;
  grid-template-columns: minmax(160px, 0.8fr) minmax(180px, 0.8fr) minmax(220px, 1fr) auto;
  gap: 14px;
  align-items: start;
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-card);
}

.editor-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.allowlist {
  display: grid;
  gap: 10px;
}

.allowlist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  font-weight: 700;
  color: var(--app-ink);
}

.admin-error {
  margin: 0;
  color: #ba3d25;
  font-size: 13px;
  font-weight: 700;
}

@media (max-width: 1200px) {
  .ingredient-form-grid,
  .macro-grid,
  .threshold-form,
  .unit-row {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 860px) {
  .ingredient-toolbar,
  .ingredient-form-grid,
  .macro-grid,
  .threshold-form,
  .email-form,
  .unit-row {
    grid-template-columns: 1fr;
  }

  .section-head {
    flex-direction: column;
  }
}
</style>
