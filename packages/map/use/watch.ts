import { watch } from "vue";
import { toBounds, toLngLat } from "../../utils";
import { Emit, Props } from "./";

export function useWatch({ props, instance, emit }: { props: Props; instance: T.Map; emit: Emit }): () => void {
  watch(
    () => ({ center: props.center, zoom: props.zoom }),
    val => {
      if (val.center == null || val.zoom == null) return;
      instance.panTo(toLngLat(val.center), val.zoom);
    },
    { deep: true }
  );
  watch(
    () => props.drag,
    val => (val ? instance.enableDrag() : instance.disableDrag()),
    { immediate: true }
  );
  watch(
    () => props.scrollWheelZoom,
    val => (val ? instance.enableScrollWheelZoom() : instance.disableScrollWheelZoom()),
    { immediate: true }
  );
  watch(
    () => props.doubleClickZoom,
    val => (val ? instance.enableDoubleClickZoom() : instance.disableDoubleClickZoom()),
    { immediate: true }
  );
  watch(
    () => props.keyboard,
    val => (val ? instance.enableKeyboard() : instance.disableKeyboard()),
    { immediate: true }
  );
  watch(
    () => props.inertia,
    val => (val ? instance.enableInertia() : instance.disableInertia()),
    { immediate: true }
  );
  watch(
    () => props.continuousZoom,
    val => (val ? instance.enableContinuousZoom() : instance.disableContinuousZoom()),
    { immediate: true }
  );
  watch(
    () => props.pinchToZoom,
    val => (val ? instance.enablePinchToZoom() : instance.disablePinchToZoom()),
    { immediate: true }
  );
  watch(
    () => props.autoResize,
    val => (val ? instance.enableAutoResize() : instance.disableAutoResize()),
    { immediate: true }
  );
  watch(
    () => props.minZoom,
    val => val != null && instance.setMinZoom(val)
  );
  watch(
    () => props.maxZoom,
    val => val != null && instance.setMaxZoom(val),
    { immediate: true }
  );
  watch(
    () => props.maxBounds,
    val => val != null && instance.setMaxBounds(toBounds(val)),
    { immediate: true, deep: true }
  );
  watch(
    () => props.viewport,
    val => val != null && instance.setViewport(val.map(lnglat => toLngLat(lnglat))),
    { immediate: true, deep: true }
  );
  watch(
    () => props.mapStyle,
    val => (val ? instance.setStyle(val) : instance.removeStyle()),
    { immediate: true }
  );

  // Keep v-model:center / v-model:zoom in sync with user interaction.
  const syncCenter = () => {
    const center = instance.getCenter();
    const next: VT.LngLat = [center.lng, center.lat];
    const current = props.center;
    if (!current || current[0] !== next[0] || current[1] !== next[1]) {
      emit("update:center", next);
    }
  };
  const syncZoom = () => {
    const zoom = instance.getZoom();
    if (props.zoom !== zoom) emit("update:zoom", zoom);
  };
  instance.addEventListener("moveend", syncCenter);
  instance.addEventListener("zoomend", syncZoom);
  return () => {
    instance.removeEventListener("moveend", syncCenter);
    instance.removeEventListener("zoomend", syncZoom);
  };
}
