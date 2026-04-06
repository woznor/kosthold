<template>
  <div class="meal-view">
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
          <!-- <v-btn
            color="#ba3d25"
            variant="text"
            rounded="pill"
            prepend-icon="mdi-delete-outline"
            text="Slett"
            @click="store.deleteMeal(item.id)"
          /> -->
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
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="planDialog = false">Avbryt</v-btn>
          <v-btn color="var(--app-primary)" variant="flat" @click="confirmPlan">Legg til</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
  planDialog.value = true
}

function confirmPlan() {
  if (!selectedMeal.value || !selectedDate.value) return
  store.addMealToPlan(selectedMeal.value.id, selectedDate.value)
  planDialog.value = false
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
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.meal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 34px rgba(65, 47, 16, 0.12);
}

.card-image {
  position: relative;
  height: 230px;
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

@media (max-width: 760px) {
  .card-image {
    height: 140px;
  }
}
</style>
