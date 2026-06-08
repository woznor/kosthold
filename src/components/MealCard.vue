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
          <div v-if="item.verified" class="verified-badge">
            Verifisert
          </div>
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
          <div class="action-grid">
            <v-btn
              color="var(--app-primary)"
              variant="tonal"
              rounded="pill"
              text="Velg måltid"
              @click="openPlanDialog(item)"
            />
            <v-btn
              color="var(--app-accent)"
              variant="flat"
              rounded="pill"
              prepend-icon="mdi-pencil"
              text="Rydd oppskrift"
              @click="store.openMealEditor(item.id)"
            />
          </div>
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
  gap: 20px;
}

.meal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 22px;
}

.meal-card {
  display: flex;
  flex-direction: column;
  position: relative;
  border-radius: var(--app-radius-xl);
  border: 1px solid var(--app-border);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--app-card-strong) 95%, transparent), color-mix(in srgb, var(--app-card) 82%, transparent));
  backdrop-filter: blur(14px);
  overflow: hidden;
  box-shadow: var(--app-shadow);
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
  animation: fadeSlideIn 0.35s ease both;
}

.meal-card:hover {
  transform: translateY(-6px) rotate(-0.2deg);
  box-shadow: var(--app-shadow-strong);
  border-color: color-mix(in srgb, var(--app-accent) 30%, var(--app-border));
}

.meal-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at top right, rgba(212, 106, 60, 0.12) 0, transparent 20%),
    linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.02) 100%);
}

.card-image {
  position: relative;
  height: 250px;
}

.card-image :deep(.v-responsive__content) {
  height: 100%;
}

.card-image :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.favorite-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to top, rgba(17, 22, 24, 0.72), rgba(17, 22, 24, 0.08)),
    linear-gradient(130deg, rgba(212, 106, 60, 0.18), transparent 52%);
}

.title {
  font-family: var(--app-display);
  font-size: 1.55rem;
  line-height: 1.08;
  font-weight: 400;
  color: var(--app-ink);
  white-space: normal;
}

.subtitle {
  margin-top: 10px;
  color: var(--app-muted);
}

.verified-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-primary) 18%, white);
  color: var(--app-primary-strong);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-top: 8px;
}

.details {
  display: grid;
  gap: 16px;
  flex: 1;
}

.card-actions {
  margin-top: auto;
  padding: 14px 18px 18px;
}

.action-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.plan-dialog {
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  background: var(--app-card);
  color: var(--app-ink);
  box-shadow: var(--app-shadow-strong);
}

.plan-title {
  font-family: var(--app-display);
  font-size: 1.8rem;
  font-weight: 400;
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
    height: 170px;
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

  .action-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 761px) {
  .card-image {
    height: 220px;
    min-height: 220px;
    max-height: 220px;
  }
}
</style>
