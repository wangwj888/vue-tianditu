<template>
  <div class="demo-toolbar">
    <button type="button" @click="moveMarker">移动标注</button>
    <button type="button" @click="appendPath">追加折线点</button>
    <button type="button" @click="radius = radius ? 0 : 1200">半径 {{ radius }} 米</button>
    <button type="button" @click="addCluster">增加聚合点</button>
    <button type="button" @click="removeCluster">移除聚合点</button>
    <button type="button" @click="appendCloud">追加海量点</button>
  </div>
  <div class="dynamic-demo-map">
    <tdt-map :center="center" :zoom="11">
      <tdt-marker :position="markerPosition" :opacity="markerOpacity" title="可移动标注" />
      <tdt-circle :center="center" :radius="radius" color="#1677ff" :fill-opacity="0.08" />
      <tdt-polyline :path="path" color="#ef4444" :weight="4" />
      <tdt-marker-clusterer :markers="clusters" />
      <tdt-cloud-marker-collection :lnglats="cloud" SizeType="SMALL" color="#22c55e" />
    </tdt-map>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const center = [113.280637, 23.125178] as [number, number];
const markerPosition = ref<[number, number]>([...center]);
const markerOpacity = ref(1);
const radius = ref(1200);
const path = ref<[number, number][]>([
  [113.2, 23.1],
  [113.3, 23.15]
]);

let clusterId = 0;
function createCluster() {
  return {
    id: `cluster-${clusterId++}`,
    position: [center[0] + (Math.random() - 0.5) * 0.08, center[1] + (Math.random() - 0.5) * 0.06] as [number, number]
  };
}
const clusters = ref(Array.from({ length: 12 }, createCluster));
const cloud = ref<[number, number][]>(
  Array.from(
    { length: 120 },
    () => [center[0] + (Math.random() - 0.5) * 0.1, center[1] + (Math.random() - 0.5) * 0.08] as [number, number]
  )
);

let step = 0;
function moveMarker() {
  step++;
  markerPosition.value = [center[0] + (step % 2 ? 0.015 : 0), center[1] + (step % 2 ? 0.008 : 0)];
  markerOpacity.value = markerOpacity.value === 1 ? 0.4 : 1;
}
function appendPath() {
  const last = path.value[path.value.length - 1];
  path.value = [...path.value, [last[0] + 0.02, last[1] + 0.01]];
}
function addCluster() {
  clusters.value = [...clusters.value, createCluster()];
}
function removeCluster() {
  clusters.value = clusters.value.slice(0, -1);
}
function appendCloud() {
  cloud.value = [
    ...cloud.value,
    ...Array.from(
      { length: 80 },
      () => [center[0] + (Math.random() - 0.5) * 0.16, center[1] + (Math.random() - 0.5) * 0.12] as [number, number]
    )
  ];
}
</script>

<script lang="ts">
export default { name: "DemoDynamicUpdates" };
</script>

<style scoped>
.dynamic-demo-map {
  width: 100%;
  height: 420px;
}
</style>
