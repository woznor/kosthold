<template>
  <div class="meta-line">
    <span class="label">Tilberedning</span>
    <v-icon
      v-if="item.must_be_heated"
      color="#ba3d25"
      icon="mdi-fire-alert"
      size="small"
    />
    <v-icon
      v-else
      color="#7d8ea4"
      icon="mdi-fire-off"
      size="small"
    />
    <span class="status">{{ item.must_be_heated ? 'Må varmes' : 'Kan spises kald' }}</span>
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
.meta-line {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
}

.label {
  color: var(--app-muted);
}

.status {
  color: #4f6479;
}
</style>
