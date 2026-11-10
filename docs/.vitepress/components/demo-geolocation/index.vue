<template>
  <div class="geolocation-demo">
    <div class="demo-toolbar">
      <label><input v-model="autoCenter" type="checkbox" /> 定位后回中</label>
      <label><input v-model="showMarker" type="checkbox" /> 显示定位点</label>
      <label><input v-model="showAccuracy" type="checkbox" /> 显示精度圈</label>
    </div>
    <p>点击“定位”才会申请位置权限。请在 HTTPS 或 localhost 中使用。</p>
    <div class="geolocation-demo-map">
      <tdt-map :center="[116.40969, 39.89945]" :zoom="11">
        <tdt-geolocation
          v-slot="{ locate, clear, ready, loading, result, error }"
          :auto-center="autoCenter"
          :zoom="15"
          :show-marker="showMarker"
          :show-accuracy="showAccuracy"
          :accuracy-style="{ color: '#1677ff', fillOpacity: 0.12 }"
        >
          <div class="geolocation-panel">
            <div class="geolocation-actions">
              <button type="button" :disabled="!ready || loading" @click="requestLocation(locate)">
                {{ loading ? "定位中…" : "定位" }}
              </button>
              <button type="button" @click="clear">清除</button>
            </div>
            <p v-if="result" class="geolocation-result" aria-live="polite">
              经度 {{ result.position[0].toFixed(6) }}<br />
              纬度 {{ result.position[1].toFixed(6) }}<br />
              精度约 {{ Math.round(result.accuracy) }} 米
            </p>
            <p v-if="error" class="geolocation-error" role="alert">{{ error.message }}</p>
          </div>
        </tdt-geolocation>
      </tdt-map>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { GeolocationHandle } from "../../../../packages/service/geolocation";

const autoCenter = ref(true);
const showMarker = ref(true);
const showAccuracy = ref(true);

async function requestLocation(locate: GeolocationHandle["locate"]) {
  try {
    await locate();
  } catch {
    // 组件插槽展示错误；清除或卸载导致的取消无需额外弹窗。
  }
}
</script>
<script lang="ts">
export default { name: "DemoGeolocation" };
</script>
<style scoped>
.geolocation-demo-map {
  height: 380px;
  width: 100%;
}
.geolocation-panel {
  max-width: 240px;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: white;
  color: #303133;
  box-shadow: 0 2px 8px #0002;
}
.geolocation-actions {
  display: flex;
  gap: 8px;
}
.geolocation-actions button {
  padding: 4px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}
.geolocation-actions button:disabled {
  cursor: wait;
  opacity: 0.6;
}
.geolocation-result,
.geolocation-error {
  margin: 8px 0 0;
  line-height: 1.6;
  font-size: 12px;
}
.geolocation-error {
  color: #c62828;
}
</style>
