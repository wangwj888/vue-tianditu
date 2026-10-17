# vue-tianditu 优化计划

> 基于 3.0.0 当前代码库的全面分析。第一批已完成，其余按批次推进。
>
> 最后更新：2026-10-17

## 项目现状

- 技术栈：TypeScript + Vue 组合式 API，同时支持 Vue 2.7.x 与 Vue 3.2.47+
- 运行时依赖：仅 `mitt`
- ESM 产物：87.45 kB（gzip 22.21 kB），CSS 2.74 kB
- 已覆盖：地图、控件、绘图工具、8 类覆盖物、4 类图层、搜索、路线规划、车辆轨迹
- 工程化：ESLint、Prettier、Vitest、Playwright、Husky、CI（lint/test/examples/docs build）

---

## 第一批：稳定性与开发体验（已完成）

### 1. 修复合法的 falsy 值被忽略

**问题**：组件 watch 普遍写成 `val => val && instance.setXxx(val)`，导致 `0` 这类合法值不会同步到天地图 SDK。典型场景：

- `opacity: 0` 无法让覆盖物或图层透明
- `fillOpacity: 0`、`weight: 0`、`radius: 0`、`minZoom: 0` 无效
- `zIndexOffset: 0`、`fontSize: 0`、`zIndex: 0` 无效
- `InfoWindow.content = ""` 无法清空

**修复**：数值型 props 统一改为 `val != null` 判断；字符串、数组、对象属性保留原有语义。

- [x] `packages/overlay/marker/use/watch.ts`
- [x] `packages/overlay/label/use/watch.ts`
- [x] `packages/overlay/circle/use/watch.ts`
- [x] `packages/overlay/polyline/use/watch.ts`
- [x] `packages/overlay/polygon/use/watch.ts`
- [x] `packages/overlay/rectangle/use/watch.ts`
- [x] `packages/overlay/infowindow/use/watch.ts`
- [x] `packages/overlay/markerClusterer/use/watch.ts`
- [x] `packages/control/use/watch.ts`
- [x] `packages/map/use/watch.ts`
- [x] `packages/tilelayer/tilelayer/use/watch.ts`
- [x] `packages/tilelayer/tdt/use/watch.ts`
- [x] `packages/tilelayer/wms/use/watch.ts`
- [x] `packages/tilelayer/gridlineLayer/use/watch.ts`

### 2. 修复数组 props 的深度监听

**问题**：父组件对坐标数组做原地修改（`path.push(...)`、`markers.push(...)`）时，浅层 watch 不触发，地图不更新。

**修复**：为坐标、路径、标注集合等数组 props 增加 `{ deep: true }`。

- [x] `marker.position`、`label.position`、`label.offset`
- [x] `circle.center`、`polyline.path`、`polygon.path`、`rectangle.bounds`
- [x] `map.center/zoom`、`map.maxBounds`、`map.viewport`
- [x] `markerClusterer.markers`、`cloudMarkerCollection.lnglats`
- [x] `control.offset`、`infowindow.offset`、`carTrack.Datas`

> 性能提示：大数据量场景仍建议替换数组引用而不是原地修改，后续在文档中补充说明。

### 3. 修复 CloudMarkerCollection 样式更新完全失效

**问题**：`watch(() => props, val => instance.setStyles(val))` 中 getter 每次返回同一个 props 代理，浅比较永远不会触发，`ShapeType` / `SizeType` / `color` 动态修改全部无效。

**修复**：改为监听三个具体字段的组合，并补充注释说明原因。

- [x] `packages/overlay/cloudMarkerCollection/use/watch.ts`

### 4. `TdtMap` 支持 `v-model:center` / `v-model:zoom`

**问题**：`center` / `zoom` 只能单向控制，用户拖动或缩放地图后父组件拿不到最新值。

**修复**：

- `moveend` 时比较当前中心点并 `emit("update:center", [lng, lat])`
- `zoomend` 时比较当前级别并 `emit("update:zoom", zoom)`
- 监听器在组件清理阶段移除，避免泄漏
- 同步更新后不会产生重复事件（emit 前做等值判断）

```html
<tdt-map v-model:center="center" v-model:zoom="zoom" />
```

- [x] `packages/map/use/const.ts`（新增事件声明与参数校验）
- [x] `packages/map/use/watch.ts`（同步逻辑与 cleanup）
- [x] `packages/map/index.ts`（注册 cleanup）

### 5. 子组件错误统一出口

**问题**：`useMapTask` 中插件加载失败（如 CarTrack 依赖的 D3 CDN 不可达）会产生未处理的 Promise rejection，组件静默不工作，业务方难以排查。

**修复**：

- `MapEmitEvents` 新增 `componentError` 事件
- `useMapTask` 捕获插件加载和任务初始化异常，通过 `mapEmitter` 上报
- `TdtMap` 将 `componentError` 转发为对外 `error` 事件

- [x] `packages/types/helpers/emitter.d.ts`
- [x] `packages/use/mapRoot.ts`
- [x] `packages/map/index.ts`

### 6. 全局组件类型提示（Volar / vue-tsc）

**问题**：全局注册后，模板中的 `TdtMap`、`TdtMarker` 等组件没有自动补全和 props 类型检查。

**修复**：新增 `GlobalComponents` 模块增强，覆盖全部 21 个组件。

- [x] `packages/types/vue-tianditu/global.d.ts`
- [x] `packages/types/vue-tianditu/index.d.ts`

