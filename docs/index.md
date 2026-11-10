# VueTianditu

VueTianditu 将天地图 JavaScript API 4.0 封装为 Vue 组件，同时支持 Vue 2.7 和 Vue 3。

除了基础地图、控件、覆盖物、瓦片图层、绘图工具、搜索与导航，还提供：

- [热力图](/overlay/heatmap)：按经纬度和权重绘制 Canvas 热力图，支持动态数据和样式。
- [自定义 DOM 覆盖物](/overlay/custom-overlay)、[图片覆盖物](/overlay/image-overlay)与 [SVG 覆盖物](/overlay/svg-overlay)：卡槽内容、图片范围和批量 SVG 图形。
- [右键菜单](/map/context-menu)：基于地图 `contextmenu` 事件的可访问菜单，支持菜单项与完全自定义。
- [图层分组](/tilelayer/layer-group)与[图层切换](/tilelayer/layer-switcher)：统一控制图层显隐，切换底图并管理业务图层。
- [定位](/service/geolocation)：用户触发定位、精度圈、错误反馈和自动回中。
- [搜索](/service/search)与[路线规划](/service/route)：受控查询参数、自定义搜索结果和规划事件；支持中英文与 CSS 变量主题。
- [公交线路查询](/service/bus-line-search)：查询公交候选线路及站点、轨迹。
- [缓冲区分析](/extra/buffer-tool)：拖动多边形/圆生成缓冲区并调整半径。
- [地图实例与状态插槽](/map/map)：通过 ref 读取地图实例，自定义加载与初始化错误界面。
- [坐标系转换](/guide/coordinates)：WGS84、GCJ-02、CGCS2000 互转。
- [动态更新](/guide/dynamic-updates)、[主题与国际化](/guide/theme-locale)与[常见问题](/guide/faq)。
- [API 加载器](/api-loader)：共享加载请求、按顺序加载扩展、配置自托管地址。
- [3.x 迁移指南](/migration)：支持范围、导入方式、双向绑定和类型工具的变化。

<ClientOnly>
<demo-map></demo-map>
</ClientOnly>

## 安装与支持范围

支持 **Vue 2.7.x 和 Vue 3.2.47+**，Vue 2 项目推荐使用 2.7.16。不再需要安装 Composition API 插件或版本切换工具。

```sh
npm install vue-map-tianditu
```

在应用入口引入样式：

```ts
import "vue-map-tianditu/style.css";
```

## Vue 3 全局注册

```ts
import { createApp } from "vue";
import VueTianditu from "vue-map-tianditu";
import "vue-map-tianditu/style.css";
import App from "./App.vue";

createApp(App).use(VueTianditu, { v: "4.0", tk: "你的天地图 Key" }).mount("#app");
```

## Vue 2.7 全局注册

```ts
import Vue from "vue";
import VueTianditu from "vue-map-tianditu";
import "vue-map-tianditu/style.css";
import App from "./App.vue";

Vue.use(VueTianditu, { v: "4.0", tk: "你的天地图 Key" });
new Vue({ render: h => h(App) }).$mount("#app");
```

## 按需引入

下面的单文件组件同时适用于 Vue 2.7 和 Vue 3。地图的父容器必须有明确高度；坐标数组顺序为经度、纬度。

```vue
<template>
  <div class="map">
    <TdtMap :center="center" :zoom="12" :load-config="loadConfig">
      <TdtMarker :position="center" />
    </TdtMap>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { TdtMap, TdtMarker } from "vue-map-tianditu";
import "vue-map-tianditu/style.css";

const center = ref<[number, number]>([113.280637, 23.125178]);
const loadConfig = { v: "4.0", tk: "你的天地图 Key" };
</script>

<style scoped>
.map {
  height: 400px;
}
</style>
```

全局注册只保存默认加载配置，地图挂载后才请求 API。组件上明确传入的加载配置优先；其他字段继承全局配置。首次加载完成后还可以追加加载扩展。

## 原生 API 和类型

组件的 `init` 事件返回对应天地图实例，也可以先等待 `useApiLoader()` 再调用原生 `T` API。包入口会引入天地图的 `T`、`VT` 全局类型声明。

```ts
import { useApiLoader, toLngLat, toBounds, toPoint, toIcon } from "vue-map-tianditu";

await useApiLoader({ tk: "你的天地图 Key" });
const map = new T.Map("map-container");
map.centerAndZoom(toLngLat([113.280637, 23.125178]), 12);
```

加载器只在浏览器调用。SSR/SSG 中可导入并注册组件，但地图和 DOM 覆盖物应在客户端挂载；VitePress 中用 `ClientOnly` 包裹示例。

## 样式和示例 Key

搜索和导航的 UI 样式通过 `vue-map-tianditu/style.css` 引入。旧的 `vue-map-tianditu/lib/style.css` 路径仍保留兼容。

文档示例使用演示 Key；本地文档可通过 `VITE_TDT_TOKEN` 配置自己的天地图 Key。演示 Key 绑定了文档站域名，未配置本地 Key 时瓦片请求会返回 403（域名不匹配）。部署时按天地图控制台要求配置可访问域名。

## 辅助函数

| 函数                     | 用途                             |
| ------------------------ | -------------------------------- |
| `toLngLat` / `toLngLats` | 将经纬度数组转换为天地图坐标对象 |
| `toBounds`               | 将两点范围数组转换为地理边界     |
| `toPoint`                | 将像素坐标数组转换为像素点       |
| `toIcon`                 | 将图标 URL 或配置转换为图标对象  |
| `toMarker`               | 将点标注配置转换为原生标注       |
