# SVG 覆盖物

`TdtSvgOverlay` 在地图上创建一个 `T.SVG` 图层，并提供根 `<g>` 元素和坐标转换方法，适合批量绘制图形、D3 轨迹、迁徙线或自定义可视化。组件不依赖 D3，你可以使用原生 SVG API，也可以自行引入 D3、ECharts 等库向根节点中绘制。

## 示例

<ClientOnly>
<demo-svg-overlay></demo-svg-overlay>
</ClientOnly>

<code-details>

<<< @/.vitepress/components/demo-svg-overlay/index.vue

</code-details>

## 按需引入

```ts
import { TdtMap, TdtSvgOverlay } from "vue-map-tianditu";
import type { SvgOverlayHandle } from "vue-map-tianditu";
```

## 属性

| 属性      | 类型    | 默认值 | 说明                                           |
| --------- | ------- | ------ | ---------------------------------------------- |
| `visible` | boolean | true   | 是否显示 SVG 图层                              |
| `padding` | number  | 0.1    | SVG 容器相对地图视图扩展的比例，仅初始化时生效 |
| `zIndex`  | number  | —      | SVG 根元素的层级                               |

## 事件

| 事件     | 参数               | 说明                                       |
| -------- | ------------------ | ------------------------------------------ |
| `init`   | `SvgOverlayHandle` | SVG 图层创建完成，适合做一次性初始化       |
| `redraw` | `SvgOverlayHandle` | 初始化后、每次缩放结束和容器尺寸变化时触发 |

`SvgOverlayHandle` 提供：

| 字段/方法               | 说明                               |
| ----------------------- | ---------------------------------- |
| `svg`                   | 原生 `T.SVG` 图层                  |
| `root`                  | 根 `<g>` 元素，向其中追加 SVG 节点 |
| `map`                   | 原生 `T.Map`                       |
| `zoom`                  | 当前缩放级别                       |
| `unitsPerMeter`         | 当前级别下每个像素对应的米数       |
| `lngLatToPoint(lnglat)` | 经纬度转图层像素坐标               |
| `redraw()`              | 请求重新触发 `redraw` 事件         |

地图平移时 SDK 会移动整个 SVG 容器，不需要重绘；缩放会改变图层像素坐标，因此应监听 `redraw` 重新计算图形位置。

```ts
function draw(context: SvgOverlayHandle) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "g");
  data.forEach(item => {
    const point = context.lngLatToPoint(item.position);
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", String(point.x));
    circle.setAttribute("cy", String(point.y));
    circle.setAttribute("r", "4");
    svg.appendChild(circle);
  });
  context.root.replaceChildren(svg);
}
```

## 组合式函数 `useSvg`

在自定义组件或组合式函数中直接使用：

```ts
import { useSvg } from "vue-map-tianditu";

const { ready, svg, root, redraw } = useSvg({
  padding: 0.1,
  onRedraw: context => {
    // 绘制逻辑
  }
});
```

返回的 `ready`、`svg`、`map`、`root` 均为只读引用；组件卸载时会移除地图事件和 SVG 图层。

## 使用边界

- SVG 根元素设置了 `pointer-events: none`，图形本身不接收鼠标事件。需要可点击图形时，请在 SVG 节点上自行设置 `pointer-events: all` 并绑定事件，或叠加普通覆盖物组件。
- 图形数量很大时，避免每次 `redraw` 重建全部 DOM；可以复用节点并只更新 `transform` / `d` 等属性。
- 组件不负责业务坐标投影；`lngLatToPoint()` 返回的是相对于 SVG 图层容器的像素坐标。
- `padding` 只在创建时生效，动态修改不会重建图层。

## API 表

<ApiTable component="TdtSvgOverlay" />