同时修复了类型增强后暴露出的既有类型问题：

- [x] `Marker` 事件参数补充 `extData`
- [x] `MarkerClusterer.markers` 允许省略未提供的字段（`Partial<MarkerProps>`）
- [x] `VT.ControlOptions` 不再强制要求所有控件的字段（`Partial` 交叉）
- [x] 文档示例中的 `SizeType`、`controls`、事件处理函数类型

### 7. 本地 Key 配置与错误提示

**问题**：

- `.env.example` 中提交了真实天地图 Key
- 未配置 `VITE_TDT_TOKEN` 时静默回退到绑定其他域名的演示 Key，本地瓦片请求返回 403「域名不匹配」，排查成本高

**修复**：

- `.env.example` 恢复为占位符
- 文档与根开发页在开发环境缺少 Key 时输出明确警告，说明 403 原因和配置方式
- CI 部署仍可通过环境变量或演示 Key 正常工作

- [x] `.env.example`
- [x] `docs/.vitepress/theme/index.js`
- [x] `src/App.vue`

### 8. `check:examples` 的 Windows 兼容性

**问题**：`scripts/check-examples.js` 直接调用 `tar -tzf E:\...`，Windows 下的 GNU tar 会把 `E:` 当作远程主机，导致本地无法执行消费示例检查（CI 的 Linux 环境不受影响）。

**修复**：Windows 下为 tar 增加 `--force-local`，并将路径转换为正斜杠；macOS 的 bsdtar 不支持该参数，按平台条件启用。

- [x] `scripts/check-examples.js`

### 第一批验证结果

| 检查项 | 结果 |
| --- | --- |
| `yarn typecheck` | 通过 |
| `yarn test` | 23/23 通过（新增 8 个回归测试） |
| `yarn lint` | 0 error（12 个既有 warning） |
| `yarn build` | 通过 |
| `yarn docs:build` | 通过 |
| `yarn check:examples` | 通过（Vue 2.7 / Vue 3 / Vue 3-min） |

新增回归测试文件：`tests/regressions.test.ts`，覆盖：

- marker / label / polyline 的 `0` 值更新
- 数组 props 原地修改
- CloudMarkerCollection 样式与坐标更新
- `update:center` / `update:zoom` 及监听器清理
- 插件加载失败上报 `componentError`

---

## 第二批：组件能力补全（待开始）

### 8. 图层分组与显隐控制

- [ ] `TdtLayerGroup`：基于已类型化的 `T.LayerGroup`（`packages/types/tianditu/base.d.ts`）
- [ ] 图层控制面板 `TdtLayerSwitcher`：底图与业务图层切换、分组显隐、ZIndex 管理
- [ ] `TdtMap` 的 `controls` prop 支持动态增删（当前仅在初始化时读取一次）

### 9. 定位组件

- [ ] 补充 `T.Geolocation` 类型声明
- [ ] `TdtGeolocation`：浏览器定位、精度圈、定位失败处理、自动回中

### 10. 搜索与路线组件增强

- [ ] `TdtSearch` 增加受控 props：初始关键字、分页大小、行政区域、是否显示路线按钮的细粒度控制
- [ ] `TdtSearch` 增加插槽：结果项、空状态、加载状态
- [ ] `TdtRoute` 增加 props：初始起终点、默认出行方式、默认策略
- [ ] `TdtRoute` 增加事件：`route-complete`、`route-error`、`plan-change`
- [ ] 公交线路查询 `TdtBusLineSearch`（`busLineSearch.d.ts` 已有类型）

### 11. 地图实例访问方式

- [ ] `TdtMap` 通过 `expose` 暴露 `getMap()` / `map` ref，减少对 `init` 事件的依赖
- [ ] `TdtMap` 增加 `loading` / `error` 作用域插槽

---

## 第三批：生态与工程质量（待开始）

### 12. 更多图层与工具组件

- [ ] `TdtImageOverlay`（加载器已支持 `ImageOverLayer` 插件）
- [ ] `TdtBufferTool`（加载器已支持 `BufferTool` 插件）
- [ ] `TdtSvgOverlay` / `useSvg`（`T.SVG` 已有类型，可用于 D3 轨迹与海量图形）
- [ ] `TdtContextMenu`（需先确认天地图 4.0 官方 API 支持范围）

### 13. 主题与国际化

- [ ] 搜索、路线 UI 的文案抽离为 locale 配置
- [ ] 搜索、路线样式改用 CSS 变量，支持暗色主题与品牌色定制

### 14. 工具函数

- [ ] 坐标转换：WGS84 / GCJ-02 / CGCS2000（注明合规使用边界）

### 15. 文档与类型

- [ ] 由 `PROPS` / `EVENTS` 自动生成组件 API 表格，避免手写漂移
- [ ] 为每个组件补充「动态更新」示例
- [ ] 补充常见问题：Key 域名白名单、混合内容、SSR / Nuxt 用法
- [ ] `VT.LngLat` 收紧为 `[number, number]`

### 16. 工程质量

- [ ] 为核心 hooks 增加覆盖率门槛
- [ ] 大数据量场景的增量更新：`markerClusterer` 差分、`cloudMarkerCollection` 增量
- [ ] 评估 `preserveModules` 或子路径导出，支持更细粒度的按需引入
- [ ] 评估 `vue-docgen-api` 接入文档构建流程
