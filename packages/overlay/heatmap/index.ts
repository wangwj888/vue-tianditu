import { defineComponent, effectScope, onBeforeUnmount, onMounted, watch, type PropType } from "vue";
import { useMapRoot } from "../../use";
import { createDomOverlay, isAbortError, toOverlayError, type DomOverlay } from "../dom-overlay";
import { createHeatmapRenderer, type HeatmapCore, type HeatmapPoint } from "./render";
import type { SharedComponent } from "../../types";

export type { HeatmapPoint } from "./render";

export interface HeatmapHandle {
  overlay: T.Overlay;
  getElement(): HTMLElement;
  refresh(): void;
}

let corePromise: Promise<HeatmapCore> | undefined;
function loadHeatmapCore(): Promise<HeatmapCore> {
  if (!corePromise) {
    corePromise = import("./vendor/heatmap.js")
      .then(module => module.default)
      .catch(error => {
        corePromise = undefined;
        throw error;
      });
  }
  return corePromise;
}

const PROPS = {
  data: { type: Array as unknown as PropType<readonly HeatmapPoint[]>, default: () => [] },
  max: { type: Number },
  radius: { type: Number, default: 40 },
  gradient: { type: Object as PropType<Record<number, string>> },
  blur: { type: Number, default: 0.85 },
  minOpacity: { type: Number, default: 0 },
  maxOpacity: { type: Number, default: 1 },
  visible: { type: Boolean, default: true }
};
const EVENTS = {
  init: (_handle: HeatmapHandle) => true,
  error: (_error: Error) => true
};

export interface HeatmapExposed {
  refresh(): void;
  getOverlay(): T.Overlay | undefined;
}

export const TdtHeatmap: SharedComponent<typeof PROPS, typeof EVENTS, HeatmapExposed> = defineComponent({
  name: "TdtHeatmap",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit, expose }) {
    const controller = new AbortController();
    const scope = effectScope();
    let disposed = false;
    let overlay: DomOverlay | undefined;
    let renderer: ReturnType<typeof createHeatmapRenderer> | undefined;

    function refresh() {
      overlay?.refresh();
    }
    expose({ refresh, getOverlay: () => overlay?.overlay });

    onBeforeUnmount(() => {
      disposed = true;
      controller.abort();
      scope.stop();
      overlay?.destroy();
      renderer?.clear();
    });

    onMounted(async () => {
      try {
        const map = await useMapRoot({ signal: controller.signal });
        if (disposed) return;
        const core = await loadHeatmapCore();
        if (disposed) return;
        const element = document.createElement("div");
        element.className = "tdt-heatmap";
        element.style.position = "absolute";
        element.style.left = "0";
        element.style.top = "0";
        element.style.pointerEvents = "none";
        renderer = createHeatmapRenderer(element, core, () => props);
        overlay = createDomOverlay({
          element,
          events: ["moveend", "zoomend", "resize"],
          update(currentMap) {
            try {
              renderer?.render(currentMap);
            } catch (error) {
              if (!disposed) emit("error", toOverlayError(error));
            }
          },
          onRemove: () => renderer?.clear()
        });
        map.addOverLay(overlay.overlay);
        scope.run(() => {
          watch(
            () => [
              props.data,
              props.max,
              props.radius,
              props.gradient,
              props.blur,
              props.minOpacity,
              props.maxOpacity,
              props.visible
            ],
            () => overlay?.requestUpdate(),
            { deep: true }
          );
        });
        emit("init", { overlay: overlay.overlay, getElement: () => element, refresh });
      } catch (error) {
        overlay?.destroy();
        renderer?.clear();
        if (!disposed && !isAbortError(error)) emit("error", toOverlayError(error));
      }
    });

    return () => null;
  }
}) as SharedComponent<typeof PROPS, typeof EVENTS, HeatmapExposed>;

export type TdtHeatmap = InstanceType<typeof TdtHeatmap>;
