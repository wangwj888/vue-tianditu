import { defineComponent, effectScope, onBeforeUnmount, onMounted, ref, watch, type PropType } from "vue";
import { useMapRoot } from "../../use";
import { h } from "../../utils";
import type { SharedComponent } from "../../types";
import { createDomOverlay, isAbortError, toOverlayError, type DomOverlay } from "../dom-overlay";

export type CustomOverlayAnchor =
  "center" | "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface CustomOverlayHandle {
  overlay: T.Overlay;
  getElement(): HTMLElement;
  refresh(): void;
}

export interface CustomOverlayEvent {
  type: string;
  target: T.Overlay;
  lnglat: T.LngLat;
  containerPoint: T.Point;
  originalEvent: MouseEvent;
  extData: unknown;
}

const ANCHORS: Record<CustomOverlayAnchor, [number, number]> = {
  center: [-50, -50],
  top: [-50, 0],
  bottom: [-50, -100],
  left: [0, -50],
  right: [-100, -50],
  "top-left": [0, 0],
  "top-right": [-100, 0],
  "bottom-left": [0, -100],
  "bottom-right": [-100, -100]
};

const MOUSE_EVENTS = ["click", "dblclick", "mousedown", "mouseup", "mouseover", "mouseout"] as const;
const STOP_EVENTS = ["click", "dblclick", "mousedown", "touchstart", "pointerdown"] as const;

const PROPS = {
  position: { type: Array as unknown as PropType<readonly number[]>, required: true as const },
  offset: { type: Array as unknown as PropType<readonly number[]>, default: () => [0, 0] },
  anchor: { type: String as PropType<CustomOverlayAnchor>, default: "center" },
  visible: { type: Boolean, default: true },
  zIndex: { type: Number, default: 0 },
  interactive: { type: Boolean, default: true },
  stopPropagation: { type: Boolean, default: true },
  extData: { type: null as unknown as PropType<unknown> }
};
const EVENTS = {
  init: (_handle: CustomOverlayHandle) => true,
  error: (_error: Error) => true,
  click: (_event: CustomOverlayEvent) => true,
  dblclick: (_event: CustomOverlayEvent) => true,
  mousedown: (_event: CustomOverlayEvent) => true,
  mouseup: (_event: CustomOverlayEvent) => true,
  mouseover: (_event: CustomOverlayEvent) => true,
  mouseout: (_event: CustomOverlayEvent) => true
};

export interface CustomOverlayExposed {
  refresh(): void;
  getOverlay(): T.Overlay | undefined;
}

export const TdtCustomOverlay: SharedComponent<typeof PROPS, typeof EVENTS, CustomOverlayExposed> = defineComponent({
  name: "TdtCustomOverlay",
  inheritAttrs: false,
  props: PROPS,
  emits: EVENTS,
  setup(props, { attrs, emit, slots, expose }) {
    const emitMouse = emit as (type: (typeof MOUSE_EVENTS)[number], event: CustomOverlayEvent) => void;
    const content = ref<HTMLElement>();
    const source = ref<HTMLElement>();
    const controller = new AbortController();
    const scope = effectScope();
    let disposed = false;
    let overlay: DomOverlay | undefined;
    let outer: HTMLElement | undefined;
    let map: T.Map | undefined;
    const listeners: (() => void)[] = [];

    function refresh() {
      overlay?.refresh();
    }

    expose({ refresh, getOverlay: () => overlay?.overlay });

    onBeforeUnmount(() => {
      disposed = true;
      controller.abort();
      scope.stop();
      listeners.forEach(remove => remove());
      // Keep Vue's slot node attached until Vue unmounts its own subtree.
      if (source.value && content.value && outer?.contains(content.value)) {
        source.value.appendChild(content.value);
      }
      overlay?.destroy();
      map = undefined;
    });

    onMounted(async () => {
      try {
        const readyMap = await useMapRoot({ signal: controller.signal });
        if (disposed || !content.value) return;
        map = readyMap;
        const element = (outer = document.createElement("div"));
        element.className = "tdt-custom-overlay";
        element.style.position = "absolute";
        element.style.left = "0";
        element.style.top = "0";
        element.style.width = "0";
        element.style.height = "0";
        element.appendChild(content.value);

        overlay = createDomOverlay({
          element,
          update(currentMap) {
            const [lng, lat] = props.position ?? [];
            const valid = Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lng) <= 180 && Math.abs(lat) <= 90;
            element.style.display = props.visible && valid ? "" : "none";
            element.style.zIndex = String(props.zIndex);
            element.style.pointerEvents = props.interactive ? "auto" : "none";
            if (!valid) return;
            const point = currentMap.lngLatToLayerPoint(new T.LngLat(lng, lat));
            if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
              element.style.display = "none";
              return;
            }
            const [rawX = 0, rawY = 0] = props.offset ?? [];
            const x = Number.isFinite(rawX) ? rawX : 0;
            const y = Number.isFinite(rawY) ? rawY : 0;
            element.style.transform = `translate(${point.x + x}px, ${point.y + y}px)`;
          }
        });

        MOUSE_EVENTS.forEach(type => {
          const listener = (event: MouseEvent) => {
            if (!props.interactive || !map || !overlay) return;
            const bounds = map.getContainer().getBoundingClientRect();
            const containerPoint = new T.Point(event.clientX - bounds.left, event.clientY - bounds.top);
            emitMouse(type, {
              type,
              target: overlay.overlay,
              lnglat: map.containerPointToLngLat(containerPoint),
              containerPoint,
              originalEvent: event,
              extData: props.extData
            });
          };
          element.addEventListener(type, listener);
          listeners.push(() => element.removeEventListener(type, listener));
        });
        STOP_EVENTS.forEach(type => {
          const listener = (event: Event) => {
            if (props.interactive && props.stopPropagation) event.stopPropagation();
          };
          element.addEventListener(type, listener);
          listeners.push(() => element.removeEventListener(type, listener));
        });

        map.addOverLay(overlay.overlay);
        scope.run(() => {
          watch(
            () => [props.position, props.offset, props.visible, props.zIndex, props.interactive],
            () => overlay?.requestUpdate(),
            { deep: true }
          );
        });
        emit("init", { overlay: overlay.overlay, getElement: () => element, refresh });
      } catch (error) {
        overlay?.destroy();
        if (!disposed && !isAbortError(error)) emit("error", toOverlayError(error));
      }
    });

    return () => {
      const [x, y] = ANCHORS[props.anchor] ?? ANCHORS.center;
      const { class: customClass, style: customStyle, ...contentAttrs } = attrs;
      return h("div", { ref: source, style: { display: "none" }, attrs: { "aria-hidden": "true" } }, [
        h(
          "div",
          {
            ref: content,
            class: ["tdt-custom-overlay-content", customClass],
            attrs: contentAttrs,
            style: [
              customStyle,
              {
                position: "absolute",
                width: "max-content",
                transform: `translate(${x}%, ${y}%)`
              }
            ]
          },
          slots.default?.({ position: props.position, visible: props.visible })
        )
      ]);
    };
  }
}) as SharedComponent<typeof PROPS, typeof EVENTS, CustomOverlayExposed>;

export type TdtCustomOverlay = InstanceType<typeof TdtCustomOverlay>;
