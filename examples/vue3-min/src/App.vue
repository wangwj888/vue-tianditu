<script setup lang="ts">
import { ref } from "vue";
import {
  TdtMap,
  TdtHeatmap,
  TdtCustomOverlay,
  TdtControl,
  TdtMarker,
  TdtLayerGroup,
  TdtLayerSwitcher
} from "vue-map-tianditu";

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
</script>

<template>
  <main>
    <h1>Vue 3 消费示例</h1>
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
