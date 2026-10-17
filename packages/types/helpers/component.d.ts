import type { ExtractPropTypes, SetupContext, ComponentPublicInstance, ComponentPropsOptions, DefineComponent } from "vue";

export type EmitsOptions = string[] | Record<string, ((...args: any[]) => any) | null>;

/** Only use the shared Vue 2.7 / Vue 3 public type parameter positions. */
export type SharedComponent<P extends ComponentPropsOptions = {}, E extends EmitsOptions = {}, Exposed = {}> =
  DefineComponent<P, Exposed, {}, {}, {}, {}, {}, E>;

export type Data<V = any> = Record<string, V>;

export type DefineProps<P> = ExtractPropTypes<P>;

export type DefineEmits<E extends EmitsOptions> = SetupContext<E>["emit"];

export type ComponentInstance<P, E extends EmitsOptions> = ComponentPublicInstance<P, Data, Data, Data, Data, E>;
