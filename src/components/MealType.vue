<template>
     <v-divider class="mx-4 mb-1"></v-divider>
     <v-card-title>Måltidstype</v-card-title>

<div class="px-4 mb-2">
    <v-chip class="ma-1" v-for="(type, i) in item.meal_category" :key="i">
        {{ type }}</v-chip>
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