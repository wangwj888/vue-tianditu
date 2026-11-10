import { watch } from "vue";
import { toBounds } from "../../../utils";
import { Props } from "./";

export function useWatch({ props, instance }: { props: Props; instance: T.ImageOverlay }) {
  watch(
    () => props.url,
    val => val != null && instance.setImageUrl(val)
  );
  watch(
    () => props.bounds,
    val => val?.length === 2 && instance.setBounds(toBounds(val)),
    { deep: true }
  );
  watch(
    () => props.opacity,
    val => val != null && instance.setOpacity(val)
  );
  watch(
    () => props.alt,
    val => {
      const element = instance.getElement();
      if (element) element.alt = val ?? "";
    }
  );
}
