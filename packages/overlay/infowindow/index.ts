import type { SharedComponent } from "../../types";
import { defineComponent, computed } from "vue";
import { useMapTask, useEvent } from "../../use";
import { useInit, useWatch, PROPS, EVENTS, NATIVE_EVENTS } from "./use";
import { h } from "../../utils";

export const TdtInfowindow = defineComponent({
  name: "TdtInfowindow",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit, slots }) {
    const contentRef = computed(() => {
      return h(
        "div",
        {
          class: "tdt-infowindow-custom",
          style: {
            minWidth: props.minWidth,
            maxWidth: props.maxWidth,
            maxHeight: props.maxHeight,
            display: slots.default && props.target ? "block" : "none"
          }
        },
        slots.default?.()
      );
    });

    useMapTask((tdtMap, onCleanup) => {
      const content = slots.default ? contentRef.value.el || contentRef.value.elm : undefined;
      const tdtComponent = useInit(props, content);
      onCleanup(() => tdtComponent.closeInfoWindow?.());
      useEvent({ events: NATIVE_EVENTS, emit, instance: tdtComponent, emitted });
      useWatch({ props, instance: tdtComponent, map: tdtMap });
      emit("init", tdtComponent);
    }, { mounted: true });

    function emitted(event: string) {
      event === "close" && emit("update:target", null);
    }

    return () => contentRef.value;
  }
}) as unknown as SharedComponent<typeof PROPS, typeof EVENTS>;

export type TdtInfowindow = InstanceType<typeof TdtInfowindow>;
