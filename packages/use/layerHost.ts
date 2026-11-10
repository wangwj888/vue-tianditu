import { computed, inject, shallowRef, toRaw, watch, type ComputedRef, type Ref } from "vue";

export type LayerInstance = T.Overlay | T.OverlayBase<any> | T.TileLayer | T.LayerGroup;
export type LayerKind = "overlay" | "tile";
export interface LayerHost {
  visible: ComputedRef<boolean>;
  zIndex: ComputedRef<number | undefined>;
  register(layer: LayerInstance): () => void;
}
export const LAYER_HOST = "vue-tianditu-layer-host";
export interface LayerRegistrationOptions {
  kind?: LayerKind;
  visible?: () => boolean;
  zIndex?: () => number | undefined;
  setZIndex?: (value: number) => void;
  setVisible?: (visible: boolean) => void;
}
const ownership = new WeakMap<T.Map, WeakMap<object, object>>();

export function inferLayerKind(layer: LayerInstance): LayerKind {
  return typeof T.TileLayer === "function" && layer instanceof T.TileLayer ? "tile" : "overlay";
}
export function setLayerVisible(layer: LayerInstance, visible: boolean) {
  if (typeof T.LayerGroup === "function" && layer instanceof T.LayerGroup) {
    layer.getLayers().forEach(child => setLayerVisible(child, visible));
    return;
  }
  if (inferLayerKind(layer) === "tile") {
    (layer as T.TileLayer).getContainer().style.display = visible ? "" : "none";
    return;
  }
  const overlay = layer as T.Overlay;
  if (visible) overlay.show();
  else overlay.hide();
}
export function useLayerVisibility(ownVisible: () => boolean = () => true) {
  const host = useParentLayerHost();
  return computed(() => ownVisible() && (host?.visible.value ?? true));
}
export function useLayerZIndex(ownZIndex: () => number | undefined) {
  const host = useParentLayerHost();
  return computed(() => host?.zIndex.value ?? ownZIndex());
}
export function applyLayerZIndex(layer: LayerInstance, zIndex: number) {
  const target = layer as unknown as {
    setZIndex?(value: number): void;
    setZIndexOffset?(value: number): void;
    getElement?(): HTMLElement;
  };
  if (target.setZIndex) target.setZIndex(zIndex);
  else if (target.setZIndexOffset) target.setZIndexOffset(zIndex);
  else {
    const element = target.getElement?.();
    if (element) element.style.zIndex = String(zIndex);
  }
}

/** Capture the host in setup. The actual T.Map always remains untouched. */
export function useLayerRegistration(explicitHost?: LayerHost) {
  const host = explicitHost ?? inject<LayerHost | undefined>(LAYER_HOST, undefined);
  return (map: T.Map, input: LayerInstance, options: LayerRegistrationOptions = {}) => {
    const layer = toRaw(input);
    let owners = ownership.get(map);
    if (!owners) {
      owners = new WeakMap();
      ownership.set(map, owners);
    }
    if (owners.has(layer)) throw new Error("The same layer instance cannot be owned by two map components or groups.");
    const owner = {};
    owners.set(layer, owner);
    const kind = options.kind ?? inferLayerKind(layer);
    let attached = false;
    const add = () => {
      attached = true;
      if (kind === "tile") map.addLayer(layer as T.TileLayer);
      else map.addOverLay(layer as T.Overlay);
    };
    const remove = () => {
      if (!attached) return;
      attached = false;
      if (kind === "tile") map.removeLayer(layer as T.TileLayer);
      else map.removeOverLay(layer as T.Overlay);
    };
    let unregister: (() => void) | undefined;
    let stop: (() => void) | undefined;
    try {
      unregister = host?.register(layer);
      // The SDK's show/hide and editing methods require an initialized map element.
      add();
      stop = watch(
        () =>
          [
            options.visible?.() !== false && (host?.visible.value ?? true),
            host?.zIndex.value ?? options.zIndex?.()
          ] as const,
        ([visible, zIndex]) => {
          if (options.setVisible) options.setVisible(visible);
          else setLayerVisible(layer, visible);
          if (zIndex != null && Number.isFinite(zIndex)) {
            if (options.setZIndex) options.setZIndex(zIndex);
            else applyLayerZIndex(layer, zIndex);
          }
        },
        { immediate: true, flush: "post" }
      );
    } catch (error) {
      stop?.();
      unregister?.();
      remove();
      owners.delete(layer);
      throw error;
    }
    let disposed = false;
    return () => {
      if (disposed) return;
      disposed = true;
      stop?.();
      try {
        remove();
      } finally {
        unregister?.();
        owners?.delete(layer);
      }
    };
  };
}

export type LayerGroupRole = "base" | "overlay";
export interface LayerGroupController {
  id: string;
  name: ComputedRef<string>;
  role: ComputedRef<LayerGroupRole>;
  visible: ComputedRef<boolean>;
  effectiveVisible: ComputedRef<boolean>;
  zIndex: ComputedRef<number | undefined>;
  setVisible(value: boolean): void;
  setZIndex(value: number | undefined): void;
}
export interface LayerRegistry {
  groups: Ref<readonly LayerGroupController[]>;
  baseLayer: Ref<string | undefined>;
  register(group: LayerGroupController): () => void;
}
const registries = new WeakMap<object, LayerRegistry>();
/** A map-local reactive registry; arrays work in both Vue 2.7 and Vue 3. */
export function useLayerRegistry(): LayerRegistry {
  const mapRoot = inject<Ref<T.Map | undefined> | undefined>("mapRoot", undefined);
  const key = mapRoot ?? {};
  let registry = registries.get(key);
  if (!registry) {
    const groups = shallowRef<readonly LayerGroupController[]>([]);
    const baseLayer = shallowRef<string>();
    registry = {
      groups,
      baseLayer,
      register(group) {
        if (groups.value.some(item => item.id === group.id)) throw new Error(`Duplicate layer group id: ${group.id}`);
        groups.value = [...groups.value, group];
        if (group.role.value === "base" && !baseLayer.value) baseLayer.value = group.id;
        return () => {
          groups.value = groups.value.filter(item => item !== group);
          if (baseLayer.value === group.id) baseLayer.value = groups.value.find(item => item.role.value === "base")?.id;
        };
      }
    };
    registries.set(key, registry);
  }
  return registry;
}
export function useParentLayerHost() {
  return inject<LayerHost | undefined>(LAYER_HOST, undefined);
}
export const inheritedVisible = (parent: LayerHost | undefined) => computed(() => parent?.visible.value ?? true);
