import { defineComponent, nextTick, watch, type PropType } from "vue";
import { TdtControl } from "../control";
import { useMapTask } from "../use";
import { useLayerRegistry, type LayerGroupController } from "../use/layerHost";
import { h, uuid } from "../utils";
import type { SharedComponent } from "../types";
import "./style.scss";

export interface BaseLayerOption {
  id: string;
  name: string;
  mapType:
    | T.MapType
    | "TMAP_NORMAL_MAP"
    | "TMAP_SATELLITE_MAP"
    | "TMAP_HYBRID_MAP"
    | "TMAP_TERRAIN_MAP"
    | "TMAP_TERRAIN_HYBRID_MAP";
}
export interface LayerSelection {
  baseLayer?: string;
  visibleLayers: string[];
}
const PROPS = {
  position: { type: String as PropType<T.ControlPosition>, default: "topright" },
  offset: { type: Array as unknown as PropType<VT.Point> },
  title: { type: String, default: "图层" },
  baseLayers: { type: Array as unknown as PropType<readonly BaseLayerOption[]>, default: () => [] },
  baseLayer: { type: String },
  zIndexControls: { type: Boolean, default: false }
};
const EVENTS = {
  init: (_map: T.Map) => true,
  error: (_error: Error) => true,
  "update:baseLayer": (_id: string | undefined) => true,
  "base-change": (_id: string | undefined) => true,
  "visibility-change": (_event: { id: string; visible: boolean }) => true,
  "z-index-change": (_event: { id: string; zIndex: number | undefined }) => true,
  change: (_selection: LayerSelection) => true
};
export interface LayerSwitcherExposed {
  setBaseLayer(id: string): void;
  setLayerVisible(id: string, visible: boolean): void;
  setLayerZIndex(id: string, zIndex: number | undefined): void;
  getSelection(): LayerSelection;
}
export const TdtLayerSwitcher = defineComponent({
  name: "TdtLayerSwitcher",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit, expose }) {
    const registry = useLayerRegistry();
    const radioName = `tdt-base-${uuid()}`;
    let map: T.Map | undefined;
    let initialized = false;
    let lastSelection: string | undefined;
    let lastProp: string | undefined;
    const report = (error: unknown) => emit("error", error instanceof Error ? error : new Error(String(error)));
    function getSelection(): LayerSelection {
      return {
        baseLayer: registry.baseLayer.value,
        visibleLayers: registry.groups.value.filter(group => group.effectiveVisible.value).map(group => group.id)
      };
    }
    function notifySelection(id: string | undefined) {
      emit("update:baseLayer", id);
      emit("base-change", id);
      emit("change", getSelection());
    }
    function setBaseLayer(id: string, notify = true) {
      const native = props.baseLayers.find(option => option.id === id);
      const group = registry.groups.value.find(option => option.id === id && option.role.value === "base");
      if (!native && !group) {
        report(new Error(`Unknown base layer: ${id}`));
        return false;
      }
      if (native) {
        if (!map) return false;
        const type = typeof native.mapType === "string" ? window[native.mapType] : native.mapType;
        if (!type) {
          report(new Error(`Tianditu map type for ${id} is not available.`));
          return false;
        }
        map.setMapType(type);
      }
      if (group && !group.visible.value) group.setVisible(true);
      registry.baseLayer.value = id;
      lastSelection = id;
      if (notify) notifySelection(id);
      return true;
    }
    function findGroup(id: string) {
      const group = registry.groups.value.find(item => item.id === id);
      if (!group) report(new Error(`Unknown layer group: ${id}`));
      return group;
    }
    function setLayerVisible(id: string, visible: boolean) {
      const group = findGroup(id);
      if (!group) return;
      if (group.role.value === "base") {
        if (visible) setBaseLayer(id);
        return;
      }
      group.setVisible(visible);
      emit("visibility-change", { id, visible });
      emit("change", getSelection());
    }
    function setLayerZIndex(id: string, zIndex: number | undefined) {
      if (zIndex != null && !Number.isFinite(zIndex)) return;
      const group = findGroup(id);
      if (!group) return;
      group.setZIndex(zIndex);
      emit("z-index-change", { id, zIndex });
    }
    expose({ setBaseLayer, setLayerVisible, setLayerZIndex, getSelection });
    useMapTask((readyMap, onCleanup) => {
      map = readyMap;
      onCleanup(() => {
        map = undefined;
      });
      function syncBaseLayer() {
        const candidates = [
          ...props.baseLayers.map(item => item.id),
          ...registry.groups.value.filter(group => group.role.value === "base").map(group => group.id)
        ];
        const valid = (id: string | undefined): id is string => id !== undefined && candidates.includes(id);
        const propChanged = !initialized || props.baseLayer !== lastProp;
        const id =
          propChanged && valid(props.baseLayer)
            ? props.baseLayer
            : valid(registry.baseLayer.value)
              ? registry.baseLayer.value
              : valid(props.baseLayer)
                ? props.baseLayer
                : candidates[0];
        const invalidProp = props.baseLayer !== undefined && !valid(props.baseLayer);
        const notify = (initialized && id !== lastSelection) || (invalidProp && propChanged);
        if (id !== undefined) {
          if (!setBaseLayer(id, false)) return;
        } else {
          registry.baseLayer.value = undefined;
          lastSelection = undefined;
        }
        initialized = true;
        lastProp = props.baseLayer;
        if (notify) notifySelection(id);
        const ids = [...props.baseLayers.map(item => item.id), ...registry.groups.value.map(item => item.id)];
        if (new Set(ids).size !== ids.length)
          report(new Error("Native base layer and layer group ids must be unique."));
      }
      watch(
        () => [
          props.baseLayer,
          props.baseLayers.map(item => [item.id, item.mapType]),
          registry.groups.value.map(group => [group.id, group.role.value])
        ],
        syncBaseLayer,
        { flush: "post" }
      );
      // Let sibling groups register before correcting an initial controlled id.
      void nextTick(() => {
        if (map === readyMap) syncBaseLayer();
      });
      emit("init", readyMap);
    });
    function zIndexInput(group?: LayerGroupController) {
      if (!group) return null;
      return props.zIndexControls
        ? h("input", {
            class: "tdt-layer-switcher-z-index",
            attrs: { type: "number", "aria-label": `${group.name.value} 层级` },
            domProps: { value: group.zIndex.value ?? "" },
            on: {
              change: (event: Event) => {
                const value = (event.target as HTMLInputElement).value;
                setLayerZIndex(group.id, value === "" ? undefined : Number(value));
              }
            }
          })
        : null;
    }
    return () => {
      const baseGroups = registry.groups.value.filter(group => group.role.value === "base");
      const overlays = registry.groups.value.filter(group => group.role.value === "overlay");
      const bases = [
        ...props.baseLayers.map(option => ({ id: option.id, name: option.name })),
        ...baseGroups.map(group => ({ id: group.id, name: group.name.value }))
      ];
      const panel = h(
        "section",
        {
          class: "tdt-layer-switcher",
          attrs: { "aria-label": props.title },
          on: {
            click: (event: Event) => event.stopPropagation(),
            dblclick: (event: Event) => event.stopPropagation(),
            mousedown: (event: Event) => event.stopPropagation(),
            touchstart: (event: Event) => event.stopPropagation(),
            wheel: (event: Event) => event.stopPropagation()
          }
        },
        [
          h("strong", {}, props.title),
          bases.length
            ? h("fieldset", {}, [
                h("legend", {}, "底图"),
                ...bases.map(option =>
                  h(
                    "label",
                    { key: option.id },
                    [
                      h("input", {
                        attrs: { type: "radio", name: radioName, value: option.id },
                        domProps: { checked: registry.baseLayer.value === option.id },
                        on: { change: () => setBaseLayer(option.id) }
                      }),
                      h("span", {}, option.name),
                      zIndexInput(baseGroups.find(group => group.id === option.id))
                    ].filter(Boolean)
                  )
                )
              ])
            : null,
          overlays.length
            ? h("fieldset", {}, [
                h("legend", {}, "业务图层"),
                ...overlays.map(group =>
                  h("label", { key: group.id }, [
                    h("input", {
                      attrs: { type: "checkbox" },
                      domProps: { checked: group.visible.value },
                      on: {
                        change: (event: Event) => setLayerVisible(group.id, (event.target as HTMLInputElement).checked)
                      }
                    }),
                    h("span", {}, group.name.value),
                    zIndexInput(group)
                  ])
                )
              ])
            : null,
          !bases.length && !overlays.length ? h("span", { class: "tdt-layer-switcher-empty" }, "暂无图层") : null
        ].filter(Boolean)
      );
      return h(TdtControl, {
        props: { position: props.position, offset: props.offset },
        scopedSlots: { default: () => panel }
      });
    };
  }
}) as unknown as SharedComponent<typeof PROPS, typeof EVENTS, LayerSwitcherExposed>;
export type TdtLayerSwitcher = InstanceType<typeof TdtLayerSwitcher>;
