// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, defineComponent, h, nextTick, provide, reactive, shallowRef, type App } from "vue";
import { TdtCustomOverlay } from "../packages/overlay/custom";
import { createDomOverlay } from "../packages/overlay/dom-overlay";
import { createHeatmapRenderer, normalizeHeatmapData, type HeatmapOptions } from "../packages/overlay/heatmap/render";

class Point {
  constructor(
    public x: number,
    public y: number
  ) {}
}

class LngLat {
  constructor(
    public lng: number,
    public lat: number
  ) {}
}

class Overlay {
  static extend(methods: Record<string, unknown>) {
    return class extends Overlay {
      constructor() {
        super();
        Object.assign(this, methods);
      }
    };
  }
}

function createMap() {
  const container = document.createElement("div");
  const pane = document.createElement("div");
  container.appendChild(pane);
  document.body.appendChild(container);
  const events = new Map<string, Set<() => void>>();
  const overlays = new Set<any>();
  const size = { x: 100, y: 80 };
  const map = {
    getPanes: () => ({ overlayPane: pane }),
    getContainer: () => container,
    getSize: () => size,
    lngLatToContainerPoint: (point: LngLat) => new Point(point.lng, point.lat),
    containerPointToLngLat: (point: Point) => new LngLat(point.x, point.y),
    lngLatToLayerPoint: (point: LngLat) => new Point(point.lng + 1000, point.lat + 2000),
    addEventListener: (event: string, listener: () => void) => {
      if (!events.has(event)) events.set(event, new Set());
      events.get(event)!.add(listener);
    },
    removeEventListener: (event: string, listener: () => void) => events.get(event)?.delete(listener),
    addOverLay: vi.fn((overlay: any) => {
      overlays.add(overlay);
      overlay.onAdd(map);
    }),
    removeOverLay: vi.fn((overlay: any) => {
      if (overlays.delete(overlay)) overlay.onRemove(map);
    })
  };
  return { map: map as unknown as T.Map, pane, container, size, events, overlays };
}

const apps: App[] = [];
beforeEach(() => {
  vi.useFakeTimers();
  globalThis.T = { Overlay, Point, LngLat } as unknown as typeof T;
});
afterEach(() => {
  apps.splice(0).forEach(app => app.unmount());
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.body.replaceChildren();
});

async function flush() {
  await nextTick();
  await Promise.resolve();
  vi.runOnlyPendingTimers();
  await nextTick();
}

describe("DOM overlay lifecycle", () => {
  it("coalesces map redraws and removes listeners and scheduled work", () => {
    const { map, pane, events } = createMap();
    const element = document.createElement("div");
    const update = vi.fn();
    const overlay = createDomOverlay({ element, update });
    map.addOverLay(overlay.overlay);
    expect(pane.contains(element)).toBe(true);
    expect(update).toHaveBeenCalledTimes(1);
    events.get("move")!.forEach(listener => listener());
    events.get("resize")!.forEach(listener => listener());
    vi.runOnlyPendingTimers();
    expect(update).toHaveBeenCalledTimes(2);
    overlay.requestUpdate();
    overlay.destroy();
    vi.runOnlyPendingTimers();
    expect(update).toHaveBeenCalledTimes(2);
    expect(pane.children).toHaveLength(0);
    expect([...events.values()].every(listeners => listeners.size === 0)).toBe(true);
    overlay.destroy();

    const next = createDomOverlay({ element: document.createElement("div"), update });
    map.addOverLay(next.overlay);
    vi.spyOn(map, "removeOverLay").mockImplementationOnce(() => {
      throw new Error("SDK map has already been disposed");
    });
    expect(() => next.destroy()).toThrow("SDK map has already been disposed");
    expect(pane.children).toHaveLength(0);
    expect([...events.values()].every(listeners => listeners.size === 0)).toBe(true);
  });
});

