<template>
  <div v-if="item.procedure" class="section">
    <h4>Fremgangsmåte</h4>
    <div v-html="item.procedure" class="body" />
  </div>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true,
  },
})
</script>

<style scoped>
.section {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: #fffdf8;
  padding: 12px;
}

.section h4 {
  margin: 0 0 8px;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #4f6479;
}

.body {
  color: #293c50;
  font-size: 14px;
  line-height: 1.5;
}
</style>
