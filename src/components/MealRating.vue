<template>
  <div class="rating-row">
    <v-rating
      :model-value="item.rating"
      color="#ee9b00"
      density="compact"
      size="small"
      half-increments
      readonly
    />

    <span class="value">{{ item.rating.toFixed(1) }}</span>
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
.rating-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.value {
  font-size: 13px;
  font-weight: 700;
  color: #5f6f84;
}
</style>
