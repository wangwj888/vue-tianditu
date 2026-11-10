# 图层切换面板

`TdtLayerSwitcher` 是放在地图内的控件。无须传入图层列表，它会自动发现同一张地图上的 `TdtLayerGroup`：底图分组使用单选按钮，业务分组使用复选框。分组动态挂载、卸载和名称变化会同步到面板。

## 示例

<ClientOnly>
<demo-layer-switcher />
</ClientOnly>

<code-details>

<<< @/.vitepress/components/demo-layer-switcher/index.vue

</code-details>

## 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| position | T.ControlPosition | "topright" | 控件位置 |
| offset | VT.Point | — | 控件偏移 |
| title | string | "图层" | 面板标题和无障碍名称 |
| baseLayers | readonly BaseLayerOption[] | [] | 可选的原生地图类型，和 type="base" 分组共同参与底图单选 |
| baseLayer | string | 首个可用底图 | 选中的底图 id，支持 v-model:baseLayer / :base-layer.sync |
| zIndexControls | boolean | false | 显示分组的数字层级输入框；清空临时覆盖后回退父组或本组 prop |

BaseLayerOption 为 `{ id, name, mapType }`。mapType 可为 `T.MapType`，或 `TMAP_NORMAL_MAP`、`TMAP_SATELLITE_MAP`、`TMAP_HYBRID_MAP`、`TMAP_TERRAIN_MAP`、`TMAP_TERRAIN_HYBRID_MAP` 字符串。所有底图和分组 id 必须唯一。

原生底图选中时通过 `map.setMapType()` 切换，业务图层不受影响。自建底图可使用包含瓦片图层的 `type="base"` 分组；这些瓦片位于地图默认底图上方。分组的父级也必须可见，底图才能显示。

选择自定义底图组会保留 SDK 原生背景，透明或局部自定义底图仍能看到下面的原生地图，也可能继续请求原生瓦片。这里的单选控制当前自定义底图组及原生地图类型，不保证停止所有未选中来源的网络请求。

`baseLayer` 采用乐观 `.sync` 语义：点击后立即切换，并发送更新事件；父组件不接收事件时，面板仍保存本次选择，之后外部 prop 再发生变化会重新同步。推荐 Vue 3 使用 `v-model:baseLayer`，Vue 2.7 使用 `:base-layer.sync`。当前候选项被删除或不再是底图组时，会回退到有效候选项；没有候选项时选择为 `undefined`，并发送对应更新事件。

## 事件与 ref 方法

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| init | T.Map | 控件所属地图就绪 |
| error | Error | 未知分组、底图类型不可用等配置错误 |
| update:baseLayer / base-change | string / undefined | 用户切换或失效回退后的底图 id；无候选项时为 undefined |
| visibility-change | { id, visible } | 用户切换业务组显隐 |
| z-index-change | { id, zIndex } | 用户修改分组层级 |
| change | { baseLayer, visibleLayers } | 选择后的快照；visibleLayers 为最终可见的分组 id |

可用导出的 `LayerSwitcherExposed` 标注组件 ref。

| 方法                         | 说明                                                                     |
| ---------------------------- | ------------------------------------------------------------------------ |
| setBaseLayer(id)             | 选择有效的原生底图或底图组                                               |
| setLayerVisible(id, visible) | 更新业务组自身显隐；底图组只能用 true 选中                               |
| setLayerZIndex(id, zIndex)   | 更新分组层级，接受有限数值或 undefined                                   |
| getSelection()               | 返回 `LayerSelection`：`{ baseLayer?: string, visibleLayers: string[] }` |

`visibleLayers` 包含最终可见的分组，包含选中的可见底图组，不包含原生 `baseLayers` 选项。业务组复选框表示该组自身的显示意图；父组隐藏时，子组可保持勾选，但不在最终可见列表中。不提供手动取消所有底图的单选操作。

面板对分组的操作会触发相应分组的 `update:visible` / `update:zIndex`；推荐在组上使用双向绑定保存状态。未绑定时，分组内部保存面板选择，后续父 props 变化会重新同步。

清空层级输入只清除面板覆盖值；若组的 `zIndex` prop 仍有值，则回退该值。需要释放组层级时应同时清除 prop，例如为组绑定 `v-model:zIndex`。父组层级优先时，请先调整父组配置。

层级的 pane 边界、SDK 服务结果的支持范围和隐藏时的网络行为见[图层分组](./layer-group.md)。

## 地图内置控件动态更新

`TdtMap.controls` 支持替换数组、push/splice 和配置对象字段更新。每次配置变化会清理上一次配置创建的控件、事件与等待计时器，并按新配置重建。只管理 controls 属性创建的控件，不影响 TdtControl 或本面板；鹰眼开合状态会按新配置重新初始化。

```ts
const controls = ref<(VT.ControlName | VT.ControlOptions)[]>(["Zoom"]);
controls.value.push({ name: "Scale", position: "bottomleft" });
controls.value = []; // 移除由 controls 创建的全部控件
```
