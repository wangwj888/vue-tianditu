import { watch } from "vue";
import { Props } from "./";

export function useWatch({ props, instance }: { props: Props; instance: T.TileLayer.TDT }) {
  watch(
    () => props.opacity,
    val => val != null && instance.setOpacity(val)
  );
  watch(
    () => props.zIndex,
    val => val != null && instance.setZIndex(val)
  );
  watch(
    () => props.url,
    val => val && instance.setUrl(val)
  );
}
