import { defineComponent, watch } from "vue";
import type { SharedComponent } from "../../types";
import { useSvg, type SvgOverlayContext, type SvgOverlayHandle } from "./useSvg";

export type { SvgOverlayContext, SvgOverlayHandle, UseSvgOptions, UseSvgResult } from "./useSvg";

const PROPS = {
  /** 是否显示 SVG 图层 */
  visible: { type: Boolean, default: true },
  /** SVG 容器相对地图视图扩展的比例，仅初始化时生效 */
  padding: { type: Number, default: 0.1 },
  /** SVG 根元素的层级 */
  zIndex: { type: Number }
};

const EVENTS = {
  /** SVG 图层创建完成 */
  init: (_handle: SvgOverlayHandle) => true,
  /** 初始化后、缩放结束或容器尺寸变化时触发 */
  redraw: (_context: SvgOverlayContext) => true
};

export interface SvgOverlayExposed {
  getSvg(): T.SVG | undefined;
  getRoot(): SVGGElement | undefined;
  getMap(): T.Map | undefined;
  redraw(): void;
}

export const TdtSvgOverlay = defineComponent({
  name: "TdtSvgOverlay",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit, expose }) {
    const { svg, map, redraw, getContext } = useSvg({
      padding: props.padding,
      onRedraw: context => emit("redraw", context)
    });

    expose({
      getSvg: () => svg.value,
      getRoot: () => svg.value?._rootGroup,
      getMap: () => map.value,
      redraw
    } as SvgOverlayExposed);

    watch(
      [() => props.visible, svg],
      ([visible, instance]) => {
        if (instance?.Ow) instance.Ow.style.display = visible ? "" : "none";
      },
      { immediate: true }
    );
    watch(
      [() => props.zIndex, svg],
      ([zIndex, instance]) => {
        if (instance?.Ow) instance.Ow.style.zIndex = zIndex == null ? "" : String(zIndex);
      },
      { immediate: true }
    );
    watch(
      svg,
      instance => {
        if (!instance) return;
        const context = getContext();
        if (context) emit("init", context);
      },
      { immediate: true }
    );

    return () => null;
  }
}) as unknown as SharedComponent<typeof PROPS, typeof EVENTS, SvgOverlayExposed>;

export type TdtSvgOverlay = InstanceType<typeof TdtSvgOverlay>;
