<template>
  <div class="planner-layout">
    <v-card class="shopping-card" elevation="0">
      <v-card-item>
        <v-card-title class="shopping-title">Handleliste (kommende 2 uker)</v-card-title>
        <template #append>
          <v-btn
            size="small"
            variant="text"
            color="var(--app-primary)"
            prepend-icon="mdi-restore"
            @click="store.resetShoppingList()"
          >
            Nullstill
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <div v-if="store.shoppingList.length" class="shopping-list">
          <div v-for="item in store.shoppingList" :key="item.key" class="shopping-item">
            <div>
              <div class="item-name">{{ item.text }}</div>
              <div class="item-meta">
                <span v-if="item.number">{{ item.number }} {{ item.type || 'stk' }}</span>
                <span v-if="item.grams">({{ item.grams }} g)</span>
              </div>
            </div>
            <v-btn
              icon="mdi-check"
              size="x-small"
              variant="tonal"
              color="var(--app-primary)"
              @click="store.removeShoppingItem(item.key)"
            />
          </div>
        </div>
        <p v-else class="empty">Ingen varer i handlelisten.</p>
      </v-card-text>
    </v-card>

    <div class="plan-view">
      <v-card
        v-for="day in store.upcomingTwoWeeksPlan"
        :key="day.date"
        class="day-card"
        elevation="0"
      >
        <v-card-item>
          <v-card-title class="day-title">{{ formatDate(day.date) }}</v-card-title>
        </v-card-item>

        <v-card-text>
          <div v-if="day.meals.length" class="meal-list">
            <div v-for="meal in day.meals" :key="`${day.date}-${meal.id}`" class="planned-item">
              <div class="planned-main">
                <span>{{ meal.name }}</span>
                <span class="planned-portions">{{ meal.plannedPortions }} porsjon{{ meal.plannedPortions === 1 ? '' : 'er' }}</span>
              </div>
              <v-btn
                icon="mdi-close"
                size="x-small"
                variant="text"
                color="#ba3d25"
                @click="store.removeMealFromPlan(day.date, meal.id)"
              />
            </div>
          </div>
          <p v-else class="empty">Ingen måltider planlagt</p>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from '../stores/app'

const store = useAppStore()

const formatter = new Intl.DateTimeFormat('nb-NO', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
})

function formatDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`)
  const formatted = formatter.format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}
</script>

<style scoped>
.planner-layout {
  display: grid;
  gap: 14px;
}

.shopping-card {
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-card);
}

.shopping-title {
  color: var(--app-ink);
}

.shopping-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
}

.shopping-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  padding: 8px;
  background: color-mix(in srgb, var(--app-bg-soft) 55%, transparent);
}

.item-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--app-ink);
}

.item-meta {
  font-size: 12px;
  color: var(--app-muted);
}

.plan-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.day-card {
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-card);
}

.day-title {
  font-size: 0.95rem;
  color: var(--app-ink);
}

.meal-list {
  display: grid;
  gap: 6px;
}

.planned-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--app-bg-soft) 60%, transparent);
  padding: 6px 8px;
  font-size: 13px;
}

.planned-main {
  display: grid;
  gap: 2px;
}

.planned-portions {
  font-size: 12px;
  color: var(--app-muted);
}

.empty {
  margin: 0;
  color: var(--app-muted);
  font-size: 13px;
}
</style>
