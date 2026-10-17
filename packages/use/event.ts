import { getCurrentScope, onScopeDispose } from "vue";

/** Bind SDK events and return an idempotent disposer. */
export function useEvent({ events, emit, instance, emitted, extData }: any): () => void {
  const names: string[] = Array.isArray(events) ? events : Object.keys(events || {});
  const listeners = names.map(event => {
    const handler = (e: any) => {
      emit(event, { ...e, extData });
      emitted?.(event);
    };
    instance.addEventListener(event, handler);
    return { event, handler };
  });
  let active = true;
  const dispose = () => {
    if (!active) return;
    active = false;
    listeners.forEach(({ event, handler }) => instance.removeEventListener?.(event, handler));
  };
  if (getCurrentScope()) onScopeDispose(dispose);
  return dispose;
}
