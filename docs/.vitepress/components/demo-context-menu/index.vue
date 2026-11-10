<template>
  <div class="demo-toolbar">
    <label><input v-model="enabled" type="checkbox" /> 启用右键菜单</label>
    <span>{{ message }}</span>
  </div>
  <div class="context-menu-demo-map">
    <tdt-map ref="mapRef" :center="center" :zoom="12">
      <tdt-marker v-for="marker in markers" :key="marker.id" :position="marker.position" />
      <tdt-context-menu :items="items" :enabled="enabled" @open="onOpen" @select="onSelect" />
    </tdt-map>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { ContextMenuEntry, ContextMenuContext, ContextMenuItem, TdtMap } from "../../../../packages";

const center = [113.280637, 23.125178] as [number, number];
const mapRef = ref<TdtMap>();
const enabled = ref(true);
const message = ref("在地图上点击右键打开菜单");
const markers = ref<{ id: number; position: [number, number] }[]>([]);
let nextId = 1;

const items: ContextMenuEntry[] = [
  { key: "zoom-in", label: "放大一级" },
  { key: "zoom-out", label: "缩小一级" },
  { type: "divider" },
  { key: "add-marker", label: "在此添加标记" },
  { key: "clear-markers", label: "清除全部标记", danger: true }
];

function onOpen(context: ContextMenuContext) {
  message.value = `右键位置：${context.lnglat[0].toFixed(5)}, ${context.lnglat[1].toFixed(5)}`;
}

function onSelect(item: ContextMenuItem, context: ContextMenuContext) {
  const map = mapRef.value?.getMap();
  if (item.key === "zoom-in") map?.zoomIn();
  else if (item.key === "zoom-out") map?.zoomOut();
  else if (item.key === "add-marker") {
    markers.value.push({ id: nextId++, position: [context.lnglat[0], context.lnglat[1]] });
    message.value = "已添加标记";
  } else if (item.key === "clear-markers") {
    markers.value = [];
    message.value = "已清除标记";
  }
}
</script>

<script lang="ts">
export default { name: "DemoContextMenu" };
</script>

<style scoped>
.context-menu-demo-map {
  width: 100%;
  height: 380px;
}
</style>