describe("heatmap adapter", () => {
  it("renders through the real ESM core when ImageData.data is read-only", async () => {
    const putImageData = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () =>
        ({
          createLinearGradient: () => ({ addColorStop() {} }),
          createRadialGradient: () => ({ addColorStop() {} }),
          fillRect() {},
          clearRect() {},
          drawImage() {},
          getImageData: (_x: number, _y: number, width: number, height: number) =>
            Object.defineProperty({}, "data", { value: new Uint8ClampedArray(width * height * 4), writable: false }),
          putImageData
        }) as unknown as CanvasRenderingContext2D
    );
    const { default: core } = await import("../packages/overlay/heatmap/vendor/heatmap.js");
    const container = document.createElement("div");
    container.style.width = "100px";
    container.style.height = "80px";
    const instance = core.create({ container, radius: 10 });
    expect(() => instance.setData({ min: 0, max: 5, data: [{ x: 20, y: 20, radius: 10, value: 3 }] })).not.toThrow();
    expect(putImageData).toHaveBeenCalledTimes(1);
  });

  function setup() {
    const fixture = createMap();
    const element = document.createElement("div");
    element.style.position = "absolute";
    const instances: { setData: ReturnType<typeof vi.fn> }[] = [];
    const core = {
      create: vi.fn((config: Record<string, unknown>) => {
        const host = config.container as HTMLElement;
        host.style.position = "relative";
        host.appendChild(document.createElement("canvas"));
        const instance = { setData: vi.fn() };
        instances.push(instance);
        return instance;
      })
    };
    const options: HeatmapOptions = {
      data: [{ lng: 20, lat: 30, count: 5 }],
      radius: 20,
      blur: 0.85,
      minOpacity: 0,
      maxOpacity: 1,
      visible: true
    };
    const renderer = createHeatmapRenderer(element, core, () => options);
    return { ...fixture, element, instances, core, options, renderer };
  }

  it("copies input, filters invalid weights, and keeps visible edge contributions", () => {
    const points = Object.freeze([
      Object.freeze({ lng: 20, lat: 30, count: 5 }),
      Object.freeze({ lng: -10, lat: 30, count: 3 }),
      Object.freeze({ lng: -20, lat: 30, count: 2 }),
      Object.freeze({ lng: 180, lat: 30, count: 100 }),
      Object.freeze({ lng: 10, lat: 30, count: 0 }),
      Object.freeze({ lng: Number.NaN, lat: 30, count: 6 })
    ]);
    const fixture = setup();
    fixture.options.data = points;
    fixture.renderer.render(fixture.map);
    const result = fixture.instances[0].setData.mock.calls[0][0];
    expect(result.max).toBe(100);
    expect(result.data).toEqual([
      { x: 20, y: 30, value: 5, radius: 20 },
      { x: -10, y: 30, value: 3, radius: 20 }
    ]);
    expect(normalizeHeatmapData(fixture.options.data)[0]).not.toBe(points[0]);
    expect(fixture.element.style.position).toBe("absolute");
    expect(fixture.element.style.transform).toBe("translate(1000px, 2000px)");
  });

  it("clears empty/offscreen datasets and rebuilds on resize/configuration changes", () => {
    const { map, options, renderer, instances, core, size, element } = setup();
    renderer.render(map);
    options.data = [];
    renderer.render(map);
    expect(instances[0].setData).toHaveBeenLastCalledWith({ min: 0, max: 1, data: [] });
    options.data = [{ lng: 180, lat: 30, count: 3 }];
    renderer.render(map);
    expect(instances[0].setData).toHaveBeenLastCalledWith({ min: 0, max: 3, data: [] });
    size.x = 120;
    renderer.render(map);
    expect(core.create).toHaveBeenCalledTimes(2);
    options.blur = 0.5;
    renderer.render(map);
    expect(core.create).toHaveBeenCalledTimes(3);
    expect(element.querySelectorAll("canvas")).toHaveLength(1);
    renderer.clear();
    expect(element.children).toHaveLength(0);
  });

  it("applies zero opacity settings and refreshes hidden data when shown", () => {
    const { map, options, renderer, core, element, instances } = setup();
    options.visible = false;
    renderer.render(map);
    expect(core.create).not.toHaveBeenCalled();
    expect(element.style.display).toBe("none");
    options.visible = true;
    options.maxOpacity = 0;
    renderer.render(map);
    expect(core.create.mock.calls[0][0]).toMatchObject({ minOpacity: 0, maxOpacity: 0 });
    expect(instances[0].setData).toHaveBeenCalled();
    expect(element.style.display).toBe("");
    expect(element.style.opacity).toBe("0");
  });
});

