<template>
<div v-if="item.protein_addons.length">
      <h3 class="mt-2">Ekstra proteinkilde</h3>
      <v-divider class="ma-1"></v-divider>
      <div>
        <div v-for="(obj, i) in item.protein_addons" :key="i">
            {{ obj.number }}
            {{ obj.type }}
            {{ obj.text }}
            {{ "("+obj.grams + "g)" }}
        </div>
        
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