import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, defineComponent, effectScope, h, nextTick, provide, ref, shallowRef, watch } from "vue";
import mitt from "mitt";
import type { MapEmitEvents } from "../packages/types";
import { useMapTask } from "../packages/use/mapRoot";
import { useEvent } from "../packages/use/event";

async function flush() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe("API loading", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.stubGlobal("T", undefined);
    document.head.innerHTML = "";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    document.head.innerHTML = "";
  });

  it("shares the main script and loads later plugins with dependency ordering", async () => {
    const { useApiLoader } = await import("../packages/use/apiLoader");
    const one = useApiLoader({ apiUrl: "https://example.test/api.js" });
    const two = useApiLoader({ apiUrl: "https://example.test/api.js" });
    expect(document.scripts).toHaveLength(1);
    vi.stubGlobal("T", { Map: class {} });
    document.scripts[0].dispatchEvent(new Event("load"));
    await Promise.all([one, two]);

    const plugin = useApiLoader({ plugins: ["CarTrack"], pluginUrls: { CarTrack: ["https://example.test/d3.js", "https://example.test/car.js"] } });
    expect(document.scripts).toHaveLength(2);
    expect(document.scripts[1].src).toContain("d3.js");
    document.scripts[1].dispatchEvent(new Event("load"));
    await flush();
    expect(document.scripts).toHaveLength(3);
    expect(document.scripts[2].src).toContain("car.js");
    document.scripts[2].dispatchEvent(new Event("load"));
    await plugin;
    await useApiLoader({ plugins: ["CarTrack"], pluginUrls: { CarTrack: ["https://example.test/d3.js", "https://example.test/car.js"] } });
    expect(document.scripts).toHaveLength(3);
  });

  it("retries failed API and plugin loads instead of caching rejected promises", async () => {
    const { useApiLoader } = await import("../packages/use/apiLoader");
    const first = useApiLoader({ apiUrl: "https://example.test/api.js" });
    const failed = expect(first).rejects.toThrow("Failed to load");
    document.scripts[0].dispatchEvent(new Event("error"));
    await failed;
    expect(document.scripts).toHaveLength(0);
    const retry = useApiLoader({ apiUrl: "https://example.test/api.js" });
    vi.stubGlobal("T", { Map: class {} });
    document.scripts[0].dispatchEvent(new Event("load"));
    await retry;

    const options = { plugins: ["HeatmapOverlay" as const], pluginUrls: { HeatmapOverlay: "https://example.test/heatmap.js" } };
    const plugin = useApiLoader(options);
    const pluginFailed = expect(plugin).rejects.toThrow("Failed to load");
    document.scripts[1].dispatchEvent(new Event("error"));
    await pluginFailed;
    const pluginRetry = useApiLoader(options);
    document.scripts[1].dispatchEvent(new Event("load"));
    await pluginRetry;
  });

  it("shares dependencies between independently requested plugin chains", async () => {
    const { useApiLoader } = await import("../packages/use/apiLoader");
    vi.stubGlobal("T", { Map: class {} });
    const promises = ["D3", "CarTrack"].map(name => useApiLoader({
      plugins: [name as "D3" | "CarTrack"],
      pluginUrls: { D3: ["https://example.test/shared.js"], CarTrack: ["https://example.test/shared.js", "https://example.test/track.js"] }
    }));
    expect(document.scripts).toHaveLength(1);
    document.scripts[0].dispatchEvent(new Event("load"));
    await flush();
    expect(document.scripts).toHaveLength(2);
    document.scripts[1].dispatchEvent(new Event("load"));
    await Promise.all(promises);
  });

  it("times out, rejects scripts without T.Map, and permits a retry", async () => {
    const { useApiLoader } = await import("../packages/use/apiLoader");
    const timeout = useApiLoader({ apiUrl: "https://example.test/api.js", timeout: 10 });
    const rejected = expect(timeout).rejects.toThrow("Timed out");
    await vi.advanceTimersByTimeAsync(10);
    await rejected;
    const missing = useApiLoader({ apiUrl: "https://example.test/api.js" });
    const missingRejected = expect(missing).rejects.toThrow("without providing T.Map");
    document.scripts[0].dispatchEvent(new Event("load"));
    await missingRejected;
    const retry = useApiLoader({ apiUrl: "https://example.test/api.js" });
    vi.stubGlobal("T", { Map: class {} });
    document.scripts[1].dispatchEvent(new Event("load"));
    await retry;
  });

  it("keeps configured defaults and reports explicit SSR loading clearly", async () => {
    const { configureApiLoader, useApiLoader } = await import("../packages/use/apiLoader");
    configureApiLoader({ tk: "configured token" });
    const loaded = useApiLoader();
    expect(document.scripts[0].src).toContain("tk=configured%20token");
    vi.stubGlobal("T", { Map: class {} });
    document.scripts[0].dispatchEvent(new Event("load"));
    await loaded;
    vi.stubGlobal("document", undefined);
    configureApiLoader({ tk: "server safe" });
    await expect(useApiLoader()).rejects.toThrow("only be loaded in a browser");
  });
});

