import { watch } from "vue";
import { Emit, Props } from "./";
import { toBounds } from "../../utils";

/** Each snapshot owns its controls, retry timers and listeners. */
export function useControls(props: Props, map: T.Map, emit: Emit): () => void {
  return watch(
    () => props.controls,
    (options, _previous, onCleanup) => {
      let active = true;
      const timers = new Set<ReturnType<typeof setTimeout>>();
      const cleanups: (() => void)[] = [];
      onCleanup(() => {
        active = false;
        timers.forEach(clearTimeout);
        timers.clear();
        cleanups.reverse().forEach(cleanup => cleanup());
      });
      function add(control: T.Control) {
        map.addControl(control);
        cleanups.push(() => map.removeControl(control));
      }
      function bindOverview(control: T.ControlOverviewMap) {
        const handler = (event: T.ControlOverviewMapEvent) => emit("viewchange", event);
        control.addEventListener("viewchange", handler);
        cleanups.push(() => control.removeEventListener("viewchange", handler));
      }
      function create(option: VT.ControlName | VT.ControlOptions, attempt = 0) {
        if (!active) return;
        const name = typeof option === "string" ? option : option.name;
        if (!T.Control[name]) {
          if (attempt >= 100) {
            emit("error", new Error(`Tianditu control ${name} did not become available.`));
            return;
          }
          const timer = setTimeout(() => {
            timers.delete(timer);
            create(option, attempt + 1);
          }, 50);
          timers.add(timer);
          return;
        }
        try {
          if (typeof option === "string") {
            const control = new T.Control[name]();
            if (name === "OverviewMap") bindOverview(control as T.ControlOverviewMap);
            add(control);
            return;
          }
          switch (name) {
            case "MapType": {
              const types = option.mapTypes?.map(item => ({ ...item, layer: window[item.layer] }));
              const control = new T.Control.MapType(types);
              if (option.position) control.setPosition(option.position);
              add(control);
              break;
            }
            case "OverviewMap": {
              const control = new T.Control.OverviewMap(option);
              bindOverview(control);
              add(control);
              break;
            }
            case "Copyright": {
              const control = new T.Control.Copyright({ position: option.position || "bottomleft" });
              add(control);
              control.addCopyright({ ...option, bounds: option.bounds?.length ? toBounds(option.bounds) : undefined });
              break;
            }
            default:
              add(new T.Control[name](option));
          }
        } catch (error) {
          emit("error", error instanceof Error ? error : new Error(String(error)));
        }
      }
      options?.forEach(option => create(option));
    },
    { deep: true, immediate: true }
  );
}
