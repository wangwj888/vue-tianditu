<template>
  <div class="map-container">
    <button @click="openTool('markTool')">标点</button>
    <p v-if="state.errorMessage" role="alert">{{ state.errorMessage }}</p>
    <TdtMap
      :center="state.center"
      :zoom="state.zoom"
      :controls="['Zoom', 'MapType']"
      :load-config="loadConfig"
      @error="state.errorMessage = $event.message"
    >
      <TdtMarker
        v-for="marker in state.markers"
        :key="marker.name"
        :position="marker.position"
        :ext-data="marker.name"
        @click="openInfoWindow"
      ></TdtMarker>
      <TdtLabel :position="state.center" text="123"></TdtLabel>
      <TdtPolyline :path="state.polylinePath" ext-data="polyline" @click="openInfoWindow"></TdtPolyline>
      <TdtPolygon :path="state.polygonPath" ext-data="polygon" @click="openInfoWindow"></TdtPolygon>
      <TdtRectangle :bounds="state.bounds" ext-data="rectangle" @click="openInfoWindow"></TdtRectangle>
      <TdtCircle :center="state.center" :radius="1000" ext-data="circle" @click="openInfoWindow"></TdtCircle>
      <TdtHeatmap :data="state.heatmapData" :radius="40" />
      <TdtCustomOverlay :position="state.center" anchor="bottom" :offset="[0, -28]">
        <button class="ripple-node" @click="state.overlayClicks++">水波纹 {{ state.overlayClicks }}</button>
      </TdtCustomOverlay>
      <TdtInfowindow
        v-model:target="state.infowindow.target"
        :content="state.infowindow.content"
        :close-on-click="true"
      ></TdtInfowindow>
      <TdtMousetool ref="mousetoolRef" :mark-tool="{ follow: true }"></TdtMousetool>
      <TdtControl position="topleft">
        <TdtSearch></TdtSearch>
      </TdtControl>
    </TdtMap>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from "vue";
import {
  TdtMap,
  TdtMarker,
  TdtLabel,
  TdtPolyline,
  TdtPolygon,
  TdtRectangle,
  TdtCircle,
  TdtInfowindow,
  TdtMousetool,
  TdtControl,
  TdtSearch,
  TdtHeatmap,
  TdtCustomOverlay
} from "~/index";

export default defineComponent({
  components: {
    TdtMap,
    TdtMarker,
    TdtLabel,
    TdtPolyline,
    TdtPolygon,
    TdtRectangle,
    TdtCircle,
    TdtInfowindow,
    TdtMousetool,
    TdtControl,
    TdtSearch,

    TdtHeatmap,

    TdtCustomOverlay
  },
  setup() {
    const token = import.meta.env.VITE_TDT_TOKEN;
    if (import.meta.env.DEV && !token) {
      console.warn(
        "[vue-tianditu] 未设置 VITE_TDT_TOKEN，将使用演示 Key。" +
          "该 Key 绑定了文档站域名，本地访问地图瓦片会返回 403（域名不匹配）。" +
          "请在仓库根目录的 .env.local 中配置自己的天地图 Key。"
      );
    }
    const loadConfig = { tk: token || "7f013d0186775b063d6a046977bbefc6" };
    const state = reactive({
      center: [113.280637, 23.125178],
      zoom: 12,
      errorMessage: "",
      overlayClicks: 0,
      heatmapData: [
        { lng: 113.28, lat: 23.125, count: 80 },
        { lng: 113.291, lat: 23.13, count: 40 },
        { lng: 113.272, lat: 23.12, count: 60 }
      ],
      polylinePath: [
        [113.280637, 23.125178],
        [113.290637, 23.135178]
      ],
      polygonPath: [
        [113.280637, 23.125178],
        [113.290637, 23.125178],
        [113.290637, 23.115178],
        [113.280637, 23.115178]
      ],
      bounds: [
        [113.280637, 23.125178],
        [113.270637, 23.115178]
      ],
      markers: [
        { name: "marker1", position: [113.280637, 23.125178] },
        { name: "marker2", position: [113.290637, 23.125178] },
        { name: "marker3", position: [113.290637, 23.115178] },
        { name: "marker4", position: [113.280637, 23.115178] }
      ],
      infowindow: {
        target: null as any,
        content: ""
      },
      keyword: ""
    });

    function openInfoWindow(e: any) {
      state.infowindow.target = e.target;
      state.infowindow.content = e.extData;
    }

    const mousetoolRef = ref();
    function openTool(toolName: string) {
      mousetoolRef.value?.open(toolName);
    }

    return {
      loadConfig,
      state,
      mousetoolRef,
      openInfoWindow,
      openTool
    };
  }
});
</script>

<style>
.map-container {
  width: 800px;
  height: 600px;
}
.ripple-node {
  position: relative;
  padding: 5px 10px;
  border: 2px solid white;
  border-radius: 16px;
  background: #0ea5e9;
  color: white;
  cursor: pointer;
}
.ripple-node::before {
  content: "";
  position: absolute;
  inset: -3px;
  border: 2px solid #0ea5e9;
  border-radius: inherit;
  animation: ripple-demo 2s ease-out infinite;
  pointer-events: none;
}
@keyframes ripple-demo {
  from {
    opacity: 0.8;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(1.8);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ripple-node::before {
    animation: none;
  }
}
</style>
