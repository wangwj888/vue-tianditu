import { default as install } from "./install";

export default install;

export * from "./components";
// Runtime helpers are public exports, but are not part of the component registry.
export { GeolocationError } from "./service/geolocation";

export * from "./utils/converter"; //辅助工具函数

export { useApiLoader } from "./use"; //api加载函数

export type { LoadConfig, PluginName } from "./use";
