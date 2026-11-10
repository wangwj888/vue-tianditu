import { useLayerRegistration } from "../../use/layerHost";
import type { SharedComponent } from "../../types";
import { defineComponent } from "vue";
import { useMapTask, useEvent } from "../../use";
import { useInit, useWatch, PROPS, EVENTS, NATIVE_EVENTS } from "./use";

export const TdtTilelayerWms = defineComponent({
  name: "TdtTilelayerWms",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit, attrs }) {
    const registerLayer = useLayerRegistration();
    useMapTask((tdtMap, onCleanup) => {
      const tdtComponent = useInit(props, attrs);
      onCleanup(registerLayer(tdtMap, tdtComponent, { kind: "tile", zIndex: () => props.zIndex }));
      useEvent({ events: NATIVE_EVENTS, emit, instance: tdtComponent });
      useWatch({ props, instance: tdtComponent, manageLayerState: false });
      emit("init", tdtComponent);
    });

    return () => {};
  }
}) as unknown as SharedComponent<typeof PROPS, typeof EVENTS>;

export type TdtTilelayerWms = InstanceType<typeof TdtTilelayerWms>;
