<template>
  <button type="button" class="counter-badge" @click.stop="count++">Vue 子组件计数：{{ count }}</button>
</template>
<script setup lang="ts">
import { ref } from "vue";
const count = ref(0);
</script>
<style scoped>
.counter-badge {
  padding: 4px 8px;
  border-radius: 4px;
  background: #e0f2fe;
  color: #0369a1;
  cursor: pointer;
}
</style>
