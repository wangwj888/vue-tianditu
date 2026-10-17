import { watch } from "vue";
import { toPoint } from "../../utils";
import { Props } from "./";

export function useWatch({ props, instance }: { props: Props; instance: T.Control }) {
  watch(
    () => props.position,
    val => val && instance.setPosition(val)
  );
  watch(
    () => props.offset,
    val => val != null && instance.setOffset(toPoint(val)),
    { immediate: true, deep: true }
  );
  watch(
    () => props.visible,
    val => (val ? instance.show() : instance.hide()),
    { immediate: true }
  );
}
