import { watch } from "vue";
import { toLngLats } from "../../../utils";
import { Props } from "./";

export function useWatch({ props, instance }: { props: Props; instance: T.Polyline }) {
  watch(
    () => props.path,
    val => val != null && instance.setLngLats(toLngLats(val)),
    { deep: true }
  );
  watch(
    () => props.color,
    val => val && instance.setColor(val)
  );
  watch(
    () => props.opacity,
    val => val != null && instance.setOpacity(val)
  );
  watch(
    () => props.weight,
    val => val != null && instance.setWeight(val)
  );
  watch(
    () => props.lineStyle,
    val => val && instance.setLineStyle(val)
  );
  watch(
    () => props.edit,
    val => (val ? instance.enableEdit() : instance.disableEdit()),
    { immediate: true }
  );
  watch(
    () => props.visible,
    val => (val ? instance.show() : instance.hide()),
    { immediate: true }
  );
}
