import { defineComponent, computed } from "vue";
import { IconClose } from "./icons";
import { h, slot, isVue2 } from "../../../utils";
import { useLocale } from "../../../locale";
import "../styles/search-box.scss";

export const SearchBox = defineComponent({
  props: {
    value: { type: String, default: "" },
    modelValue: { type: String, default: "" },
    /** 显示在输入框的提示；未传时使用当前语言配置 */
    placeholder: { type: String, default: undefined },
    /** 是否显示搜索按钮 */
    searchBtn: { type: Boolean, default: true },
    /** 是否显示导航按钮 */
    routeBtn: { type: Boolean, default: true }
  },
  emits: {
    input: (e: string) => true,
    "update:modelValue": (e: string) => true,
    focus: (_event: FocusEvent) => true,
    // 点击搜索按钮或回车时触发
    search: (e: string) => true
  },
  setup(props, { emit, slots }) {
    const messages = useLocale();
    const placeholder = computed(() => props.placeholder ?? messages.value.search.placeholder);
    let isComposition = false;

    const keyword = computed({
      get() {
        return isVue2 ? props.value : props.modelValue;
      },
      set(val: string) {
        isVue2 ? emit("input", val) : emit("update:modelValue", val);
      }
    });

    return () =>
      h(
        "div",
        {
          class: "tdt-search-box"
        },
        [
          h("input", {
            class: "tdt-search-box__input",
            attrs: {
              type: "text",
              placeholder: placeholder.value
            },
            domProps: {
              value: keyword.value
            },
            on: {
              compositionstart: () => (isComposition = true),
              compositionend: (e: CompositionEvent) => {
                isComposition = false;
                keyword.value = (e.target as HTMLInputElement).value;
              },
              input: (e: InputEvent) => {
                if (!isComposition && !e.isComposing) keyword.value = (e.target as HTMLInputElement).value;
              },
              focus: (e: FocusEvent) => emit("focus", e),
              keyup: (e: KeyboardEvent) => {
                if (e.code === "Enter" && !isComposition && !e.isComposing)
                  emit("search", (e.target as HTMLInputElement).value);
              }
            }
          }),
          h(
            "i",
            {
              class: "tdt-search-box__close",
              style: { display: props.value || props.modelValue ? "block" : "none" },
              attrs: { role: "button", tabindex: "0", "aria-label": messages.value.common.clear },
              on: {
                click: () => (keyword.value = "")
              }
            },
            [h(IconClose)]
          ),
          slot(slots.default)
        ]
      );
  }
});
