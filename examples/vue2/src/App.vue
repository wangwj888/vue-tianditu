<script setup lang="ts">
import { computed, ref, shallowRef } from "vue";
import {
  TdtMap,
  TdtHeatmap,
  TdtCustomOverlay,
  TdtControl,
  TdtMarker,
  TdtLayerGroup,
  TdtLayerSwitcher,
  TdtImageOverlay,
  TdtSvgOverlay,
  TdtBufferTool,
  TdtPolygon,
  TdtContextMenu
} from "vue-map-tianditu";
import type { ContextMenuItem } from "vue-map-tianditu";

const tk = import.meta.env.VITE_TDT_KEY as string | undefined;
const visible = ref(true);
const position = ref<[number, number]>([116.397, 39.908]);
const points = ref([
  { lng: 116.397, lat: 39.908, count: 50 },
  { lng: 116.407, lat: 39.918, count: 90 }
]);
const map = ref<TdtMap>();
const controls = ref<VT.ControlName[]>(["Zoom"]);
const mapMessage = ref("");
function readMap() {
  const instance = map.value?.getMap();
  const center = instance?.getCenter();
  mapMessage.value = center ? `中心：${center.lng.toFixed(4)}, ${center.lat.toFixed(4)}` : "地图尚未就绪";
}
const heatmap = ref<TdtHeatmap>();
const overlay = ref<TdtCustomOverlay>();
function refresh() {
  heatmap.value?.refresh();
  overlay.value?.refresh();
}
const imageUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" fill="#1677ff" fill-opacity=".35"/><text x="100" y="66" text-anchor="middle" fill="white" font-size="18">Image</text></svg>'
)}`;
const imageBounds = [
  [116.35, 39.88],
  [116.45, 39.93]
] as [[number, number], [number, number]];
const menuItems: ContextMenuItem[] = [
  { key: "zoom-in", label: "放大一级" },
  { key: "zoom-out", label: "缩小一级" }
];
function onMenuSelect(item: ContextMenuItem) {
  const instance = map.value?.getMap();
  if (item.key === "zoom-in") instance?.zoomIn();
  else if (item.key === "zoom-out") instance?.zoomOut();
}
const polygon = shallowRef<T.Polygon>();
const bufferLayers = computed(() => (polygon.value ? [polygon.value] : []));
const polygonPath = [
  [116.36, 39.89],
  [116.42, 39.9],
  [116.4, 39.94]
] as [number, number][];
const svgOverlay = ref<TdtSvgOverlay>();
</script>

<template>
  <main>
    <h1>Vue 2.7 消费示例</h1>
    <p v-if="!tk">请在此示例的 .env.local 中设置 VITE_TDT_KEY 后启动地图。</p>
    <template v-else>
      <button @click="visible = !visible">切换覆盖物</button>
      <button @click="readMap">读取地图实例</button>
      <button @click="controls = controls.length ? [] : ['Zoom']">切换缩放控件</button>
      <span>{{ mapMessage }}</span>
      <TdtMap ref="map" :load-config="{ tk }" :center="position" :zoom="12" :controls="controls" class="map">
        <template #loading>正在加载地图…</template>
        <template #error="{ error }">{{ error?.message }}</template>
        <TdtLayerSwitcher />
        <TdtImageOverlay :url="imageUrl" :bounds="imageBounds" :opacity="0.35" :z-index="1" />
        <TdtPolygon :path="polygonPath" color="#f59e0b" :fill-opacity="0.15" @init="polygon = $event" />
        <TdtBufferTool :layers="bufferLayers" :active="false" />
        <TdtSvgOverlay ref="svgOverlay" :z-index="3" />
        <TdtContextMenu :items="menuItems" @select="onMenuSelect" />
        <TdtControl><button @click="refresh">刷新覆盖物</button></TdtControl>
        <TdtLayerGroup id="business" name="业务覆盖物">
          <TdtMarker :position="position" />
          <TdtHeatmap ref="heatmap" :data="points" :max="100" :visible="visible" />
          <TdtCustomOverlay ref="overlay" :position="position" :visible="visible" :offset="[48, 0]" anchor="center">
            <button class="ripple" @click="position = [position[0] + 0.01, position[1]]">移动</button>
          </TdtCustomOverlay>
        </TdtLayerGroup>
      </TdtMap>
    </template>
  </main>
</template>

<style scoped>
main {
  font-family: sans-serif;
  padding: 20px;
}
.map {
  height: 480px !important;
  margin-top: 16px;
}
.ripple {
  border-radius: 50%;
  background: #1677ff;
  color: white;
  width: 48px;
  height: 48px;
  border: 0;
  cursor: pointer;
  box-shadow: 0 0 0 12px #1677ff33;
}
</style>
