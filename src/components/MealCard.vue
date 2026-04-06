<template>
  <div class="meal-view">
    <Search />

    <div class="actions">
      <v-btn
        color="var(--app-primary)"
        variant="flat"
        rounded="pill"
        prepend-icon="mdi-plus"
        @click="store.addMealDialog = true"
      >
        Legg til måltid
      </v-btn>
    </div>

    <div class="meal-grid">
      <v-card
        v-for="item in store.filteredMeals"
        :key="item.id"
        :disabled="store.loading"
        :loading="store.loading"
        class="meal-card"
        elevation="0"
      >
        <template #loader="{ isActive }">
          <v-progress-linear :active="isActive" color="var(--app-accent)" height="4" indeterminate />
        </template>

        <v-img class="card-image" height="230" :src="item.image" cover>
          <div class="image-overlay" />
        </v-img>

        <v-card-item>
          <v-card-title class="title">{{ item.name }}</v-card-title>
          <v-card-subtitle class="subtitle">
            <Preparation :item="item" />
          </v-card-subtitle>

          <Nutrients :item="item" />
        </v-card-item>

        <v-card-text class="details">
          <MealRating :item="item" />
          <Procedure :item="item" />
          <Ingredients :item="item" />
          <ProteinAddons :item="item" />
        </v-card-text>

        <MealType :item="item" />

        <v-card-actions class="card-actions">
          <v-btn color="var(--app-primary)" variant="tonal" rounded="pill" text="Velg måltid" />
          <v-spacer />
          <v-btn
            color="#ba3d25"
            variant="text"
            rounded="pill"
            prepend-icon="mdi-delete-outline"
            text="Slett"
            @click="store.deleteMeal(item.id)"
          />
        </v-card-actions>
      </v-card>
    </div>

    <AddMeal />
  </div>
</template>

<script setup>
import { useAppStore } from '../stores/app'

const store = useAppStore()
</script>

<style scoped>
.meal-view {
  display: grid;
  gap: 16px;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.meal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

.meal-card {
  border-radius: 20px;
  border: 1px solid var(--app-border);
  background: var(--app-card);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.meal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 34px rgba(65, 47, 16, 0.12);
}

.card-image {
  position: relative;
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(13, 22, 30, 0.38), rgba(13, 22, 30, 0.04));
}

.title {
  font-size: 1.1rem;
  line-height: 1.3;
  font-weight: 800;
  color: var(--app-ink);
  white-space: normal;
}

.subtitle {
  margin-top: 8px;
  color: var(--app-muted);
}

.details {
  display: grid;
  gap: 14px;
}

.card-actions {
  padding: 12px 16px 16px;
}

@media (max-width: 760px) {
  .actions {
    justify-content: stretch;
  }

  .actions :deep(.v-btn) {
    width: 100%;
  }
}
</style>
