import { defineComponent } from "vue";
import type { SharedComponent } from "../../types";
import { useMapTask } from "../../use";
import { useLayerRegistration, useLayerVisibility } from "../../use/layerHost";
import { useInit, useWatch, PROPS, EVENTS } from "./use";

export const TdtImageOverlay = defineComponent({
  name: "TdtImageOverlay",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit }) {
    const registerLayer = useLayerRegistration();
    const visible = useLayerVisibility(() => props.visible);
    useMapTask(
      (map, onCleanup) => {
        const instance = useInit(props);
        onCleanup(
          registerLayer(map, instance, {
            visible: () => visible.value,
            zIndex: () => props.zIndex
          })
        );
        useWatch({ props, instance });
        emit("init", instance);
      },
      { plugins: ["ImageOverLayer"] }
    );

    return () => null;
  }
}) as unknown as SharedComponent<typeof PROPS, typeof EVENTS>;

export type TdtImageOverlay = InstanceType<typeof TdtImageOverlay>;
