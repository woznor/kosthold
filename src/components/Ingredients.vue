<template>
        <div v-if="item.ingredients">
        <div v-for="(obj, i) in item.ingredients" :key="i">
            {{ obj.number }}
            {{ obj.type }}
            {{ obj.text }}
            {{ "("+obj.grams + "g)" }}
        </div>
      </div>
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