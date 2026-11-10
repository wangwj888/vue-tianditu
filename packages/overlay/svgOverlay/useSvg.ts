import { computed, markRaw, shallowRef, type ComputedRef, type ShallowRef } from "vue";
import { useMapTask } from "../../use";

export interface SvgOverlayContext {
  /** 原生 T.SVG 图层 */
  svg: T.SVG;
  /** 用于绘制图形的 <g> 元素 */
  root: SVGGElement;
  map: T.Map;
  zoom: number;
  /** 当前缩放级别下每个屏幕像素对应的米数 */
  unitsPerMeter: number;
  /** 经纬度转图层像素坐标 */
  lngLatToPoint(lnglat: readonly [number, number]): T.Point;
}

export interface SvgOverlayHandle extends SvgOverlayContext {
  /** 请求重新绘制，并触发 onRedraw / redraw 事件 */
  redraw(): void;
}

export interface UseSvgOptions {
  /** SVG 容器相对地图视图扩展的比例，默认 0.1 */
  padding?: number;
  /** 初始化及每次缩放、容器尺寸变化后调用 */
  onRedraw?: (context: SvgOverlayContext) => void;
}

export interface UseSvgResult {
  ready: Readonly<ShallowRef<boolean>>;
  svg: Readonly<ShallowRef<T.SVG | undefined>>;
  map: Readonly<ShallowRef<T.Map | undefined>>;
  root: ComputedRef<SVGGElement | undefined>;
  /** 使用当前状态构造上下文并请求重绘 */
  redraw(): void;
  getContext(): SvgOverlayHandle | undefined;
}

function createContext(svg: T.SVG, map: T.Map, redraw: () => void): SvgOverlayHandle {
  return {
    svg,
    root: svg._rootGroup,
    map,
    get zoom() {
      return map.getZoom();
    },
    get unitsPerMeter() {
      return (256 * Math.pow(2, map.getZoom())) / 40075017;
    },
    lngLatToPoint(lnglat) {
      return map.lngLatToLayerPoint(new T.LngLat(lnglat[0], lnglat[1]));
    },
    redraw
  };
}

/**
 * 在 TdtMap 内创建 T.SVG 图层。适合配合 D3、原生 SVG 或批量图形渲染。
 * 监听 zoomend / resize 后调用 onRedraw；地图平移由 SDK 自动移动 SVG 容器。
 */
export function useSvg(options: UseSvgOptions = {}): UseSvgResult {
  const ready = shallowRef(false);
  const svg = shallowRef<T.SVG>();
  const mapRef = shallowRef<T.Map>();
  const root = computed(() => svg.value?._rootGroup);
  let redrawHandler: (() => void) | undefined;

  function redraw() {
    redrawHandler?.();
  }

  function getContext() {
    if (!svg.value || !mapRef.value) return;
    return createContext(svg.value, mapRef.value, redraw);
  }

  useMapTask((map, onCleanup) => {
    const instance = new T.SVG({ padding: options.padding ?? 0.1 });
    map.addLayer(instance as unknown as T.TileLayer);
    mapRef.value = markRaw(map);
    svg.value = markRaw(instance);
    ready.value = true;

    const update = () => {
      const context = getContext();
      if (context) options.onRedraw?.(context);
    };
    const zoomHandler = () => update();
    const resizeHandler = () => update();
    redrawHandler = update;
    map.addEventListener("zoomend", zoomHandler);
    map.addEventListener("resize", resizeHandler);
    update();

    onCleanup(() => {
      map.removeEventListener("zoomend", zoomHandler);
      map.removeEventListener("resize", resizeHandler);
      redrawHandler = undefined;
      ready.value = false;
      svg.value = undefined;
      mapRef.value = undefined;
      map.removeLayer(instance as unknown as T.TileLayer);
    });
  });

  return { ready, svg, map: mapRef, root, redraw, getContext };
}
