import { useLayerRegistration, useLayerVisibility } from "../../use/layerHost";
import type { SharedComponent } from "../../types";
import { defineComponent } from "vue";
import { useMapTask, useEvent } from "../../use";
import { useInit, useWatch, PROPS, EVENTS, NATIVE_EVENTS } from "./use";

export const TdtCircle = defineComponent({
  name: "TdtCircle",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit }) {
    const registerLayer = useLayerRegistration();
    const visible = useLayerVisibility(() => props.visible);
    useMapTask((tdtMap, onCleanup) => {
      const tdtComponent = useInit(props);
      onCleanup(registerLayer(tdtMap, tdtComponent, { visible: () => props.visible }));
      useEvent({ events: NATIVE_EVENTS, emit, instance: tdtComponent, extData: props.extData });
      useWatch({ props, instance: tdtComponent, manageLayerState: false, visible: () => visible.value });
      emit("init", tdtComponent);
    });

    return () => {};
  }
}) as unknown as SharedComponent<typeof PROPS, typeof EVENTS>;

export type TdtCircle = InstanceType<typeof TdtCircle>;
