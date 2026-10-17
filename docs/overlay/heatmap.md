# 热力图

`TdtHeatmap` 根据经纬度和权重绘制 Canvas 热力图。组件内核随应用打包并按需加载，无需配置天地图的 `HeatmapOverlay` 外链扩展。

## 示例

<ClientOnly>
<demo-heatmap></demo-heatmap>
</ClientOnly>

<code-details>

<<< @/.vitepress/components/demo-heatmap/index.vue

</code-details>

## 按需引入

```ts
import { TdtMap, TdtHeatmap } from "vue-tianditu";
```

将热力图放在 `TdtMap` 内。数据项使用 `lng`（经度）、`lat`（纬度）、`count`（非负权重）。`radius` 单位为像素；地图缩放后坐标重新投影，半径保持屏幕像素大小。

## 属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `data` | `{ lng: number; lat: number; count: number }[]` | 热度点；空数组清空画面 |
| `max` | number | 热度上限；不传时根据全部数据的最大权重计算，拖动地图不会改变色阶 |
| `radius` | number | 每个点的影响半径，单位像素；默认 40 |
| `gradient` | `Record<number, string>` | 0 到 1 的色阶与 CSS 颜色映射 |
| `blur` | number | 模糊程度，范围 0 到 1；默认 0.85 |
| `minOpacity` | number | 最小透明度，范围 0 到 1；默认 0 |
| `maxOpacity` | number | 最大透明度，范围 0 到 1；默认 1 |
| `visible` | boolean | 控制显隐，默认 true |

非有限值、越界经纬度和非正权重会被过滤；0 权重不绘制。支持响应式替换数据数组和更新样式。组件不会修改传入的数据；对大量数据建议一次替换数组，合并业务侧的多次更新。

## 事件和方法

| 事件    | 说明                                         |
| ------- | -------------------------------------------- |
| `init`  | 热力图初始化完成，返回组件实例接口           |
| `error` | 渲染内核加载、初始化或绘制失败，参数为 Error |

`init` 参数为 `HeatmapHandle`，包含 `overlay`、`getElement()` 和 `refresh()`。也可通过组件 ref 调用 `refresh()` 请求重绘。

热力图为连续 Canvas 图像，不提供逐点点击事件。需要点击标记时可以叠加 `TdtMarker` 或 `TdtCustomOverlay`。

## 更新与生命周期

地图移动、缩放、容器尺寸变化时重绘；尺寸变化时重建画布并恢复当前数据。空数据清空画面，`visible` 控制显隐；卸载时清理画布、监听器和待执行的绘制任务。绘制只在客户端执行。

热力数据较多时应避免同时创建大量 DOM 覆盖物。涉及逐点展示的场景可以使用点聚合或海量点组件。
