<template>
  <div>
    <div class="mapDiv">
      <tdt-map :center="[116.403, 39.915]" :zoom="11">
        <tdt-control>
          <tdt-bus-line-search v-model:keyword="keyword" :auto-select="true" @line-complete="onLine" @error="onError">
            <template #empty>未找到线路，请确认地图所在城市和线路名称。</template>
            <template #line="{ line }"
              ><strong>{{ line.lineName }}</strong>
              <p>首班 {{ line.startTime }} / 末班 {{ line.endTime }} · {{ line.stationCount }} 站</p></template
            >
          </tdt-bus-line-search>
        </tdt-control>
      </tdt-map>
    </div>
    <p>输入纯数字线路号（如 850）会按“850路”查询；也可输入完整线路名称。</p>
    <p aria-live="polite">{{ message }}</p>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
const keyword = ref("850");
const message = ref("");
function onLine(line: T.BusLine) {
  message.value = "已查询：" + line.lineName;
}
function onError(error: Error) {
  message.value = error.message;
}
</script>
<script lang="ts">
export default { name: "DemoBusLineSearch" };
</script>
<style scoped>
.mapDiv {
  width: 100%;
  height: 600px;
}
</style>
