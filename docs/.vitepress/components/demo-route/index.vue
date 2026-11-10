<template>
  <div>
    <div class="mapDiv">
      <tdt-map :center="[116.403, 39.915]" :zoom="12">
        <tdt-control>
          <tdt-route
            v-model:start="start"
            v-model:end="end"
            v-model:route-type="routeType"
            start-keyword="天安门"
            end-keyword="北京站"
            :driving-policy="0"
            :transit-policy="1"
            @route-complete="onComplete"
            @route-error="onError"
            @plan-change="onPlanChange"
          />
        </tdt-control>
      </tdt-map>
    </div>
    <p aria-live="polite">{{ message }}</p>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import type { RouteType, RouteCompleteEvent, RouteErrorEvent, RoutePlanChangeEvent } from "~/service/route";
const start = ref([116.3975, 39.9087]);
const end = ref([116.4273, 39.9032]);
const routeType = ref<RouteType>(0);
const message = ref("地图就绪后自动规划路线");
function onComplete(event: RouteCompleteEvent) {
  message.value = ["驾车", "公交", "步行"][event.routeType] + "规划完成";
}
function onError(event: RouteErrorEvent) {
  message.value = event.error.message;
}
function onPlanChange(event: RoutePlanChangeEvent) {
  message.value = "已选择方案 " + (event.index + 1);
}
</script>
<script lang="ts">
export default { name: "DemoRoute" };
</script>
<style scoped>
.mapDiv {
  width: 100%;
  height: 600px;
}
</style>
