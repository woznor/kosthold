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

      <v-switch
        :model-value="store.showUnverifiedOnly"
        color="var(--app-primary)"
        label="Kun ikke-verifiserte"
        hide-details
        inset
        @update:model-value="store.setShowUnverifiedOnly"
      />

      <v-btn
        color="var(--app-primary)"
        variant="flat"
        prepend-icon="mdi-plus"
        @click="store.openMealEditor()"
      >
        Ny oppskrift
      </v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { useAppStore } from '../stores/app'

const store = useAppStore()
</script>

<style scoped>
.search-wrap {
  border-radius: var(--app-radius-lg);
  border: 1px solid var(--app-border);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--app-card-strong) 92%, transparent), color-mix(in srgb, var(--app-card) 78%, transparent));
  backdrop-filter: blur(18px);
  box-shadow: var(--app-shadow);
  padding: 16px;
}

.filters {
  display: grid;
  grid-template-columns: 1.3fr 1fr auto auto auto;
  gap: 14px;
  align-items: center;
}

.filters :deep(.v-field) {
  background: color-mix(in srgb, var(--app-card-strong) 90%, transparent);
  border-radius: 16px;
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

.filters :deep(.v-switch) {
  padding: 10px 12px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--app-bg-soft) 72%, transparent);
  border: 1px solid color-mix(in srgb, var(--app-border) 80%, transparent);
}

@media (max-width: 900px) {
  .filters {
    grid-template-columns: 1fr;
  }
}
</style>
