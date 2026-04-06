<template>
  <v-divider class="divider" />
  <v-card-title class="section-title">Måltidstype</v-card-title>

  <div class="chips">
    <v-chip
      v-for="(type, i) in item.meal_category"
      :key="i"
      size="small"
      class="chip"
      color="var(--app-primary)"
      variant="tonal"
    >
      {{ type }}
    </v-chip>
  </div>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true,
  },
})
</script>

<style scoped>
.divider {
  margin: 6px 16px 0;
}

.section-title {
  padding: 10px 16px 4px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #23384d;
}

.chips {
  padding: 0 16px 12px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  font-weight: 700;
}
</style>
