<template>
  <v-app class="app-shell">
    <div v-if="!authStore.initialized || authStore.loading" class="auth-wrap">
      <v-card class="auth-card" elevation="0">
        <v-card-title class="auth-title">Laster</v-card-title>
        <v-card-text>
          <v-progress-linear color="var(--app-primary)" indeterminate />
        </v-card-text>
      </v-card>
    </div>

    <div v-else-if="!authStore.isAuthenticated" class="auth-wrap">
      <v-card class="auth-card" elevation="0">
        <v-card-title class="auth-title">Logg inn</v-card-title>
        <v-card-text>
          <p class="auth-copy">Skriv inn whitelisted e-post og passord.</p>
          <v-text-field
            v-model="emailInput"
            label="E-post"
            type="email"
            variant="outlined"
            density="comfortable"
            :error="Boolean(authStore.error)"
            :error-messages="authStore.error ? [authStore.error] : []"
            @keyup.enter="submitAuth"
          />
          <v-text-field
            v-model="passwordInput"
            label="Passord"
            type="password"
            variant="outlined"
            density="comfortable"
            :error="Boolean(authStore.error)"
            @keyup.enter="submitAuth"
          />
          <v-btn
            color="var(--app-primary)"
            variant="flat"
            block
            :loading="authStore.loading"
            @click="submitAuth"
          >
            Logg inn
          </v-btn>
        </v-card-text>
      </v-card>
    </div>

    <router-view v-else />
  </v-app>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const emailInput = ref('')
const passwordInput = ref('')

async function submitAuth() {
  await authStore.login(emailInput.value, passwordInput.value)
}

onMounted(() => {
  authStore.initializeAuth()
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

:root {
  --app-bg: #f3efe6;
  --app-bg-soft: #fff9f1;
  --app-ink: #1f2a37;
  --app-muted: #607089;
  --app-primary: #005f73;
  --app-accent: #ee9b00;
  --app-card: #fffdf8;
  --app-border: #e2d8c8;
}

:root[data-theme='dark'] {
  --app-bg: #121620;
  --app-bg-soft: #1a2230;
  --app-ink: #e5edf9;
  --app-muted: #98a8bf;
  --app-primary: #4dc2d6;
  --app-accent: #ffb347;
  --app-card: #1b2432;
  --app-border: #2e3c53;
}

html,
body,
#app {
  min-height: 100%;
  font-family: 'Manrope', 'Segoe UI', sans-serif;
  background: radial-gradient(circle at top right, #ffe9c7 0%, var(--app-bg) 45%, #efe7d8 100%);
  color: var(--app-ink);
  transition: background 0.25s ease, color 0.25s ease;
}

:root[data-theme='dark'] body,
:root[data-theme='dark'] #app,
:root[data-theme='dark'] html {
  background: radial-gradient(circle at top right, #203448 0%, var(--app-bg) 50%, #0f141d 100%);
}

.app-shell {
  background: transparent;
}

.auth-wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
}

.auth-card {
  width: min(420px, 100%);
  border-radius: 16px;
  border: 1px solid var(--app-border);
  background: var(--app-card);
}

.auth-title {
  font-weight: 800;
}

.auth-copy {
  margin: 0 0 12px;
  color: var(--app-muted);
}

.app-shell .v-card,
.app-shell .v-list,
.app-shell .v-card-title,
.app-shell .v-card-subtitle,
.app-shell .v-card-text {
  color: var(--app-ink);
}

.app-shell .v-field {
  background: color-mix(in srgb, var(--app-card) 94%, transparent);
}

.app-shell .v-field__input,
.app-shell .v-label,
.app-shell .v-select__selection-text,
.app-shell .v-field .v-icon,
.app-shell .v-selection-control .v-label,
.app-shell .v-tab {
  color: var(--app-ink) !important;
  opacity: 1 !important;
}

.app-shell .v-field input::placeholder {
  color: color-mix(in srgb, var(--app-ink) 60%, transparent);
}
</style>
