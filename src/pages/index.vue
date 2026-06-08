<template>
  <div class="page-wrap">
    <header class="hero">
      <div class="hero-copy">
        <p class="hero-kicker">Kamillas fit kjokken</p>
        <h1>Kamillas fit kjokken</h1>
        <p class="hero-lead">Der kalorier er i fokus</p>
      </div>

      <div class="hero-controls">
        <div class="hero-stat">
          <strong>{{ store.filteredMeals.length }}</strong>
          <span>viser maaltider</span>
        </div>
        <v-btn
          :icon="isDark ? 'mdi-weather-night' : 'mdi-white-balance-sunny'"
          size="default"
          variant="flat"
          class="theme-btn"
          @click="toggleTheme"
        />
        <v-btn
          size="default"
          variant="flat"
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
      <v-tab>Planlegg</v-tab>
      <v-tab v-if="authStore.isAdmin">Admin</v-tab>
    </v-tabs>

    <section class="content">
      <MealCard v-if="tab === 0" />
      <UpcomingWeeks v-else-if="tab === 1" />
      <AdminPanel v-else-if="authStore.isAdmin" />
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import AdminPanel from '@/components/AdminPanel.vue'
import MealCard from '@/components/MealCard.vue'
import UpcomingWeeks from '@/components/UpcomingWeeks.vue'
import { useAuthStore } from '../stores/auth'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const authStore = useAuthStore()
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
  authStore.logout()
}

onMounted(() => {
  store.fetchMeals()
  store.loadMealPlan()
  store.loadUserPlannerState()
  store.loadUiPreferences()
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
  max-width: 1360px;
  margin: 0 auto;
  padding: 28px 18px 96px;
}

.hero {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(255, 206, 145, 0.22) 0, transparent 26%),
    linear-gradient(135deg, #113f43 0%, #155e63 52%, #c55f35 120%);
  color: #fff8f0;
  border-radius: calc(var(--app-radius-xl) + 2px);
  padding: 28px;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 24px;
  box-shadow: var(--app-shadow-strong);
}

.hero::before,
.hero::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.hero::before {
  width: 240px;
  height: 240px;
  right: -40px;
  top: -70px;
  background: rgba(255, 255, 255, 0.08);
}

.hero::after {
  width: 180px;
  height: 180px;
  right: 160px;
  bottom: -90px;
  background: rgba(255, 214, 176, 0.13);
}

.hero-copy,
.hero-controls {
  position: relative;
  z-index: 1;
}

.hero-kicker {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.72;
}

.hero h1 {
  margin: 0;
  max-width: 12ch;
  font-family: var(--app-display);
  font-size: clamp(2.3rem, 5vw, 4.4rem);
  line-height: 0.98;
}

.hero-lead {
  max-width: 62ch;
  margin: 14px 0 0;
  color: rgba(255, 248, 240, 0.82);
  font-size: 1.02rem;
  line-height: 1.7;
}

.hero-controls {
  min-width: 220px;
  display: grid;
  align-content: space-between;
  justify-items: end;
  gap: 10px;
}

.hero-stat {
  width: min(210px, 100%);
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  display: grid;
  gap: 4px;
  text-align: left;
}

.hero-stat strong {
  font-family: var(--app-display);
  font-size: 2.2rem;
  line-height: 1;
}

.hero-stat span {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
  opacity: 0.78;
}

.theme-btn {
  min-width: 148px;
  justify-self: stretch;
  color: #fff8f0;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(9, 22, 25, 0.16);
  backdrop-filter: blur(8px);
}

.tabs {
  position: sticky;
  top: 10px;
  z-index: 8;
  margin-top: 18px;
  background: color-mix(in srgb, var(--app-card) 76%, transparent);
  border: 1px solid var(--app-border);
  border-radius: 999px;
  padding: 6px;
  backdrop-filter: blur(18px);
  box-shadow: var(--app-shadow);
}

.content {
  margin-top: 22px;
}

@media (max-width: 760px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 22px;
  }

  .hero-controls {
    width: 100%;
    justify-items: stretch;
  }

  .hero h1 {
    max-width: 12ch;
  }

  .theme-btn,
  .hero-stat {
    width: 100%;
  }
}
</style>
