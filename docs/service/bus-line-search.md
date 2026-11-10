# 公交线路查询

`TdtBusLineSearch` 根据线路关键字查询候选列表，再查询某一方向的线路详情。列表通过 `T.LocalSearch` 的 V2 搜索获取，详情通过 `T.BusLineSearch.getBusLine()` 获取；起终点之间的公交换乘规划请使用 [TdtRoute](./route.md)。

组件放在 `TdtMap` 内，通过 `TdtControl` 定位，并导入 `vue-map-tianditu/lib/style.css`。

<ClientOnly><demo-bus-line-search /></ClientOnly>

<code-details>

<<< @/.vitepress/components/demo-bus-line-search/index.vue

</code-details>

## 属性

| 属性           | 类型    | 默认值                 | 说明                                           |
| -------------- | ------- | ---------------------- | ---------------------------------------------- |
| keyword        | string  | 未设置                 | 受控关键字，修改后查询；支持 `v-model:keyword` |
| defaultKeyword | string  | `""`                   | 非受控初始关键字，非空时地图就绪后查询         |
| placeholder    | string  | 输入公交线路，例如 850 | 输入提示                                       |
| autoSelect     | boolean | false                  | 列表返回后自动选择第一条线路                   |
| autoViewport   | boolean | true                   | 线路详情返回后调整地图视野                     |
| showLine       | boolean | true                   | 在地图显示线路折线                             |
| queryTimeout   | number  | 15000                  | 单次列表/详情请求超时，单位毫秒                |

Vue 2.7 双向绑定使用 `:keyword.sync`。普通输入更新关键字，按回车或“查询”按钮发出查询。线路名通常包含上下行方向，选择相应候选项获取详情。检索范围由地图决定；此组件不添加 SDK 未声明的城市参数。

纯数字输入会在实际查询时补上“路”，例如 `850` 按 `850路` 查询，输入框和绑定的关键字保持原值。其他名称原样查询。V2 普通搜索也可能返回地点或建议词，此时组件按空线路列表处理；可尝试包含城市或方向的完整线路名称。

## 事件

| 事件           | 参数                                                | 说明                                        |
| -------------- | --------------------------------------------------- | ------------------------------------------- |
| init           | T.BusLineSearch                                     | 创建本次查询关联的公交详情 SDK 实例         |
| update:keyword | string                                              | 关键字变化                                  |
| list-complete  | `(items: T.BusListItem[], result: T.BusListResult)` | 候选线路和兼容 BusListResult 接口的结果快照 |
| line-select    | T.BusListItem                                       | 选择待查询的线路                            |
| line-complete  | T.BusLine                                           | 详情返回，含线路名称、首末班时间、站数等    |
| error          | Error                                               | SDK 不可用、异常、无效响应或超时            |

空列表通过 `empty` 插槽展示，不作为错误。新查询会作废旧回调，超时或卸载后不再应用迟到的 SDK 结果。

`list-complete` 的第二个参数提供 `getNumBusList()` 和 `getBusListItem(index)`，用于读取本次候选列表；它是组件适配的结果快照，不是原生 `T.BusListResult` 实例。

## 插槽

| 插槽 | 作用域参数 | 说明 |
| --- | --- | --- |
| default | `{ keyword, items, line, loading, error, search, select, clear }` | 替换整个面板，地图折线仍由组件管理 |
| result-item | `{ item, index, select }` | 每条候选线路的内容 |
| line | `{ line }` | 详情内容 |
| loading / empty | 无 | 加载/空状态 |

`result-item` 的默认外层是可点击按钮；自定义内容无需再包一层按钮。业务交互较复杂时，可使用 `default` 插槽自行组织列表。

## 实例方法

组件 ref 类型为导出的 `BusLineSearchExposed`。

| 方法             | 说明                                                   |
| ---------------- | ------------------------------------------------------ |
| search(keyword?) | 查询候选线路，省略关键字时使用当前输入                 |
| select(item)     | 调用 SDK 的 `getBusLine(item)` 查询详情                |
| clear()          | 清空关键字、结果和组件绘制的折线，作废当前回调         |
| getSearch()      | 最近使用的 `T.BusLineSearch`，未发起请求时为 undefined |

## SDK 旧列表接口兼容

部分天地图 4.x SDK 的 `T.BusLineSearch.getBusList()` 仍请求旧 `/search` 地址，该地址可能返回 404，SDK 代理随后返回 `error: '500'`。组件使用已接入 `/v2/search` 的 `T.LocalSearch` 查询列表，并保留原生公交详情接口。

业务代码应通过组件的 `search()` 查询列表。直接调用 `getSearch().getBusList()` 会绕过上述兼容处理，仍受原生 SDK 接口状态影响。宿主自行加载 SDK 时，应使用已接入 V2 搜索的版本。

依照[天地图 BusLineSearch](http://lbs.tianditu.gov.cn/api/js4.0/pages-class/service/BusLineSearch.html)、[BusListResult](http://lbs.tianditu.gov.cn/api/js4.0/pages-class/service/BusListResult.html) 和 [BusLine](http://lbs.tianditu.gov.cn/api/js4.0/pages-class/service/BusLine.html) 官方参考封装。SDK 没有公布取消请求/销毁接口，因此组件在清空或卸载时清理自身折线、计时器，并忽略后续回调。

V2 搜索的线路结果格式见[天地图搜索 V2](http://lbs.tianditu.gov.cn/server/search2.html)。

## API 表

<ApiTable component="TdtBusLineSearch" />
