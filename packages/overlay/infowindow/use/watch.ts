import { watch } from "vue";
import { toLngLat, toPoint } from "../../../utils";
import { Props } from "./";

export function useWatch({ props, instance, map }: { props: Props; instance: T.InfoWindow; map: T.Map }) {
  watch(
    () => props.offset,
    val => val != null && instance.setOffset(toPoint(val)),
    { deep: true }
  );
  watch(
    () => props.content,
    val => val != null && instance.setContent(val)
  );
  watch(
    () => props.target,
    val => {
      if (val instanceof Array) {
        map.openInfoWindow(instance, toLngLat(val));
      } else {
        val ? val.openInfoWindow(instance) : instance.closeInfoWindow();
      }
    },
    { immediate: true }
  );
}
