import { default as install } from "./install";
import "./styles/theme.scss";

export default install;

export * from "./components";
// Runtime helpers are public exports, but are not part of the component registry.
export { GeolocationError } from "./service/geolocation";

export * from "./utils/converter"; //辅助工具函数
export * from "./utils/coords"; //坐标系转换

export { useApiLoader } from "./use"; //api加载函数

export type { LoadConfig, PluginName } from "./use";
export type { InstallConfig } from "./install";

export { configureLocale, getLocaleMessages, formatMessage, zhCN, enUS } from "./locale";
export type { LocaleName, LocaleMessages, LocaleOverrides, LocaleInput } from "./locale";

export { useSvg } from "./overlay/svgOverlay/useSvg";
export type { UseSvgOptions, UseSvgResult } from "./overlay/svgOverlay/useSvg";
