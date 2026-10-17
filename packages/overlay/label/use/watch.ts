import { watch } from "vue";
import { toLngLat, toPoint } from "../../../utils";
import { Props } from "./";

export function useWatch({ props, instance }: { props: Props; instance: T.Label }) {
  watch(
    () => props.position,
    val => val != null && instance.setLngLat(toLngLat(val)),
    { deep: true }
  );
  watch(
    () => props.text,
    val => val && instance.setLabel(val)
  );
  watch(
    () => props.offset,
    val => val != null && instance.setOffset(toPoint(val)),
    { deep: true }
  );
  watch(
    () => props.title,
    val => val && instance.setTitle(val),
    { immediate: true }
  );
  watch(
    () => props.zIndex,
    val => val != null && instance.setZIndex(val),
    { immediate: true }
  );
  watch(
    () => props.fontSize,
    val => val != null && instance.setFontSize(val),
    { immediate: true }
  );
  watch(
    () => props.fontColor,
    val => val && instance.setFontColor(val),
    { immediate: true }
  );
  watch(
    () => props.backgroundColor,
    val => val && instance.setBackgroundColor(val),
    { immediate: true }
  );
  watch(
    () => props.borderLine,
    val => val && instance.setBorderLine(val),
    { immediate: true }
  );
  watch(
    () => props.borderColor,
    val => val && instance.setBorderColor(val),
    { immediate: true }
  );
  watch(
    () => props.opacity,
    val => val != null && instance.setOpacity(val),
    { immediate: true }
  );
  watch(
    () => props.visible,
    val => (val ? instance.show() : instance.hide()),
    { immediate: true }
  );
}
