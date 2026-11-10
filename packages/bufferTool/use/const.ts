import { PropType } from "vue";
import type { DefineEmits, DefineProps } from "../../types";

export const DEFAULT_BUFFER_STYLE: T.BufferToolStyle = {
  color: "red",
  weight: 3,
  opacity: 0.5,
  fillColor: "#FFFFFF",
  fillOpacity: 0.5,
  lineStyle: "dashed"
};

export const PROPS = {
  /** 参与缓冲区分析的图形实例；同一实例不应同时由其他组件管理 */
  layers: { type: Array as unknown as PropType<readonly T.BufferToolLayer[]>, default: () => [] },
  /** 是否启用拖拽生成/调整缓冲区 */
  active: { type: Boolean, default: true },
  /** 缓冲区样式 */
  style: { type: Object as PropType<T.BufferToolStyle>, default: () => ({ ...DEFAULT_BUFFER_STYLE }) }
};

export const EVENTS = {
  /** 缓冲区工具初始化完成 */
  init: (_tool: T.BufferTool) => true,
  /** 开始拖动图形或缓冲区 */
  "drag-start": (_event: T.BufferToolEvent) => true,
  /** 拖动中，radius 为当前缓冲区半径 */
  drag: (_event: T.BufferToolEvent) => true,
  /** 拖动结束，radius 为最终缓冲区半径 */
  "drag-end": (_event: T.BufferToolEvent) => true,
  /** 初始化或同步失败 */
  error: (_error: Error) => true
};

export type Props = DefineProps<typeof PROPS>;
export type Emit = DefineEmits<typeof EVENTS>;
