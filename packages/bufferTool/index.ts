import { defineComponent, toRaw, watch } from "vue";
import type { SharedComponent } from "../types";
import { useMapTask } from "../use";
import { PROPS, EVENTS, type Props } from "./use";

export interface BufferToolExposed {
  open(): void;
  close(): void;
  clear(): void;
  getTool(): T.BufferTool | undefined;
  getBufferLayers(): T.GroupLayer[];
}

const BUFFER_EVENTS = ["dragStart", "drag", "dragEnd"] as const;

export const TdtBufferTool = defineComponent({
  name: "TdtBufferTool",
  props: PROPS,
  emits: EVENTS,
  setup(props: Props, { emit, expose }) {
    let tool: T.BufferTool | undefined;
    const listeners: { event: string; handler: (event: T.BufferToolEvent) => void }[] = [];

    function unbind() {
      listeners.splice(0).forEach(({ event, handler }) => {
        try {
          tool?.off(event, handler as never);
        } catch {
          /* SDK 可能已经销毁，忽略解绑失败。 */
        }
      });
    }

    function bind(instance: T.BufferTool) {
      const handlers: Record<(typeof BUFFER_EVENTS)[number], (event: T.BufferToolEvent) => void> = {
        dragStart: event => emit("drag-start", event),
        drag: event => emit("drag", event),
        dragEnd: event => emit("drag-end", event)
      };
      BUFFER_EVENTS.forEach(event => {
        const handler = handlers[event];
        instance.on(event, handler as never);
        listeners.push({ event, handler });
      });
    }

    function report(reason: unknown) {
      emit("error", reason instanceof Error ? reason : new Error(String(reason)));
    }

    function syncLayers() {
      if (!tool) return;
      try {
        tool.close();
        tool.clear();
        tool.OverlayGroup = props.layers.map(layer => toRaw(layer));
        if (props.active) tool.open();
      } catch (reason) {
        report(reason);
      }
    }

    function applyStyle() {
      if (!tool) return;
      try {
        tool.options.style = { ...props.style };
      } catch (reason) {
        report(reason);
      }
    }

    expose({
      open: () => tool?.open(),
      close: () => tool?.close(),
      clear: () => {
        try {
          tool?.clear();
        } catch (reason) {
          report(reason);
        }
      },
      getTool: () => tool,
      getBufferLayers: () => {
        try {
          return tool?.getBufferLayers() ?? [];
        } catch (reason) {
          report(reason);
          return [];
        }
      }
    });

    useMapTask(
      (map, onCleanup) => {
        const instance = new T.BufferTool(
          map,
          props.layers.map(layer => toRaw(layer)),
          { style: { ...props.style } }
        );
        tool = instance;
        bind(instance);
        if (props.active) instance.open();
        onCleanup(() => {
          unbind();
          try {
            instance.close();
            instance.clear();
            map.removeLayer(instance.buffers as unknown as T.TileLayer);
          } catch {
            /* 清理阶段的 SDK 失败不再上报。 */
          }
          tool = undefined;
        });
        watch(
          () => props.active,
          active => {
            try {
              active ? instance.open() : instance.close();
            } catch (reason) {
              report(reason);
            }
          }
        );
        watch(() => props.layers, syncLayers, { deep: true });
        watch(() => props.style, applyStyle, { deep: true });
        emit("init", instance);
      },
      { plugins: ["BufferTool"] }
    );

    return () => null;
  }
}) as unknown as SharedComponent<typeof PROPS, typeof EVENTS, BufferToolExposed>;

export type TdtBufferTool = InstanceType<typeof TdtBufferTool>;
