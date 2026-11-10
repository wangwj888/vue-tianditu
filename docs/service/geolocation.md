# 浏览器定位

`TdtGeolocation` 使用浏览器 `navigator.geolocation.getCurrentPosition()` 获取一次当前位置，并在地图上显示定位点和以米为半径的精度圈。组件默认显示一个定位按钮；挂载时不会请求位置权限，点击按钮或调用 `locate()` 后才发起请求。

## 示例

<ClientOnly>
<demo-geolocation></demo-geolocation>
</ClientOnly>

<code-details>

<<< @/.vitepress/components/demo-geolocation/index.vue

</code-details>

## 按需引入

```ts
import { TdtMap, TdtGeolocation } from "vue-map-tianditu";
import type { GeolocationHandle, GeolocationResult } from "vue-map-tianditu";
```

将组件放在 `TdtMap` 内。默认按钮位于地图右上角，可以使用默认插槽替换按钮与状态展示。支持 Vue 2.7 和 Vue 3。

## 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `autoLocate` | boolean | false | 地图就绪后主动定位；从 false 改为 true 时也会发起一次请求，可能弹出浏览器权限提示 |
| `autoCenter` | boolean | true | 每次定位成功后将地图中心移动到当前位置 |
| `zoom` | number | — | 配合 autoCenter 指定回中后的缩放级别；不传时保留当前级别 |
| `enableHighAccuracy` | boolean | true | 向浏览器请求更高精度；实际精度由设备、系统和定位服务决定 |
| `timeout` | number | 10000 | 浏览器定位超时配置，单位毫秒，要求有限且非负；无效值使用默认值 |
| `maximumAge` | number | 0 | 可接受的定位缓存年龄，单位毫秒，要求有限且非负；0 表示请求新结果 |
| `showMarker` | boolean | true | 显示定位点；更新时只增删本组件的定位点 |
| `showAccuracy` | boolean | true | 显示精度圈；accuracy 为 0 时不创建圆 |
| `markerIcon` | string / `VT.IconOptions` | — | 自定义定位图标，格式与 TdtMarker 的 icon 一致 |
| `accuracyStyle` | `T.CircleOptions` | 见下文 | 精度圈的描边、填充等样式；支持响应式更新 |

精度圈默认样式为 `{ color: "#1677ff", weight: 1, opacity: 0.6, fillColor: "#1677ff", fillOpacity: 0.15 }`，传入的 `accuracyStyle` 会与默认样式合并。圈的圆心和半径由定位结果决定。

## 事件

| 事件       | 参数                | 说明                                                       |
| ---------- | ------------------- | ---------------------------------------------------------- |
| `init`     | `GeolocationHandle` | 地图就绪后返回组件接口；此事件不会主动申请定位权限         |
| `locating` | 无                  | 开始一次定位请求，包括等待地图就绪的阶段                   |
| `success`  | `GeolocationResult` | 定位成功，并完成当前配置的覆盖物绘制与自动回中             |
| `error`    | `GeolocationError`  | 定位或地图操作失败；包含 code、message、可选 originalError |
| `clear`    | 无                  | 主动调用 clear()，取消当前请求的接收并移除定位覆盖物       |

`GeolocationResult` 包含：

```ts
interface GeolocationResult {
  readonly position: readonly [number, number]; // [经度, 纬度]
  readonly accuracy: number; // 浏览器报告的水平精度，单位米
  readonly timestamp: number; // 浏览器结果的时间戳
  readonly nativePosition: GeolocationPosition; // 原始浏览器结果，可读取海拔、速度等字段
}
```

精度圈用于表达浏览器报告的精度范围，不代表实际位置必定位于圆内。定位失败时保留上一次成功结果；需要移除时调用 `clear()`。

## 方法

通过组件 ref 或 `init` 参数访问以下方法：

| 方法 | 返回值 | 说明 |
| --- | --- | --- |
| `locate()` | `Promise<GeolocationResult>` | 定位成功时 resolve，失败时 reject；请求进行中重复调用会返回同一个 Promise |
| `clear()` | void | 使在途回调失效，清空结果和错误，并移除本组件的定位点与精度圈 |
| `getPosition()` | `GeolocationResult \| undefined` | 获取上一次成功结果 |
| `getMap()` | `T.Map \| undefined` | 获取已经就绪的地图实例 |
| `getMarker()` | `T.Marker \| undefined` | 获取本组件的定位点 |
| `getAccuracyCircle()` | `T.Circle \| undefined` | 获取本组件的精度圈 |

```vue
<template>
  <tdt-map>
    <tdt-geolocation ref="locator" :auto-center="false" />
  </tdt-map>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { GeolocationHandle } from "vue-map-tianditu";

const locator = ref<GeolocationHandle>();
async function locateFromUserAction() {
  try {
    const result = await locator.value?.locate();
    console.log(result?.position);
  } catch (error) {
    // 处理拒绝权限、超时或主动清除造成的取消。
    console.error(error);
  }
}
</script>
```

`getCurrentPosition()` 没有浏览器级取消接口。`clear()` 和卸载会使组件忽略过期回调；尚未完成的 `locate()` Promise 会以 `code: "aborted"`、`name: "AbortError"` 拒绝，不触发 `error` 事件。组件不会清除地图上的其他覆盖物。

## 插槽

默认插槽提供 `{ locate, clear, ready, loading, result, error }`。其中 `ready` 表示地图已就绪；`locate` 返回 Promise，业务事件处理函数应捕获失败。示例已展示自定义按钮、请求状态、坐标、精度和错误信息。

## 定位失败

常见错误 code 为 `permission-denied`、`position-unavailable`、`timeout`、`unsupported` 和 `insecure-context`。地图失败对应 `map-unavailable`，无效浏览器结果对应 `invalid-position`，覆盖物绘制或自动回中失败对应 `render-error`。

浏览器定位需要安全上下文（通常为 HTTPS 或 localhost）和用户授权；嵌入 iframe 时还受 Permissions Policy 和 iframe 的定位权限设置影响。用户未处理权限提示时，请求可能继续等待，`timeout` 沿用浏览器 API 的语义。组件不会用城市或 IP 定位替代失败的精确定位。

## SDK 类型

同时提供 `T.Geolocation`、`T.GeolocationResult` 类型供使用原生天地图 API 的项目使用。SDK 的 `getStatus()` 和浏览器的错误 code 含义不同；组件自身的 `GeolocationResult` 也与 SDK 结果区分。

已核对的 SDK 接口见[天地图 Geolocation 类参考](http://lbs.tianditu.gov.cn/api/js4.0/pages-class/service/Geolocation.html)、[GeolocationResult 类参考](http://lbs.tianditu.gov.cn/api/js4.0/pages-class/service/GeolocationResult.html)和[官方 H5 定位示例](http://lbs.tianditu.gov.cn/api/js4.0/APIExample/mapGeolocation.html)。

## API 表

<ApiTable component="TdtGeolocation" />
