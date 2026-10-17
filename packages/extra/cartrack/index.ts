import type { SharedComponent } from "../../types";
import { defineComponent, watch } from "vue";
import { useMapTask } from "../../use";
import { useInit, PROPS, EVENTS } from "./use";

export interface CarTrackMethods {
  start(): void;
  pause(): void;
  stop(): void;
  clear(): void;
}

export const TdtCarTrack = defineComponent({
  name: "TdtCarTrack",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit, expose }) {
    let tdtComponent: T.CarTrack | null = null;
    const start = () => tdtComponent?.start();
    const pause = () => tdtComponent?.pause();
    const stop = () => tdtComponent?.stop();
    const clear = () => tdtComponent?.clear();
    expose({ start, pause, stop, clear });

    useMapTask((tdtMap, onCleanup) => {
      onCleanup(() => { clear(); tdtComponent = null; });
      watch(() => props.Datas, val => {
        clear();
        tdtComponent = null;
        if (!val.length) return;
        tdtComponent = useInit(props, emit, tdtMap);
        emit("init", tdtComponent);
      }, { immediate: true, deep: true });
    }, { plugins: ["CarTrack"] });

    return () => null;
  }
}) as unknown as SharedComponent<typeof PROPS, typeof EVENTS, CarTrackMethods>;

export type TdtCarTrack = InstanceType<typeof TdtCarTrack>;
