import { effectScope, getCurrentScope, inject, onBeforeMount, onBeforeUnmount, onMounted, onScopeDispose } from "vue";
import type { Ref } from "vue";
import type { MapEmitter } from "../types";
import { useApiLoader } from "./apiLoader";
import type { PluginName } from "./apiLoader";

export function abortError(): Error {
  const error = new Error("The map operation was cancelled.");
  error.name = "AbortError";
  return error;
}

/** Capture injected dependencies synchronously, before waiting for the map. */
export function useMapRoot({ signal }: { signal?: AbortSignal } = {}): Promise<T.Map> {
  const mapRoot = inject<Ref<T.Map | undefined>>("mapRoot");
  const emitter = inject<MapEmitter>("mapEmitter");
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      emitter?.off("mapInit", ready);
      emitter?.off("mapError", failed);
      emitter?.off("mapDisposed", cancelled);
      signal?.removeEventListener("abort", cancelled);
    };
    const ready = (map: T.Map) => { cleanup(); resolve(map); };
    const failed = (error: Error) => { cleanup(); reject(error); };
    const cancelled = () => failed(abortError());
    if (getCurrentScope()) onScopeDispose(cancelled);
    if (signal?.aborted) return cancelled();
    if (!mapRoot || !emitter) return failed(new Error("This component must be placed inside TdtMap."));
    if (mapRoot.value) return ready(mapRoot.value);
    emitter.on("mapInit", ready);
    emitter.on("mapError", failed);
    emitter.on("mapDisposed", cancelled);
    signal?.addEventListener("abort", cancelled, { once: true });
  });
}

/** Own effects created after an await and stop them before the component leaves. */
export function useComponentScope() {
  const scope = effectScope(true);
  const controller = new AbortController();
  const cleanups: (() => void)[] = [];
  let active = true;
  const dispose = () => {
    if (!active) return;
    active = false;
    controller.abort();
    scope.stop();
    for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  };
  onBeforeUnmount(dispose);
  if (getCurrentScope()) onScopeDispose(dispose);
  return {
    get active() { return active; },
    signal: controller.signal,
    run<R>(task: () => R): R | undefined { return active ? scope.run(task) : undefined; },
    onCleanup(cleanup: () => void) { active ? cleanups.push(cleanup) : cleanup(); }
  };
}

/** Run synchronous SDK initialization/watchers inside a component owned scope. */
export function useMapTask(task: (map: T.Map, onCleanup: (cleanup: () => void) => void) => void, { mounted = false, plugins = [] }: { mounted?: boolean; plugins?: PluginName[] } = {}): void {
  const lifecycle = useComponentScope();
  const emitter = inject<MapEmitter>("mapEmitter");
  const map = useMapRoot({ signal: lifecycle.signal });
  // Handle rejection immediately, including components that never mount.
  const result = map.then(value => ({ value }), error => ({ error }));
  const report = (reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    emitter?.emit("componentError", error);
  };
  (mounted ? onMounted : onBeforeMount)(async () => {
    const settled = await result;
    if (!lifecycle.active) return;
    if ("error" in settled) return;
    try {
      if (plugins.length) await useApiLoader({ plugins });
      if (!lifecycle.active) return;
      lifecycle.run(() => task(settled.value, lifecycle.onCleanup));
    } catch (reason) {
      if (lifecycle.active) report(reason);
    }
  });
}
