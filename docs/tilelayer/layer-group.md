# 图层分组

`TdtLayerGroup` 把地图子组件与外部 SDK 图层放入一个分组，统一控制显隐和层级。分组可以嵌套；父组与子层的 `visible` 取交集，重新显示父组会保留各子组件自己的显示状态。组件放在 `TdtMap` 内使用。

## 示例

<ClientOnly>
<demo-layer-group />
</ClientOnly>

<code-details>

<<< @/.vitepress/components/demo-layer-group/index.vue

</code-details>

## 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| id | string | 自动生成 | 分组标识；同一地图中必须唯一，初始化后保持不变 |
| name | string | id | 图层切换面板显示的名称 |
| type | "base" / "overlay" | "overlay" | 底图分组单选，业务分组多选；初始化配置 |
| visible | boolean | true | 分组自身的显示状态；支持 Vue 3 `v-model:visible` 和 Vue 2.7 `:visible.sync` |
| zIndex | number | — | 为支持层级调整的后代统一设置层级，接受 0 |
| layers | readonly LayerInstance[] | [] | 外部 SDK 实例；替换数组或 push/splice 时按实例身份增删 |

`layers` 支持 `T.Overlay`、普通覆盖物、`T.TileLayer` 与原生 `T.LayerGroup`。传入尚未由其他组件或分组管理的实例；同一个实例只能有一个所有者。SDK 对象建议用 `shallowRef` 保存，避免深度响应式包装。数组监听不会遍历 SDK 实例内部的地图数据。

## 插槽与方法

默认插槽参数为 `{ visible }`，这里的 visible 是包含父组和底图选中状态的最终显隐值。

通过组件 ref 调用：

| 方法              | 说明                                          |
| ----------------- | --------------------------------------------- |
| getGroup()        | 获取原生 T.LayerGroup；初始化前为 undefined   |
| getLayers()       | 获取直属成员 SDK 实例，包括嵌套子组的原生容器 |
| setVisible(value) | 更新自身显隐，并触发 update:visible           |
| setZIndex(value)  | 更新层级，并触发 update:zIndex                |

可用导出的 `LayerGroupExposed` 标注组件 ref。`getGroup()` 在初始化前和卸载后为 `undefined`；`getLayers()` 只返回直属成员，不展开嵌套组。

| 事件           | 参数               | 说明                               |
| -------------- | ------------------ | ---------------------------------- |
| init           | T.LayerGroup       | SDK 分组初始化完成                 |
| update:visible | boolean            | 调用实例方法或切换面板更新自身显隐 |
| update:zIndex  | number / undefined | 调用实例方法或切换面板更新层级     |
| error          | Error              | 外部图层注册失败等错误             |

地图或任务初始化错误也可通过 `TdtMap` 的 `error` 事件接收。请通过组件 props 管理成员；直接向 `getGroup()` 返回的 SDK 容器增删成员不会进入组件生命周期。

## 显隐、层级与支持范围

支持普通点、文本、折线、多边形、矩形、圆、海量点、自定义覆盖物、热力图，以及 Tilelayer/Tdt/Wms/GridlineLayer。隐藏组会关闭这些可编辑图形的编辑状态；显示时按各自 edit 属性恢复。

分组不替换或修改原始 T.Map。SDK 图层仍正常挂载以保证初始化、更新及编辑接口有效，隐藏通过 SDK show/hide 或瓦片容器 display 实现；隐藏瓦片仍可能产生网络请求，卸载才会移除实例。

分组层级优先于子组件层级，父组显式层级优先于子组。`setZIndex(undefined)` 清除方法或面板设置的临时覆盖，回退到父组或本组 `zIndex` prop。需要释放本组层级时，也应清除该 prop；可用 Vue 3 的 `v-model:zIndex` 或 Vue 2.7 的 `:z-index.sync` 同步更新。

释放所有祖先及本组层级后，子组件会恢复自身显式 `zIndex` / `zIndexOffset`；没有显式层级的外部实例保留 SDK 最后设置的值。层级只在 SDK 支持的同一 pane 内比较，不能用它在瓦片、Marker、SVG 等不同 pane 之间进行全局排序，也不承诺共享 SVG 渲染器内图形的绘制顺序。

SDK 服务实例本身，以及信息窗口、点聚合、绘图工具、车辆轨迹等不自动加入分组。搜索/路线组件生成的普通 `TdtMarker`、`TdtPolyline` 若位于分组的组件后代中，仍按普通覆盖物继承分组策略。嵌套 `TdtMap` 会使用自己的图层宿主，不继承外部地图的分组。

原生接口参考：[天地图 LayerGroup](https://lbs.tianditu.gov.cn/api/js4.0/pages-class/LayerGroup.html)。
