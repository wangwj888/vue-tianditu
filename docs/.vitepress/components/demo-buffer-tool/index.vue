<template>
  <div class="demo-toolbar">
    <label><input v-model="active" type="checkbox" /> 启用拖拽</label>
    <button type="button" @click="bufferRef?.clear()">清除缓冲区</button>
    <span>{{ message }}</span>
  </div>
  <p v-if="errorMessage" class="demo-error" role="alert">{{ errorMessage }}</p>
  <div class="buffer-tool-demo-map">
    <tdt-map :center="center" :zoom="11">
      <tdt-polygon :path="polygonPath" color="#1677ff" :fill-opacity="0.2" @init="polygon = $event" />
      <tdt-circle :center="circleCenter" :radius="2500" color="#22c55e" :fill-opacity="0.2" @init="circle = $event" />
      <tdt-buffer-tool
        ref="bufferRef"
        :layers="layers"
        :active="active"
        :style="{
          color: '#ef4444',
          weight: 2,
          opacity: 0.8,
          fillColor: '#fecaca',
          fillOpacity: 0.35,
          lineStyle: 'dashed'
        }"
        @drag-start="message = '开始拖动…'"
        @drag="onDrag"
        @drag-end="onDragEnd"
        @error="onError"
      />
    </tdt-map>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from "vue";
import type { BufferToolExposed } from "../../../../packages";

const center = [113.280637, 23.125178] as [number, number];
const circleCenter = [113.33, 23.13] as [number, number];
const polygonPath = [
  [113.22, 23.16],
  [113.28, 23.17],
  [113.3, 23.11],
  [113.24, 23.1]
] as [number, number][];
const polygon = shallowRef<T.Polygon>();
const circle = shallowRef<T.Circle>();
const layers = computed(() => [polygon.value, circle.value].filter(Boolean) as (T.Polygon | T.Circle)[]);
const bufferRef = ref<BufferToolExposed>();
const active = ref(true);
const message = ref("拖动多边形或圆生成缓冲区");
const errorMessage = ref("");

function onDrag(event: T.BufferToolEvent) {
  if (event.radius != null) message.value = `缓冲区半径约 ${Math.round(event.radius)} 米`;
}
function onDragEnd(event: T.BufferToolEvent) {
  message.value = event.radius != null ? `已生成缓冲区，半径约 ${Math.round(event.radius)} 米` : "缓冲区已更新";
}
function onError(error: unknown) {
  errorMessage.value = error instanceof Error ? error.message : String(error);
}
</script>

<script lang="ts">
export default { name: "DemoBufferTool" };
</script>

<style scoped>
.buffer-tool-demo-map {
  width: 100%;
  height: 420px;
}
</style>
