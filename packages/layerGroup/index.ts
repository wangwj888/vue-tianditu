import { computed, defineComponent, provide, shallowRef, toRaw, watch, type PropType } from "vue";
import type { SharedComponent } from "../types";
import { useMapTask } from "../use";
import { uuid, h } from "../utils";
import {
  LAYER_HOST,
  useLayerRegistry,
  useLayerRegistration,
  useParentLayerHost,
  type LayerGroupController,
  type LayerGroupRole,
  type LayerHost,
  type LayerInstance
} from "../use/layerHost";

const PROPS = {
  id: { type: String, default: () => `layer-group-${uuid()}` },
  name: { type: String, default: "" },
  type: { type: String as PropType<LayerGroupRole>, default: "overlay" },
  visible: { type: Boolean, default: true },
  zIndex: { type: Number },
  layers: { type: Array as unknown as PropType<readonly LayerInstance[]>, default: () => [] }
};
const EVENTS = {
  init: (_group: T.LayerGroup) => true,
  error: (_error: Error) => true,
  "update:visible": (_visible: boolean) => true,
  "update:zIndex": (_zIndex: number | undefined) => true
};
export interface LayerGroupExposed {
  getGroup(): T.LayerGroup | undefined;
  getLayers(): LayerInstance[];
  setVisible(visible: boolean): void;
  setZIndex(zIndex: number | undefined): void;
}

export const TdtLayerGroup = defineComponent({
  name: "TdtLayerGroup",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit, slots, expose }) {
    const parent = useParentLayerHost();
    const registry = useLayerRegistry();
    const group = shallowRef<T.LayerGroup>();
    const members = new Map<LayerInstance, number>();
    const visibleOverride = shallowRef<boolean>();
    const zIndexOverride = shallowRef<number>();
    const requestedVisible = computed(() => visibleOverride.value ?? props.visible);
    const role = computed(() => props.type);
    const visible = computed(
      () =>
        requestedVisible.value &&
        (parent?.visible.value ?? true) &&
        (props.type !== "base" || registry.baseLayer.value === props.id)
    );
    const zIndex = computed(() => parent?.zIndex.value ?? zIndexOverride.value ?? props.zIndex);
    const host: LayerHost = {
      visible,
      zIndex,
      register(layer) {
        const count = members.get(layer) ?? 0;
        members.set(layer, count + 1);
        if (!count) group.value?.addLayer(layer);
        return () => {
          const remaining = (members.get(layer) ?? 1) - 1;
          if (remaining) members.set(layer, remaining);
          else {
            members.delete(layer);
            group.value?.removeLayer(layer);
          }
        };
      }
    };
    provide(LAYER_HOST, host);
    const registerLayer = useLayerRegistration(host);
    function setVisible(value: boolean) {
      visibleOverride.value = value;
      emit("update:visible", value);
    }
    function setZIndex(value: number | undefined) {
      if (value != null && !Number.isFinite(value)) return;
      zIndexOverride.value = value;
      emit("update:zIndex", value);
    }
    watch(
      () => props.visible,
      () => {
        visibleOverride.value = undefined;
      }
    );
    watch(
      () => props.zIndex,
      () => {
        zIndexOverride.value = undefined;
      }
    );
    const controller: LayerGroupController = {
      id: props.id,
      name: computed(() => props.name || props.id),
      role,
      visible: requestedVisible,
      effectiveVisible: visible,
      zIndex,
      setVisible,
      setZIndex
    };
    expose({ getGroup: () => group.value, getLayers: () => [...members.keys()], setVisible, setZIndex });
    useMapTask((map, onCleanup) => {
      const sdkGroup = new T.LayerGroup([]);
      group.value = sdkGroup;
      members.forEach((_count, layer) => sdkGroup.addLayer(layer));
      const unregisterParent = parent?.register(sdkGroup);
      const unregisterRegistry = registry.register(controller);
      const external = new Map<LayerInstance, () => void>();
      onCleanup(() => {
        external.forEach(dispose => dispose());
        external.clear();
        unregisterRegistry();
        unregisterParent?.();
        sdkGroup.clearLayers();
        group.value = undefined;
      });
      watch(
        () => props.layers.map(layer => toRaw(layer)),
        layers => {
          const next = new Set(layers);
          external.forEach((dispose, layer) => {
            if (!next.has(layer)) {
              dispose();
              external.delete(layer);
            }
          });
          next.forEach(layer => {
            if (external.has(layer)) return;
            try {
              external.set(layer, registerLayer(map, layer));
            } catch (error) {
              emit("error", error instanceof Error ? error : new Error(String(error)));
            }
          });
        },
        { immediate: true }
      );
      emit("init", sdkGroup);
    });
    return () => h("div", { style: { display: "none" } }, slots.default?.({ visible: visible.value }));
  }
}) as unknown as SharedComponent<typeof PROPS, typeof EVENTS, LayerGroupExposed>;

export type TdtLayerGroup = InstanceType<typeof TdtLayerGroup>;
export type { LayerInstance, LayerGroupRole } from "../use/layerHost";
