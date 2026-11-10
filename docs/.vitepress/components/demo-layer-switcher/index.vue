<script setup lang="ts">
import { computed, ref } from "vue";
import type { BaseLayerOption, LayerSwitcherExposed } from "../../../../packages/layerSwitcher";

const baseLayer = ref<string | undefined>("normal");
const visible = ref(true);
const zIndex = ref<number | undefined>(100);
const showImagery = ref(true);
const controls = ref<(VT.ControlName | VT.ControlOptions)[]>(["Zoom"]);
const switcherRef = ref<LayerSwitcherExposed>();
const message = ref("");
const errorMessage = ref("");
const nativeBases: BaseLayerOption[] = [
  { id: "normal", name: "地图", mapType: "TMAP_NORMAL_MAP" },
  { id: "satellite", name: "影像", mapType: "TMAP_SATELLITE_MAP" },
  { id: "hybrid", name: "影像与注记", mapType: "TMAP_HYBRID_MAP" }
];
const bases = computed(() => nativeBases.filter(option => showImagery.value || option.id === "normal"));
function toggleControls() {
  controls.value = controls.value.length ? [] : ["Zoom", "Scale"];
}
function readSelection() {
  const selection = switcherRef.value?.getSelection();
  message.value = selection ? "实际可见分组：" + (selection.visibleLayers.join("、") || "无") : "地图尚未就绪";
}
function onError(error: Error) {
  errorMessage.value = error.message;
}
</script>
<script lang="ts">
export default { name: "DemoLayerSwitcher" };
</script>

<template>
  <section>
    <div class="switcher-demo-toolbar">
      <button type="button" @click="toggleControls">动态增删内置控件</button>
      <button type="button" @click="visible = !visible">业务组：{{ visible ? "显示" : "隐藏" }}</button>
      <button type="button" @click="showImagery = !showImagery">{{ showImagery ? "移除" : "加入" }}影像选项</button>
      <button type="button" @click="readSelection">读取当前选择</button>
    </div>
    <p>当前底图：{{ baseLayer || "无" }}。自定义示意底图保留 SDK 原生背景。{{ message }}</p>
    <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>
    <div class="switcher-demo-map">
      <TdtMap :center="[116.397, 39.908]" :zoom="12" :controls="controls" @error="onError">
        <TdtLayerGroup id="business" v-model:visible="visible" v-model:z-index="zIndex" name="业务点位">
          <TdtMarker :position="[116.397, 39.908]" />
          <TdtCustomOverlay :position="[116.415, 39.918]"
            ><span class="business-label">业务数据</span></TdtCustomOverlay
          >
        </TdtLayerGroup>
        <TdtLayerGroup id="heat" name="热力分布" :z-index="50">
          <TdtHeatmap
            :data="[
              { lng: 116.4, lat: 39.91, count: 80 },
              { lng: 116.42, lat: 39.92, count: 50 }
            ]"
          />
        </TdtLayerGroup>
        <TdtLayerGroup id="region-base" name="自定义示意底图" type="base">
          <TdtPolygon
            :path="[
              [116.36, 39.89],
              [116.44, 39.89],
              [116.44, 39.94],
              [116.36, 39.94]
            ]"
            color="#1685b5"
            fill-color="#80deea"
            :fill-opacity="0.45"
          />
        </TdtLayerGroup>
        <TdtLayerSwitcher
          ref="switcherRef"
          v-model:base-layer="baseLayer"
          :base-layers="bases"
          z-index-controls
          @error="onError"
        />
      </TdtMap>
    </div>
  </section>
</template>
<style scoped>
.switcher-demo-map {
  height: 440px;
}
.switcher-demo-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.business-label {
  padding: 4px 8px;
  background: #1677ff;
  border-radius: 4px;
  color: white;
  white-space: nowrap;
}
</style>
