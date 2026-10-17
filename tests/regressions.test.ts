import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, defineComponent, effectScope, h, nextTick, provide, reactive, shallowRef } from "vue";
import mitt from "mitt";
import type { MapEmitEvents } from "../packages/types";
import { useMapTask } from "../packages/use/mapRoot";
import { useWatch as useMarkerWatch } from "../packages/overlay/marker/use/watch";
import { useWatch as useLabelWatch } from "../packages/overlay/label/use/watch";
import { useWatch as usePolylineWatch } from "../packages/overlay/polyline/use/watch";
import { useWatch as useCloudMarkerWatch } from "../packages/overlay/cloudMarkerCollection/use/watch";
import { useWatch as useMapWatch } from "../packages/map/use/watch";

class LngLat {
  constructor(
    public lng: number,
    public lat: number
  ) {}
}

beforeEach(() => {
  vi.stubGlobal("T", { LngLat });
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.head.replaceChildren();
  document.body.replaceChildren();
  vi.useRealTimers();
});

async function flush() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe("falsy prop updates", () => {
  it("applies marker opacity and z-index offset of zero", async () => {
    const props = reactive({
      icon: undefined,
      draggable: false,
      title: "",
      zIndexOffset: 5,
      opacity: 1,
      position: [1, 2],
      visible: true,
      extData: undefined
    });
    const instance = {
      setOpacity: vi.fn(),
      setZIndexOffset: vi.fn(),
      setLngLat: vi.fn(),
      setIcon: vi.fn(),
      enableDragging: vi.fn(),
      disableDragging: vi.fn(),
      show: vi.fn(),
      hide: vi.fn()
    };
    const scope = effectScope();
    scope.run(() => useMarkerWatch({ props: props as never, instance: instance as never }));

    instance.setOpacity.mockClear();
    instance.setZIndexOffset.mockClear();
    props.opacity = 0;
    props.zIndexOffset = 0;
    await nextTick();

    expect(instance.setOpacity).toHaveBeenCalledWith(0);
    expect(instance.setZIndexOffset).toHaveBeenCalledWith(0);
    scope.stop();
  });

  it("applies label opacity of zero", async () => {
    const props = reactive({
      position: [1, 2],
      text: "label",
      offset: [0, 0],
      title: "",
      zIndex: 1,
      fontSize: 12,
      fontColor: "#000",
      backgroundColor: "#fff",
      borderLine: 0,
      borderColor: "#000",
      opacity: 1,
      visible: true
    });
    const instance = {
      setLngLat: vi.fn(),
      setLabel: vi.fn(),
      setOffset: vi.fn(),
      setTitle: vi.fn(),
      setZIndex: vi.fn(),
      setFontSize: vi.fn(),
      setFontColor: vi.fn(),
      setBackgroundColor: vi.fn(),
      setBorderLine: vi.fn(),
      setBorderColor: vi.fn(),
      setOpacity: vi.fn(),
      show: vi.fn(),
      hide: vi.fn()
    };
    const scope = effectScope();
    scope.run(() => useLabelWatch({ props: props as never, instance: instance as never }));

    instance.setOpacity.mockClear();
    props.opacity = 0;
    await nextTick();

    expect(instance.setOpacity).toHaveBeenCalledWith(0);
    scope.stop();
  });

  it("applies polyline weight of zero", async () => {
    const props = reactive({
      path: [
        [1, 2],
        [3, 4]
      ],
      color: "#000",
      opacity: 1,
      weight: 5,
      lineStyle: "solid",
      edit: false,
      visible: true
    });
    const instance = {
      setLngLats: vi.fn(),
      setColor: vi.fn(),
      setOpacity: vi.fn(),
      setWeight: vi.fn(),
      setLineStyle: vi.fn(),
      enableEdit: vi.fn(),
      disableEdit: vi.fn(),
      show: vi.fn(),
      hide: vi.fn()
    };
    const scope = effectScope();
    scope.run(() => usePolylineWatch({ props: props as never, instance: instance as never }));

    instance.setWeight.mockClear();
    props.weight = 0;
    await nextTick();

    expect(instance.setWeight).toHaveBeenCalledWith(0);
    scope.stop();
  });
});

