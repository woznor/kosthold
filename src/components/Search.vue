<template>
    <div class="d-flex">
    <v-text-field
    v-model="store.searchTerm"
    label="Søk"
    >
    </v-text-field>
    <v-select
    :items="store.mealTypeMap"
    v-model="store.selectedMealType"
    label="Måltidstype"
    clearable
    ></v-select>
</div>

</template>

<script setup>

import { useAppStore } from "../stores/app";

const store = useAppStore();

</script>