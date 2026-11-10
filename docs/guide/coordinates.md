# 坐标系转换

组件库提供 WGS84、GCJ-02、CGCS2000 之间的轻量转换函数，适用于展示、纠偏和与第三方地图对齐。函数不依赖天地图 SDK，可以在任何 JavaScript 环境调用。

## 示例

<ClientOnly>
<demo-coords></demo-coords>
</ClientOnly>

<code-details>

<<< @/.vitepress/components/demo-coords/index.vue

</code-details>

## API

```ts
import {
  wgs84ToGcj02,
  gcj02ToWgs84,
  wgs84ToCgcs2000,
  cgcs2000ToWgs84,
  convertCoordinateSystem,
  isValidLngLat
} from "vue-map-tianditu";

const [lng, lat] = wgs84ToGcj02([116.3975, 39.9087]);
```

| 函数                                        | 说明                                       |
| ------------------------------------------- | ------------------------------------------ |
| `wgs84ToGcj02(lnglat)`                      | WGS84 转 GCJ-02；境外坐标原样返回          |
| `gcj02ToWgs84(lnglat, { iterations? })`     | GCJ-02 转 WGS84，迭代默认 6 次，误差厘米级 |
| `wgs84ToCgcs2000(lnglat)`                   | 按同一基准返回坐标，不做七参数转换         |
| `cgcs2000ToWgs84(lnglat)`                   | 按同一基准返回坐标，不做七参数转换         |
| `convertCoordinateSystem(lnglat, from, to)` | 在三种坐标系之间转换                       |
| `isValidLngLat(lnglat)`                     | 校验是否为有限的 `[经度, 纬度]`            |

所有函数接收 `[经度, 纬度]` 数组并返回新的 `[经度, 纬度]` 数组。非法坐标抛出 `RangeError`；`isValidLngLat` 返回 `false`。

## 选择哪种坐标系

| 场景                           | 建议                                   |
| ------------------------------ | -------------------------------------- |
| GPS 原始坐标直接叠加到天地图   | 使用 WGS84 / CGCS2000，不要再转 GCJ-02 |
| 与高德、腾讯等 GCJ-02 地图对齐 | WGS84 → GCJ-02                         |
| 从 GCJ-02 地图取点后放到天地图 | GCJ-02 → WGS84，再作为 CGCS2000 使用   |
| 高精度测绘、界址点、控制点     | 使用专业测绘软件和正式基准转换参数     |

天地图使用 CGCS2000 基准。GCJ-02 是国内互联网地图常用的加密坐标，二者不是同一种偏移。把 WGS84 先转成 GCJ-02 再放到天地图上会产生系统性偏移。

## 精度与边界

- `gcj02ToWgs84` 使用迭代逼近，默认 6 次通常可达到厘米级；可通过 `iterations` 调整。
- GCJ-02 偏移只在中国范围内定义；境外坐标原样返回。
- CGCS2000 与 WGS84 的差异通常在厘米级，本工具按同一基准处理，**不执行**七参数/四参数基准转换。需要毫米级精度时应使用专业测绘成果。
- 函数不做投影转换（如 Web 墨卡托），只处理经纬度数值。

## 合规提示

坐标转换和地图展示应遵守《测绘法》《地图管理条例》以及天地图、主管部门的授权与审核要求。涉及测绘、导航电子地图制作、地理信息生产等业务时，请使用具备资质的工具和正式审批的数据，不要用本工具替代法定测绘流程。