describe("array prop updates", () => {
  it("reacts to in-place polyline path edits", async () => {
    const path = reactive([
      [1, 2],
      [3, 4]
    ]);
    const props = reactive({
      path,
      color: "#000",
      opacity: 1,
      weight: 5,
      lineStyle: "solid",
      edit: false,
      visible: true
    });
    const instance = {
      setLngLats: vi.fn(),
      setColor: vi.fn(),
      setOpacity: vi.fn(),
      setWeight: vi.fn(),
      setLineStyle: vi.fn(),
      enableEdit: vi.fn(),
      disableEdit: vi.fn(),
      show: vi.fn(),
      hide: vi.fn()
    };
    const scope = effectScope();
    scope.run(() => usePolylineWatch({ props: props as never, instance: instance as never }));

    instance.setLngLats.mockClear();
    path.push([5, 6]);
    await nextTick();

    expect(instance.setLngLats).toHaveBeenCalledTimes(1);
    expect(instance.setLngLats.mock.calls[0][0]).toHaveLength(3);
    scope.stop();
  });

  it("reacts to cloud marker style and in-place lnglat edits", async () => {
    const lnglats = reactive([[1, 2]]);
    const props = reactive({
      ShapeType: "CIRCLE",
      SizeType: "TINY",
      color: "#fa937e",
      lnglats
    });
    const instance = { setLnglats: vi.fn(), setStyles: vi.fn() };
    const scope = effectScope();
    scope.run(() => useCloudMarkerWatch({ props: props as never, instance: instance as never }));

    props.color = "red";
    await nextTick();
    expect(instance.setStyles).toHaveBeenCalledWith({ ShapeType: "CIRCLE", SizeType: "TINY", color: "red" });

    instance.setLnglats.mockClear();
    lnglats.push([3, 4]);
    await nextTick();
    expect(instance.setLnglats).toHaveBeenCalledTimes(1);
    scope.stop();
  });
});

describe("map two-way binding", () => {
  function createMapInstance() {
    const listeners = new Map<string, () => void>();
    const instance = {
      getCenter: () => ({ lng: 3, lat: 4 }),
      getZoom: () => 9,
      panTo: vi.fn(),
      enableDrag: vi.fn(),
      disableDrag: vi.fn(),
      enableScrollWheelZoom: vi.fn(),
      disableScrollWheelZoom: vi.fn(),
      enableDoubleClickZoom: vi.fn(),
      disableDoubleClickZoom: vi.fn(),
      enableKeyboard: vi.fn(),
      disableKeyboard: vi.fn(),
      enableInertia: vi.fn(),
      disableInertia: vi.fn(),
      enableContinuousZoom: vi.fn(),
      disableContinuousZoom: vi.fn(),
      enablePinchToZoom: vi.fn(),
      disablePinchToZoom: vi.fn(),
      enableAutoResize: vi.fn(),
      disableAutoResize: vi.fn(),
      setMinZoom: vi.fn(),
      setMaxZoom: vi.fn(),
      setMaxBounds: vi.fn(),
      setViewport: vi.fn(),
      setStyle: vi.fn(),
      removeStyle: vi.fn(),
      addEventListener: vi.fn((event: string, listener: () => void) => listeners.set(event, listener)),
      removeEventListener: vi.fn((event: string) => listeners.delete(event))
    };
    return { instance, listeners };
  }

  const props = () => ({
    projection: "EPSG:900913",
    minZoom: 1,
    maxZoom: 18,
    center: [1, 2],
    zoom: 5,
    drag: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    keyboard: true,
    inertia: true,
    continuousZoom: true,
    pinchToZoom: true,
    autoResize: true,
    maxBounds: undefined,
    viewport: undefined,
    mapStyle: undefined
  });

  it("emits update:center and update:zoom after user interaction", () => {
    const { instance, listeners } = createMapInstance();
    const emit = vi.fn();
    const scope = effectScope();
    scope.run(() => useMapWatch({ props: reactive(props()) as never, instance: instance as never, emit }));

    listeners.get("moveend")!();
    expect(emit).toHaveBeenCalledWith("update:center", [3, 4]);

    listeners.get("zoomend")!();
    expect(emit).toHaveBeenCalledWith("update:zoom", 9);

    scope.stop();
  });

  it("removes the binding listeners on cleanup", () => {
    const { instance } = createMapInstance();
    const scope = effectScope();
    let cleanup: (() => void) | undefined;
    scope.run(() => {
      cleanup = useMapWatch({ props: reactive(props()) as never, instance: instance as never, emit: vi.fn() });
    });
    cleanup!();
    expect(instance.removeEventListener).toHaveBeenCalledWith("moveend", expect.any(Function));
    expect(instance.removeEventListener).toHaveBeenCalledWith("zoomend", expect.any(Function));
    scope.stop();
  });
});

describe("child component errors", () => {
  it("reports plugin loading failures through the map emitter", async () => {
    vi.stubGlobal("T", { Map: class {}, LngLat });
    const map = shallowRef<T.Map>({} as T.Map);
    const emitter = mitt<MapEmitEvents>();
    const error = vi.fn();
    emitter.on("componentError", error);

    const Child = defineComponent({
      setup() {
        useMapTask(() => undefined, { plugins: ["CarTrack"] });
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
    await flush();

    const script = document.scripts[0];
    expect(script).toBeTruthy();
    script.dispatchEvent(new Event("error"));
    await flush();

    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(error.mock.calls[0][0].message).toContain("Failed to load");
    app.unmount();
  });
});
