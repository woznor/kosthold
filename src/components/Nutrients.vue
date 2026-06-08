<template>
  <div class="nutrients-wrap">
    <div class="nutrients">
      <span class="nutrient">
        <v-icon icon="mdi-fire" color="#ba3d25" size="small" />
        <strong>{{ displayNutrients.calories }}</strong>
        <small>kcal</small>
      </span>
      <span class="nutrient">
        <v-icon icon="mdi-food-steak" color="#8a5a2b" size="small" />
        <strong>{{ displayNutrients.protein }}</strong>
        <small>protein</small>
      </span>
      <span class="nutrient">
        <v-icon icon="mdi-bread-slice-outline" color="#9a6f22" size="small" />
        <strong>{{ displayNutrients.carbs }}</strong>
        <small>karb</small>
      </span>
      <span class="nutrient">
        <v-icon icon="mdi-water" color="#2f6fb1" size="small" />
        <strong>{{ displayNutrients.fat }}</strong>
        <small>fett</small>
      </span>
    </div>

    <button v-if="audit && !item.verified" :class="['audit-panel', panelClass]" type="button" @click="isExpanded = !isExpanded">
      <div class="audit-head">
        <span>Beregnet mot Matvaretabellen</span>
        <small>{{ auditSummary }}</small>
        <v-icon
          :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          size="small"
          :color="iconColor"
        />
      </div>

      <div v-if="statusPills.length" class="audit-pills">
        <span v-for="pill in statusPills" :key="pill.text" :class="['audit-pill', pill.className]">
          {{ pill.text }}
        </span>
      </div>

      <div class="audit-grid">
        <div v-for="entry in auditRows" :key="entry.key" class="audit-row">
          <span class="audit-label">{{ entry.label }}</span>
          <strong class="audit-values">{{ entry.calculated }} / {{ entry.saved }}</strong>
          <small :class="['audit-delta', entry.deltaClass]">{{ entry.deltaText }}</small>
        </div>
      </div>

      <div v-if="isExpanded" class="audit-inspector">
        <div class="audit-inspector-note">
          Diff = beregnet minus lagret. Beregningen bruker gram, ikke antall.
        </div>

        <div v-if="unmatchedRows.length" class="audit-warning-list">
          <div class="audit-inspector-head">Trenger mapping</div>
          <div class="audit-reason-list">
            <div v-for="entry in unmatchedRows" :key="entry" class="audit-reason is-warning">
              <strong>{{ entry }}</strong>
              <small>Fant ingen sikker næringskilde for denne ingrediensen ennå.</small>
            </div>
          </div>
        </div>

        <div v-if="warningRows.length" class="audit-warning-list">
          <div class="audit-inspector-head">Bør sjekkes</div>
          <div class="audit-reason-list">
            <div
              v-for="entry in warningRows"
              :key="entry.key"
              class="audit-reason is-warning"
            >
              <strong>{{ entry.title }}</strong>
              <small>{{ entry.summary }}</small>
            </div>
          </div>
        </div>

        <div v-if="reasonRows.length" class="audit-reasons">
          <div class="audit-inspector-head">Hva driver forskjellen?</div>
          <div class="audit-reason-list">
            <div
              v-for="entry in reasonRows"
              :key="entry.key"
              :class="['audit-reason', entry.deltaClass]"
            >
              <strong>{{ entry.title }}</strong>
              <small>{{ entry.summary }}</small>
            </div>
          </div>
        </div>

        <div class="audit-inspector-head">Ingredienser i beregningen</div>
        <div class="audit-ingredient-list">
          <div
            v-for="entry in ingredientRows"
            :key="`${entry.ingredient}-${entry.matchedFood}`"
            class="audit-ingredient"
          >
            <div class="audit-ingredient-main">
              <strong>{{ entry.ingredient }}</strong>
              <small>{{ entry.grams }} g -> {{ entry.matchedFood }} ({{ entry.matchLabel }})</small>
            </div>
            <div class="audit-ingredient-macros">
              <span>{{ entry.contribution.calories }} kcal</span>
              <span>P {{ entry.contribution.protein }}</span>
              <span>K {{ entry.contribution.carbs }}</span>
              <span>F {{ entry.contribution.fat }}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const audit = computed(() => props.item.nutritionAudit)
