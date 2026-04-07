<template>
  <div class="nutrients-wrap">
    <div class="nutrients">
      <span class="nutrient">
        <v-icon icon="mdi-fire" color="#ba3d25" size="small" />
        <strong>{{ item.nutrients.calories }}</strong>
        <small>kcal</small>
      </span>
      <span class="nutrient">
        <v-icon icon="mdi-food-steak" color="#8a5a2b" size="small" />
        <strong>{{ item.nutrients.protein }}</strong>
        <small>protein</small>
      </span>
      <span class="nutrient">
        <v-icon icon="mdi-bread-slice-outline" color="#9a6f22" size="small" />
        <strong>{{ item.nutrients.carbs }}</strong>
        <small>karb</small>
      </span>
      <span class="nutrient">
        <v-icon icon="mdi-water" color="#2f6fb1" size="small" />
        <strong>{{ item.nutrients.fat }}</strong>
        <small>fett</small>
      </span>
    </div>

    <button
      v-if="audit?.fullyVerified"
      class="audit-panel"
      type="button"
      @click="isExpanded = !isExpanded"
    >
      <div class="audit-head">
        <span>Beregnet mot Matvaretabellen</span>
        <small>Vises bare for fullt verifiserte måltider</small>
        <v-icon
          :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          size="small"
          color="#274c32"
        />
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
const labels = {
  calories: 'kcal',
  protein: 'protein',
  carbs: 'karb',
  fat: 'fett',
}

function formatDelta(value) {
  const rounded = Math.round((Number(value) || 0) * 10) / 10
  if (rounded === 0) return '0'
  return rounded > 0 ? `+${rounded}` : `${rounded}`
}

const auditRows = computed(() => {
  if (!audit.value?.fullyVerified) return []

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
      deltaClass: Math.abs(delta) <= 5 ? 'is-close' : 'is-off',
    }
  })
})

const ingredientRows = computed(() => {
  if (!audit.value?.fullyVerified) return []
  return (audit.value.matched || []).map((entry) => ({
    ...entry,
    matchLabel: {
      manual: 'manuell',
      alias: 'mapping',
      exact: 'eksakt',
      'single-prefix': 'automatisk',
      'single-partial': 'automatisk',
    }[entry.matchType] || entry.matchType,
  }))
})

const reasonRows = computed(() => {
  if (!audit.value?.fullyVerified) return []

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
        deltaClass: Math.abs(delta) <= 5 ? 'is-close' : 'is-off',
      }
    })
    .filter(Boolean)
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
