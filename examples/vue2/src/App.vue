<script setup lang="ts">
import { ref } from "vue";
import { TdtMap, TdtHeatmap, TdtCustomOverlay, TdtControl, TdtMarker } from "vue-map-tianditu";

const tk = import.meta.env.VITE_TDT_KEY as string | undefined;
const visible = ref(true);
const position = ref<[number, number]>([116.397, 39.908]);
const points = ref([
  { lng: 116.397, lat: 39.908, count: 50 },
  { lng: 116.407, lat: 39.918, count: 90 }
]);
const map = ref<TdtMap>();
const heatmap = ref<TdtHeatmap>();
const overlay = ref<TdtCustomOverlay>();
function refresh() {
  heatmap.value?.refresh();
  overlay.value?.refresh();
}
</script>

<template>
  <main>
    <h1>Vue 2.7 消费示例</h1>
    <p v-if="!tk">请在此示例的 .env.local 中设置 VITE_TDT_KEY 后启动地图。</p>
    <template v-else>
      <button @click="visible = !visible">切换覆盖物</button>
      <TdtMap ref="map" :load-config="{ tk }" :center="position" :zoom="12" class="map">
        <TdtControl><button @click="refresh">刷新覆盖物</button></TdtControl>
        <TdtMarker :position="position" />
        <TdtHeatmap ref="heatmap" :data="points" :max="100" :visible="visible" />
        <TdtCustomOverlay ref="overlay" :position="position" :visible="visible" :offset="[48, 0]" anchor="center">
          <button class="ripple" @click="position = [position[0] + 0.01, position[1]]">移动</button>
        </TdtCustomOverlay>
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
