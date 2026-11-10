import { computed, inject, provide, shallowRef, type ComputedRef } from "vue";

export type LocaleName = "zh-CN" | "en-US";

export interface LocaleMessages {
  common: {
    /** 搜索按钮的无障碍标签 */
    search: string;
    /** 路线规划按钮的无障碍标签 */
    route: string;
    /** 从路线规划返回搜索的按钮标签 */
    back: string;
    /** 清除按钮的无障碍标签 */
    clear: string;
  };
  search: {
    placeholder: string;
    loading: string;
    empty: string;
    /** 信息窗口中的地址前缀 */
    address: string;
    timeoutError: string;
    invalidResult: string;
  };
  route: {
    startPlaceholder: string;
    endPlaceholder: string;
    planning: string;
    types: Readonly<Record<"driving" | "transit" | "walking", string>>;
    drivingPolicies: readonly [string, string, string];
    transitPolicies: Readonly<Record<1 | 2 | 4 | 8, string>>;
    planTitle: string;
    drivingSummary: string;
    transitSummary: string;
    step: string;
    walk: string;
    ride: string;
    stations: string;
    transfer: string;
    destination: string;
    separator: string;
    timeoutError: string;
    noTransitPlans: string;
    noPlans: string;
    transitFailed: string;
  };
}

export type LocaleOverrides = {
  [K in keyof LocaleMessages]?: Partial<LocaleMessages[K]>;
};

export type LocaleInput = LocaleName | LocaleOverrides;

export const zhCN: LocaleMessages = {
  common: {
    search: "搜索",
    route: "路线规划",
    back: "返回搜索",
    clear: "清除"
  },
  search: {
    placeholder: "输入关键字搜索",
    loading: "搜索中…",
    empty: "未找到匹配结果",
    address: "地址：",
    timeoutError: "搜索请求超时，请检查网络和天地图服务权限。",
    invalidResult: "搜索服务没有返回结果。"
  },
  route: {
    startPlaceholder: "请输入起点",
    endPlaceholder: "请输入终点",
    planning: "路线规划中…",
    types: { driving: "驾车", transit: "公交", walking: "步行" },
    drivingPolicies: ["最少时间", "最短距离", "避开高速"],
    transitPolicies: { 1: "最少时间", 2: "最少换乘", 4: "最少步行", 8: "不乘地铁" },
    planTitle: "方案{index}",
    drivingSummary: "{title}: {duration} 秒 | {distance} 公里",
    transitSummary: "{title}: {lineName}",
    step: "{index}.{guide}",
    walk: "步行约{distance}米，到达{station}",
    ride: "乘坐{direction}{stations}，到达{station}",
    stations: "，经过{count}站",
    transfer: "站内换乘",
    destination: "终点",
    separator: "，",
    timeoutError: "路线规划请求超时，请检查网络和天地图服务权限。",
    noTransitPlans: "未找到可用公交方案。",
    noPlans: "未找到可用路线。",
    transitFailed: "公交规划失败，状态码：{code}"
  }
};

export const enUS: LocaleMessages = {
  common: {
    search: "Search",
    route: "Route planning",
    back: "Back to search",
    clear: "Clear"
  },
  search: {
    placeholder: "Search places",
    loading: "Searching…",
    empty: "No matching results",
    address: "Address: ",
    timeoutError: "The search request timed out. Check the network and Tianditu service permissions.",
    invalidResult: "The search service returned no result."
  },
  route: {
    startPlaceholder: "Enter a start point",
    endPlaceholder: "Enter an end point",
    planning: "Planning route…",
    types: { driving: "Driving", transit: "Transit", walking: "Walking" },
    drivingPolicies: ["Fastest", "Shortest", "Avoid highways"],
    transitPolicies: { 1: "Fastest", 2: "Fewest transfers", 4: "Least walking", 8: "No subway" },
    planTitle: "Route {index}",
    drivingSummary: "{title}: {duration} s | {distance} km",
    transitSummary: "{title}: {lineName}",
    step: "{index}. {guide}",
    walk: "Walk about {distance} m to {station}",
    ride: "Take {direction}{stations} to {station}",
    stations: ", {count} stops",
    transfer: "Transfer within the station",
    destination: "Destination",
    separator: "; ",
    timeoutError: "The route request timed out. Check the network and Tianditu service permissions.",
    noTransitPlans: "No transit route is available.",
    noPlans: "No route is available.",
    transitFailed: "Transit planning failed with status code {code}."
  }
};

const dictionaries: Record<LocaleName, LocaleMessages> = { "zh-CN": zhCN, "en-US": enUS };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function clone<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clone) as T;
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)])) as T;
  }
  return value;
}

function merge<T>(base: T, overrides: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(overrides)) return clone(base);
  const result: Record<string, unknown> = clone(base);
  Object.entries(overrides).forEach(([key, value]) => {
    if (value === undefined) return;
    const current = result[key];
    result[key] = isPlainObject(current) && isPlainObject(value) ? merge(current, value) : clone(value);
  });
  return result as T;
}

const configuredLocale = shallowRef<LocaleName | LocaleOverrides>(dictionaries["zh-CN"]);

/** Configure the library-wide default locale. Call again to switch languages at runtime. */
export function configureLocale(locale: LocaleInput = "zh-CN"): void {
  if (typeof locale === "string" && !dictionaries[locale]) {
    throw new Error(`Unknown vue-map-tianditu locale: ${locale}`);
  }
  configuredLocale.value = typeof locale === "string" ? dictionaries[locale] : locale;
}

export function getLocaleMessages(locale?: LocaleInput): LocaleMessages {
  const source = locale ?? configuredLocale.value;
  const base = typeof source === "string" ? dictionaries[source] : dictionaries["zh-CN"];
  return typeof source === "string" ? clone(base) : merge(base, source);
}

export function formatMessage(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match
  );
}

export const LOCALE_KEY = "vue-map-tianditu-locale";

/** Resolve a locale prop and expose it to descendant service components. */
export function provideLocale(source: () => LocaleInput | undefined): ComputedRef<LocaleMessages> {
  const parent = inject<ComputedRef<LocaleMessages> | undefined>(LOCALE_KEY, undefined);
  const messages = computed(() => {
    const input = source();
    if (input === undefined) return parent?.value ?? getLocaleMessages();
    if (parent && typeof input !== "string") return merge(parent.value, input);
    return getLocaleMessages(input);
  });
  provide(LOCALE_KEY, messages);
  return messages;
}

/** Inherit the parent service locale, or fall back to the configured default. */
export function useLocale(override?: () => LocaleInput | undefined): ComputedRef<LocaleMessages> {
  const parent = inject<ComputedRef<LocaleMessages> | undefined>(LOCALE_KEY, undefined);
  if (parent && !override) return parent;
  if (parent && override) return computed(() => merge(parent.value, override()));
  return computed(() => getLocaleMessages(override?.()));
}
