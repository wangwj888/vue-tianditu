import { defineComponent, markRaw, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import type { SharedComponent } from "../../types";
import { useMapTask } from "../../use";
import { h, fixMapPropagation, toLngLats } from "../../utils";
import { TdtPolyline } from "../../overlay/polyline";
import { SearchBox } from "../search/components/SearchBox";
import { lineCoordinates, requestTimeout, toServiceError } from "../utils";
import "../search/styles/tdt-search.scss";
import "./styles.scss";

export interface BusLineSearchExposed {
  search(keyword?: string): void;
  select(item: T.BusListItem): void;
  clear(): void;
  getSearch(): T.BusLineSearch | undefined;
}
const PROPS = {
  keyword: { type: String, default: undefined },
  defaultKeyword: { type: String, default: "" },
  placeholder: { type: String, default: "输入公交线路，例如 850" },
  autoSelect: { type: Boolean, default: false },
  autoViewport: { type: Boolean, default: true },
  showLine: { type: Boolean, default: true },
  queryTimeout: { type: Number, default: 15000 }
};
const EVENTS = {
  init: (_instance: T.BusLineSearch) => true,
  "update:keyword": (_keyword: string) => true,
  "list-complete": (_items: T.BusListItem[], _result: T.BusListResult) => true,
  "line-complete": (_line: T.BusLine) => true,
  "line-select": (_item: T.BusListItem) => true,
  error: (_error: Error) => true
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getListError(result: T.LocalSearchResult): Error | undefined {
  // LocalSearchResult keeps service status/errors on its original response.
  const wrapped = result as unknown as Record<string, unknown>;
  const response = isRecord(wrapped.result) ? wrapped.result : wrapped;
  if (response.error) {
    const detail = isRecord(response.error)
      ? response.error.message || response.error.msg || response.error.code
      : response.error;
    return new Error(`公交线路查询失败：${String(detail || "服务返回错误")}`);
  }
  if (isRecord(response.status)) {
    const code = response.status.infocode;
    // 3001 means no data, which is a completed empty list rather than a failure.
    if (code !== undefined && !["1000", "3001"].includes(String(code))) {
      return new Error(`公交线路查询失败：${String(response.status.cndesc || response.status.endesc || code)}`);
    }
  }
  return undefined;
}

export const TdtBusLineSearch = defineComponent({
  name: "TdtBusLineSearch",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit, slots, expose }) {
    const keyword = ref(props.keyword ?? props.defaultKeyword);
    const items = ref<T.BusListItem[]>([]);
    const line = shallowRef<T.BusLine>();
    const path = ref<number[][]>([]);
    const loading = ref(false);
    const error = shallowRef<Error>();
    const searched = ref(false);
    let map: T.Map | undefined;
    let instance: T.BusLineSearch | undefined;
    let listSearch: T.LocalSearch | undefined;
    let generation = 0;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const releaseCallbacks = () => {
      listSearch?.setSearchCompleteCallback(() => {});
      listSearch?.clearResults();
      listSearch = undefined;
      instance?.setGetBusListCompleteCallback(() => {});
      instance?.setGetBusLineCompleteCallback(() => {});
    };
    const updateKeyword = (value: string) => {
      keyword.value = value;
      if (value !== props.keyword) emit("update:keyword", value);
    };
    const clear = () => {
      generation++;
      releaseCallbacks();
      clearTimeout(timer);
      loading.value = false;
      items.value = [];
      line.value = undefined;
      path.value = [];
      error.value = undefined;
      searched.value = false;
    };
    const fail = (reason: unknown, id: number) => {
      if (disposed || id !== generation) return;
      generation++;
      releaseCallbacks();
      clearTimeout(timer);
      loading.value = false;
      error.value = toServiceError(reason);
      emit("error", error.value);
    };
    function createSearch(id: number, callbacks: T.BusLineSearchOptions) {
      if (!map) return undefined;
      if (typeof T.BusLineSearch !== "function") throw new Error("当前天地图 SDK 未提供 BusLineSearch。");
      const search = markRaw(new T.BusLineSearch(map, callbacks));
      instance = search;
      timer = setTimeout(
        () => fail(new Error("公交线路查询超时，请检查网络和天地图服务权限。"), id),
        requestTimeout(props.queryTimeout)
      );
      emit("init", search);
      return search;
    }
    function select(item: T.BusListItem) {
      const id = ++generation;
      releaseCallbacks();
      clearTimeout(timer);
      line.value = undefined;
      path.value = [];
      error.value = undefined;
      if (!map || disposed) return;
      loading.value = true;
      emit("line-select", item);
      if (disposed || id !== generation) return;
      try {
        const search = createSearch(id, {
          onGetBusLineComplete(result) {
            if (disposed || id !== generation) return;
            try {
              if (!result) throw new Error("公交线路服务没有返回详情。");
              line.value = markRaw(result);
              path.value = lineCoordinates(result.linePoint);
              if (props.autoViewport && path.value.length) map?.setViewport(toLngLats(path.value));
              if (disposed || id !== generation) return;
              clearTimeout(timer);
              generation++;
              releaseCallbacks();
              loading.value = false;
              emit("line-complete", result);
            } catch (reason) {
              fail(reason, id);
            }
          }
        });
        if (!disposed && id === generation) search?.getBusLine(item);
      } catch (reason) {
        fail(reason, id);
      }
    }
    function search(value = keyword.value) {
      updateKeyword(value);
      clear();
      if (!value.trim() || !map || disposed) return;
      const id = generation;
      loading.value = true;
      searched.value = true;
      try {
        // Keep the exposed SDK instance for native line details. Its list endpoint
        // is obsolete; current LocalSearch uses the supported V2 search service.
        createSearch(id, {});
        if (disposed || id !== generation || !map) return;
        if (typeof T.LocalSearch !== "function") throw new Error("当前天地图 SDK 未提供 LocalSearch。");
        const search = markRaw(
          new T.LocalSearch(map, {
            pageCapacity: 10,
            onSearchComplete(result) {
              if (disposed || id !== generation) return;
              try {
                if (!result) throw new Error("公交线路服务返回了无效结果。");
                const businessError = getListError(result);
                if (businessError) throw businessError;
                const snapshot: T.BusListItem[] =
                  Number(result.resultType) === 5 && Array.isArray(result.lineData)
                    ? result.lineData.map(item => ({ stationNum: item.stationNum, name: item.name, uuid: item.uuid }))
                    : [];
                const listResult: T.BusListResult = {
                  getNumBusList: () => snapshot.length,
                  getBusListItem: index => {
                    if (!Number.isInteger(index) || index < 0 || index >= snapshot.length)
                      throw new RangeError("公交线路列表索引超出范围。");
                    return { ...snapshot[index] };
                  }
                };
                items.value = snapshot.map(item => ({ ...item }));
                generation++;
                releaseCallbacks();
                clearTimeout(timer);
                loading.value = false;
                emit("list-complete", items.value, listResult);
                if (generation === id + 1 && props.autoSelect && items.value.length) select(items.value[0]);
              } catch (reason) {
                fail(reason, id);
              }
            }
          })
        );
        listSearch = search;
        const query = value.trim();
        search.search(/^\d+$/.test(query) ? `${query}路` : query, 1);
      } catch (reason) {
        fail(reason, id);
      }
    }
    const clearSearch = () => {
      clear();
      updateKeyword("");
    };
    expose({
      search,
      select,
      clear: clearSearch,
      getSearch: () => instance
    });
    watch(
      () => props.keyword,
      value => {
        if (value !== undefined && value !== keyword.value) search(value);
      }
    );
    watch(
      () => props.autoViewport,
      enabled => {
        if (enabled && path.value.length) map?.setViewport(toLngLats(path.value));
      }
    );
    onBeforeUnmount(() => {
      disposed = true;
      generation++;
      releaseCallbacks();
      clearTimeout(timer);
    });
    useMapTask((readyMap, onCleanup) => {
      map = readyMap;
      onCleanup(() => {
        map = undefined;
        instance = undefined;
      });
      if (keyword.value.trim()) search();
    });
    const onInput = (value: string) => {
      clear();
      updateKeyword(value);
    };
    return () =>
      h("div", { class: "tdt-search tdt-bus-line-search", on: fixMapPropagation(map || null) }, [
        ...(slots.default?.({
          keyword: keyword.value,
          items: items.value,
          line: line.value,
          loading: loading.value,
          error: error.value,
          search,
          select,
          clear: clearSearch
        }) || [
          h(SearchBox, {
            props: { value: keyword.value, modelValue: keyword.value, placeholder: props.placeholder },
            on: { input: onInput, "update:modelValue": onInput, search },
            scopedSlots: {
              default: () => h("button", { attrs: { type: "button" }, on: { click: () => search() } }, "查询")
            }
          }),
          loading.value ? h("div", { attrs: { role: "status" } }, slots.loading?.() || "公交线路查询中…") : null,
          error.value ? h("div", { attrs: { role: "alert" } }, error.value.message) : null,
          searched.value && !loading.value && !error.value && !items.value.length
            ? h("div", null, slots.empty?.() || "未找到公交线路")
            : null,
          ...items.value.map((item, index) =>
            h(
              "button",
              {
                attrs: { type: "button" },
                class: "search-pois-item",
                key: item.uuid,
                on: { click: () => select(item) }
              },
              slots["result-item"]?.({ item, index, select: () => select(item) }) || item.name
            )
          ),
          line.value
            ? h(
                "div",
                null,
                slots.line?.({ line: line.value }) || [
                  h("strong", null, line.value.lineName),
                  h(
                    "p",
                    null,
                    `首班 ${line.value.startTime} · 末班 ${line.value.endTime} · ${line.value.stationCount} 站`
                  )
                ]
              )
            : null
        ]),
        props.showLine && path.value.length
          ? h(TdtPolyline, { props: { path: path.value, color: "#2C64A7", weight: 5 } })
          : null
      ]);
  }
}) as unknown as SharedComponent<typeof PROPS, typeof EVENTS, BusLineSearchExposed>;
export type TdtBusLineSearch = InstanceType<typeof TdtBusLineSearch>;
