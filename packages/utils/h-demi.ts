import { h as hDemi, version } from "vue";
import type { VNode as VNodeDemi } from "vue";

export const isVue2 = version.startsWith("2.");

interface Options {
  attrs: object;
  props?: object;
  domProps?: object;
  on?: object;
}

/** VNode.elm in Vue2 */
type VNode = VNodeDemi & { el?: HTMLElement; elm?: HTMLElement };

const adaptOnsV3 = (ons: object) => {
  if (!ons) return null;
  return Object.entries(ons).reduce((ret, [key, handler]) => {
    key = key.charAt(0).toUpperCase() + key.slice(1);
    key = `on${key}`;
    return { ...ret, [key]: handler };
  }, {});
};

export const h = (type: string | any, options?: Options | any, chidren?: any) => {
  if (isVue2) return hDemi(type, options, chidren) as VNode;

  const { attrs, props, domProps, on, scopedSlots, ...extraOptions } = options ?? {};
  const ons = adaptOnsV3(on);
  const params = {
    ...(extraOptions ?? {}),
    ...(attrs ?? {}),
    ...(props ?? {}),
    ...(domProps ?? {}),
    ...(ons ?? {})
  };

  return hDemi(type, params, scopedSlots || chidren) as VNode;
};

export const slot = (s: any, attrs?: any) => {
  if (typeof s == "function") return s(attrs);
  return s;
};
