import { watch } from "vue";
import { toIcon, toLngLat } from "../../../utils";
import { Props } from "./";

export function useWatch({
  props,
  instance,
  manageLayerState = true
}: {
  props: Props;
  manageLayerState?: boolean;
  instance: T.Marker;
}) {
  watch(
    () => props.position,
    val => val != null && instance.setLngLat(toLngLat(val)),
    { deep: true }
  );
  watch(
    () => props.draggable,
    val => (val ? instance.enableDragging() : instance.disableDragging())
  );
  watch(
    () => props.icon,
    val => val && instance.setIcon(toIcon(val)),
    { immediate: true }
  );

  watch(
    () => props.opacity,
    val => val != null && instance.setOpacity(val),
    { immediate: true }
  );

  // Components delegate group visibility and z-index to their layer registration.
  if (manageLayerState) {
    watch(
      () => props.zIndexOffset,
      val => val != null && instance.setZIndexOffset(val),
      { immediate: true }
    );
    watch(
      () => props.visible,
      val => (val ? instance.show() : instance.hide()),
      { immediate: true }
    );
  }
}