describe("component owned map work", () => {
  it("cancels pending initialization when a child unmounts", async () => {
    const map = shallowRef<T.Map>();
    const emitter = mitt<MapEmitEvents>();
    const show = ref(true);
    const initialize = vi.fn();
    const Child = defineComponent({ setup() { useMapTask(initialize); return () => null; } });
    const Parent = defineComponent({
      setup() {
        provide("mapRoot", map);
        provide("mapEmitter", emitter);
        return () => show.value ? h(Child) : h("div");
      }
    });
    const app = createApp(Parent);
    app.mount(document.createElement("div"));
    expect(emitter.all.get("mapInit")).toHaveLength(1);
    show.value = false;
    await flush();
    expect(emitter.all.get("mapInit") || []).toHaveLength(0);
    emitter.emit("mapInit", {} as T.Map);
    await flush();
    expect(initialize).not.toHaveBeenCalled();
    app.unmount();
  });

  it("stops watchers created after map readiness and runs cleanup once", async () => {
    const map = shallowRef<T.Map>();
    const emitter = mitt<MapEmitEvents>();
    const source = ref(0);
    const changed = vi.fn();
    const cleanup = vi.fn();
    const Child = defineComponent({
      setup() {
        useMapTask((_map, onCleanup) => {
          watch(source, changed);
          onCleanup(cleanup);
        });
        return () => null;
      }
    });
    const Parent = defineComponent({
      setup() {
        provide("mapRoot", map);
        provide("mapEmitter", emitter);
        return () => h(Child);
      }
    });
    const app = createApp(Parent);
    app.mount(document.createElement("div"));
    emitter.emit("mapInit", {} as T.Map);
    await flush();
    source.value++;
    await flush();
    expect(changed).toHaveBeenCalledTimes(1);
    app.unmount();
    source.value++;
    await flush();
    expect(changed).toHaveBeenCalledTimes(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("removes every SDK listener with its original callback", () => {
    const instance = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
    const emit = vi.fn();
    const scope = effectScope();
    let dispose: (() => void) | undefined;
    scope.run(() => { dispose = useEvent({ instance, events: ["click", "move"], emit }); });
    expect(instance.addEventListener.mock.calls.map(call => call[0])).toEqual(["click", "move"]);
    const click = instance.addEventListener.mock.calls[0][1];
    click({ type: "click" });
    expect(emit).toHaveBeenCalledWith("click", { type: "click", extData: undefined });
    scope.stop();
    dispose?.();
    expect(instance.removeEventListener).toHaveBeenCalledTimes(2);
    expect(instance.removeEventListener).toHaveBeenCalledWith("click", click);
  });
});
