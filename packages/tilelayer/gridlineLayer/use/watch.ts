import { watch } from "vue";
import { Props } from ".";

export function useWatch({
  props,
  instance,
  manageLayerState = true
}: {
  props: Props;
  manageLayerState?: boolean;
  instance: T.GridlineLayer;
}) {
  watch(
    () => props.opacity,
    val => val != null && instance.setOpacity(val)
  );

  // Components delegate group visibility and z-index to their layer registration.
  if (manageLayerState) {
    watch(
      () => props.zIndex,
      val => val != null && instance.setZIndex(val)
    );
  }
}
