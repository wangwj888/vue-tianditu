import { PropType } from "vue";
import { DefineEmits, DefineProps } from "../../../types";

export const NATIVE_PROPS = {
  /** 图片地址 */
  url: { type: String, required: true as const },
  /** 图片覆盖的地理范围 */
  bounds: { type: Array as unknown as PropType<VT.Bounds>, required: true as const },
  /** 图片透明度，范围 0-1 */
  opacity: { type: Number, default: 1 },
  /** 图片替代文本 */
  alt: { type: String, default: "" }
};

export const EXTRA_PROPS = {
  /** 是否可见 */
  visible: { type: Boolean, default: true },
  /** 覆盖物层级；天地图按元素 z-index 生效 */
  zIndex: { type: Number }
};

export const EVENTS = {
  /** 图片覆盖物创建完成 */
  init: (e: T.ImageOverlay) => e instanceof T.ImageOverlay
};

export const PROPS = { ...NATIVE_PROPS, ...EXTRA_PROPS };
export type Props = DefineProps<typeof PROPS>;
export type Emit = DefineEmits<typeof EVENTS>;
