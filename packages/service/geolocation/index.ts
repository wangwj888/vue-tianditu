import { defineComponent, onBeforeUnmount, onMounted, ref, shallowRef, watch, type PropType } from "vue";
import { useMapRoot } from "../../use";
import { h, toIcon } from "../../utils";
import type { SharedComponent } from "../../types";

export type GeolocationErrorCode =
  | "permission-denied"
  | "position-unavailable"
  | "timeout"
  | "unsupported"
  | "insecure-context"
  | "map-unavailable"
  | "invalid-position"
  | "render-error"
  | "aborted";

export class GeolocationError extends Error {
  constructor(
    public readonly code: GeolocationErrorCode,
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = code === "aborted" ? "AbortError" : "GeolocationError";
  }
}

export interface GeolocationResult {
  readonly position: readonly [number, number];
  /** Browser-reported horizontal accuracy in meters, not a guaranteed boundary. */
  readonly accuracy: number;
  readonly timestamp: number;
  readonly nativePosition: GeolocationPosition;
}

export interface GeolocationHandle {
  locate(): Promise<GeolocationResult>;
  clear(): void;
  getPosition(): GeolocationResult | undefined;
  getMap(): T.Map | undefined;
  getMarker(): T.Marker | undefined;
  getAccuracyCircle(): T.Circle | undefined;
}

export interface GeolocationSlotProps {
  locate: GeolocationHandle["locate"];
  clear: GeolocationHandle["clear"];
  ready: boolean;
  loading: boolean;
  result: GeolocationResult | undefined;
  error: GeolocationError | undefined;
}

const PROPS = {
  autoLocate: { type: Boolean, default: false },
  autoCenter: { type: Boolean, default: true },
  zoom: { type: Number },
  enableHighAccuracy: { type: Boolean, default: true },
  timeout: { type: Number, default: 10000 },
  maximumAge: { type: Number, default: 0 },
  showMarker: { type: Boolean, default: true },
  showAccuracy: { type: Boolean, default: true },
  markerIcon: { type: [Object, String] as PropType<VT.IconOptions | string> },
  accuracyStyle: { type: Object as PropType<T.CircleOptions>, default: () => ({}) }
};
const EVENTS = {
  init: (_handle: GeolocationHandle) => true,
  locating: () => true,
  success: (_result: GeolocationResult) => true,
  error: (_error: GeolocationError) => true,
  clear: () => true
};

const DEFAULT_ACCURACY_STYLE: T.CircleOptions = {
  color: "#1677ff",
  weight: 1,
  opacity: 0.6,
  fillColor: "#1677ff",
  fillOpacity: 0.15
};

