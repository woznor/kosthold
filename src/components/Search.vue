<template>
  <v-card class="search-wrap" elevation="0">
    <div class="filters">
      <v-text-field
        v-model="store.searchTerm"
        label="Søk måltid"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        hide-details
      />

      <v-select
        v-model="store.selectedMealType"
        :items="store.mealTypeMap"
        label="Måltidstype"
        prepend-inner-icon="mdi-shape-outline"
        variant="outlined"
        density="comfortable"
        clearable
        hide-details
      />

      <v-text-field
        v-model.number="store.portions"
        label="Porsjoner"
        type="number"
        min="1"
        prepend-inner-icon="mdi-silverware-fork-knife"
        variant="outlined"
        density="comfortable"
        hide-details
        @change="store.fetchMeals()"
      />
    </div>
  </v-card>
</template>

<script setup>
import { useAppStore } from '../stores/app'

const store = useAppStore()
</script>

<style scoped>
.search-wrap {
  border-radius: 16px;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-card) 86%, transparent);
  padding: 12px;
}

.filters {
  display: grid;
  grid-template-columns: 1.3fr 1fr 160px;
  gap: 10px;
}

@media (max-width: 900px) {
  .filters {
    grid-template-columns: 1fr;
  }
}
</style>
