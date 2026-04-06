<template>
  <div class="nutrients">
    <span class="nutrient">
      <v-icon icon="mdi-fire" color="#ba3d25" size="small" />
      <strong>{{ item.nutrients.calories }}</strong>
      <small>kcal</small>
    </span>
    <span class="nutrient">
      <v-icon icon="mdi-food-steak" color="#8a5a2b" size="small" />
      <strong>{{ item.nutrients.protein }}</strong>
      <small>protein</small>
    </span>
    <span class="nutrient">
      <v-icon icon="mdi-bread-slice-outline" color="#9a6f22" size="small" />
      <strong>{{ item.nutrients.carbs }}</strong>
      <small>karb</small>
    </span>
    <span class="nutrient">
      <v-icon icon="mdi-water" color="#2f6fb1" size="small" />
      <strong>{{ item.nutrients.fat }}</strong>
      <small>fett</small>
    </span>
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
.nutrients {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.nutrient {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #fff4e6;
  border: 1px solid #efd8bb;
  border-radius: 12px;
  min-height: 32px;
  font-size: 12px;
}

.nutrient strong {
  font-size: 13px;
}

.nutrient small {
  color: #6f5b42;
  text-transform: lowercase;
}

@media (max-width: 420px) {
  .nutrients {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
