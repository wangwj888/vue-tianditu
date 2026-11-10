# vue-map-tianditu 优化计划

> 基于 3.0.0 当前代码库的全面分析。第一、二、三批均已完成。
>
> 最后更新：2026-11-10

## 项目现状

- 技术栈：TypeScript + Vue 组合式 API，同时支持 Vue 2.7.x 与 Vue 3.2.47+
- 运行时依赖：仅 `mitt`
- 构建产物：ESM、UMD、独立 CSS 与 TypeScript 声明
- 已覆盖：地图、控件、绘图工具、覆盖物（含热力图和自定义 DOM）、图层与分组、定位、搜索、路线规划、公交线路查询、车辆轨迹
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

- [x] `packages/types/vue-map-tianditu/global.d.ts`
- [x] `packages/types/vue-map-tianditu/index.d.ts`

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

| 检查项                | 结果                                |
| --------------------- | ----------------------------------- |
| `yarn typecheck`      | 通过                                |
| `yarn test`           | 23/23 通过（新增 8 个回归测试）     |
| `yarn lint`           | 0 error（12 个既有 warning）        |
| `yarn build`          | 通过                                |
| `yarn docs:build`     | 通过                                |
| `yarn check:examples` | 通过（Vue 2.7 / Vue 3 / Vue 3-min） |

新增回归测试文件：`tests/regressions.test.ts`，覆盖：

- marker / label / polyline 的 `0` 值更新
- 数组 props 原地修改
- CloudMarkerCollection 样式与坐标更新
- `update:center` / `update:zoom` 及监听器清理
- 插件加载失败上报 `componentError`

---

## 第二批：组件能力补全（已完成）

### 8. 图层分组与显隐控制

- [x] `TdtLayerGroup`：基于 `T.LayerGroup`，支持嵌套、动态成员与继承显隐/层级
- [x] 图层控制面板 `TdtLayerSwitcher`：底图与业务图层切换、分组显隐、ZIndex 管理、候选项失效回退
- [x] `TdtMap` 的 `controls` prop 支持动态增删与配置更新，清理自身控件、监听器和等待计时器

### 9. 定位组件

- [x] 补充 `T.Geolocation` 类型声明
- [x] `TdtGeolocation`：浏览器定位、精度圈、定位失败处理、自动回中；默认手动触发

### 10. 搜索与路线组件增强

- [x] `TdtSearch` 增加受控 props：初始关键字、分页大小、行政区域、是否显示路线按钮的细粒度控制
- [x] `TdtSearch` 增加插槽：结果项、空状态、加载状态
- [x] `TdtRoute` 增加 props：初始起终点、默认出行方式、默认策略
- [x] `TdtRoute` 增加事件：`route-complete`、`route-error`、`plan-change`
- [x] 公交线路查询 `TdtBusLineSearch`：候选线路、详情和地图展示，并补正 SDK 类型

### 11. 地图实例访问方式

- [x] `TdtMap` 通过 `expose` 暴露 `getMap()` / `map` ref，减少对 `init` 事件的依赖
- [x] `TdtMap` 增加 `loading` / `error` 作用域插槽

### 第二批文档与验证

- [x] 补齐新组件与增强服务的 API 文档、交互演示、导航、README 和 CHANGELOG
- [x] 补齐组件导出、全局组件类型；三个消费示例接入图层分组、切换面板及地图 ref/插槽
- [x] 修正控件清理函数的声明推导，兼容 Vue 2.7；发布包脚本使用相对归档路径，兼容 GNU tar 和系统 bsdtar

| 检查项                         | 结果                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------- |
| 类型检查（`vue-tsc --noEmit`） | 通过                                                                         |
| ESLint                         | 0 error，14 warning                                                          |
| 库构建及声明生成               | 通过                                                                         |
| 文档构建                       | 通过                                                                         |
| `yarn check:examples`          | 通过：发布包内容检查，以及 Vue 2.7.16 / 3.2.47 / 3.5.44 的类型检查与生产构建 |
| 单元测试、浏览器测试           | 本批未新增、未运行                                                           |

显隐、层级、定位权限和 SDK 服务的使用边界已写入各组件文档。上述静态检查与构建结果不代表真实地图接口或浏览器交互已验证。

---

## 第三批：生态与工程质量（已完成）

### 12. 更多图层与工具组件

