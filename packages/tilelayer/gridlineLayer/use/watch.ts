import { watch } from "vue";
import { Props } from ".";

export function useWatch({ props, instance }: { props: Props; instance: T.GridlineLayer }) {
  watch(
    () => props.opacity,
    val => val != null && instance.setOpacity(val)
  );
  watch(
    () => props.zIndex,
    val => val != null && instance.setZIndex(val)
  );
}
