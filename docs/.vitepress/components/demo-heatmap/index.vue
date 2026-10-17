<template>
  <div class="demo-toolbar">
    <button type="button" @click="replaceData">更新数据</button>
    <button type="button" @click="data = []">清空</button>
    <label><input v-model="visible" type="checkbox" /> 显示热力图</label>
    <label>半径 {{ radius }} px <input v-model.number="radius" type="range" min="10" max="70" /></label>
    <label
      >配色
      <select v-model="palette">
        <option value="warm">暖色</option>
        <option value="cool">冷色</option>
      </select></label
    >
    <span>{{ data.length }} 个数据点</span>
  </div>
  <p v-if="errorMessage" class="demo-error" role="alert">{{ errorMessage }}</p>
  <div class="heatmap-demo-map">
    <tdt-map :center="center" :zoom="12" @error="onError">
      <tdt-heatmap :data="data" :max="100" :radius="radius" :gradient="gradient" :visible="visible" @error="onError" />
    </tdt-map>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const center = [113.280637, 23.125178];
let generation = 0;
function createData() {
  return Array.from({ length: 80 }, (_, index) => ({
    lng: center[0] + ((index % 10) - 4.5) * 0.008,
    lat: center[1] + (Math.floor(index / 10) - 3.5) * 0.006,
    count: ((index * 17 + generation * 29) % 100) + 1
  }));
}
const data = ref(createData());
const radius = ref(32);
const visible = ref(true);
const palette = ref("warm");
const errorMessage = ref("");
const gradient = computed<Record<number, string>>(() =>
  palette.value === "warm"
    ? { 0.2: "#2563eb", 0.45: "#22c55e", 0.7: "#facc15", 1: "#ef4444" }
    : { 0.2: "#312e81", 0.45: "#7c3aed", 0.7: "#06b6d4", 1: "#a7f3d0" }
);
function replaceData() {
  generation++;
  data.value = createData();
}
function onError(error: unknown) {
  errorMessage.value = error instanceof Error ? error.message : String(error);
}
</script>
<script lang="ts">
export default { name: "DemoHeatmap" };
</script>
<style scoped>
.heatmap-demo-map {
  width: 100%;
  height: 380px;
}
select {
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 2px 6px;
}
</style>
