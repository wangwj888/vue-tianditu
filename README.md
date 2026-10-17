# vue-tianditu

支持 Vue 2.7 和 Vue 3 的天地图组件库，采用 TypeScript 编写，提供地图、控件、图层、绘图工具、搜索、路线规划和车辆轨迹。

3.x 新增 **热力图 `TdtHeatmap`** 和 **自定义 DOM 覆盖物 `TdtCustomOverlay`**。自定义覆盖物可通过插槽编写水波纹点、标签、按钮和 Vue 组件。

- [在线文档](https://soullyoko.github.io/vue-tianditu/)
- [3.x 迁移指南](docs/migration.md)
- [热力图](docs/overlay/heatmap.md)
- [自定义 DOM 覆盖物](docs/overlay/custom-overlay.md)

## 安装与支持范围

支持 **Vue 2.7.x 和 Vue 3.2.47+**，Vue 2 项目推荐使用 2.7.16。不再需要安装 Composition API 插件或版本切换工具。

```sh
npm install vue-tianditu
```

在应用入口引入样式：

```ts
import "vue-tianditu/style.css";
```

## Vue 3 全局注册

```ts
import { createApp } from "vue";
import VueTianditu from "vue-tianditu";
import "vue-tianditu/style.css";
import App from "./App.vue";

createApp(App).use(VueTianditu, { v: "4.0", tk: "你的天地图 Key" }).mount("#app");
```

## Vue 2.7 全局注册

```ts
import Vue from "vue";
import VueTianditu from "vue-tianditu";
import "vue-tianditu/style.css";
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
import { TdtMap, TdtMarker } from "vue-tianditu";
import "vue-tianditu/style.css";

const center = ref([113.280637, 23.125178]);
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
import { useApiLoader, toLngLat, toBounds, toPoint, toIcon } from "vue-tianditu";

await useApiLoader({ tk: "你的天地图 Key" });
const map = new T.Map("map-container");
map.centerAndZoom(toLngLat([113.280637, 23.125178]), 12);
```

加载器只在浏览器调用。SSR/SSG 中可导入并注册组件，但地图和 DOM 覆盖物应在客户端挂载；VitePress 中用 `ClientOnly` 包裹示例。

## 开发与验证

开发环境使用 Node.js 22.22.1+ 或 24+。使用仓库锁文件安装依赖，Vue 2.7 与 Vue 3 示例各自绑定对应的 Vue 运行时，不再通过安装命令切换根项目依赖。常用命令如下：

| 命令                                | 用途                                                  |
| ----------------------------------- | ----------------------------------------------------- |
| `yarn install --frozen-lockfile`    | 安装固定依赖                                          |
| `yarn build`                        | 构建 ESM、UMD、CSS 和声明文件                         |
| `yarn check:examples`               | 安装并检查 Vue 2.7、Vue 3.2.47、当前 Vue 3 的消费示例 |
| `yarn dev` / `yarn dev2`            | 启动 Vue 3 开发页 / Vue 2.7 消费示例                  |
| `yarn docs:dev` / `yarn docs:build` | 启动 / 构建文档                                       |
| `yarn lint` / `yarn test`           | 静态检查 / 行为测试                                   |

消费示例首次启动前先运行 `yarn check:examples`，再在相应示例的 `.env.local` 中设置 `VITE_TDT_KEY`。根开发页和文档使用 `VITE_TDT_TOKEN`，可参考根目录 `.env.example`。

真实浏览器检查使用现有 Chrome/Edge（可通过 `BROWSER_EXECUTABLE` 指定路径）。启动文档后运行 `node tests/browser-smoke.mjs http://127.0.0.1:5173/vue-tianditu`；三套消费示例可运行 `node tests/consumer-browser-smoke.mjs`，并提供 `VITE_TDT_KEY`。浏览器检查需要网络和可用 Key。

## License

MIT
