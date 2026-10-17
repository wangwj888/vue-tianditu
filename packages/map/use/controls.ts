import { Emit, Props } from "./";
import { toBounds } from "../../utils";
import { getCurrentScope, onScopeDispose } from "vue";

export function useControls(props: Props, map: T.Map, emit: Emit) {
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const cleanups: (() => void)[] = [];
  const attempts = new Map<unknown, number>();
  let active = true;
  const retry = (key: unknown, task: () => void) => {
    const count = (attempts.get(key) || 0) + 1;
    attempts.set(key, count);
    if (!active) return;
    if (count > 100) {
      emit("error", new Error("The requested Tianditu control did not become available."));
      return;
    }
    const timer = setTimeout(() => { timers.delete(timer); if (active) task(); }, 50);
    timers.add(timer);
  };
  const add = (control: T.Control) => {
    map.addControl(control);
    cleanups.push(() => map.removeControl(control));
  };
  const bindOverview = (control: T.ControlOverviewMap) => {
    const handler = (event: T.ControlOverviewMapEvent) => emit("viewchange", event);
    control.addEventListener("viewchange", handler);
    cleanups.push(() => control.removeEventListener("viewchange", handler));
  };
  if (getCurrentScope()) onScopeDispose(() => {
    active = false;
    timers.forEach(clearTimeout);
    cleanups.reverse().forEach(cleanup => cleanup());
  });
  props.controls?.forEach((option: VT.ControlName | VT.ControlOptions) => {
    if (typeof option === "string") {
      addControlByName(option);
    } else if (typeof option === "object") {
      addControlByOption(option);
    }
  });

  function addControlByName(option: VT.ControlName) {
    const controlName = option;
    if (!T.Control[controlName]) {
      retry(option, () => addControlByName(option));
      return;
    }
    const control = new T.Control[controlName]();
    if (controlName === "OverviewMap") {
      const c = control as T.ControlOverviewMap;
      bindOverview(c);
    }
    add(control);
  }

  function addControlByOption(option: VT.ControlOptions) {
    const controlName = option.name;
    if (!T.Control[controlName]) {
      retry(option, () => addControlByOption(option));
      return;
    }
    switch (controlName) {
      case "MapType":
        {
          const mapTypes = option.mapTypes?.map(item => {
            return {
              ...item,
              layer: window[item.layer]
            };
          });
          const control = new T.Control.MapType(mapTypes);
          option.position && control.setPosition(option.position);
          add(control);
        }
        break;
      case "OverviewMap":
        {
          const control = new T.Control.OverviewMap(option);
          bindOverview(control);
          add(control);
        }
        break;
      case "Copyright":
        {
          // 根据官网的示例，需要先初始化控件，再添加版权信息
          const control = new T.Control.Copyright({ position: option.position || "bottomleft" });
          add(control);
          control.addCopyright({
            ...option,
            bounds: option.bounds?.length ? toBounds(option.bounds) : undefined
          });
        }
        break;
      default:
        {
          const control = new T.Control[controlName](option);
          add(control);
        }
        break;
    }
  }
}