- [x] `TdtImageOverlay`：基于 `ImageOverlay` 扩展，支持 `url`、`bounds`、`opacity`（含 0）、`alt`、显隐和层级动态更新
- [x] `TdtBufferTool`：基于 `BufferTool` 扩展，接收原生 `T.Polygon` / `T.Circle`，支持拖拽生成和调整缓冲区、样式、启用开关及 `drag-start` / `drag` / `drag-end`
- [x] `TdtSvgOverlay` / `useSvg`：直接使用核心 `T.SVG` 图层，提供根 `<g>`、`lngLatToPoint`、`unitsPerMeter` 和缩放重绘；不依赖 CDN D3
- [x] `TdtContextMenu`：确认天地图 4.0 无官方 `T.ContextMenu`，改为基于地图 `contextmenu` 事件实现可访问 DOM 菜单，支持菜单项、插槽、键盘导航和受控显隐

### 13. 主题与国际化

- [x] 搜索、路线 UI 文案抽离为 `LocaleMessages`，导出 `zhCN`、`enUS`、`formatMessage`
- [x] `TdtSearch` / `TdtRoute` 新增 `locale` prop，支持 `"zh-CN"`、`"en-US"` 或局部覆盖对象；嵌套路线自动继承父级语言
- [x] `configureLocale()` 支持运行时切换，`app.use(VueTianditu, { locale })` 可设置全局默认语言
- [x] 搜索、路线、右键菜单样式改用 CSS 变量，新增 `theme.scss`、暗色主题（`data-tdt-theme="dark"` / `.tdt-dark` / `.dark`）和品牌色覆盖

### 14. 工具函数

- [x] 新增 WGS84 / GCJ-02 / CGCS2000 转换、迭代反算、范围校验和 `convertCoordinateSystem`
- [x] 明确 CORS、CGCS2000 与 WGS84 同基准处理、精度边界和测绘合规提示

### 15. 文档与类型

- [x] 新增 `scripts/gen-api-docs.mjs`，用 TypeScript AST 解析 `PROPS` / `EVENTS`（含对象展开），生成 `docs/.vitepress/generated/api.json` 与 `<ApiTable>` 组件；文档构建前自动刷新
- [x] 为全部组件文档追加自动生成的属性和事件表，避免手写漂移
- [x] 新增「动态更新」指南与综合示例，覆盖 `0` 值、数组原地修改、聚合差分和海量点合并
- [x] 新增常见问题：Key 域名白名单 / 403（301007）、混合内容、SSR / Nuxt、容器高度、插件加载、主题和类型提示
- [x] `VT.LngLat` 收紧为 `[number, number]`，`LngLats`、`Bounds`、`Point` 同步收紧；迁移指南补充写法

### 16. 工程质量

- [x] Vitest v8 覆盖率门槛：核心 hooks 全局 lines/statements/functions ≥ 70%，branches ≥ 60%；新增 `test:coverage`
- [x] `markerClusterer` 基于稳定 `id` 差分增删改；缺少 id、id 重复或不可序列化时回退整组重建
- [x] `cloudMarkerCollection` SDK 仅提供 `setLnglats`，实现同 tick 合并与相同快照跳过，避免流式数据重复重建画布
- [x] 评估 `preserveModules` / 子路径导出：当前单 ESM 入口配合 `sideEffects: ["**/*.css"]` 已可被现代打包器 tree-shake；拆分 modules 会改变产物路径和声明引用，收益不足以抵消迁移成本，暂不启用
- [x] 评估 `vue-docgen-api`：其运行时元数据提取会引入额外依赖并可能丢失 `PROPS` 展开信息；改用仓库内 TypeScript AST 生成器，零新增运行时依赖

### 第三批验证结果

| 检查项                         | 结果                                                                    |
| ------------------------------ | ----------------------------------------------------------------------- |
| `yarn typecheck`               | 通过                                                                    |
| `yarn lint`                    | 0 error，20 warning（既有单文件多组件等提示）                           |
| `yarn test`                    | 40/40 通过，新增坐标、locale、增量更新和右键菜单测试                    |
| `yarn test:coverage`           | 通过门槛：statements 83.84%、branches 70.35%、functions 86.6%、lines 89% |
| `yarn build`                   | 通过：ESM、UMD、CSS、类型声明                                           |
| `yarn docs:build`              | 通过，构建前自动生成 29 个组件的 API 表                                 |
| `yarn check:examples`          | 通过：发布包内容检查，Vue 2.7.16 / 3.2.47 / 3.5.44 类型检查与生产构建   |

说明：上述验证覆盖静态检查、单元测试、构建和消费示例。图片覆盖物、SVG、缓冲区、右键菜单和主题/语言切换涉及真实天地图接口、插件 CDN 和浏览器交互，仍需在可用 Key 的浏览器环境中人工验收。
