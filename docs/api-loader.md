# API 加载器

## 配置来源

全局注册时设置默认配置，也可以给 `TdtMap` 的 `loadConfig` 单独传参。直接调用 `useApiLoader()` 时继承之前注册的默认配置。插件名合并去重，`pluginUrls` 按扩展名覆盖；普通配置以调用处显式参数为准。注册本身不会发出网络请求。

```ts
import { useApiLoader } from "vue-tianditu";

try {
  await useApiLoader({ v: "4.0", tk: "你的天地图 Key" });
  // 此时可以使用 T.Map、T.Marker 等原生 API
} catch (error) {
  console.error("地图 API 加载失败", error);
}
```

## 配置项

| 配置         | 类型                           | 说明                                                    |
| ------------ | ------------------------------ | ------------------------------------------------------- |
| `v`          | string                         | 天地图 API 版本，默认 4.0                               |
| `tk`         | string                         | 天地图访问 Key                                          |
| `plugins`    | string[]                       | 需要加载的扩展                                          |
| `apiUrl`     | string                         | 主 API 脚本地址，可指定带完整查询参数的自托管或代理地址 |
| `pluginUrls` | 扩展名到 URL 或 URL 数组的映射 | 覆盖扩展地址；数组中的脚本依次加载                      |
| `timeout`    | number                         | 单个脚本加载超时，单位毫秒；默认 15000                  |

扩展名包括 `D3`、`CarTrack`、`HeatmapOverlay`、`BufferTool`、`ImageOverLayer`。新 `TdtHeatmap` 组件无需这些扩展，内核随应用打包。

## 追加扩展和自托管

```ts
await useApiLoader({
  plugins: ["CarTrack"],
  pluginUrls: {
    CarTrack: ["/map-plugins/d3.min.js", "/map-plugins/D3SvgOverlay.min.js", "/map-plugins/CarTrack.min.js"]
  },
  timeout: 15000
});
```

替换地址时请提供该扩展所需的完整依赖序列。静态文件通过应用自己的 HTTPS 服务公开，并保留上游文件的来源和版权信息。默认外链不可访问时，可以使用此配置覆盖。

## 加载行为

主 API 请求共享 Promise，插件脚本按 URL 去重，依赖按顺序加载。即使 `T` 已存在，仍会加载新请求的插件。失败、超时会拒绝 Promise，后续调用可重试。

如果 SDK 已由宿主应用加载，可以直接使用组件，但宿主需要自行保证版本和 Key 正确。SDK 已加载后，修改配置不会重新替换全局 `T`。

在 Node.js 或 SSR 阶段直接调用加载器会得到明确错误；组件导入和插件注册可在服务端执行。地图组件通过 `error` 事件报告初始化错误。
