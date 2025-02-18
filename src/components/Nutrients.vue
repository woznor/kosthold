<template>
     <v-icon
          icon="mdi-food-steak"
          color="red"
          size="small"
        ></v-icon>
        <span class="me-1">{{ item.nutrients.protein }}</span>
        <v-icon
          color="error"
          icon="mdi-fire"
          size="small"
        ></v-icon>
        <span class="me-1">{{ item.nutrients.calories }}</span>
        <v-icon
          color="brown"
          icon="mdi-bread-slice-outline"
          size="small"
        ></v-icon>
        <span class="me-1">{{ item.nutrients.carbs }}</span>
        <v-icon
          color="white"
          icon="mdi-water"
          size="small"
        ></v-icon>
        <span class="me-1">{{ item.nutrients.fat }}</span>
        <v-icon
          color="green"
          icon="mdi-sprout-outline"
          size="small"
        ></v-icon>
        <span class="me-1">{{ item.nutrients.fibre }}</span>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})
</script>