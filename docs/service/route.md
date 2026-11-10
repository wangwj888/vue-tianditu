# 路线规划

`TdtRoute` 提供驾车、公交、步行搜索和方案展示。放在 `TdtMap` 内，通过 `TdtControl` 定位；导入 `vue-map-tianditu/lib/style.css`。

<ClientOnly><demo-route /></ClientOnly>

<code-details>

<<< @/.vitepress/components/demo-route/index.vue

</code-details>

## 属性

给出有效的 `start` / `end` 后，地图就绪时自动规划。修改起终点、出行方式或当前策略会重新规划；也可以通过输入框选择 POI。坐标顺序是经度、纬度。

| 属性                      | 类型              | 默认值    | 说明                                            |
| ------------------------- | ----------------- | --------- | ----------------------------------------------- |
| start / end               | readonly number[] | `[]`      | 初始/动态起终点；空数组清空该端点               |
| startKeyword / endKeyword | string            | `""`      | 初始/动态输入文字；单独输入文字不会当作坐标规划 |
| routeType                 | 0 / 1 / 2         | 0         | 0 驾车、1 公交、2 步行                          |
| routeTypes                | RouteType[]       | `[0,1,2]` | 可见且可选的出行方式；空值或非法值回退为全部    |
| drivingPolicy             | 0 / 1 / 2         | 0         | 最少时间、最短距离、避开高速                    |
| transitPolicy             | 1 / 2 / 4 / 8     | 1         | 最少时间、最少换乘、最少步行、不乘地铁          |
| autoViewport              | boolean           | true      | 选择方案后自动调整地图视野                      |
| queryTimeout              | number            | 15000     | 路线请求超时，单位毫秒                          |

步行使用天地图官方 `TMAP_DRIVING_POLICY_WALK=3`。策略详情见[DrivingRouteOptions](http://lbs.tianditu.gov.cn/api/js4.0/pages-class/service/DrivingRouteOptions.html)。

`start`、`end`、`routeType`、`drivingPolicy`、`transitPolicy` 都提供对应的 `update:*` 事件。Vue 3 可用 `v-model:start`、`v-model:routeType` 等，Vue 2.7 使用 `.sync`。不接收更新事件时，组件仍允许在面板内选择端点和策略；外部下一次修改 prop 会同步到组件。

## 事件

| 事件                                        | 参数                 | 说明                         |
| ------------------------------------------- | -------------------- | ---------------------------- |
| route-complete                              | RouteCompleteEvent   | 当前路线请求成功             |
| route-error                                 | RouteErrorEvent      | 无可用方案、SDK 异常或超时   |
| plan-change                                 | RoutePlanChangeEvent | 首次选中方案，或用户切换方案 |
| update:start / update:end                   | number[]             | 在面板选点或清空端点         |
| update:routeType                            | RouteType            | 面板切换出行方式             |
| update:drivingPolicy / update:transitPolicy | 对应策略值           | 面板切换策略                 |

导出的事件类型：

```ts
interface RouteCompleteEvent {
  routeType: 0 | 1 | 2;
  start: number[];
  end: number[];
  result: T.DrivingRouteResult | T.TransitRouteResult;
}
interface RouteErrorEvent {
  routeType: 0 | 1 | 2;
  start: number[];
  end: number[];
  error: Error;
  code?: number; // SDK 提供的公交状态码
}
interface RoutePlanChangeEvent {
  routeType: 0 | 1 | 2;
  index: number; // 从 0 开始
  plan: DrivingPlan | TransitPlan;
}
```

`result` 是原生 SDK 结果；`plan` 是面板当前使用的方案，兼容 SDK 返回的字段结构和 getter 接口。失败请求的迟到回调、切换出行方式前的旧结果和卸载后的结果都会被忽略。公交状态码非 0 按失败处理。

## 实例方法

通过组件 ref 调用 `search()`，用当前端点和策略重新规划；可用导出的 `RouteExposed` 标注 ref 类型。缺少有效端点时不会发出路线请求。

## API 表

<ApiTable component="TdtRoute" />
