import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, nextTick, reactive } from "vue";
import { useWatch as useClusterWatch } from "../packages/overlay/markerClusterer/use/watch";
import { useWatch as useCloudWatch } from "../packages/overlay/cloudMarkerCollection/use/watch";

class LngLat {
  constructor(
    public lng: number,
    public lat: number
  ) {}
}

class Marker {
  extData: unknown;
  constructor(
    public lnglat: LngLat,
    public options: unknown
  ) {}
  setIcon() {}
}

beforeEach(() => {
  vi.stubGlobal("T", { LngLat, Marker });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function flush() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function clusterProps() {
  return reactive({
    girdSize: 60,
    maxZoom: 18,
    styles: [],
    markers: [
      { id: "a", position: [1, 2] as [number, number], title: "A" },
      { id: "b", position: [3, 4] as [number, number], title: "B" }
    ]
  });
}

describe("marker clusterer diff", () => {
  it("adds only new markers when ids are stable", async () => {
    const props = clusterProps();
    const instance = {
      addMarkers: vi.fn(),
      removeMarkers: vi.fn(),
      clearMarkers: vi.fn(),
      setGridSize: vi.fn(),
      setMaxZoom: vi.fn(),
      setStyles: vi.fn()
    };
    const scope = effectScope();
    scope.run(() => useClusterWatch({ props: props as never, instance: instance as never }));
    await flush();

    const initialMarkers = instance.addMarkers.mock.calls[0][0];
    expect(initialMarkers).toHaveLength(2);
    instance.addMarkers.mockClear();
    instance.removeMarkers.mockClear();

    props.markers.push({ id: "c", position: [5, 6], title: "C" });
    await flush();

    expect(instance.removeMarkers).not.toHaveBeenCalled();
    expect(instance.addMarkers).toHaveBeenCalledTimes(1);
    expect(instance.addMarkers.mock.calls[0][0]).toHaveLength(1);
    scope.stop();
  });

  it("replaces changed markers and removes deleted ones", async () => {
    const props = clusterProps();
    const instance = {
      addMarkers: vi.fn(),
      removeMarkers: vi.fn(),
      clearMarkers: vi.fn(),
      setGridSize: vi.fn(),
      setMaxZoom: vi.fn(),
      setStyles: vi.fn()
    };
    const scope = effectScope();
    scope.run(() => useClusterWatch({ props: props as never, instance: instance as never }));
    await flush();
    const initialMarkers = instance.addMarkers.mock.calls[0][0];
    instance.addMarkers.mockClear();
    instance.removeMarkers.mockClear();

    props.markers[1].position = [7, 8];
    await flush();
    expect(instance.removeMarkers).toHaveBeenCalledWith([initialMarkers[1]]);
    expect(instance.addMarkers).toHaveBeenCalledTimes(1);
    const replacement = instance.addMarkers.mock.calls[0][0][0];

    instance.removeMarkers.mockClear();
    props.markers.pop();
    await flush();
    expect(instance.removeMarkers).toHaveBeenCalledWith([replacement]);
    scope.stop();
  });

  it("falls back to a full rebuild without stable ids", async () => {
    const props = clusterProps();
    const instance = {
      addMarkers: vi.fn(),
      removeMarkers: vi.fn(),
      clearMarkers: vi.fn(),
      setGridSize: vi.fn(),
      setMaxZoom: vi.fn(),
      setStyles: vi.fn()
    };
    const scope = effectScope();
    scope.run(() => useClusterWatch({ props: props as never, instance: instance as never }));
    await flush();
    instance.clearMarkers.mockClear();
    instance.addMarkers.mockClear();

    props.markers = [{ position: [1, 2], title: "A" }] as never;
    await flush();

    expect(instance.clearMarkers).toHaveBeenCalledTimes(1);
    expect(instance.addMarkers).toHaveBeenCalledTimes(1);
    scope.stop();
  });
});

describe("cloud marker updates", () => {
  it("coalesces mutations in one tick and skips identical snapshots", async () => {
    const props = reactive({
      lnglats: [[1, 2]] as [number, number][],
      ShapeType: "CIRCLE" as const,
      SizeType: "TINY" as const,
      color: "#fa937e"
    });
    const instance = { setLnglats: vi.fn(), setStyles: vi.fn() };
    const scope = effectScope();
    scope.run(() => useCloudWatch({ props: props as never, instance: instance as never }));
    await flush();
    expect(instance.setLnglats).not.toHaveBeenCalled();

    props.lnglats.push([3, 4]);
    props.lnglats.push([5, 6]);
    await flush();
    expect(instance.setLnglats).toHaveBeenCalledTimes(1);
    expect(instance.setLnglats.mock.calls[0][0]).toHaveLength(3);

    instance.setLnglats.mockClear();
    props.lnglats = [
      [1, 2],
      [3, 4],
      [5, 6]
    ];
    await flush();
    expect(instance.setLnglats).not.toHaveBeenCalled();
    scope.stop();
  });
});