describe("custom overlay Vue integration", () => {
  it("keeps slot updates, click handlers and sibling insertion working after DOM relocation", async () => {
    const { map, pane, container } = createMap();
    const state = reactive({ text: "first", position: [20, 30], visible: true, sibling: false });
    const onClick = vi.fn();
    const buttonClick = vi.fn();
    const mapClick = vi.fn();
    container.addEventListener("click", mapClick);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const app = createApp(
      defineComponent({
        setup() {
          provide("mapRoot", shallowRef(map));
          provide("mapEmitter", { on() {}, off() {} });
          return () =>
            h("div", [
              h(
                TdtCustomOverlay,
                {
                  position: state.position,
                  visible: state.visible,
                  anchor: "bottom",
                  extData: "item",
                  class: "user-overlay",
                  style: { position: "fixed", transform: "rotate(20deg)", color: "red" },
                  onClick
                },
                {
                  default: () => h("button", { onClick: buttonClick }, state.text)
                }
              ),
              state.sibling ? h("p", { id: "sibling" }, "sibling") : null
            ]);
        }
      })
    );
    apps.push(app);
    app.mount(host);
    await flush();
    const button = pane.querySelector("button")!;
    expect(button.textContent).toBe("first");
    state.text = "second";
    state.sibling = true;
    await flush();
    expect(pane.querySelector("button")).toBe(button);
    expect(button.textContent).toBe("second");
    expect(host.querySelector("#sibling")).not.toBeNull();
    expect(pane.querySelector<HTMLElement>(".tdt-custom-overlay-content")!.style.transform).toBe(
      "translate(-50%, -100%)"
    );
    expect(pane.querySelector<HTMLElement>(".user-overlay")!.style.position).toBe("absolute");
    expect(pane.querySelector<HTMLElement>(".user-overlay")!.style.color).toBe("red");
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 20, clientY: 30 }));
    expect(buttonClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0]).toMatchObject({ type: "click", extData: "item" });
    expect(mapClick).not.toHaveBeenCalled();
    state.position = [0, 0];
    state.visible = false;
    await flush();
    expect(pane.firstElementChild!.getAttribute("style")).toContain("display: none");
    app.unmount();
    apps.splice(apps.indexOf(app), 1);
    expect(pane.children).toHaveLength(0);
  });

  it("cancels waiting for a map when the component unmounts", async () => {
    const fixture = createMap();
    const pending = new Map<string, Set<(value: unknown) => void>>();
    const emitter = {
      on(event: string, listener: (value: unknown) => void) {
        if (!pending.has(event)) pending.set(event, new Set());
        pending.get(event)!.add(listener);
      },
      off(event: string, listener: (value: unknown) => void) {
        pending.get(event)?.delete(listener);
      }
    };
    const host = document.createElement("div");
    const app = createApp(
      defineComponent({
        setup() {
          provide("mapRoot", shallowRef());
          provide("mapEmitter", emitter);
          return () => h(TdtCustomOverlay, { position: [20, 30] }, { default: () => "pending" });
        }
      })
    );
    app.mount(host);
    app.unmount();
    pending.get("mapInit")?.forEach(listener => listener(fixture.map));
    await flush();
    expect([...pending.values()].every(listeners => listeners.size === 0)).toBe(true);
    expect(fixture.map.addOverLay).not.toHaveBeenCalled();
  });
});
