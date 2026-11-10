<template>
  <div class="demo-toolbar coords-inputs">
    <label>经度 <input v-model.number="lng" type="number" step="0.000001" /></label>
    <label>纬度 <input v-model.number="lat" type="number" step="0.000001" /></label>
    <button type="button" @click="reset">恢复示例</button>
    <span>{{ validity }}</span>
  </div>
  <div v-if="result" class="coords-grid">
    <div>
      <strong>WGS84</strong>
      <code>{{ result.wgs84[0].toFixed(6) }}, {{ result.wgs84[1].toFixed(6) }}</code>
    </div>
    <div>
      <strong>GCJ-02</strong>
      <code>{{ result.gcj02[0].toFixed(6) }}, {{ result.gcj02[1].toFixed(6) }}</code>
    </div>
    <div>
      <strong>CGCS2000</strong>
      <code>{{ result.cgcs2000[0].toFixed(6) }}, {{ result.cgcs2000[1].toFixed(6) }}</code>
    </div>
    <div>
      <strong>往返误差</strong>
      <code>{{ result.roundTripError.toFixed(4) }} 米</code>
    </div>
  </div>
  <div class="coords-demo-map">
    <tdt-map :center="mapCenter" :zoom="14">
      <template v-if="result">
        <tdt-marker :position="result.wgs84" :icon="greenIcon" title="WGS84" />
        <tdt-marker :position="result.gcj02" :icon="redIcon" title="GCJ-02" />
      </template>
    </tdt-map>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { withBase } from "vitepress";
import { gcj02ToWgs84, isValidLngLat, wgs84ToGcj02, wgs84ToCgcs2000 } from "../../../../packages";

const lng = ref(116.3975);
const lat = ref(39.9087);
const greenIcon = {
  iconUrl: withBase("/marker_green.png"),
  iconSize: [18, 26] as [number, number],
  iconAnchor: [9, 26] as [number, number]
};
const redIcon = {
  iconUrl: withBase("/marker_red.png"),
  iconSize: [18, 26] as [number, number],
  iconAnchor: [9, 26] as [number, number]
};

const result = computed(() => {
  const input = [lng.value, lat.value];
  if (!isValidLngLat(input)) return undefined;
  const wgs84: [number, number] = [input[0], input[1]];
  const gcj02 = wgs84ToGcj02(wgs84);
  const back = gcj02ToWgs84(gcj02);
  const [dx, dy] = [back[0] - wgs84[0], back[1] - wgs84[1]];
  return {
    wgs84,
    gcj02,
    cgcs2000: wgs84ToCgcs2000(wgs84),
    roundTripError: Math.sqrt(dx * dx + dy * dy) * 111320
  };
});
const mapCenter = computed<[number, number]>(() => (result.value ? result.value.wgs84 : [116.3975, 39.9087]));
const validity = computed(() => (result.value ? "坐标有效" : "请输入有效的经纬度"));

function reset() {
  lng.value = 116.3975;
  lat.value = 39.9087;
}
</script>

<script lang="ts">
export default { name: "DemoCoords" };
</script>

<style scoped>
.coords-inputs input {
  width: 130px;
}
.coords-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px 16px;
  margin: 10px 0;
}
.coords-grid div {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
}
.coords-demo-map {
  width: 100%;
  height: 360px;
}
</style>
