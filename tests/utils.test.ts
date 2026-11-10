import { afterEach, describe, expect, it } from "vitest";
import {
  cgcs2000ToWgs84,
  convertCoordinateSystem,
  gcj02ToWgs84,
  isValidLngLat,
  wgs84ToCgcs2000,
  wgs84ToGcj02
} from "../packages/utils/coords";
import { configureLocale, enUS, formatMessage, getLocaleMessages, zhCN } from "../packages/locale";

afterEach(() => {
  configureLocale("zh-CN");
});

describe("coordinate conversion", () => {
  it("keeps coordinates outside China unchanged", () => {
    expect(wgs84ToGcj02([-74.006, 40.7128])).toEqual([-74.006, 40.7128]);
    expect(gcj02ToWgs84([139.6917, 35.6895])).toEqual([139.6917, 35.6895]);
  });

  it("applies the GCJ-02 offset inside China and round-trips accurately", () => {
    const wgs84: [number, number] = [116.3975, 39.9087];
    const gcj02 = wgs84ToGcj02(wgs84);
    expect(gcj02[0]).toBeGreaterThan(wgs84[0]);
    expect(gcj02[1]).toBeGreaterThan(wgs84[1]);
    expect(gcj02[0]).toBeCloseTo(116.4033, 3);
    expect(gcj02[1]).toBeCloseTo(39.9101, 3);

    const back = gcj02ToWgs84(gcj02);
    expect(back[0]).toBeCloseTo(wgs84[0], 6);
    expect(back[1]).toBeCloseTo(wgs84[1], 6);
  });

  it("treats CGCS2000 and WGS84 as the same datum", () => {
    expect(wgs84ToCgcs2000([113.28, 23.12])).toEqual([113.28, 23.12]);
    expect(cgcs2000ToWgs84([113.28, 23.12])).toEqual([113.28, 23.12]);
  });

  it("converts between all supported systems", () => {
    const source: [number, number] = [116.3975, 39.9087];
    expect(convertCoordinateSystem(source, "WGS84", "GCJ02")).toEqual(wgs84ToGcj02(source));
    expect(convertCoordinateSystem(wgs84ToGcj02(source), "GCJ02", "WGS84")[0]).toBeCloseTo(source[0], 6);
    expect(convertCoordinateSystem(source, "WGS84", "CGCS2000")).toEqual(source);
    expect(convertCoordinateSystem(source, "GCJ02", "CGCS2000")).toEqual(gcj02ToWgs84(source));
  });

  it("validates coordinates", () => {
    expect(isValidLngLat([116, 39])).toBe(true);
    expect(isValidLngLat([181, 39])).toBe(false);
    expect(isValidLngLat([116])).toBe(false);
    expect(isValidLngLat([Number.NaN, 39])).toBe(false);
    expect(() => wgs84ToGcj02([200, 100])).toThrow(RangeError);
  });
});

describe("locale", () => {
  it("formats placeholders", () => {
    expect(formatMessage("hi {name}, {missing}", { name: "map" })).toBe("hi map, {missing}");
  });

  it("resolves named and partial locales", () => {
    expect(getLocaleMessages("en-US").search.placeholder).toBe(enUS.search.placeholder);
    expect(getLocaleMessages().search.placeholder).toBe(zhCN.search.placeholder);
    const custom = getLocaleMessages({ search: { placeholder: "查找地点" } });
    expect(custom.search.placeholder).toBe("查找地点");
    expect(custom.search.loading).toBe(zhCN.search.loading);
  });

  it("switches the global locale", () => {
    configureLocale("en-US");
    expect(getLocaleMessages().route.planning).toBe(enUS.route.planning);
    configureLocale({ route: { planning: "规划中" } });
    expect(getLocaleMessages().route.planning).toBe("规划中");
    expect(getLocaleMessages().search.placeholder).toBe(zhCN.search.placeholder);
  });

  it("rejects unknown locale names", () => {
    expect(() => configureLocale("fr-FR" as never)).toThrow(/Unknown/);
  });
});
