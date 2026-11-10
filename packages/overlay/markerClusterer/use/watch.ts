import { watch } from "vue";
import { toMarker, toPoint } from "../../../utils";
import { Props, type ClusterMarker } from "./";

interface TrackedMarker {
  marker: T.Marker;
  signature: string;
}

function signatureOf(config: ClusterMarker): string | undefined {
  try {
    return JSON.stringify(config);
  } catch {
    // Circular business data attached to extData still works, but cannot be diffed.
    return undefined;
  }
}

export function useWatch({ props, instance }: { props: Props; instance: T.MarkerClusterer }) {
  const tracked = new Map<string, TrackedMarker>();

  function fullRebuild(list: readonly ClusterMarker[]) {
    instance.clearMarkers();
    tracked.clear();
    if (!list.length) return;
    const markers = list.map(config => toMarker(config));
    instance.addMarkers(markers);
    list.forEach((config, index) => {
      const signature = signatureOf(config);
      if (config.id == null || signature === undefined) return;
      tracked.set(String(config.id), { marker: markers[index], signature });
    });
  }

  function apply(list: readonly ClusterMarker[]) {
    const keys = new Set<string>();
    const signatures = new Map<string, string>();
    for (const config of list) {
      if (config.id == null) {
        fullRebuild(list);
        return;
      }
      const key = String(config.id);
      const signature = signatureOf(config);
      if (signature === undefined || keys.has(key)) {
        fullRebuild(list);
        return;
      }
      keys.add(key);
      signatures.set(key, signature);
    }

    const removed: T.Marker[] = [];
    const added: T.Marker[] = [];
    const next = new Map<string, TrackedMarker>();
    list.forEach(config => {
      const key = String(config.id);
      const signature = signatures.get(key)!;
      const existing = tracked.get(key);
      if (existing && existing.signature === signature) {
        next.set(key, existing);
        return;
      }
      if (existing) removed.push(existing.marker);
      const marker = toMarker(config);
      added.push(marker);
      next.set(key, { marker, signature });
    });
    tracked.forEach((entry, key) => {
      if (!next.has(key)) removed.push(entry.marker);
    });
    // Batch removals before additions so changed markers never duplicate in one frame.
    if (removed.length) instance.removeMarkers(removed);
    if (added.length) instance.addMarkers(added);
    tracked.clear();
    next.forEach((entry, key) => tracked.set(key, entry));
  }

  watch(
    () => props.girdSize,
    val => val != null && instance.setGridSize(val)
  );
  watch(
    () => props.maxZoom,
    val => val != null && instance.setMaxZoom(val)
  );
  watch(
    () => props.markers,
    val => apply(val ?? []),
    { deep: true, immediate: true }
  );
  watch(
    () => props.styles,
    val => {
      const styles =
        val?.map(item => {
          return {
            ...item,
            offset: item.offset && toPoint(item.offset)
          };
        }) ?? [];
      instance.setStyles(styles);
    },
    { immediate: true }
  );
}
