# 缓冲区分析

`TdtBufferTool` 封装天地图 `BufferTool` 扩展。拖动传入的多边形或圆会生成缓冲区，继续拖动缓冲区边缘可调整半径。组件会自动加载 `turf` 与 `BufferTool` 插件。

## 示例

<ClientOnly>
<demo-buffer-tool></demo-buffer-tool>
</ClientOnly>

<code-details>

<<< @/.vitepress/components/demo-buffer-tool/index.vue

</code-details>

## 按需引入

```ts
import { TdtMap, TdtPolygon, TdtCircle, TdtBufferTool } from "vue-map-tianditu";
import type { BufferToolExposed } from "vue-map-tianditu";
```

`layers` 接收原生 `T.Polygon` / `T.Circle` 实例。通常通过覆盖物组件的 `init` 事件获取：

```vue
<tdt-map :center="center" :zoom="11">
  <tdt-polygon :path="path" @init="polygon = $event" />
  <tdt-circle :center="center" :radius="2000" @init="circle = $event" />
  <tdt-buffer-tool :layers="layers" />
</tdt-map>
```

```ts
const polygon = shallowRef<T.Polygon>();
const circle = shallowRef<T.Circle>();
const layers = computed(() => [polygon.value, circle.value].filter(Boolean) as (T.Polygon | T.Circle)[]);
```

## 属性

| 属性     | 类型                        | 默认值 | 说明                        |
| -------- | --------------------------- | ------ | --------------------------- |
| `layers` | `(T.Polygon \| T.Circle)[]` | []     | 参与缓冲区分析的图形实例    |
| `active` | boolean                     | true   | 是否启用拖拽生成/调整缓冲区 |
| `style`  | `T.BufferToolStyle`         | 见下文 | 缓冲区样式                  |

默认样式为 `{ color: "red", weight: 3, opacity: 0.5, fillColor: "#FFFFFF", fillOpacity: 0.5, lineStyle: "dashed" }`。

`layers` 替换或原地修改时，组件会先解除旧图形的拖拽监听、清空已有缓冲区，再绑定新列表。样式修改对新生成的缓冲区立即生效，已有缓冲区保留原样式。

## 事件

| 事件         | 参数                | 说明                          |
| ------------ | ------------------- | ----------------------------- |
| `init`       | `T.BufferTool`      | 工具初始化完成                |
| `drag-start` | `T.BufferToolEvent` | 开始拖动图形或缓冲区          |
| `drag`       | `T.BufferToolEvent` | 拖动中，`radius` 为当前半径   |
| `drag-end`   | `T.BufferToolEvent` | 拖动结束，`radius` 为最终半径 |
| `error`      | `Error`             | 初始化或同步失败              |

## 方法

通过组件 ref 调用：

| 方法                 | 说明                         |
| -------------------- | ---------------------------- |
| `open()` / `close()` | 启用或停用拖拽               |
| `clear()`            | 清除所有缓冲区，保留原始图形 |
| `getTool()`          | 获取原生 `T.BufferTool`      |
| `getBufferLayers()`  | 获取当前地图上的缓冲区图层   |

## 使用边界

- `BufferTool` 会直接修改传入图形的行为，图形实例只能交给一个工具或分组管理。
- `clear()` 只移除缓冲区，不删除原始多边形/圆；如需移除原始图形，请通过对应组件的 `visible` 或数组数据控制。
- 计算依赖 `turf@3`（随插件自动加载）。离线部署时可通过 `pluginUrls` 覆盖 CDN 地址。
- 缓冲区是工具生成的 `T.Polygon` / `T.Circle`，不会自动加入 `TdtLayerGroup`。
- 插件依赖 CDN；不可达时组件通过地图的 `error` 事件上报。

## API 表

<ApiTable component="TdtBufferTool" />
