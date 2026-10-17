import type { SharedComponent } from "../../types";
import { defineComponent } from "vue";
import { useMapTask, useEvent } from "../../use";
import { useInit, useWatch, PROPS, EVENTS, NATIVE_EVENTS } from "./use";

export const TdtMarker = defineComponent({
  name: "TdtMarker",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit }) {
    useMapTask((tdtMap, onCleanup) => {
      const tdtComponent = useInit(props);
      onCleanup(() => { tdtMap.removeOverLay(tdtComponent); });
      tdtMap.addOverLay(tdtComponent);
      useEvent({ events: NATIVE_EVENTS, emit, instance: tdtComponent, extData: props.extData });
      useWatch({ props, instance: tdtComponent });
      emit("init", tdtComponent);
    });

    return () => {};
  }
}) as unknown as SharedComponent<typeof PROPS, typeof EVENTS>;

export type TdtMarker = InstanceType<typeof TdtMarker>;