const isExpanded = ref(false)
const displayNutrients = computed(() => {
  if (props.item.verified && audit.value?.calculated) {
    return audit.value.calculated
  }

  return props.item.nutrients || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  }
})
const labels = {
  calories: 'kcal',
  protein: 'protein',
  carbs: 'karb',
  fat: 'fett',
}
const rowThresholds = computed(() => audit.value?.thresholds || {
  calories: 60,
  protein: 7,
  carbs: 7,
  fat: 6,
})

function formatDelta(value) {
  const rounded = Math.round((Number(value) || 0) * 10) / 10
  if (rounded === 0) return '0'
  return rounded > 0 ? `+${rounded}` : `${rounded}`
}

const auditRows = computed(() => {
  if (!audit.value) return []

  return [
    { key: 'calories', label: 'Kcal' },
    { key: 'protein', label: 'Protein' },
    { key: 'carbs', label: 'Karb' },
    { key: 'fat', label: 'Fett' },
  ].map((row) => {
    const delta = Number(audit.value.delta?.[row.key] || 0)
    return {
      ...row,
      calculated: audit.value.calculated?.[row.key] ?? 0,
      saved: audit.value.saved?.[row.key] ?? 0,
      deltaText: `${formatDelta(delta)} diff`,
      deltaClass: Math.abs(delta) <= rowThresholds.value[row.key] ? 'is-close' : 'is-off',
    }
  })
})

const unmatchedRows = computed(() => audit.value?.unmatched || [])

const warningRows = computed(() => {
  if (!audit.value?.mismatchKeys?.length) return []

  return audit.value.mismatchKeys.map((key) => ({
    key,
    title: `${labels[key]} utenfor grense`,
    summary: `Diffen er ${formatDelta(audit.value.delta?.[key] || 0)} ${labels[key]}. Dette er større enn toleransen for automatisk godkjenning.`,
  }))
})

const ingredientRows = computed(() => {
  if (!audit.value) return []
  return (audit.value.matched || []).map((entry) => ({
    ...entry,
    matchLabel: {
      selected: 'valgt',
      manual: 'manuell',
      alias: 'mapping',
      exact: 'eksakt',
      'single-prefix': 'automatisk',
      'single-partial': 'automatisk',
    }[entry.matchType] || entry.matchType,
  }))
})

const reasonRows = computed(() => {
  if (!audit.value) return []

  return Object.entries(labels)
    .map(([key, unit]) => {
      const delta = Number(audit.value.delta?.[key] || 0)
      if (Math.abs(delta) < 1) return null

      const topDrivers = [...(audit.value.matched || [])]
        .map((entry) => ({
          ingredient: entry.ingredient,
          value: Number(entry.contribution?.[key] || 0),
        }))
        .filter((entry) => entry.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 2)

      const driverText = topDrivers.length
        ? `Størst utslag i beregningen: ${topDrivers.map((entry) => `${entry.ingredient} (${entry.value} ${unit})`).join(', ')}.`
        : 'Ingen tydelige drivere funnet.'

      return {
        key,
        title: `${labels[key]}: ${formatDelta(delta)}`,
        summary: `${delta > 0 ? 'Beregnet verdi er høyere enn lagret.' : 'Beregnet verdi er lavere enn lagret.'} ${driverText}`,
        deltaClass: Math.abs(delta) <= rowThresholds.value[key] ? 'is-close' : 'is-off',
      }
    })
    .filter(Boolean)
})

const panelClass = computed(() => {
  if (!audit.value) return ''
  if (!audit.value.fullyMatched) return 'is-warning-panel'
  if (audit.value.deviationLevel === 'small') return 'is-small-panel'
  if (audit.value.deviationLevel === 'medium') return 'is-medium-panel'
  if (audit.value.deviationLevel === 'large') return 'is-large-panel'
  return 'is-good-panel'
})

const iconColor = computed(() => {
  if (!audit.value) return '#274c32'
  if (!audit.value.fullyMatched) return '#9a6700'
  if (audit.value.deviationLevel === 'small') return '#906000'
  if (audit.value.deviationLevel === 'medium') return '#b46b1f'
  if (audit.value.deviationLevel === 'large') return '#ba3d25'
  return '#274c32'
})

