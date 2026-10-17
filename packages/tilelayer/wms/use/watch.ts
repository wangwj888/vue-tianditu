import { watch } from "vue";
import { Props } from "./";

export function useWatch({ props, instance }: { props: Props; instance: T.TileLayer.WMS }) {
  watch(
    () => props.opacity,
    val => val != null && instance.setOpacity(val),
    { immediate: true }
  );
  watch(
    () => props.zIndex,
    val => val != null && instance.setZIndex(val),
    { immediate: true }
  );
  watch(
    () => props.url,
    val => val && instance.setUrl(val)
  );
}
