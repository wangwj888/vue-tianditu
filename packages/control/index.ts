import type { SharedComponent } from "../types";
import { defineComponent } from "vue";
import { useEvent, useMapTask } from "../use";
import { useInit, useWatch, PROPS, EVENTS, NATIVE_EVENTS } from "./use";
import { h } from "../utils";

export const TdtControl = defineComponent({
  name: "TdtControl",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit, slots }) {
    let controlRef = h("div");

    useMapTask((tdtMap, onCleanup) => {
      const tdtComponent = useInit(props);
      onCleanup(() => tdtMap.removeControl(tdtComponent));
      tdtComponent.onAdd = () => controlRef.el || controlRef.elm;
      tdtComponent.onRemove = () => {};
      tdtMap.addControl(tdtComponent);
      useEvent({ events: NATIVE_EVENTS, emit, instance: tdtComponent });
      useWatch({ props, instance: tdtComponent });
      emit("init", tdtComponent);
    }, { mounted: true });

    return () => {
      controlRef = h("div", { class: "tdt-control-custom" }, slots.default?.());
      return controlRef;
    };
  }
}) as unknown as SharedComponent<typeof PROPS, typeof EVENTS>;

export type TdtControl = InstanceType<typeof TdtControl>;
