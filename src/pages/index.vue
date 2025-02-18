<template>
  <MealCard />
</template>

<script setup>
import MealCard from '@/components/MealCard.vue';


import { onMounted } from 'vue';

import {useAppStore} from "../stores/app"
const store = useAppStore()


onMounted(() => {
  store.fetchMeals()
})

</script>
