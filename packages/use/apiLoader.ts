export const DEFAULT_CONFIG = { v: "4.0", tk: "", plugins: [] as PluginName[], timeout: 15000 };

const OPEN_LIBRARY = "https://lbs.tianditu.gov.cn/api/js4.0/opensource/openlibrary/";
const D3 = "https://cdn.jsdelivr.net/npm/d3@3.5.17/d3.min.js";

export const PLUGINS_URL = {
  D3: [D3, `${OPEN_LIBRARY}D3SvgOverlay.min.js`],
  CarTrack: [D3, `${OPEN_LIBRARY}D3SvgOverlay.min.js`, `${OPEN_LIBRARY}CarTrack.min.js`],
  HeatmapOverlay: [`${OPEN_LIBRARY}HeatmapOverlay.min.js`],
  BufferTool: ["https://cdn.jsdelivr.net/npm/turf@3.0.14/turf.min.js", `${OPEN_LIBRARY}BufferTool.min.js`],
  ImageOverLayer: [`${OPEN_LIBRARY}ImageOverlay.min.js`]
};

export type PluginName = keyof typeof PLUGINS_URL;

export interface LoadConfig {
  v?: string;
  tk?: string;
  plugins?: PluginName[];
  /** Full API script URL. When supplied, v/tk are not appended. */
  apiUrl?: string;
  /** Override an entire plugin dependency chain, in execution order. */
  pluginUrls?: Partial<Record<PluginName, string | string[]>>;
  /** Script timeout in milliseconds. */
  timeout?: number;
}

let defaultConfig: LoadConfig = {};
let apiPromise: Promise<void> | undefined;
const scripts = new Map<string, Promise<void>>();

/** Configure loading without accessing the DOM (also safe during SSR). */
export function configureApiLoader(config: LoadConfig = {}): void {
  defaultConfig = {
    ...defaultConfig,
    ...config,
    plugins: [...new Set([...(defaultConfig.plugins || []), ...(config.plugins || [])])],
    pluginUrls: { ...defaultConfig.pluginUrls, ...config.pluginUrls }
  };
}

/** Load the API once, then load requested plugins even when T already exists. */
export async function useApiLoader(config: LoadConfig = {}): Promise<void> {
  if (typeof document === "undefined") {
    throw new Error("The Tianditu API can only be loaded in a browser.");
  }
  const options = {
    ...DEFAULT_CONFIG,
    ...defaultConfig,
    ...config,
    plugins: [...new Set([...(defaultConfig.plugins || []), ...(config.plugins || [])])],
    pluginUrls: { ...defaultConfig.pluginUrls, ...config.pluginUrls }
  };
  const timeout = options.timeout > 0 ? options.timeout : DEFAULT_CONFIG.timeout;
  if (!globalThis.T?.Map) {
    if (!apiPromise) {
      const url = options.apiUrl || `https://api.tianditu.gov.cn/api?v=${encodeURIComponent(options.v)}&tk=${encodeURIComponent(options.tk)}`;
      apiPromise = loadScript(url, timeout).then(() => {
        if (!globalThis.T?.Map) {
          scripts.delete(url);
          throw new Error("The Tianditu script loaded without providing T.Map.");
        }
      }).catch(error => {
        apiPromise = undefined;
        throw error;
      });
    }
    await apiPromise;
  }
  // Each chain is sequential; shared scripts across chains still run only once.
  await Promise.all(options.plugins.map(async name => {
    const override = options.pluginUrls[name];
    const urls = override === undefined ? PLUGINS_URL[name] : typeof override === "string" ? [override] : override;
    if (!urls) throw new Error(`Unknown Tianditu plugin: ${name}`);
    for (const url of urls) await loadScript(url, timeout);
  }));
}

function loadScript(url: string, timeout: number): Promise<void> {
  const cached = scripts.get(url);
  if (cached) return cached;
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    const finish = (error?: Error) => {
      clearTimeout(timer);
      script.onload = script.onerror = null;
      if (error) {
        script.remove();
        reject(error);
      } else resolve();
    };
    script.src = url;
    script.type = "text/javascript";
    script.async = true;
    script.onload = () => finish();
    script.onerror = () => finish(new Error(`Failed to load Tianditu script: ${url}`));
    const timer = setTimeout(() => finish(new Error(`Timed out loading Tianditu script: ${url}`)), timeout);
    (document.head || document.body || document.documentElement).appendChild(script);
  }).catch(error => {
    scripts.delete(url);
    throw error;
  });
  scripts.set(url, promise);
  return promise;
}