const auditSummary = computed(() => {
  if (!audit.value) return ''
  if (!audit.value.fullyMatched) return 'Noen ingredienser mangler trygg mapping'
  if (audit.value.deviationLevel === 'small') return 'Alle ingredienser er matchet med lite avvik'
  if (audit.value.deviationLevel === 'medium') return 'Alle ingredienser er matchet med noe avvik'
  if (audit.value.deviationLevel === 'large') return 'Alle ingredienser er matchet, men har store avvik'
  return 'Alle ingredienser er matchet og verdiene ligger innenfor grensen'
})

const statusPills = computed(() => {
  if (!audit.value) return []

  const deviationPill = audit.value.isCloseToSaved
    ? {
        text: 'Nær lagrede verdier',
        className: 'is-good',
      }
    : {
        text: {
          small: 'Lite avvik',
          medium: 'Noe avvik',
          large: 'Store avvik',
        }[audit.value.deviationLevel] || 'Store avvik',
        className: {
          small: 'is-small',
          medium: 'is-medium',
          large: 'is-off',
        }[audit.value.deviationLevel] || 'is-off',
      }

  return [
    {
      text: audit.value.fullyMatched ? 'Fullt matchet' : 'Manglende mapping',
      className: audit.value.fullyMatched ? 'is-good' : 'is-warning',
    },
    deviationPill,
  ]
})
</script>

<style scoped>
.nutrients-wrap {
  margin-top: 10px;
  display: grid;
  gap: 10px;
}

.nutrients {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.nutrient {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #fff4e6;
  border: 1px solid #efd8bb;
  border-radius: 12px;
  min-height: 32px;
  font-size: 12px;
  color: #1f2a37;
}

.nutrient strong {
  font-size: 13px;
  color: #1f2a37;
  font-weight: 800;
}

.nutrient small {
  color: #6f5b42;
  text-transform: lowercase;
}

.audit-panel {
  appearance: none;
  width: 100%;
  text-align: left;
  border: 1px solid #d8e3d8;
  background: #f6fbf4;
  border-radius: 14px;
  padding: 10px;
  cursor: pointer;
}

.audit-panel.is-small-panel {
  border-color: #ead8a5;
  background: #fffaf0;
}

.audit-panel.is-medium-panel {
  border-color: #efc595;
  background: #fff6ee;
}

.audit-panel.is-large-panel {
  border-color: #f0c7b7;
  background: #fff7f2;
}

.audit-panel.is-warning-panel {
  border-color: #efd8a6;
  background: #fff9ed;
}

.audit-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 8px;
  color: #274c32;
}

.audit-head span {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.audit-head small {
  color: #5d745d;
}

.audit-head :deep(.v-icon) {
  margin-left: auto;
}

.audit-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.audit-row {
  display: grid;
  gap: 2px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid #e1ecdf;
}

.audit-label {
  font-size: 11px;
  font-weight: 700;
  color: #5d745d;
  text-transform: uppercase;
}

.audit-values {
  font-size: 14px;
  color: #1f2a37;
}

.audit-delta {
  font-size: 11px;
  font-weight: 700;
}

.audit-delta.is-close {
  color: #2d6a4f;
}

.audit-delta.is-off {
  color: #b35c00;
}

.audit-inspector {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #c6d6c5;
}

.audit-inspector-note {
  margin-bottom: 10px;
  font-size: 11px;
  color: #5d745d;
}

.audit-inspector-head {
  font-size: 12px;
  font-weight: 800;
  color: #274c32;
  margin-bottom: 8px;
}

.audit-reasons {
  margin-bottom: 12px;
}

.audit-reason-list {
  display: grid;
  gap: 8px;
  margin-bottom: 10px;
}

.audit-reason {
  display: grid;
  gap: 4px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e1ecdf;
}

.audit-reason strong {
  font-size: 12px;
  color: #1f2a37;
}

.audit-reason small {
  font-size: 11px;
  color: #5d745d;
}

.audit-reason.is-off {
  border-color: #f0cf9b;
  background: #fff8ef;
}

.audit-ingredient-list {
  display: grid;
  gap: 8px;
}

.audit-ingredient {
  display: grid;
  gap: 4px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid #e1ecdf;
}

.audit-ingredient-main {
  display: grid;
  gap: 2px;
}

.audit-ingredient-main strong {
  font-size: 13px;
  color: #1f2a37;
}

.audit-ingredient-main small {
  color: #5d745d;
}

.audit-ingredient-macros {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  color: #516651;
}

@media (max-width: 420px) {
  .nutrients {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .audit-grid {
    grid-template-columns: 1fr;
  }
}
</style>
