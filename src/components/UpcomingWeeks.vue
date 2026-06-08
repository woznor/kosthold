<template>
  <div class="planner-layout">
    <v-card class="shopping-card" elevation="0">
      <v-card-item>
        <v-card-title class="shopping-title">Handleliste</v-card-title>
        <template #append>
          <div class="shopping-actions">
            <v-select
              v-model="sortMode"
              :items="sortModes"
              item-title="label"
              item-value="value"
              density="compact"
              variant="outlined"
              hide-details
              class="sort-select"
            />
            <v-btn
              size="small"
              variant="text"
              color="var(--app-primary)"
              prepend-icon="mdi-restore"
              @click="store.resetShoppingList()"
            >
              Nullstill
            </v-btn>
          </div>
        </template>
      </v-card-item>

      <v-card-text>
        <div v-if="store.shoppingList.length" class="shopping-list-wrap">
          <div v-for="group in groupedShoppingList" :key="group.title" class="shopping-group">
            <h4 v-if="groupedShoppingList.length > 1" class="group-title">{{ group.title }}</h4>
            <TransitionGroup name="shopping" tag="div" class="shopping-list">
              <div v-for="item in group.items" :key="item.key" class="shopping-item">
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
            </TransitionGroup>
          </div>
        </div>
        <p v-else class="empty">Ingen varer i handlelisten.</p>
      </v-card-text>
    </v-card>

    <div class="planner-header">
      <h3>Planlegg</h3>
      <v-btn
        size="small"
        color="var(--app-primary)"
        variant="tonal"
        prepend-icon="mdi-calendar-sync"
        @click="store.autoPlanDinnerForTwoWeeks()"
      >
        Auto-plan middag
      </v-btn>
    </div>

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
import { computed, ref } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const sortMode = ref('alphabetical')

const sortModes = [
  { label: 'Sorter: A-Å', value: 'alphabetical' },
  { label: 'Sorter etter butikk', value: 'store' },
]

const formatter = new Intl.DateTimeFormat('nb-NO', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
})

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function shopCategory(itemText) {
  const text = normalize(itemText)

  const rules = [
    { title: 'Frukt og grønt', words: ['salat', 'tomat', 'agurk', 'paprika', 'lok', 'hvitlok', 'gulrot', 'potet', 'brokkoli', 'mais', 'frukt', 'eple', 'banan', 'sitron', 'ingef', 'koriander', 'sopp'] },
    { title: 'Kjøtt og fisk', words: ['kylling', 'storfe', 'karbonade', 'biff', 'bacon', 'fisk', 'torsk', 'radyr', 'spekeskinke', 'kjott'] },
    { title: 'Meieri og egg', words: ['melk', 'yoghurt', 'kesam', 'skyr', 'egg', 'ost', 'creme fraiche', 'kremost', 'smor'] },
    { title: 'Tørrvarer og krydder', words: ['ris', 'pasta', 'nudler', 'buljong', 'krydder', 'mel', 'corn flakes', 'taco', 'saus', 'olje', 'quinoa', 'couscous'] },
  ]

  const match = rules.find((group) => group.words.some((word) => text.includes(word)))
  return match ? match.title : 'Annet'
}

const groupedShoppingList = computed(() => {
  const list = store.shoppingList
  if (sortMode.value !== 'store') {
    return [{ title: 'Alle varer', items: list }]
  }

  const grouped = new Map()
  list.forEach((item) => {
    const title = shopCategory(item.text)
    if (!grouped.has(title)) grouped.set(title, [])
    grouped.get(title).push(item)
  })

  return Array.from(grouped.entries())
    .map(([title, items]) => ({
      title,
      items: items.sort((a, b) => a.text.localeCompare(b.text, 'nb')),
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'nb'))
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
  gap: 20px;
}

.shopping-card {
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-xl);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--app-card-strong) 94%, transparent), color-mix(in srgb, var(--app-card) 82%, transparent));
  backdrop-filter: blur(14px);
  box-shadow: var(--app-shadow);
}

.shopping-title {
  font-family: var(--app-display);
  font-size: 1.9rem;
  color: var(--app-ink);
}

.shopping-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-select {
  min-width: 190px;
}

.shopping-list-wrap {
  display: grid;
  gap: 18px;
}

.group-title {
  margin: 0 0 8px;
  color: var(--app-accent);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.shopping-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.shopping-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  padding: 12px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--app-bg-soft) 76%, transparent), transparent);
}

.shopping-enter-active,
.shopping-leave-active {
  transition: all 0.2s ease;
}

.shopping-enter-from,
.shopping-leave-to {
  opacity: 0;
  transform: translateY(8px);
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

.planner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.planner-header h3 {
  margin: 0;
  font-family: var(--app-display);
  font-size: 2rem;
  font-weight: 400;
  color: var(--app-ink);
}

.plan-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.day-card {
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--app-card-strong) 92%, transparent), color-mix(in srgb, var(--app-card) 82%, transparent));
  box-shadow: var(--app-shadow);
  transition: transform 0.24s ease, box-shadow 0.24s ease;
}

.day-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--app-shadow-strong);
}

.day-title {
  font-size: 1.02rem;
  letter-spacing: 0.01em;
  color: var(--app-ink);
}

.meal-list {
  display: grid;
  gap: 10px;
}

.planned-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--app-bg-soft) 78%, transparent), transparent);
  padding: 10px 12px;
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

@media (max-width: 760px) {
  .shopping-actions {
    width: 100%;
    justify-content: space-between;
  }

  .sort-select {
    min-width: 0;
    width: 55%;
  }

  .planner-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
