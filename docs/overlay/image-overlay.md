# 图片覆盖物

`TdtImageOverlay` 在地图上按经纬度范围显示一张图片，随地图缩放和移动自动调整位置与尺寸。组件基于天地图 `ImageOverlay` 扩展，会自动加载 `ImageOverLayer` 插件。

## 示例

<ClientOnly>
<demo-image-overlay></demo-image-overlay>
</ClientOnly>

<code-details>

<<< @/.vitepress/components/demo-image-overlay/index.vue

</code-details>

## 按需引入

```ts
import { TdtMap, TdtImageOverlay } from "vue-map-tianditu";
import "vue-map-tianditu/style.css";
```

组件放在 `TdtMap` 内。`url` 和 `bounds` 必填；`bounds` 为 `[[西南经度, 西南纬度], [东北经度, 东北纬度]]`。

```vue
<tdt-map :center="[113.28, 23.12]" :zoom="11">
  <tdt-image-overlay
    url="https://example.com/plan.png"
    :bounds="[
      [113.18, 23.05],
      [113.38, 23.2]
    ]"
    :opacity="0.8"
  />
</tdt-map>
```

## 属性

| 属性      | 类型        | 默认值 | 说明                          |
| --------- | ----------- | ------ | ----------------------------- |
| `url`     | string      | —      | 图片地址，必填                |
| `bounds`  | `VT.Bounds` | —      | 图片覆盖的地理范围，必填      |
| `opacity` | number      | 1      | 透明度，范围 0-1，支持 0      |
| `alt`     | string      | ""     | 图片替代文本                  |
| `visible` | boolean     | true   | 是否显示                      |
| `zIndex`  | number      | —      | 通过元素 z-index 调整同层顺序 |

`url`、`bounds`、`opacity`、`alt` 和 `visible` 均支持动态更新。图片地址变化时只替换 `src`，不会重建覆盖物。`bounds` 支持替换数组或原地修改坐标。

## 事件与方法

| 事件   | 参数             | 说明           |
| ------ | ---------------- | -------------- |
| `init` | `T.ImageOverlay` | 覆盖物创建完成 |

通过 `init` 获取原生实例后，可调用 `setImageUrl()`、`setBounds()`、`setOpacity()`、`getElement()`、`bringToFront()` / `bringToBack()` 等方法。

## 使用边界

- 图片使用普通 `<img>` 加载，页面为 HTTPS 时应使用 HTTPS 图片地址，否则会被浏览器按混合内容拦截。
- 图片按范围拉伸，不保持原始宽高比；需要等比展示时请自行计算 `bounds`。
- 组件不提供点击事件。需要交互时可在同一位置叠加 `TdtMarker` 或 `TdtCustomOverlay`。
- 插件加载失败会通过地图组件的 `error` 事件上报；也可在应用入口预加载：

```ts
import { useApiLoader } from "vue-map-tianditu";
await useApiLoader({ plugins: ["ImageOverLayer"] });
```

## API 表

<ApiTable component="TdtImageOverlay" />
