# 从 2.x 迁移到 3.x

## Vue 支持范围

3.x 支持 Vue 2.7.x 和 Vue 3.2.47+。Vue 3 的最低支持基线为 3.2.47，并使用当前工具链检查发布产物的类型兼容性。Vue 2 项目推荐升级到 2.7.16，2.6 及更早版本请继续使用组件库 2.x。

Vue 2.7 已自带 Composition API。项目中不再需要为了本组件库安装 `vue-demi` 或 `@vue/composition-api`，也不再执行 `vue-demi-switch`。其他依赖若仍使用这些包，请按实际依赖关系保留。

业务组件中的 `ref`、`reactive`、`watch`、生命周期等直接从 `vue` 导入。

## 注册和样式

Vue 3 继续通过 `createApp(...).use(VueTianditu, config)` 注册；Vue 2.7 使用 `Vue.use(VueTianditu, config)` 和 `new Vue(...)` 挂载。

推荐样式入口为 `vue-tianditu/style.css`；旧的 `vue-tianditu/lib/style.css` 仍可使用。

注册插件只保存加载配置，首次挂载地图或显式调用 `useApiLoader` 时才加载脚本。需要在地图挂载前使用原生 `T` 时，请显式等待加载器。

## API 加载变化

- 脚本加载失败、超时会拒绝 Promise；直接调用加载器时请捕获错误。
- `TdtMap` 的 `error` 事件用于接收 API 加载和初始化错误。
- 主 API 加载后仍可追加扩展；同一脚本的并发请求合并，失败后可以重试。
- 可配置 `apiUrl`、`pluginUrls` 和 `timeout`；详见 [API 加载器](/api-loader)。
- 热力图新组件使用随应用打包的渲染内核，不需要配置 `plugins: ["HeatmapOverlay"]`。

同一页面的天地图 API 只有一个全局运行时。请在首次加载前统一 Key 和版本，不要通过创建第二张地图来切换全局 API 版本。

## 双向绑定

Vue 2.7 与 Vue 3 的模板语法仍有差异。例如信息窗口的 `target`：

```html
<!-- Vue 2.7 -->
<tdt-infowindow :target.sync="target" />

<!-- Vue 3 -->
<tdt-infowindow v-model:target="target" />
```

普通 props、事件和新覆盖物默认插槽在两版中的用法一致。鼠标工具和车辆轨迹通过组件 ref 暴露方法，Vue 2.7/3 使用相同的方法名。

## 新增组件

- [TdtHeatmap](/overlay/heatmap)：经纬度权重数据、半径、渐变、透明度和动态更新。
- [TdtCustomOverlay](/overlay/custom-overlay)：自定义 DOM、Vue 组件、定位锚点和鼠标交互。

## 类型和开发工具

组件库发布 JavaScript、CSS 和类型声明。Vue 2.7、Vue 3 消费示例分别验证同一份打包产物。

Vue Language Tools 3.1 及以后不再支持 Vue 2。Vue 2.7 示例使用 `vue-tsc 3.0.11`、TypeScript 5.9.x 和 `vueCompilerOptions.target: 2.7`；Vue 3 示例使用新版类型工具。查看 [官方 Vue 2 工具兼容说明](https://github.com/vuejs/language-tools/wiki/Vue-2-Compat-Guides)。

开发和 CI 的 Node.js 基线提高到 22.22.1+ 或 24+。构建、启动和提交钩子不再安装或切换 Vue 版本。

## SSR 与静态文档

模块导入和插件注册不会访问浏览器 DOM。直接加载 SDK 需要浏览器环境；地图实例只在客户端挂载后创建。在 VitePress 中用 `ClientOnly` 包裹地图示例。
