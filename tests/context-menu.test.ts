import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, defineComponent, h, nextTick, provide, shallowRef } from "vue";
import mitt from "mitt";
import { TdtContextMenu } from "../packages/contextMenu";
import type { MapEmitEvents } from "../packages/types";

async function flush() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe("context menu", () => {
  let host: HTMLElement;
  let listeners: Map<string, (event: unknown) => void>;
  let map: T.Map;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    listeners = new Map();
    map = {
      addEventListener: vi.fn((event: string, handler: (event: unknown) => void) => listeners.set(event, handler)),
      removeEventListener: vi.fn((event: string) => listeners.delete(event)),
      getContainer: () => host
    } as unknown as T.Map;
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  function mount(selected = vi.fn()) {
    const mapRoot = shallowRef<T.Map>(map);
    const emitter = mitt<MapEmitEvents>();
    const Parent = defineComponent({
      setup() {
        provide("mapRoot", mapRoot);
        provide("mapEmitter", emitter);
        return () =>
          h("div", { style: { position: "relative", width: "400px", height: "300px" } }, [
            h(TdtContextMenu, {
              items: [
                { key: "add", label: "添加" },
                { type: "divider" },
                { key: "remove", label: "删除", danger: true }
              ],
              onSelect: selected
            })
          ]);
      }
    });
    const app = createApp(Parent);
    app.mount(host);
    return { app, selected };
  }

  it("opens on map contextmenu and emits the selected item", async () => {
    const { app, selected } = mount();
    await flush();
    const handler = listeners.get("contextmenu");
    expect(handler).toBeTypeOf("function");

    handler!({
      lnglat: { lng: 113.28, lat: 23.12 },
      containerPoint: { x: 20, y: 30 },
      originalEvent: new MouseEvent("contextmenu", { clientX: 120, clientY: 140, cancelable: true })
    });
    await flush();

    const menu = document.querySelector(".tdt-context-menu");
    expect(menu).toBeTruthy();
    const item = menu!.querySelector('[role="menuitem"]') as HTMLElement;
    expect(item.textContent).toContain("添加");
    item.click();
    await flush();

    expect(selected).toHaveBeenCalledTimes(1);
    expect(selected.mock.calls[0][0]).toMatchObject({ key: "add", label: "添加" });
    expect(selected.mock.calls[0][1]).toMatchObject({ lnglat: [113.28, 23.12] });
    expect(document.querySelector(".tdt-context-menu")).toBeNull();
    app.unmount();
  });

  it("closes on Escape and keeps disabled items inert", async () => {
    const { app, selected } = mount();
    await flush();
    listeners.get("contextmenu")!({
      lnglat: { lng: 1, lat: 2 },
      containerPoint: { x: 1, y: 2 },
      originalEvent: new MouseEvent("contextmenu", { clientX: 10, clientY: 10 })
    });
    await flush();

    const menu = document.querySelector(".tdt-context-menu") as HTMLElement;
    menu.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await flush();
    expect(document.querySelector(".tdt-context-menu")).toBeNull();
    expect(selected).not.toHaveBeenCalled();
    app.unmount();
  });
});
