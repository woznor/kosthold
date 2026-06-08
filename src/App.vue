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
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');

:root {
  --app-bg: #f7eddc;
  --app-bg-soft: #fff7ea;
  --app-ink: #1b1a17;
  --app-muted: #6d675c;
  --app-primary: #155e63;
  --app-primary-strong: #0b464a;
  --app-accent: #d46a3c;
  --app-accent-soft: #f6d1b4;
  --app-card: rgba(255, 250, 243, 0.88);
  --app-card-strong: #fffaf3;
  --app-border: rgba(136, 101, 71, 0.18);
  --app-shadow: 0 22px 44px rgba(109, 72, 39, 0.12);
  --app-shadow-strong: 0 30px 70px rgba(61, 38, 15, 0.18);
  --app-radius-xl: 28px;
  --app-radius-lg: 22px;
  --app-display: 'DM Serif Display', Georgia, serif;
  --app-body: 'Manrope', 'Segoe UI', sans-serif;
}

:root[data-theme='dark'] {
  --app-bg: #15181c;
  --app-bg-soft: #20262c;
  --app-ink: #f4ece1;
  --app-muted: #b8ab99;
  --app-primary: #8cd0c6;
  --app-primary-strong: #b2ece2;
  --app-accent: #f09b67;
  --app-accent-soft: rgba(240, 155, 103, 0.18);
  --app-card: rgba(33, 38, 44, 0.82);
  --app-card-strong: #252c33;
  --app-border: rgba(231, 214, 191, 0.12);
  --app-shadow: 0 20px 50px rgba(0, 0, 0, 0.28);
  --app-shadow-strong: 0 30px 70px rgba(0, 0, 0, 0.4);
}

html,
body,
#app {
  min-height: 100%;
  font-family: var(--app-body);
  background:
    radial-gradient(circle at 12% 18%, rgba(236, 176, 102, 0.22) 0, transparent 22%),
    radial-gradient(circle at 85% 10%, rgba(21, 94, 99, 0.18) 0, transparent 24%),
    radial-gradient(circle at 78% 82%, rgba(212, 106, 60, 0.14) 0, transparent 18%),
    linear-gradient(180deg, #fbf4e8 0%, var(--app-bg) 46%, #efe1cd 100%);
  color: var(--app-ink);
  transition: background 0.25s ease, color 0.25s ease;
}

:root[data-theme='dark'] body,
:root[data-theme='dark'] #app,
:root[data-theme='dark'] html {
  background:
    radial-gradient(circle at 14% 20%, rgba(240, 155, 103, 0.14) 0, transparent 18%),
    radial-gradient(circle at 88% 12%, rgba(140, 208, 198, 0.14) 0, transparent 22%),
    radial-gradient(circle at 70% 80%, rgba(255, 205, 138, 0.08) 0, transparent 18%),
    linear-gradient(180deg, #171b1f 0%, var(--app-bg) 52%, #111418 100%);
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.42;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 26px 26px;
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
  border-radius: var(--app-radius-lg);
  border: 1px solid var(--app-border);
  background: var(--app-card);
  backdrop-filter: blur(18px);
  box-shadow: var(--app-shadow-strong);
}

.auth-title {
  font-weight: 800;
  font-family: var(--app-display);
  font-size: 2rem;
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
  background: color-mix(in srgb, var(--app-card-strong) 88%, transparent);
  border-radius: 16px;
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

.app-shell .v-btn {
  letter-spacing: 0.01em;
  text-transform: none;
  font-weight: 700;
}
</style>
