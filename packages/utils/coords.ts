/**
 * 常用坐标系转换。
 *
 * 合规提示：GCJ-02 偏移仅用于修正公开地图展示。涉及测绘、导航电子地图制作、
 * 地理信息生产等业务时，应遵守《测绘法》及天地图/主管部门的授权与审核要求。
 * CGCS2000 与 WGS84 在本工具中按同一基准处理：两者差异通常在厘米级，不执行
 * 七参数/四参数基准转换；需要高精度大地测量时应使用专业测绘软件。
 */
export type CoordinateSystem = "WGS84" | "GCJ02" | "CGCS2000";

export type LngLatTuple = [number, number];

const SEMI_MAJOR_AXIS = 6378245;
const ECCENTRICITY_SQUARED = 0.006693421622965943;

export function isValidLngLat(lnglat: readonly number[]): lnglat is LngLatTuple {
  return (
    lnglat.length === 2 &&
    Number.isFinite(lnglat[0]) &&
    Number.isFinite(lnglat[1]) &&
    Math.abs(lnglat[0]) <= 180 &&
    Math.abs(lnglat[1]) <= 90
  );
}

function assertLngLat(lnglat: readonly number[]): asserts lnglat is LngLatTuple {
  if (!isValidLngLat(lnglat)) {
    throw new RangeError("坐标必须是 [经度, 纬度]，且经度在 ±180、纬度在 ±90 范围内。");
  }
}

/** GCJ-02 偏移只在中国范围内定义；境外坐标原样返回。 */
function outOfChina(lng: number, lat: number): boolean {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function transformLat(x: number, y: number): number {
  let ret = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3;
  ret += ((20 * Math.sin(y * Math.PI) + 40 * Math.sin((y / 3) * Math.PI)) * 2) / 3;
  ret += ((160 * Math.sin((y / 12) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30)) * 2) / 3;
  return ret;
}

function transformLng(x: number, y: number): number {
  let ret = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3;
  ret += ((20 * Math.sin(x * Math.PI) + 40 * Math.sin((x / 3) * Math.PI)) * 2) / 3;
  ret += ((150 * Math.sin((x / 12) * Math.PI) + 300 * Math.sin((x / 30) * Math.PI)) * 2) / 3;
  return ret;
}

function offset(lng: number, lat: number): LngLatTuple {
  let dLat = transformLat(lng - 105, lat - 35);
  let dLng = transformLng(lng - 105, lat - 35);
  const radLat = (lat / 180) * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - ECCENTRICITY_SQUARED * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180) / (((SEMI_MAJOR_AXIS * (1 - ECCENTRICITY_SQUARED)) / (magic * sqrtMagic)) * Math.PI);
  dLng = (dLng * 180) / ((SEMI_MAJOR_AXIS / sqrtMagic) * Math.cos(radLat) * Math.PI);
  return [dLng, dLat];
}

/** WGS84（GPS 原始坐标）转 GCJ-02（国测局加密坐标）。 */
export function wgs84ToGcj02(lnglat: readonly [number, number]): LngLatTuple {
  assertLngLat(lnglat);
  const [lng, lat] = lnglat;
  if (outOfChina(lng, lat)) return [lng, lat];
  const [dLng, dLat] = offset(lng, lat);
  return [lng + dLng, lat + dLat];
}

/**
 * GCJ-02 转 WGS84。使用迭代逼近，默认 6 次可将误差控制在厘米级；
 * 境外坐标原样返回。
 */
export function gcj02ToWgs84(lnglat: readonly [number, number], options: { iterations?: number } = {}): LngLatTuple {
  assertLngLat(lnglat);
  const [lng, lat] = lnglat;
  if (outOfChina(lng, lat)) return [lng, lat];
  const iterations = Math.max(1, Math.floor(options.iterations ?? 6));
  let result: LngLatTuple = [lng, lat];
  for (let index = 0; index < iterations; index++) {
    const converted = wgs84ToGcj02(result);
    result = [result[0] + (lng - converted[0]), result[1] + (lat - converted[1])];
  }
  return result;
}

/** CGCS2000 与 WGS84 在本工具中按同一基准处理。 */
export function cgcs2000ToWgs84(lnglat: readonly [number, number]): LngLatTuple {
  assertLngLat(lnglat);
  return [lnglat[0], lnglat[1]];
}

/** WGS84 与 CGCS2000 在本工具中按同一基准处理。 */
export function wgs84ToCgcs2000(lnglat: readonly [number, number]): LngLatTuple {
  assertLngLat(lnglat);
  return [lnglat[0], lnglat[1]];
}

/** 在 WGS84、GCJ-02、CGCS2000 之间转换。 */
export function convertCoordinateSystem(
  lnglat: readonly [number, number],
  from: CoordinateSystem,
  to: CoordinateSystem
): LngLatTuple {
  assertLngLat(lnglat);
  if (from === to) return [lnglat[0], lnglat[1]];
  if (from === "WGS84" && to === "GCJ02") return wgs84ToGcj02(lnglat);
  if (from === "GCJ02" && to === "WGS84") return gcj02ToWgs84(lnglat);
  if (from === "CGCS2000" && to === "GCJ02") return wgs84ToGcj02(cgcs2000ToWgs84(lnglat));
  if (from === "GCJ02" && to === "CGCS2000") return wgs84ToCgcs2000(gcj02ToWgs84(lnglat));
  if (from === "WGS84" && to === "CGCS2000") return wgs84ToCgcs2000(lnglat);
  return cgcs2000ToWgs84(lnglat);
}
