export interface HeatmapPoint {
  lng: number;
  lat: number;
  count: number;
}

export interface HeatmapOptions {
  data: readonly HeatmapPoint[];
  max?: number;
  radius: number;
  gradient?: Record<number, string>;
  blur: number;
  minOpacity: number;
  maxOpacity: number;
  visible: boolean;
}

export interface HeatmapCore {
  create(config: Record<string, unknown>): {
    setData(data: { min: number; max: number; data: ProjectedHeatmapPoint[] }): void;
  };
}

export interface ProjectedHeatmapPoint {
  x: number;
  y: number;
  value: number;
  radius: number;
}

export function normalizeHeatmapData(data: readonly HeatmapPoint[]): HeatmapPoint[] {
  return data
    .filter(
      point =>
        point &&
        Number.isFinite(point.lng) &&
        Number.isFinite(point.lat) &&
        Math.abs(point.lng) <= 180 &&
        Math.abs(point.lat) <= 90 &&
        Number.isFinite(point.count) &&
        point.count > 0
    )
    .map(({ lng, lat, count }) => ({ lng, lat, count }));
}

export function projectHeatmapData(
  map: T.Map,
  data: HeatmapPoint[],
  width: number,
  height: number,
  radius: number
): ProjectedHeatmapPoint[] {
  return data.flatMap(point => {
    const pixel = map.lngLatToContainerPoint(new T.LngLat(point.lng, point.lat));
    const x = Math.round(pixel.x);
    const y = Math.round(pixel.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
    if (x <= -radius || x >= width + radius || y <= -radius || y >= height + radius) return [];
    return [{ x, y, value: point.count, radius }];
  });
}

/** All renderer interaction uses public heatmap.js APIs. */
export function createHeatmapRenderer(element: HTMLElement, core: HeatmapCore, getOptions: () => HeatmapOptions) {
  let instance: ReturnType<HeatmapCore["create"]> | undefined;
  let previousKey = "";

  function clear() {
    instance = undefined;
    previousKey = "";
    element.replaceChildren();
  }

  return {
    clear,
    render(map: T.Map) {
      const options = getOptions();
      const { x: width, y: height } = map.getSize();
      element.style.display = options.visible ? "" : "none";
      if (!options.visible) return;
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        clear();
        return;
      }
      const radius = Math.max(1, Number.isFinite(options.radius) ? options.radius : 40);
      const clamp = (value: number, fallback: number) =>
        Math.max(0, Math.min(1, Number.isFinite(value) ? value : fallback));
      const minOpacity = clamp(options.minOpacity, 0);
      const maxOpacity = Math.max(minOpacity, clamp(options.maxOpacity, 1));
      // The upstream core treats zero as its default maximum; preserve a real zero.
      element.style.opacity = maxOpacity === 0 ? "0" : "";
      const config = {
        radius,
        gradient: options.gradient && { ...options.gradient },
        blur: clamp(options.blur, 0.85),
        minOpacity,
        maxOpacity
      };
      const key = JSON.stringify([width, height, config]);
      if (!instance || key !== previousKey) {
        clear();
        element.style.width = `${width}px`;
        element.style.height = `${height}px`;
        const canvasHost = document.createElement("div");
        canvasHost.style.width = `${width}px`;
        canvasHost.style.height = `${height}px`;
        element.appendChild(canvasHost);
        // Re-create on resize/config changes rather than accessing private renderers.
        instance = core.create({ ...config, container: canvasHost });
        previousKey = key;
      }
      const origin = map.lngLatToLayerPoint(map.containerPointToLngLat(new T.Point(0, 0)));
      element.style.transform = `translate(${origin.x}px, ${origin.y}px)`;
      const data = normalizeHeatmapData(options.data);
      const autoMax = data.reduce((max, point) => Math.max(max, point.count), 1);
      const max = options.max && Number.isFinite(options.max) && options.max > 0 ? options.max : autoMax;
      instance.setData({ min: 0, max, data: projectHeatmapData(map, data, width, height, radius) });
    }
  };
}
