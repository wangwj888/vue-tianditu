import { watch } from "vue";
import { toLngLats } from "../../../utils";
import { Props } from "./";

export function useWatch({ props, instance }: { props: Props; instance: T.CloudMarkerCollection }) {
  watch(
    () => props.lnglats,
    val => val != null && instance.setLnglats(toLngLats(val)),
    { deep: true }
  );
  // A getter that returns props itself never changes identity, so the style
  // watcher must depend on the individual options.
  watch(
    () => ({ ShapeType: props.ShapeType, SizeType: props.SizeType, color: props.color }),
    val => instance.setStyles(val)
  );
}
