<template>
  <v-app class="app-shell">
    <div v-if="!isAuthenticated" class="auth-wrap">
      <v-card class="auth-card" elevation="0">
        <v-card-title class="auth-title">Låst side</v-card-title>
        <v-card-text>
          <p class="auth-copy">Skriv inn passord for å åpne planen.</p>
          <v-text-field
            v-model="passwordInput"
            label="Passord"
            type="password"
            variant="outlined"
            density="comfortable"
            :error="hasError"
            :error-messages="hasError ? ['Feil passord'] : []"
            @keyup.enter="login"
          />
          <v-btn color="var(--app-primary)" variant="flat" block @click="login">Logg inn</v-btn>
        </v-card-text>
      </v-card>
    </div>

    <router-view v-else />
  </v-app>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const AUTH_KEY = 'auth_ok'
const PASSWORD_HASH = 'dfdae38fd30310922474a025dab9e5247fc9f2714dd1b848b53c871b90a31a5b'

const isAuthenticated = ref(false)
const passwordInput = ref('')
const hasError = ref(false)

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function login() {
  const inputHash = await sha256Hex(passwordInput.value)
  if (inputHash === PASSWORD_HASH) {
    isAuthenticated.value = true
    hasError.value = false
    localStorage.setItem(AUTH_KEY, '1')
  } else {
    hasError.value = true
  }
}

onMounted(() => {
  isAuthenticated.value = localStorage.getItem(AUTH_KEY) === '1'
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
