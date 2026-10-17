<template>
  <div class="demo-toolbar">
    <button type="button" @click="move">移动位置</button>
    <label><input v-model="visible" type="checkbox" /> 显示覆盖物</label>
    <label><input v-model="interactive" type="checkbox" /> 可交互</label>
    <span>最近点击：{{ lastClick }}</span>
  </div>
  <p v-if="errorMessage" class="demo-error" role="alert">{{ errorMessage }}</p>
  <div class="custom-overlay-demo-map">
    <tdt-map :center="center" :zoom="13" @error="onError">
      <tdt-custom-overlay
        :position="position"
        :visible="visible"
        :interactive="interactive"
        :z-index="10"
        ext-data="水波纹点"
        @click="lastClick = '水波纹点'"
        @error="onError"
      >
        <button class="ripple-point" type="button" aria-label="点击水波纹点计数" @click="clicks++">
          <span>{{ clicks }}</span>
        </button>
      </tdt-custom-overlay>
      <tdt-custom-overlay
        :position="position"
        anchor="bottom"
        :offset="[0, -32]"
        :visible="visible"
        :interactive="interactive"
        :z-index="11"
        @error="onError"
      >
        <div class="status-card">
          <strong>自定义 Vue 内容</strong>
          <span>{{ position[0].toFixed(4) }}, {{ position[1].toFixed(4) }}</span>
          <CounterBadge />
        </div>
      </tdt-custom-overlay>
    </tdt-map>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import CounterBadge from "./CounterBadge.vue";

const center = [113.280637, 23.125178];
const position = ref([...center]);
const visible = ref(true);
const interactive = ref(true);
const clicks = ref(0);
const lastClick = ref("无");
const errorMessage = ref("");
let moved = false;
function move() {
  moved = !moved;
  position.value = [center[0] + (moved ? 0.012 : 0), center[1] + (moved ? 0.006 : 0)];
}
function onError(error: unknown) {
  errorMessage.value = error instanceof Error ? error.message : String(error);
}
</script>
<script lang="ts">
export default { name: "DemoCustomOverlay" };
</script>
<style scoped>
.custom-overlay-demo-map {
  width: 100%;
  height: 400px;
}
.ripple-point {
  position: relative;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 2px solid white;
  border-radius: 50%;
  background: #0ea5e9;
  color: white;
  cursor: pointer;
}
.ripple-point::before,
.ripple-point::after {
  position: absolute;
  inset: -3px;
  border: 2px solid #0ea5e9;
  border-radius: 50%;
  content: "";
  pointer-events: none;
  animation: ripple 2s ease-out infinite;
}
.ripple-point::after {
  animation-delay: 1s;
}
.ripple-point span {
  position: relative;
  font-size: 12px;
}
.status-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 190px;
  padding: 12px;
  border: 1px solid #bae6fd;
  border-radius: 10px;
  background: white;
  color: #0f172a;
  box-shadow: 0 4px 16px #0f172a22;
  white-space: nowrap;
}
.status-card span {
  font-size: 12px;
  color: #475569;
}
@keyframes ripple {
  from {
    opacity: 0.8;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(3);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ripple-point::before,
  .ripple-point::after {
    animation: none;
  }
}
</style>
