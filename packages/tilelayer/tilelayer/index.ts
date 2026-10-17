import type { SharedComponent } from "../../types";
import { defineComponent } from "vue";
import { useMapTask, useEvent } from "../../use";
import { useInit, useWatch, PROPS, EVENTS, NATIVE_EVENTS } from "./use";

export const TdtTilelayer = defineComponent({
  name: "TdtTilelayer",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit, attrs }) {
    useMapTask((tdtMap, onCleanup) => {
      const tdtComponent = useInit(props, attrs);
      onCleanup(() => { tdtMap.removeLayer(tdtComponent); });
      tdtMap.addLayer(tdtComponent);
      useEvent({ events: NATIVE_EVENTS, emit, instance: tdtComponent });
      useWatch({ props, instance: tdtComponent });
      emit("init", tdtComponent);
    });

    return () => {};
  }
}) as unknown as SharedComponent<typeof PROPS, typeof EVENTS>;

export type TdtTilelayer = InstanceType<typeof TdtTilelayer>;
