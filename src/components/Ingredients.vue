<template>
  <div v-if="item.ingredients?.length" class="section">
    <h4>Ingredienser</h4>
    <ul>
      <li v-for="(obj, i) in item.ingredients" :key="i">
        <strong>{{ obj.number }} {{ obj.type }}</strong>
        <span>{{ obj.text }}</span>
        <small>({{ obj.grams }}g)</small>
      </li>
    </ul>
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

h4 {
  margin: 0 0 8px;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #4f6479;
}

ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;
}

li {
  color: #293c50;
  font-size: 14px;
}

li strong {
  margin-right: 6px;
}

li small {
  margin-left: 6px;
  color: #6f8096;
}
</style>
