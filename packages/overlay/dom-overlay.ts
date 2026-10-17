/** Shared DOM lifecycle for overlays owned by a Vue component. */
export interface DomOverlayOptions {
  element: HTMLElement;
  update(map: T.Map): void;
  onAdd?(map: T.Map): void;
  onRemove?(): void;
  events?: (keyof T.MapEvents)[];
}

export interface DomOverlay {
  overlay: T.Overlay;
  refresh(): void;
  requestUpdate(): void;
  destroy(): void;
}

export function createDomOverlay(options: DomOverlayOptions): DomOverlay {
  let map: T.Map | undefined;
  let cancelFrame: (() => void) | undefined;
  let destroyed = false;
  const { element } = options;
  const events = options.events ?? ["move", "moveend", "zoomend", "resize"];

  function refresh() {
    if (!destroyed && map) options.update(map);
  }

  function requestUpdate() {
    if (destroyed || !map || cancelFrame) return;
    const render = () => {
      cancelFrame = undefined;
      refresh();
    };
    if (typeof requestAnimationFrame === "function") {
      const frame = requestAnimationFrame(render);
      cancelFrame = () => cancelAnimationFrame(frame);
    } else {
      const timer = setTimeout(render, 16);
      cancelFrame = () => clearTimeout(timer);
    }
  }

  function detach() {
    cancelFrame?.();
    cancelFrame = undefined;
    const previousMap = map;
    map = undefined;
    events.forEach(event => previousMap?.removeEventListener(event, requestUpdate));
    element.parentNode?.removeChild(element);
    if (previousMap) options.onRemove?.();
  }

  const Overlay = T.Overlay.extend({
    initialize() {},
    onAdd(nextMap: T.Map) {
      if (destroyed) return element;
      map = nextMap;
      const pane = map.getPanes().overlayPane;
      if (!pane) throw new Error("The Tianditu map does not provide an overlayPane.");
      pane.appendChild(element);
      events.forEach(event => map?.addEventListener(event, requestUpdate));
      options.onAdd?.(map);
      refresh();
      return element;
    },
    onRemove: detach,
    update: requestUpdate,
    show() {
      element.style.display = "";
    },
    hide() {
      element.style.display = "none";
    },
    isHidden() {
      return element.style.display === "none";
    },
    getElement() {
      return element;
    }
  });
  const overlay = new Overlay();

  return {
    overlay,
    refresh,
    requestUpdate,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      try {
        if (map) map.removeOverLay(overlay);
      } finally {
        // onAdd may have failed, or the SDK may already have disposed its map.
        detach();
      }
    }
  };
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function toOverlayError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
