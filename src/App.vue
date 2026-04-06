<template>
  <v-app class="app-shell">
    <router-view />
  </v-app>
</template>

<script setup>
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
</style>
