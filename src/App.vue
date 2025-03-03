<template>
  <v-app>
    
    <router-view />
  </v-app>
</template>

<script setup>

import { useAppStore } from "./stores/app";
const store = useAppStore();

</script>
