<template>
  <div class="mapDiv">
    <tdt-map :center="state.center" :zoom="state.zoom">
      <tdt-tilelayer-tdt :url="state.url" :z-index="1"></tdt-tilelayer-tdt>
    </tdt-map>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from "vue";

const tk = import.meta.env.VITE_TDT_TOKEN || "7f013d0186775b063d6a046977bbefc6";

const state = reactive({
  center: [113.280637, 23.125178],
  zoom: 11,
  url: `https://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tk}`
});
</script>

<script lang="ts">
export default { name: "DemoTilelayerTdt" };
</script>

<style scoped>
.mapDiv {
  width: 100%;
  height: 300px;
}
</style>
