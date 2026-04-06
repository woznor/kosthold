<template>
  <div class="page-wrap">
    <header class="hero">
      <div>
        <p class="hero-kicker">Kostholdsplan</p>
      </div>

      <div class="hero-controls">
        <p class="hero-meta">{{ store.filteredMeals.length }} måltider tilgjengelig</p>
        <v-btn
          :icon="isDark ? 'mdi-weather-night' : 'mdi-white-balance-sunny'"
          size="small"
          variant="tonal"
          class="theme-btn"
          @click="toggleTheme"
        />
        <v-btn
          size="small"
          variant="tonal"
          class="theme-btn"
          prepend-icon="mdi-logout"
          @click="logout"
        >
          Logg ut
        </v-btn>
      </div>
    </header>

    <v-tabs v-model="tab" class="tabs" color="var(--app-primary)">
      <v-tab>Måltider</v-tab>
      <v-tab>Kommende 2 uker</v-tab>
    </v-tabs>

    <section class="content">
      <MealCard v-if="tab === 0" />
      <UpcomingWeeks v-else />
    </section>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import MealCard from '@/components/MealCard.vue'
import UpcomingWeeks from '@/components/UpcomingWeeks.vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const tab = ref(0)
const isDark = ref(false)

function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

function toggleTheme() {
  isDark.value = !isDark.value
}

function logout() {
  localStorage.removeItem('auth_ok')
  window.location.reload()
}

onMounted(() => {
  store.fetchMeals()
  store.loadMealPlan()
  store.loadHiddenShoppingItems()
  store.fetchIngredients()
  store.fetchIngredientUnits()

  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') isDark.value = true
  applyTheme()
})

watch(isDark, applyTheme)
</script>

<style scoped>
.page-wrap {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 16px 84px;
}

.hero {
  background: linear-gradient(120deg, #003845 0%, #005f73 100%);
  color: #fdf8ef;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  box-shadow: 0 20px 36px rgba(0, 44, 53, 0.25);
}

.hero-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.8;
}

.hero h1 {
  margin: 0;
  font-size: clamp(1.2rem, 2vw, 1.9rem);
  line-height: 1.2;
}

.hero-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero-meta {
  margin: 0;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.theme-btn {
  color: #fdf8ef;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.tabs {
  margin-top: 14px;
  background: color-mix(in srgb, var(--app-card) 85%, transparent);
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 4px;
}

.content {
  margin-top: 18px;
}

@media (max-width: 760px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-controls {
    align-self: stretch;
    justify-content: space-between;
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
