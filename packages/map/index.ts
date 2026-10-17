import type { SharedComponent } from "../types";
import mitt from "mitt";
import { defineComponent, shallowRef, provide, onMounted, onUnmounted } from "vue";
import type { MapEmitEvents } from "../types";
import { useApiLoader, useEvent, useComponentScope } from "../use";
import { useInit, useWatch, useControls, PROPS, EVENTS, NATIVE_EVENTS } from "./use";
import { h } from "../utils";

export const TdtMap = defineComponent({
  name: "TdtMap",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit, slots }) {
    const tdtMap = shallowRef<T.Map>();
    const mapEmitter = mitt<MapEmitEvents>();
    const lifecycle = useComponentScope();
    let instance: T.Map | undefined;
    provide("mapRoot", tdtMap);
    provide("mapEmitter", mapEmitter);
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
          tdtMap.value = instance;
          useEvent({ events: NATIVE_EVENTS, emit, instance });
          lifecycle.onCleanup(useWatch({ props, instance, emit }));
          useControls(props, instance, emit);
          emit("init", instance);
          mapEmitter.emit("mapInit", instance);
        });
      } catch (reason) {
        if (!lifecycle.active) return;
        const error = reason instanceof Error ? reason : new Error(String(reason));
        mapEmitter.emit("mapError", error);
        emit("error", error);
      }
    });

    return () => h("div", {
      class: "tdt-map-container",
      style: "width:100%;height:100%"
    }, [tdtMapRef, slots.default?.()]);
  }
}) as unknown as SharedComponent<typeof PROPS, typeof EVENTS>;

export type TdtMap = InstanceType<typeof TdtMap>;
