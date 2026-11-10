# 常见问题

## 地图瓦片返回 403，提示「域名不匹配」

天地图 Key 会校验请求的 `Referer`。请求不带 `Referer` 时通常可以正常返回；带了未被 Key 放行的域名或来源时，瓦片服务返回 403，响应体中常见 `301007`「域名不匹配」。

排查顺序：

1. 打开浏览器开发者工具 → Network，找到失败的瓦片请求，查看请求头和响应体。
2. 确认当前页面域名（含端口）已加入天地图控制台的域名白名单。
3. 本地开发时，页面来源通常是 `http://127.0.0.1:5173` 或 `http://localhost:5173`，需要把对应来源加入白名单，或使用不限制域名的 Key。
4. 文档站演示 Key 绑定了文档站域名，本地使用会 403。请在 `.env.local` 配置自己的 `VITE_TDT_TOKEN`。
5. 反向代理、SSR 服务或截图服务不会携带浏览器 `Referer`；这类场景应使用服务端 Key 或允许无 Referer 的 Key。

## 页面是 HTTPS，但图片/瓦片是 HTTP

浏览器会按混合内容策略拦截 HTTPS 页面中的 HTTP 资源。请使用 HTTPS 的天地图服务地址、图片地址和 WMS 地址；如果第三方服务只提供 HTTP，需要通过同域 HTTPS 反向代理转发。

## SSR / Nuxt 中报错 `document is not defined`

地图和所有 DOM 覆盖物只能在浏览器中创建。SSR 场景建议：

```vue
<ClientOnly>
  <tdt-map ... />
</ClientOnly>
```

或在客户端动态导入地图组件。`configureLocale()`、`configureApiLoader()` 和坐标转换函数不访问 DOM，可以在服务端调用；`useApiLoader()` 在非浏览器环境会明确抛错。

Nuxt 中可使用 `<ClientOnly>`，或在 `onMounted` 后再挂载地图。不要把 `TdtMap` 放在 SSR 期间执行的模板分支中。

## 地图区域高度为 0，什么都不显示

地图容器必须有明确高度：

```css
.map {
  width: 100%;
  height: 400px;
}
```

父级使用 `height: 100%` 时，需要确保祖先链上每一级都有确定高度。地图初始化后容器尺寸变化时，可调用原生实例的 `checkResize()`。

## 组件没有反应，控制台没有报错

组件必须放在 `TdtMap` 内。独立使用时 `useMapRoot()` 找不到地图会静默等待；地图初始化失败时，请监听 `TdtMap` 的 `error` 事件或使用 `#error` 插槽。

```vue
<tdt-map @error="onError">
  <template #error="{ error }">{{ error?.message }}</template>
</tdt-map>
```

## 插件加载失败

`CarTrack`、`BufferTool`、`ImageOverLayer` 等扩展从天地图开放库和 CDN 加载。网络不可达、CSP 拦截或 CDN 超时会失败，组件通过地图的 `error` 事件上报。

内网或离线环境可通过 `pluginUrls` 覆盖依赖地址：

```ts
app.use(VueTianditu, {
  tk: "你的 Key",
  pluginUrls: {
    BufferTool: ["https://your-cdn/turf.min.js", "https://your-cdn/BufferTool.min.js"]
  }
});
```

## 搜索或路线规划没有结果

- 检查天地图服务权限和 Key 配额。
- `TdtSearch` 的 `adminCode` 会限制行政区域；不需要限制时设为 `0`。
- 搜索/路线依赖天地图服务端接口，返回结果与浏览器定位、GPS 坐标不是同一套数据。
- 监听 `search-error` / `route-error` 获取状态码和错误信息。

## 主题变量不生效

- 确认已引入 `vue-map-tianditu/style.css`。
- 变量需要设置在组件祖先上；组件内部的 scoped 样式不会阻止 CSS 变量继承。
- 暗色主题使用 `data-tdt-theme="dark"`、`.tdt-dark` 或 VitePress 的 `.dark`；只设置 `color-scheme: dark` 不会改变组件变量。

## 全局组件类型提示不生效

确保项目包含包内的类型声明，并在 `tsconfig.json` 中启用 Vue Language Tools（Volar）。Vue 2.7 项目使用 `vue-tsc` 或 Volar 的 Vue 2 模式；`GlobalComponents` 的类型增强只在模板类型检查中生效，不影响运行时。
