<template>
  <v-footer class="footer" app height="52">
    <div class="inner">
      <span class="brand">Kosthold</span>
      <span class="meta">&copy; {{ year }} Meal Planner</span>
    </div>
  </v-footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.footer {
  backdrop-filter: blur(8px);
  background: rgba(255, 249, 241, 0.84);
  border-top: 1px solid var(--app-border);
}

.inner {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #425466;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.brand {
  color: var(--app-primary);
  font-weight: 800;
}
</style>
