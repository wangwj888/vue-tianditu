import type { SharedComponent } from "../types";
import mitt from "mitt";
import { defineComponent, shallowRef, provide, onMounted, onUnmounted, type ShallowRef } from "vue";
import type { MapEmitEvents } from "../types";
import { useApiLoader, useEvent, useComponentScope } from "../use";
import { useInit, useWatch, useControls, PROPS, EVENTS, NATIVE_EVENTS } from "./use";
import { h } from "../utils";
import { LAYER_HOST } from "../use/layerHost";

export interface MapExposed {
  /** The native map is unavailable before initialization and after unmount. */
  map: ShallowRef<T.Map | undefined>;
  getMap(): T.Map | undefined;
}

export const TdtMap = defineComponent({
  name: "TdtMap",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit, slots, expose }) {
    const tdtMap = shallowRef<T.Map>();
    const loading = shallowRef(true);
    const initError = shallowRef<Error>();
    const mapEmitter = mitt<MapEmitEvents>();
    const lifecycle = useComponentScope();
    let instance: T.Map | undefined;
    provide("mapRoot", tdtMap);
    provide("mapEmitter", mapEmitter);
    provide("mapError", initError);
    // A nested map owns its layers independently from any outer layer group.
    provide(LAYER_HOST, undefined);
    expose({ map: tdtMap, getMap: () => tdtMap.value });
    mapEmitter.on("componentError", error => emit("error", error));

    const tdtMapRef = h("div", {
      class: "tdt-map",
      style: "width:100%;height:100%",
      attrs: { id: props.mid }
    });

    lifecycle.onCleanup(() => {
      mapEmitter.emit("mapDisposed", undefined);
      mapEmitter.all.clear();
      tdtMap.value = undefined;
    });
    // Children release their resources before the underlying map is cleared.
    onUnmounted(() => {
      instance?.clearOverLays();
      (instance as (T.Map & { remove?: () => void }) | undefined)?.remove?.();
    });

    onMounted(async () => {
      try {
        await useApiLoader(props.loadConfig);
        if (!lifecycle.active) return;
        lifecycle.run(() => {
          instance = useInit(props, tdtMapRef.el || tdtMapRef.elm);
          useEvent({ events: NATIVE_EVENTS, emit, instance });
          lifecycle.onCleanup(useWatch({ props, instance, emit }));
          useControls(props, instance, emit);
          tdtMap.value = instance;
          loading.value = false;
          emit("init", instance);
          mapEmitter.emit("mapInit", instance);
        });
      } catch (reason) {
        if (!lifecycle.active) return;
        const error = reason instanceof Error ? reason : new Error(String(reason));
        initError.value = error;
        loading.value = false;
        mapEmitter.emit("mapError", error);
        emit("error", error);
      }
    });

    return () => {
      const state = { map: tdtMap.value, loading: loading.value, error: initError.value };
      const status = initError.value ? slots.error?.(state) : loading.value ? slots.loading?.(state) : undefined;
      return h(
        "div",
        {
          class: "tdt-map-container",
          style: "width:100%;height:100%;position:relative",
          attrs: { "aria-busy": String(loading.value) }
        },
        [
          tdtMapRef,
          slots.default?.(state),
          status &&
            h(
              "div",
              {
                class: ["tdt-map-status", initError.value ? "tdt-map-status--error" : "tdt-map-status--loading"],
                attrs: { role: initError.value ? "alert" : "status" },
                style: "position:absolute;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center"
              },
              status
            )
        ]
      );
    };
  }
}) as unknown as SharedComponent<typeof PROPS, typeof EVENTS, MapExposed>;

export type TdtMap = InstanceType<typeof TdtMap>;
