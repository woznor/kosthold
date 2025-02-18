<template>
    <div v-html="item.procedure" class="my-4">
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