export const TdtGeolocation: SharedComponent<typeof PROPS, typeof EVENTS, GeolocationHandle> = defineComponent({
  name: "TdtGeolocation",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit, slots, expose }) {
    const ready = ref(false);
    const loading = ref(false);
    const result = shallowRef<GeolocationResult>();
    const error = shallowRef<GeolocationError>();
    const controller = new AbortController();
    let map: T.Map | undefined;
    let marker: T.Marker | undefined;
    let circle: T.Circle | undefined;
    let mounted = false;
    let disposed = false;
    let requestId = 0;
    let pending: Promise<GeolocationResult> | undefined;
    let rejectPending: ((reason: GeolocationError) => void) | undefined;
    // Register both outcomes immediately, including components unmounted before readiness.
    const readiness = useMapRoot({ signal: controller.signal }).then(
      value => ({ map: value }),
      reason => ({ error: new GeolocationError("map-unavailable", "地图尚未就绪或初始化失败。", reason) })
    );

    function report(reason: GeolocationError) {
      if (disposed || reason.code === "aborted") return;
      error.value = reason;
      emit("error", reason);
    }

    function removeOwnedOverlays() {
      const owned = [circle, marker];
      circle = undefined;
      marker = undefined;
      let failure: unknown;
      owned.forEach(overlay => {
        try {
          if (overlay && map) map.removeOverLay(overlay);
        } catch (reason) {
          failure ??= reason;
        }
      });
      if (failure) throw failure;
    }

    function draw(position: GeolocationResult) {
      if (!map || disposed) return false;
      const generation = requestId;
      const active = () => !disposed && requestId === generation;
      removeOwnedOverlays();
      if (!active()) return false;
      const lnglat = new T.LngLat(...position.position);
      if (props.showAccuracy && position.accuracy > 0) {
        circle = new T.Circle(lnglat, position.accuracy, { ...DEFAULT_ACCURACY_STYLE, ...props.accuracyStyle });
        map.addOverLay(circle);
      }
      if (!active()) {
        removeOwnedOverlays();
        return false;
      }
      if (props.showMarker) {
        marker = new T.Marker(lnglat, {
          title: "当前位置",
          ...(props.markerIcon ? { icon: toIcon(props.markerIcon) } : {})
        });
        map.addOverLay(marker);
      }
      if (!active()) {
        removeOwnedOverlays();
        return false;
      }
      return true;
    }

    function settle() {
      pending = undefined;
      rejectPending = undefined;
      loading.value = false;
    }

    function locate(): Promise<GeolocationResult> {
      if (disposed) return Promise.reject(new GeolocationError("aborted", "定位组件已卸载。"));
      if (pending) return pending;
      const id = ++requestId;
      loading.value = true;
      error.value = undefined;
      let resolveRequest!: (value: GeolocationResult) => void;
      let rejectRequest!: (reason: GeolocationError) => void;
      const operation = new Promise<GeolocationResult>((resolve, reject) => {
        resolveRequest = resolve;
        rejectRequest = reject;
      });
      pending = operation;
      rejectPending = rejectRequest;
      const current = () => !disposed && requestId === id && pending === operation;
      const fail = (reason: GeolocationError) => {
        if (!current()) return;
        settle();
        report(reason);
        rejectRequest(reason);
      };
      emit("locating");

      void readiness.then(state => {
        if (!current()) return;
        if ("error" in state) return fail(state.error);
        map = state.map;
        if (typeof window === "undefined" || typeof navigator === "undefined") {
          return fail(new GeolocationError("unsupported", "当前浏览器不支持定位。"));
        }
        if (window.isSecureContext === false) {
          return fail(new GeolocationError("insecure-context", "浏览器定位需要 HTTPS 或 localhost 安全上下文。"));
        }
        if (!navigator.geolocation) {
          return fail(new GeolocationError("unsupported", "当前浏览器不支持定位。"));
        }
        const duration = (value: number, fallback: number) => (Number.isFinite(value) && value >= 0 ? value : fallback);
        try {
          navigator.geolocation.getCurrentPosition(
            nativePosition => {
              if (!current()) return;
              const { longitude: lng, latitude: lat, accuracy } = nativePosition.coords;
              if (
                ![lng, lat, accuracy].every(Number.isFinite) ||
                Math.abs(lng) > 180 ||
                Math.abs(lat) > 90 ||
                accuracy < 0
              ) {
                return fail(new GeolocationError("invalid-position", "浏览器返回了无效的定位坐标或精度。"));
              }
              const next: GeolocationResult = Object.freeze({
                position: Object.freeze([lng, lat] as [number, number]),
                accuracy,
                timestamp: nativePosition.timestamp,
                nativePosition
              });
              try {
                if (!draw(next) || !current()) return;
                if (props.autoCenter && map) {
                  const point = new T.LngLat(lng, lat);
                  if (props.zoom !== undefined && Number.isFinite(props.zoom)) map.centerAndZoom(point, props.zoom);
                  else map.panTo(point);
                }
              } catch (reason) {
                try {
                  removeOwnedOverlays();
                } catch {
                  /* Attempt every owned overlay even after SDK failure. */
                }
                return fail(
                  new GeolocationError("render-error", "位置已获取，但定位覆盖物绘制或地图回中失败。", reason)
                );
              }
              if (!current()) return;
              result.value = next;
              settle();
              resolveRequest(next);
              emit("success", next);
            },
            nativeError => {
              if (nativeError.code === 1)
                fail(
                  new GeolocationError(
                    "permission-denied",
                    "定位权限被拒绝，请在浏览器或系统设置中允许访问位置。",
                    nativeError
                  )
                );
              else if (nativeError.code === 3)
                fail(new GeolocationError("timeout", "定位超时，请稍后重试。", nativeError));
              else fail(new GeolocationError("position-unavailable", "暂时无法获取当前位置。", nativeError));
            },
            {
              enableHighAccuracy: props.enableHighAccuracy,
              timeout: duration(props.timeout, 10000),
              maximumAge: duration(props.maximumAge, 0)
            }
          );
        } catch (reason) {
          fail(new GeolocationError("position-unavailable", "无法发起浏览器定位请求。", reason));
        }
      });
      return operation;
    }

    function cancel() {
      requestId++;
      rejectPending?.(new GeolocationError("aborted", "定位请求已取消，后续回调将被忽略。"));
      settle();
    }

    function clear() {
      cancel();
      result.value = undefined;
      error.value = undefined;
      try {
        removeOwnedOverlays();
      } catch (reason) {
        report(new GeolocationError("render-error", "无法移除定位覆盖物。", reason));
      }
      if (!disposed) emit("clear");
    }

    const handle: GeolocationHandle = {
      locate,
      clear,
      getPosition: () => result.value,
      getMap: () => map,
      getMarker: () => marker,
      getAccuracyCircle: () => circle
    };
    expose(handle);

    function requestLocate() {
      void locate().catch(() => undefined);
    }

    watch(
      () => props.autoLocate,
      value => {
        if (value && mounted && ready.value) requestLocate();
      }
    );
    watch(
      () => [props.showMarker, props.showAccuracy, props.markerIcon, props.accuracyStyle],
      () => {
        if (disposed || !result.value || !map) return;
        try {
          draw(result.value);
        } catch (reason) {
          try {
            removeOwnedOverlays();
          } catch {
            /* Preserve the original drawing failure. */
          }
          report(new GeolocationError("render-error", "无法更新定位覆盖物。", reason));
        }
      },
      { deep: true }
    );

    onMounted(async () => {
      mounted = true;
      const state = await readiness;
      if (disposed) return;
      if ("error" in state) {
        report(state.error);
        return;
      }
      map = state.map;
      ready.value = true;
      emit("init", handle);
      if (props.autoLocate) requestLocate();
    });

    onBeforeUnmount(() => {
      disposed = true;
      ready.value = false;
      controller.abort();
      clear();
      map = undefined;
    });

    return () =>
      h(
        "div",
        {
          class: "tdt-geolocation",
          style: { position: "absolute", top: "12px", right: "12px", zIndex: 1000 }
        },
        slots.default
          ? slots.default({
              locate,
              clear,
              ready: ready.value,
              loading: loading.value,
              result: result.value,
              error: error.value
            } satisfies GeolocationSlotProps)
          : [
              h(
                "button",
                {
                  attrs: { type: "button", disabled: loading.value || !ready.value, "aria-busy": loading.value },
                  on: { click: requestLocate },
                  style: {
                    padding: "6px 12px",
                    border: "1px solid #dcdfe6",
                    borderRadius: "4px",
                    background: "white",
                    color: "#303133",
                    cursor: "pointer"
                  }
                },
                loading.value ? "定位中…" : "定位"
              ),
              error.value &&
                h(
                  "div",
                  {
                    attrs: { role: "alert" },
                    style: { maxWidth: "240px", padding: "6px", background: "white", color: "#c62828" }
                  },
                  error.value.message
                )
            ]
      );
  }
}) as SharedComponent<typeof PROPS, typeof EVENTS, GeolocationHandle>;

export type TdtGeolocation = InstanceType<typeof TdtGeolocation>;
