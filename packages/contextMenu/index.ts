import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
  type PropType
} from "vue";
import type { SharedComponent } from "../types";
import { useMapTask } from "../use";
import { h } from "../utils";
import "./style.scss";

export interface ContextMenuItem {
  key: string;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  /** 图标地址；也支持传入 data URL */
  iconUrl?: string;
}

export interface ContextMenuDivider {
  type: "divider";
  key?: string;
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuDivider;

export interface ContextMenuContext {
  lnglat: VT.LngLat;
  containerPoint: VT.Point;
  originalEvent?: MouseEvent;
}

export interface ContextMenuSlotProps extends ContextMenuContext {
  items: readonly ContextMenuEntry[];
  visible: boolean;
  select(item: ContextMenuItem): void;
  close(): void;
}

export interface ContextMenuItemSlotProps {
  item: ContextMenuItem;
  index: number;
  select(): void;
}

export interface ContextMenuExposed {
  open(lnglat: VT.LngLat, options?: Partial<Omit<ContextMenuContext, "lnglat">>): void;
  close(): void;
  getMenuElement(): HTMLElement | undefined;
}

const PROPS = {
  /** 菜单项；也可以通过默认插槽完全自定义 */
  items: { type: Array as unknown as PropType<readonly ContextMenuEntry[]>, default: () => [] },
  /** 是否响应地图右键 */
  enabled: { type: Boolean, default: true },
  /** 受控显隐；不传时由组件内部管理 */
  visible: { type: Boolean, default: undefined },
  /** 相对鼠标位置的偏移 */
  offset: { type: Array as unknown as PropType<VT.Point>, default: () => [0, 0] },
  /** 点击菜单项后是否自动关闭 */
  closeOnSelect: { type: Boolean, default: true },
  /** 地图平移或缩放时是否自动关闭 */
  closeOnMove: { type: Boolean, default: true },
  minWidth: { type: Number, default: 160 },
  maxWidth: { type: Number, default: 320 },
  zIndex: { type: Number, default: 1200 }
};

const EVENTS = {
  /** 菜单打开，参数包含经纬度、容器像素坐标和原始鼠标事件 */
  open: (_context: ContextMenuContext) => true,
  /** 菜单关闭 */
  close: () => true,
  /** 点击菜单项，参数为菜单项和打开位置 */
  select: (_item: ContextMenuItem, _context: ContextMenuContext) => true,
  /** 显隐变化，可用于 v-model:visible */
  "update:visible": (_visible: boolean) => true
};

function isDivider(entry: ContextMenuEntry): entry is ContextMenuDivider {
  return (entry as ContextMenuDivider).type === "divider";
}

export const TdtContextMenu = defineComponent({
  name: "TdtContextMenu",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit, slots, expose }) {
    const isOpen = ref(false);
    const position = ref({ x: 0, y: 0 });
    const anchor = shallowRef<HTMLElement>();
    const menu = shallowRef<HTMLElement>();
    const current = shallowRef<ContextMenuContext>();
    let previousFocus: HTMLElement | null = null;

    const shown = computed(() => props.visible ?? isOpen.value);

    function clamp(value: number, min: number, max: number) {
      return Math.min(Math.max(value, min), Math.max(min, max));
    }

    function menuElement() {
      return menu.value;
    }

    function focusableItems(): HTMLElement[] {
      return Array.from(
        menu.value?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []
      );
    }

    function focusItem(index: number) {
      const items = focusableItems();
      if (!items.length) return;
      items[(index + items.length) % items.length]?.focus();
    }

    async function reposition() {
      await nextTick();
      const element = menu.value;
      const host = anchor.value?.offsetParent as HTMLElement | null;
      if (!element || !host) return;
      const [offsetX = 0, offsetY = 0] = props.offset;
      const context = current.value;
      const target = context?.originalEvent;
      let x: number;
      let y: number;
      if (target && Number.isFinite(target.clientX) && Number.isFinite(target.clientY)) {
        const rect = host.getBoundingClientRect();
        x = target.clientX - rect.left + host.scrollLeft;
        y = target.clientY - rect.top + host.scrollTop;
      } else if (context) {
        x = context.containerPoint[0];
        y = context.containerPoint[1];
      } else {
        x = 0;
        y = 0;
      }
      const maxX = host.clientWidth - element.offsetWidth;
      const maxY = host.clientHeight - element.offsetHeight;
      position.value = {
        x: clamp(x + offsetX, 0, maxX),
        y: clamp(y + offsetY, 0, maxY)
      };
    }

    function open(context: ContextMenuContext) {
      current.value = context;
      previousFocus = document.activeElement as HTMLElement | null;
      isOpen.value = true;
      emit("update:visible", true);
      emit("open", context);
      void reposition().then(() => focusItem(0));
    }

    function close(restoreFocus = false) {
      if (!shown.value) return;
      isOpen.value = false;
      emit("update:visible", false);
      emit("close");
      if (restoreFocus && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      previousFocus = null;
    }

    function select(item: ContextMenuItem) {
      if (item.disabled || !current.value) return;
      emit("select", item, current.value);
      if (props.closeOnSelect) close(true);
    }

    function openFromMap(event: T.MapEvent) {
      if (!props.enabled) return;
      event.originalEvent?.preventDefault();
      open({
        lnglat: [event.lnglat.lng, event.lnglat.lat],
        containerPoint: [event.containerPoint.x, event.containerPoint.y],
        originalEvent: event.originalEvent
      });
    }

    expose({
      open: (lnglat: VT.LngLat, options: Partial<Omit<ContextMenuContext, "lnglat">> = {}) =>
        open({
          lnglat,
          containerPoint: options.containerPoint ?? [0, 0],
          originalEvent: options.originalEvent
        }),
      close,
      getMenuElement: menuElement
    } as ContextMenuExposed);

    watch(
      () => props.visible,
      value => {
        if (value === undefined) return;
        if (value) {
          isOpen.value = true;
          void reposition().then(() => focusItem(0));
        } else {
          isOpen.value = false;
          previousFocus = null;
        }
      }
    );

    function onDocumentMouseDown(event: MouseEvent) {
      if (!shown.value) return;
      const target = event.target as Node | null;
      if (target && (menu.value?.contains(target) || anchor.value?.contains(target))) return;
      close();
    }

    function onWindowResize() {
      if (shown.value) void reposition();
    }

    function onMenuKeydown(event: KeyboardEvent) {
      const items = focusableItems();
      if (!items.length) return;
      const active = document.activeElement as HTMLElement | null;
      const index = active ? items.indexOf(active) : -1;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusItem(index + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        focusItem(index <= 0 ? items.length - 1 : index - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        focusItem(0);
      } else if (event.key === "End") {
        event.preventDefault();
        focusItem(items.length - 1);
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close(true);
      } else if (event.key === "Enter" || event.key === " ") {
        if (active && items.includes(active)) {
          event.preventDefault();
          active.click();
        }
      }
    }

    onMounted(() => {
      document.addEventListener("mousedown", onDocumentMouseDown, true);
      window.addEventListener("resize", onWindowResize);
    });
    onBeforeUnmount(() => {
      document.removeEventListener("mousedown", onDocumentMouseDown, true);
      window.removeEventListener("resize", onWindowResize);
    });

    useMapTask((map, onCleanup) => {
      const contextHandler = (event: T.MapEvent) => openFromMap(event);
      const closeHandler = () => {
        if (props.closeOnMove) close();
      };
      map.addEventListener("contextmenu", contextHandler);
      map.addEventListener("movestart", closeHandler);
      map.addEventListener("zoomstart", closeHandler);
      map.addEventListener("dragstart", closeHandler);
      const clickHandler = () => close();
      map.addEventListener("click", clickHandler);
      onCleanup(() => {
        map.removeEventListener("contextmenu", contextHandler);
        map.removeEventListener("movestart", closeHandler);
        map.removeEventListener("zoomstart", closeHandler);
        map.removeEventListener("dragstart", closeHandler);
        map.removeEventListener("click", clickHandler);
      });
    });

    function renderEntry(entry: ContextMenuEntry, index: number) {
      if (isDivider(entry)) {
        return h("div", {
          key: entry.key ?? `divider-${index}`,
          class: "tdt-context-menu__divider",
          attrs: { role: "separator" }
        });
      }
      if (slots.item) {
        return h(
          "div",
          { key: entry.key, class: "tdt-context-menu__custom", attrs: { role: "none" } },
          slots.item({ item: entry, index, select: () => select(entry) })
        );
      }
      return h(
        "button",
        {
          key: entry.key,
          class: ["tdt-context-menu__item", entry.danger && "tdt-context-menu__item--danger"],
          attrs: {
            type: "button",
            role: "menuitem",
            tabindex: "-1",
            "aria-disabled": entry.disabled ? "true" : undefined,
            disabled: entry.disabled
          },
          on: {
            click: () => select(entry)
          }
        },
        [
          entry.iconUrl && h("img", { class: "tdt-context-menu__icon", attrs: { src: entry.iconUrl, alt: "" } }),
          h("span", { class: "tdt-context-menu__label" }, entry.label)
        ]
      );
    }

    return () => {
      const context = current.value;
      const body = slots.default
        ? context &&
          slots.default({
            ...context,
            items: props.items,
            visible: shown.value,
            select,
            close
          } satisfies ContextMenuSlotProps)
        : props.items.map(renderEntry);
      return h(
        "div",
        {
          ref: anchor,
          class: "tdt-context-menu-anchor",
          style: { position: "absolute", left: "0", top: "0", width: "0", height: "0", zIndex: String(props.zIndex) }
        },
        shown.value
          ? [
              h(
                "div",
                {
                  ref: menu,
                  class: "tdt-context-menu",
                  attrs: { role: "menu", tabindex: "-1" },
                  style: {
                    left: `${position.value.x}px`,
                    top: `${position.value.y}px`,
                    minWidth: `${props.minWidth}px`,
                    maxWidth: `${props.maxWidth}px`,
                    zIndex: String(props.zIndex)
                  },
                  on: {
                    mousedown: (event: MouseEvent) => event.stopPropagation(),
                    contextmenu: (event: MouseEvent) => event.preventDefault(),
                    keydown: onMenuKeydown
                  }
                },
                body
              )
            ]
          : []
      );
    };
  }
}) as unknown as SharedComponent<typeof PROPS, typeof EVENTS, ContextMenuExposed>;

export type TdtContextMenu = InstanceType<typeof TdtContextMenu>;
