<template>
  <v-card class="search-wrap" elevation="0">
    <div class="filters">
      <v-text-field
        v-model="store.searchTerm"
        label="Søk Måltid"
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

      <v-switch
        :model-value="store.showFavoritesOnly"
        color="var(--app-primary)"
        label="Kun favoritter"
        hide-details
        inset
        @update:model-value="store.setShowFavoritesOnly"
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
  grid-template-columns: 1.3fr 1fr auto;
  gap: 10px;
  align-items: center;
}

.filters :deep(.v-field) {
  background: color-mix(in srgb, var(--app-card) 94%, transparent);
}

.filters :deep(.v-field__input),
.filters :deep(.v-label),
.filters :deep(.v-icon) {
  color: var(--app-ink) !important;
}

.filters :deep(input::placeholder) {
  color: color-mix(in srgb, var(--app-ink) 60%, transparent);
}

.filters :deep(.v-switch .v-label) {
  color: var(--app-ink);
  opacity: 1;
  font-weight: 600;
}

@media (max-width: 900px) {
  .filters {
    grid-template-columns: 1fr;
  }
}
</style>

