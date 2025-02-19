<template>
  <v-tabs v-model="tab" align-tabs="center">
    <v-tab>Måltider</v-tab>
    <v-tab>Trening</v-tab>
  </v-tabs>
  <MealCard v-if="tab == 0" />
  <Exercise v-if="tab == 1" />
</template>

<script setup>
import MealCard from "@/components/MealCard.vue";

import { onMounted } from "vue";

import { useAppStore } from "../stores/app";
const store = useAppStore();
const tab = ref(1);

onMounted(() => {
  store.fetchMeals();
  store.fetchExcerises();
});
</script>
