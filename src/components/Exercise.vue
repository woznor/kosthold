<template>
  <div class="exercise-grid">
    <v-card
      v-for="item in store.exercises"
      :key="item.name"
      :disabled="store.loading"
      :loading="store.loading"
      class="exercise-card"
      elevation="0"
    >
      <template #loader="{ isActive }">
        <v-progress-linear :active="isActive" color="var(--app-accent)" height="4" indeterminate />
      </template>

      <v-img height="220" :src="item.image" cover />

      <v-card-item>
        <v-card-title class="title">{{ item.name }}</v-card-title>
      </v-card-item>

      <v-card-actions>
        <v-btn color="var(--app-primary)" variant="tonal" rounded="pill" text="Velg øvelse" block />
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
import { useAppStore } from '../stores/app'

const store = useAppStore()
</script>

<style scoped>
.exercise-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
}

.exercise-card {
  border-radius: 18px;
  border: 1px solid var(--app-border);
  background: var(--app-card);
  overflow: hidden;
}

.title {
  font-weight: 800;
  color: #1b2f45;
}
</style>
