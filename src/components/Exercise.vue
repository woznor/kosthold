<template>
    {{store.exercises}}
  <v-card
    v-for="(item, i) in store.exercises"
    :key="i"
    :disabled="store.loading"
    :loading="store.loading"
    class="mx-auto my-12"
    max-width="600"
  >
    <template v-slot:loader="{ isActive }">
      <v-progress-linear
        :active="isActive"
        color="deep-purple"
        height="4"
        indeterminate
      ></v-progress-linear>
    </template>

    <v-img height="250" :src="item.image" cover></v-img>

    <v-card-item>
      <v-card-title>{{ item.name }}</v-card-title>

      <v-card-subtitle>
      </v-card-subtitle>
      <v-card-subtitle> </v-card-subtitle>
    </v-card-item>

    <v-card-text>

    </v-card-text>


    <v-card-actions>
      <v-btn
        color="deep-purple-lighten-2"
        text="Legg i dagens måltid"
        block
        border
      ></v-btn>
    </v-card-actions>
  </v-card>
</template>




<script setup>
import { useAppStore } from "../stores/app";

const store = useAppStore();

  </script>