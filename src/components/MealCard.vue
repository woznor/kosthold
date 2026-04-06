<template>
  <div class="meal-view" :class="{ 'compact-mobile': store.compactMobile }">
    <Search />

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

        <v-img class="card-image" :src="item.image" cover>
          <div class="image-overlay" />
          <v-btn
            class="favorite-btn"
            :icon="store.isFavorite(item.id) ? 'mdi-heart' : 'mdi-heart-outline'"
            :color="store.isFavorite(item.id) ? '#f25f5c' : 'white'"
            size="small"
            variant="flat"
            @click.stop="toggleFavorite(item.id)"
          />
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
          <v-btn
            color="var(--app-primary)"
            variant="tonal"
            rounded="pill"
            text="Velg måltid"
            @click="openPlanDialog(item)"
            style="width: 100%;"
          />
          <v-spacer />
        </v-card-actions>
      </v-card>
    </div>

    <v-dialog v-model="planDialog" max-width="440">
      <v-card class="plan-dialog" elevation="0">
        <v-card-title class="plan-title">Legg til i plan</v-card-title>
        <v-card-text>
          <p class="selected-name">{{ selectedMeal?.name || '' }}</p>
          <v-select
            v-model="selectedDate"
            :items="dayOptions"
            item-title="title"
            item-value="value"
            label="Velg dag"
            variant="outlined"
            density="comfortable"
            class="plan-select"
          />
          <v-text-field
            v-model.number="selectedPortions"
            label="Porsjoner"
            type="number"
            min="1"
            variant="outlined"
            density="comfortable"
            class="plan-select"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="planDialog = false">Avbryt</v-btn>
          <v-btn color="var(--app-primary)" variant="flat" @click="confirmPlan">Legg til</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="addedFeedback" timeout="1400" color="var(--app-primary)">
      Måltid lagt til i planen
    </v-snackbar>

    <AddMeal />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const planDialog = ref(false)
const selectedMeal = ref(null)
const selectedDate = ref('')
const selectedPortions = ref(1)
const addedFeedback = ref(false)

const dayFormatter = new Intl.DateTimeFormat('nb-NO', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
})

const dayOptions = computed(() =>
  store.upcomingTwoWeeksPlan.map((day) => {
    const date = new Date(`${day.date}T00:00:00`)
    const title = dayFormatter.format(date)
    return {
      value: day.date,
      title: title.charAt(0).toUpperCase() + title.slice(1),
    }
  })
)

function openPlanDialog(meal) {
  selectedMeal.value = meal
  selectedDate.value = dayOptions.value[0]?.value || ''
  selectedPortions.value = 1
  planDialog.value = true
}

function confirmPlan() {
  if (!selectedMeal.value || !selectedDate.value) return
  store.addMealToPlan(selectedMeal.value.id, selectedDate.value, selectedPortions.value)
  planDialog.value = false
  addedFeedback.value = true
}

function toggleFavorite(mealId) {
  store.toggleFavoriteMeal(mealId)
}
</script>

<style scoped>
.meal-view {
  display: grid;
  gap: 16px;
}

.meal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

.meal-card {
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  border: 1px solid var(--app-border);
  background: var(--app-card);
  overflow: hidden;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
  animation: fadeSlideIn 0.35s ease both;
}

.meal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 34px rgba(65, 47, 16, 0.12);
}

.card-image {
  position: relative;
  height: 230px;
}

.favorite-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  backdrop-filter: blur(4px);
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
  flex: 1;
}

.card-actions {
  margin-top: auto;
  padding: 12px 16px 16px;
}

.plan-dialog {
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: var(--app-card);
  color: var(--app-ink);
}

.plan-title {
  font-weight: 700;
  color: var(--app-ink);
}

.selected-name {
  margin: 0 0 12px;
  color: var(--app-ink);
  font-weight: 600;
}

.plan-dialog :deep(.v-card-text),
.plan-dialog :deep(.v-card-actions),
.plan-dialog :deep(.v-btn) {
  color: var(--app-ink);
}

.plan-select :deep(.v-field) {
  background: color-mix(in srgb, var(--app-card) 94%, transparent);
}

.plan-select :deep(.v-field__input),
.plan-select :deep(.v-label),
.plan-select :deep(.v-select__selection-text),
.plan-select :deep(.v-icon) {
  color: var(--app-ink) !important;
  opacity: 1 !important;
}

.plan-dialog :deep(.v-list),
.plan-dialog :deep(.v-list-item-title) {
  color: var(--app-ink) !important;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 760px) {
  .card-image {
    height: 140px;
  }

  .compact-mobile .card-image {
    height: 84px;
  }

  .compact-mobile .details :deep(.v-expansion-panels),
  .compact-mobile .details :deep(.v-expansion-panel-text) {
    display: none;
  }

  .compact-mobile .details {
    gap: 6px;
  }
}
</style>

