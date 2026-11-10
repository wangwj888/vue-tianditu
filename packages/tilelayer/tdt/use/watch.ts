import { watch } from "vue";
import { Props } from "./";

export function useWatch({
  props,
  instance,
  manageLayerState = true
}: {
  props: Props;
  manageLayerState?: boolean;
  instance: T.TileLayer.TDT;
}) {
  watch(
    () => props.opacity,
    val => val != null && instance.setOpacity(val)
  );

  watch(
    () => props.url,
    val => val && instance.setUrl(val)
  );

  // Components delegate group visibility and z-index to their layer registration.
  if (manageLayerState) {
    watch(
      () => props.zIndex,
      val => val != null && instance.setZIndex(val)
    );
  }
}
