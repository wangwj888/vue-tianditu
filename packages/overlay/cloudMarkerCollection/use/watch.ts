import { getCurrentScope, onScopeDispose, watch } from "vue";
import { toLngLats } from "../../../utils";
import { Props } from "./";

function signatureOf(lnglats: readonly (readonly number[])[]): string | undefined {
  try {
    return JSON.stringify(lnglats);
  } catch {
    return undefined;
  }
}

export function useWatch({ props, instance }: { props: Props; instance: T.CloudMarkerCollection }) {
  let disposed = false;
  let scheduled = false;
  let appliedSignature = signatureOf(props.lnglats);

  if (getCurrentScope()) {
    onScopeDispose(() => {
      disposed = true;
    });
  }

  // The SDK only exposes setLnglats (no per-point add/remove). Coalesce all
  // mutations in one tick and skip identical snapshots so large arrays do not
  // rebuild the canvas repeatedly while data streams in.
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    void Promise.resolve().then(() => {
      scheduled = false;
      if (disposed) return;
      const signature = signatureOf(props.lnglats);
      if (signature !== undefined && signature === appliedSignature) return;
      try {
        instance.setLnglats(toLngLats(props.lnglats));
        appliedSignature = signature;
      } catch {
        /* SDK 已销毁时忽略迟到的合并更新。 */
      }
    });
  }

  watch(
    () => props.lnglats,
    () => schedule(),
    { deep: true }
  );
  // A getter that returns props itself never changes identity, so the style
  // watcher must depend on the individual options.
  watch(
    () => ({ ShapeType: props.ShapeType, SizeType: props.SizeType, color: props.color }),
    val => instance.setStyles(val)
  );
}
