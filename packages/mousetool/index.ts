import type { SharedComponent } from "../types";
import { defineComponent } from "vue";
import type { ToolInstances } from "./types";
import { useMapTask } from "../use";
import { useInit, useWatch, PROPS, EVENTS, useEvent } from "./use";

export interface MousetoolMethods {
  open(name: keyof ToolInstances): void;
  close(name: keyof ToolInstances): void;
  clear(name: keyof ToolInstances): void;
  clearAll(): void;
}

export const TdtMousetool = defineComponent({
  name: "TdtMousetool",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit, expose }) {
    let tools: ToolInstances = {};
    function open(name: keyof ToolInstances) { tools[name]?.open(); }
    function close(name: keyof ToolInstances) { tools[name]?.close(); }
    function clear(name: keyof ToolInstances) {
      try { tools[name]?.clear(); }
      catch (error) { console.error(error); }
    }
    function clearAll() {
      (Object.keys(tools) as (keyof ToolInstances)[]).forEach(name => {
        close(name);
        clear(name);
      });
    }
    expose({ open, close, clear, clearAll });

    useMapTask((tdtMap, onCleanup) => {
      tools = useInit(props, tdtMap);
      onCleanup(() => { clearAll(); tools = {}; });
      useEvent({ emit, instances: tools });
      useWatch({ props, instances: tools });
      emit("init", tools);
    });

    return () => null;
  }
}) as unknown as SharedComponent<typeof PROPS, typeof EVENTS, MousetoolMethods>;

export type TdtMousetool = InstanceType<typeof TdtMousetool>;
