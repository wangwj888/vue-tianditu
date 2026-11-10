<template>
  <div class="demo-toolbar">
    <label
      >透明度 {{ opacity.toFixed(2) }} <input v-model.number="opacity" type="range" min="0" max="1" step="0.05"
    /></label>
    <label><input v-model="visible" type="checkbox" /> 显示图片</label>
    <button type="button" @click="move">移动范围</button>
  </div>
  <p v-if="errorMessage" class="demo-error" role="alert">{{ errorMessage }}</p>
  <div class="image-overlay-demo-map">
    <tdt-map :center="center" :zoom="11">
      <tdt-image-overlay
        :url="url"
        :bounds="bounds"
        :opacity="opacity"
        :visible="visible"
        :z-index="2"
        alt="示例图片覆盖物"
        @error="onError"
      />
    </tdt-map>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const center = [113.280637, 23.125178] as [number, number];
const baseBounds: [[number, number], [number, number]] = [
  [113.18, 23.05],
  [113.38, 23.2]
];
const shiftedBounds: [[number, number], [number, number]] = [
  [113.3, 23.1],
  [113.5, 23.25]
];
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#1677ff" stop-opacity=".55"/>
    <stop offset="1" stop-color="#22c55e" stop-opacity=".35"/>
  </linearGradient></defs>
  <rect width="640" height="360" fill="url(#g)"/>
  <rect x="8" y="8" width="624" height="344" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="12 8"/>
  <text x="320" y="190" text-anchor="middle" font-size="42" font-family="sans-serif" fill="#fff">Image Overlay</text>
</svg>`;
const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const bounds = ref<[[number, number], [number, number]]>(baseBounds);
const opacity = ref(0.8);
const visible = ref(true);
const errorMessage = ref("");
let shifted = false;

function move() {
  shifted = !shifted;
  bounds.value = shifted ? shiftedBounds : baseBounds;
}
function onError(error: unknown) {
  errorMessage.value = error instanceof Error ? error.message : String(error);
}
</script>

<script lang="ts">
export default { name: "DemoImageOverlay" };
</script>

<style scoped>
.image-overlay-demo-map {
  width: 100%;
  height: 380px;
}
</style>
