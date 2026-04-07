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
        <div class="audit-inspector-head">Ingredienser i beregningen</div>
        <div class="audit-ingredient-list">
          <div
            v-for="entry in ingredientRows"
            :key="`${entry.ingredient}-${entry.matchedFood}`"
            class="audit-ingredient"
          >
            <div class="audit-ingredient-main">
              <strong>{{ entry.ingredient }}</strong>
              <small>{{ entry.grams }} g -> {{ entry.matchedFood }}</small>
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
  return audit.value.matched || []
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

.audit-inspector-head {
  font-size: 12px;
  font-weight: 800;
  color: #274c32;
  margin-bottom: 8px;
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
