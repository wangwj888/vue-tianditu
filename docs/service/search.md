# 搜索

`TdtSearch` 提供关键字搜索、建议词、分页和地图结果。放在 `TdtMap` 内，通过 `TdtControl` 定位；导入 `vue-map-tianditu/lib/style.css`。

<ClientOnly><demo-search /></ClientOnly>

<code-details>

<<< @/.vitepress/components/demo-search/index.vue

</code-details>

## 受控输入与动态配置

Vue 3 使用 `v-model:keyword` / `v-model:page`；Vue 2.7 使用 `:keyword.sync` / `:page.sync`。不绑定 `keyword` 时，组件管理输入状态，`defaultKeyword` 只决定初始值。初始关键字非空时，地图就绪后自动搜索；之后修改 `keyword` 会重新搜索。

`page` 从 1 开始，输入新关键字、修改行政区或分页大小会回到第一页。输入建议有 100 ms 防抖；按回车或点击搜索会立即执行普通搜索。快速切换条件时，旧请求、超时后的回调和卸载后的回调不会覆盖当前结果。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| keyword | string | 未设置 | 当前关键字，支持双向绑定 |
| defaultKeyword | string | `""` | 非受控模式的初始关键字 |
| page | number | 未设置 | 当前页，支持双向绑定；页码大于结果页数时回退到最后一页 |
| pageCapacity | number | 10 | 每页条数，取 1–100 的整数 |
| adminCode | number | 0 | 行政区国标码，传给 SDK 的 `setSpecifyAdminCode`；0 使用 SDK 默认范围 |
| queryTimeout | number | 15000 | 请求超时，单位毫秒 |
| placeholder | string | 输入关键字搜索 | 输入提示 |
| searchBtn | boolean | true | 显示搜索按钮 |
| routeBtn | boolean / SearchRouteButtons | true | 显示路线入口及允许的出行方式 |

`routeBtn=false` 隐藏路线入口；`true` 开启全部方式。对象配置中，省略的项默认开启：

```vue
<tdt-search :route-btn="{ driving: true, transit: false, walking: true }" />
```

## 事件

| 事件            | 参数                 | 说明                         |
| --------------- | -------------------- | ---------------------------- |
| update:keyword  | string               | 输入或选择建议时的关键字     |
| update:page     | number               | 当前页变化                   |
| poi-click       | T.LocalSearchPoi     | 点击结果或地图标记           |
| suggest-click   | T.LocalSearchSuggest | 点击建议                     |
| search-complete | T.LocalSearchResult  | 当前请求完成，包括建议词搜索 |
| search-error    | Error                | SDK 异常、无效响应或请求超时 |

无匹配项是正常的空结果，不触发 `search-error`。SDK 没有通用网络失败回调时，通过 `queryTimeout` 结束加载状态。

## 插槽

| 插槽        | 作用域参数               | 说明                                          |
| ----------- | ------------------------ | --------------------------------------------- |
| result-item | `{ poi, index, select }` | 自定义每个 POI 的内容；默认外层仍支持点击选择 |
| empty       | `{ keyword }`            | 已查询且没有 POI/建议时显示                   |
| loading     | `{ keyword }`            | 请求期间显示                                  |

插槽使用正常的 Vue 文本渲染；如果在 `result-item` 里主动调用 `select()`，请用 `@click.stop` 避免外层点击再次触发选择。

## 实例方法

通过组件 ref 调用；Vue 2.7 和 Vue 3 一致。导出的 `SearchExposed` 可用于 ref 类型。

| 方法             | 说明                                            |
| ---------------- | ----------------------------------------------- |
| search(keyword?) | 立即普通搜索；省略参数使用当前输入              |
| clear()          | 清空关键字、结果与当前请求                      |
| getSearch()      | 最近使用的 `T.LocalSearch`，地图未就绪时为 null |

SDK 范围、分页接口见[天地图 LocalSearch 类参考](http://lbs.tianditu.gov.cn/api/js4.0/pages-class/service/LocalSearch.html)。
