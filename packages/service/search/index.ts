import type { SharedComponent } from "../../types";
import { computed, defineComponent, markRaw, watch, type PropType } from "vue";
import { useMapTask } from "../../use";
import { h, fixMapPropagation } from "../../utils";
import { useState, useMethods } from "./use";
import { SearchBox, SearchSuggests, SearchPois, SearchMapView, IconSearch, IconRoute, IconClose } from "./components";
import { TdtRoute } from "../route";
import { pageCapacity as normalizePageCapacity } from "../utils";
import type { SearchExposed, SearchRouteButtons } from "./types";
import type { RouteType } from "../route/types";
import "./styles/tdt-search.scss";
import "../../styles/tdt-icon.scss";

export type { SearchExposed, SearchRouteButtons, SearchItemSlot } from "./types";
const PROPS = {
  keyword: { type: String, default: undefined },
  defaultKeyword: { type: String, default: "" },
  page: { type: Number, default: undefined },
  pageCapacity: { type: Number, default: 10 },
  adminCode: { type: Number, default: 0 },
  queryTimeout: { type: Number, default: 15000 },
  placeholder: { type: String, default: "输入关键字搜索" },
  searchBtn: { type: Boolean, default: true },
  routeBtn: { type: [Boolean, Object] as PropType<boolean | SearchRouteButtons>, default: true }
};
const EVENTS = {
  "update:keyword": (_keyword: string) => true,
  "update:page": (_page: number) => true,
  "poi-click": (_poi: T.LocalSearchPoi) => true,
  "suggest-click": (_suggest: T.LocalSearchSuggest) => true,
  "search-complete": (_result: T.LocalSearchResult) => true,
  "search-error": (_error: Error) => true
};
export const TdtSearch = defineComponent({
  name: "TdtSearch",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit, slots, expose }) {
    const state = useState();
    state.keyword = props.keyword ?? props.defaultKeyword;
    const methods = useMethods(state, emit, {
      pageCapacity: () => props.pageCapacity,
      adminCode: () => props.adminCode,
      timeout: () => props.queryTimeout
    });
    expose({
      search: (keyword = state.keyword) => methods.search(1, keyword),
      clear: methods.clear,
      getSearch: () => state.localSearch
    });
    const routeTypes = computed<RouteType[]>(() => {
      if (typeof props.routeBtn === "boolean") return props.routeBtn ? [0, 1, 2] : [];
      return (["driving", "transit", "walking"] as const).flatMap((key, index) =>
        props.routeBtn && typeof props.routeBtn === "object" && props.routeBtn[key] !== false
          ? [index as RouteType]
          : []
      );
    });
    watch(routeTypes, value => {
      if (!value.length) state.showRoute = false;
    });
    watch(
      () => props.keyword,
      keyword => {
        if (keyword !== undefined && keyword !== state.keyword) methods.search(1, keyword);
      }
    );
    watch(
      () => [props.pageCapacity, props.adminCode],
      () => {
        if (state.keyword.trim()) methods.search(1, state.keyword);
      }
    );
    watch(
      () => props.page,
      page => {
        if (page !== undefined && page !== state.current && state.keyword.trim())
          methods.onPageChange({ current: page });
      }
    );
    useMapTask((map, onCleanup) => {
      state.tdtMap = markRaw(map);
      onCleanup(() => {
        state.tdtMap = null;
      });
      if (state.keyword.trim()) methods.search(1, state.keyword, props.adminCode, props.page || 1);
    });
    const enterRoute = () => {
      state.showRoute = true;
    };
    return () =>
      h(
        "div",
        { class: "tdt-search", on: fixMapPropagation(state.tdtMap) },
        state.showRoute
          ? [
              h(TdtRoute, { props: { routeTypes: routeTypes.value, routeType: routeTypes.value[0] || 0 } }),
              h(
                "button",
                {
                  class: "tdt-search-route__close",
                  attrs: { type: "button", "aria-label": "返回搜索" },
                  on: {
                    click: () => {
                      state.showRoute = false;
                    }
                  }
                },
                [h(IconClose)]
              )
            ]
          : [
              h(SearchBox, {
                props: { value: state.keyword, modelValue: state.keyword, placeholder: props.placeholder },
                on: {
                  input: methods.onInput,
                  "update:modelValue": methods.onInput,
                  search: (keyword: string) => methods.search(1, keyword)
                },
                scopedSlots: {
                  default: () => [
                    props.searchBtn &&
                      h(
                        "button",
                        {
                          class: "tdt-search-box__btn",
                          attrs: { type: "button", "aria-label": "搜索" },
                          on: { click: () => methods.search(1) }
                        },
                        [h(IconSearch)]
                      ),
                    routeTypes.value.length > 0 &&
                      h(
                        "button",
                        {
                          class: "tdt-search-box__btn",
                          attrs: { type: "button", "aria-label": "路线规划" },
                          on: { click: enterRoute }
                        },
                        [h(IconRoute)]
                      )
                  ]
                }
              }),
              state.loading
                ? h(
                    "div",
                    { class: "tdt-search-status", attrs: { role: "status" } },
                    slots.loading?.({ keyword: state.keyword }) || "搜索中…"
                  )
                : null,
              !state.loading &&
              !state.error &&
              state.hasSearched &&
              !(state.pois || []).length &&
              !(state.suggests || []).length
                ? h(
                    "div",
                    { class: "tdt-search-status" },
                    slots.empty?.({ keyword: state.keyword }) || "未找到匹配结果"
                  )
                : null,
              state.error
                ? h("div", { class: "tdt-search-status", attrs: { role: "alert" } }, state.error.message)
                : null,
              h(SearchSuggests, {
                props: { suggests: state.suggests || [] },
                on: { "suggest-click": methods.onSuggestClick }
              }),
              h(SearchPois, {
                props: {
                  pois: state.pois || [],
                  page: { current: state.current, size: normalizePageCapacity(props.pageCapacity), total: state.total }
                },
                on: { "poi-click": methods.onPoiClick, "update:page": methods.onPageChange },
                scopedSlots: { "result-item": (args: unknown) => slots["result-item"]?.(args) }
              }),
              h(SearchMapView, {
                props: { pois: state.pois || [], target: state.target, content: state.content },
                on: {
                  "poi-click": methods.onPoiClick,
                  "update:target": (target: VT.LngLat | null) => {
                    state.target = target;
                  }
                }
              })
            ]
      );
  }
}) as unknown as SharedComponent<typeof PROPS, typeof EVENTS, SearchExposed>;
export type TdtSearch = InstanceType<typeof TdtSearch>;
