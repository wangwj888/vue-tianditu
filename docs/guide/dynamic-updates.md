# 动态更新

组件库的 props 均为响应式。数值型属性使用 `!= null` 判断，`0`、空字符串和 `false` 都是合法值；坐标、路径、标注集合等数组支持深度监听，可以替换数组或原地修改。

## 示例

<ClientOnly>
<demo-dynamic-updates></demo-dynamic-updates>
</ClientOnly>

<code-details>

<<< @/.vitepress/components/demo-dynamic-updates/index.vue

</code-details>

## 通用规则

| 数据           | 推荐写法                                     | 说明                                        |
| -------------- | -------------------------------------------- | ------------------------------------------- |
| 坐标 / 路径    | 替换数组或 `push` / `splice`                 | `deep: true`，两种写法都会同步到 SDK        |
| 覆盖物样式     | 直接修改 prop                                | `opacity: 0`、`weight: 0`、`radius: 0` 生效 |
| 显隐           | `visible` / `v-model:visible`（图层分组）    | 分组隐藏时会同时关闭编辑状态                |
| 地图中心与级别 | `v-model:center` / `v-model:zoom`            | 用户拖动、缩放后会回写                      |
| 海量数据       | 尽量替换数组，减少同一 tick 内的多次原地修改 | 组件会合并更新                              |

数值为 `0` 时不会被忽略。例如：

```vue
<tdt-circle :center="center" :radius="radius" :opacity="opacity" />
<!-- radius = 0、opacity = 0 都会立即生效 -->
```

## 点聚合的差分更新

`TdtMarkerClusterer` 的 `markers` 支持为每项提供稳定 `id`。满足以下条件时只增删变化的标注，不整组重建：

- 每项都有 `id`；
- `id` 不重复；
- 配置可以 `JSON.stringify`（`extData` 不要包含循环引用）。

```ts
const markers = ref([
  { id: "a", position: [113.28, 23.12] as [number, number], title: "A" },
  { id: "b", position: [113.3, 23.13] as [number, number], title: "B" }
]);

// 只创建 c，A/B 不会重建
markers.value.push({ id: "c", position: [113.32, 23.14], title: "C" });

// 只重建 b
markers.value[1].position = [113.31, 23.14];
```

缺少 `id`、`id` 重复或配置无法序列化时，组件回退为整组 `clearMarkers()` + `addMarkers()`，行为与旧版本一致。

## 海量点的合并更新

天地图 `CloudMarkerCollection` 只提供 `setLnglats()`，没有逐点增删接口。组件会在同一 tick 内合并多次修改，并跳过内容完全相同的快照，避免数据流式写入时反复重建画布。

```ts
for (let index = 0; index < 1000; index++) {
  points.value.push([lng + index * 0.0001, lat]);
}
// 同一 tick 内只调用一次 setLnglats
```

数据量很大时仍建议一次替换数组，并避免把动画帧级的数组写入深度响应式对象。

## 其他组件

- `TdtHeatmap`：替换 `data` 数组会重绘；空数组清空画面。
- `TdtImageOverlay`：`url`、`bounds`、`opacity` 动态更新，范围变化不会重建覆盖物。
- `TdtSvgOverlay`：数据变化后调用 `redraw()`，或监听 `redraw` 事件重绘；缩放时组件自动触发。
- `TdtLayerGroup`：修改 `visible` / `zIndex` 会同步到所有后代；成员数组替换会增删外部图层。
- `TdtSearch` / `TdtRoute`：`keyword`、`page`、`routeType`、政策等受控 props 会触发查询或界面更新。
- `TdtContextMenu`：`items`、`enabled`、`visible` 支持动态修改；`visible` 可用于受控显隐。
