<template>
    <v-row
        align="center"
        class="mx-0"
      >
        <v-rating
          :model-value="item.rating"
          color="amber"
          density="compact"
          size="small"
          half-increments
          readonly
        ></v-rating>

        <div class="text-grey ms-4">
          {{ item.rating + ".0 (23)" }}
        </div>
      </v-row>
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