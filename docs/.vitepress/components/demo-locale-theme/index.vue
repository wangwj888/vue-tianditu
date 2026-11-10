<template>
  <div class="demo-toolbar">
    <label>
      语言
      <select v-model="locale">
        <option value="zh-CN">简体中文</option>
        <option value="en-US">English</option>
      </select>
    </label>
    <label><input v-model="dark" type="checkbox" /> 暗色主题</label>
    <label>品牌色 <input v-model="brand" type="color" /></label>
    <span>{{ hint }}</span>
  </div>
  <div class="locale-theme-demo" :data-tdt-theme="dark ? 'dark' : 'light'" :style="{ '--tdt-color-primary': brand }">
    <tdt-map :center="center" :zoom="11">
      <tdt-control>
        <tdt-search :locale="locale" />
      </tdt-control>
    </tdt-map>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const center = [113.280637, 23.125178] as [number, number];
const locale = ref<"zh-CN" | "en-US">("zh-CN");
const dark = ref(true);
const brand = ref("#7aa7e0");
const hint = computed(() =>
  locale.value === "zh-CN"
    ? "切换语言会更新搜索框、结果状态和路线规划按钮文案。"
    : "Switching the locale updates search, status and route copy."
);
</script>

<script lang="ts">
export default { name: "DemoLocaleTheme" };
</script>

<style scoped>
.locale-theme-demo {
  width: 100%;
  height: 420px;
}
</style>
