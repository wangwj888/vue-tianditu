<script setup lang="ts">
import { ref, shallowRef } from "vue";
import type { LayerInstance, LayerGroupExposed } from "../../../../packages/layerGroup";
import CounterBadge from "../demo-custom-overlay/CounterBadge.vue";

const visible = ref(true);
const childVisible = ref(true);
const mounted = ref(true);
const layers = shallowRef<LayerInstance[]>([]);
const groupRef = ref<LayerGroupExposed>();
const message = ref("");
const errorMessage = ref("");
let circle: T.Circle | undefined;
function ready() {
  circle = new T.Circle(new T.LngLat(116.405, 39.91), 450, { color: "#e66a26", fillOpacity: 0.3 });
  layers.value = [circle];
}
function toggleExternal() {
  if (circle) layers.value = layers.value.length ? [] : [circle];
}
function readMembers() {
  message.value = "直属 SDK 成员：" + (groupRef.value?.getLayers().length ?? 0);
}
function onError(error: Error) {
  errorMessage.value = error.message;
}
</script>
<script lang="ts">
export default { name: "DemoLayerGroup" };
</script>

<template>
  <section>
    <div class="group-demo-toolbar">
      <button type="button" @click="visible = !visible">父组：{{ visible ? "显示" : "隐藏" }}</button>
      <button type="button" @click="childVisible = !childVisible">点标记：{{ childVisible ? "显示" : "隐藏" }}</button>
      <button type="button" @click="mounted = !mounted">{{ mounted ? "卸载" : "挂载" }}嵌套组</button>
      <button type="button" @click="toggleExternal">{{ layers.length ? "移除" : "加入" }}外部圆</button>
      <button type="button" @click="readMembers">读取成员</button>
    </div>
    <p>隐藏再显示父组会保留子组件计数；卸载嵌套组后重新挂载会重建子组件。{{ message }}</p>
    <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>
    <div class="group-demo-map">
      <TdtMap :center="[116.397, 39.908]" :zoom="13" @init="ready" @error="onError">
        <TdtLayerGroup id="places" ref="groupRef" name="示例地点" :visible="visible" :layers="layers" @error="onError">
          <TdtMarker :position="[116.397, 39.908]" :visible="childVisible" />
          <TdtLayerGroup v-if="mounted" id="labels" name="嵌套内容">
            <TdtCustomOverlay :position="[116.403, 39.913]">
              <div class="group-label"><strong>嵌套插槽内容</strong><CounterBadge /></div>
            </TdtCustomOverlay>
          </TdtLayerGroup>
        </TdtLayerGroup>
      </TdtMap>
    </div>
  </section>
</template>
<style scoped>
.group-demo-map {
  height: 400px;
}
.group-demo-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.group-label {
  display: grid;
  gap: 6px;
  background: white;
  color: #1677ff;
  border: 1px solid currentColor;
  padding: 8px;
  border-radius: 4px;
  white-space: nowrap;
}
</style>
