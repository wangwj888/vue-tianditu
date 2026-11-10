<template>
  <section>
    <div class="demo-toolbar">
      <button @click="readMap">读取地图实例</button>
      <button @click="toggleControls">切换缩放控件</button>
      <span>{{ message }}</span>
    </div>
    <div class="mapDiv">
      <tdt-map ref="mapRef" v-model:center="state.center" v-model:zoom="state.zoom" :controls="controls">
        <template #loading="{ loading }">
          <div v-if="loading" class="map-status">正在加载地图…</div>
        </template>
        <template #error="{ error }">
          <div class="map-status">地图加载失败：{{ error?.message }}。请检查 Key 和网络后重新挂载地图。</div>
        </template>
      </tdt-map>
    </div>
    <p>中心：{{ state.center.map(value => value.toFixed(4)).join(", ") }}；级别：{{ state.zoom }}</p>
  </section>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import type { TdtMap } from "../../../../packages";

const mapRef = ref<TdtMap>();
const controls = ref<VT.ControlName[]>(["Zoom"]);
const message = ref("");

const state = reactive({
  center: [113.280637, 23.125178] as [number, number],
  zoom: 11
});

function readMap() {
  const map = mapRef.value?.getMap();
  const center = map?.getCenter();
  message.value = center ? `原生实例中心：${center.lng.toFixed(4)}, ${center.lat.toFixed(4)}` : "地图尚未就绪";
}

function toggleControls() {
  controls.value = controls.value.length ? [] : ["Zoom"];
}
</script>

<script lang="ts">
export default { name: "DemoMap" };
</script>

<style scoped>
.mapDiv {
  width: 100%;
  height: 300px;
}
.map-status {
  max-width: 90%;
  padding: 12px 16px;
  border-radius: 6px;
  background: var(--vp-c-bg, #fff);
  color: var(--vp-c-text-1, #222);
}
</style>
