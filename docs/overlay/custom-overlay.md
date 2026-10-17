# 自定义 DOM 覆盖物

`TdtCustomOverlay` 将默认插槽中的 DOM 定位到地图经纬度上。可以直接编写 `div`、标签、按钮，或放入自己的 Vue 组件；插槽中的响应式数据、事件和 scoped CSS 继续由 Vue 管理。

## 示例

下面同时展示 CSS 水波纹点、动态文字、按钮计数和鼠标穿透。位置、内容与显示状态都可以响应式更新。

<ClientOnly>
<demo-custom-overlay></demo-custom-overlay>
</ClientOnly>

<code-details>

<<< @/.vitepress/components/demo-custom-overlay/index.vue

</code-details>

## 按需引入

```ts
import { TdtMap, TdtCustomOverlay } from "vue-map-tianditu";
```

将覆盖物放在 `TdtMap` 内，在默认插槽编写内容。水波纹只是一种示例 CSS，组件不限制内容样式。

## 属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `position` | number[] | 经纬度，顺序为经度、纬度 |
| `anchor` | string | 默认 center；支持 top、bottom、left、right、top-left、top-right、bottom-left、bottom-right |
| `offset` | number[] | 默认 [0, 0]；水平、垂直像素偏移；负的垂直值向上移动 |
| `visible` | boolean | 控制显隐，默认 true |
| `zIndex` | number | 同一地图覆盖物面板内的叠放顺序，默认 0 |
| `interactive` | boolean | 默认 true；false 时穿透到地图 |
| `stopPropagation` | boolean | 默认 true；交互时阻止点击、双击、按下和触摸开始事件向地图传播 |
| `extData` | unknown | 自定义业务数据，通过覆盖物事件传回 |

## 插槽

| 插槽      | 说明                                     |
| --------- | ---------------------------------------- |
| `default` | 自定义 DOM 或 Vue 组件；可以包含多个节点 |

插槽仍处于原有 Vue 组件上下文中，不需要再次创建 Vue 应用。DOM 挂载到地图面板后，scoped CSS 和 Vue 事件仍然生效。

## 事件

支持 `init`、`error`、`click`、`dblclick`、`mousedown`、`mouseup`、`mouseover`、`mouseout`。初始化返回 `CustomOverlayHandle`（`overlay`、`getElement()`、`refresh()`），错误返回 Error。鼠标事件包含 `type`、`target`（原生覆盖物）、`lnglat`、`containerPoint`、`originalEvent` 和 `extData`。

也可通过组件 ref 调用 `refresh()`。默认插槽可选用作用域参数 `{ position, visible }`。

`interactive=true` 时覆盖物可交互，并阻止会触发地图拖动、双击缩放等操作的事件向地图传播；内部按钮仍可使用 Vue 的 `@click`。设置为 false 后，覆盖物内部按钮也不会接收鼠标事件。

## 定位与动画

定位外壳由组件控制，插槽内容由使用者控制。请将水波纹缩放等动画放到插槽内部节点或伪元素上，避免覆盖定位外壳的 transform。

示例对 `prefers-reduced-motion` 做了适配。覆盖物随地图平移、缩放自动更新位置，卸载时移除 DOM 和事件监听器。
