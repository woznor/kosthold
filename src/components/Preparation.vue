<template>
     <span class="me-1">Tilberedning</span>

<v-icon
  v-if="item.must_be_heated"
  color="error"
  icon="mdi-fire-alert"
  size="small"
></v-icon>
<v-icon
  v-if="!item.must_be_heated"
  color="error"
  icon="mdi-fire-off"
  size="small"
></v-icon>
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