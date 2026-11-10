import { markRaw, onBeforeUnmount } from "vue";
import { toLngLat } from "../../../utils";
import type { LocaleMessages } from "../../../locale";
import { coordinates, escapeHtml, pageCapacity, requestTimeout, toServiceError } from "../../utils";
import type { PageProps } from "../components";
import type { SearchState } from "../types";

interface SearchOptions {
  pageCapacity(): number;
  adminCode(): number;
  timeout(): number;
  messages(): LocaleMessages;
}
export function useMethods(state: SearchState, emit: (event: any, ...args: any[]) => void, options: SearchOptions) {
  let generation = 0;
  let disposed = false;
  let activeAdminCode = options.adminCode();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let inputTimer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => {
    clearTimeout(timer);
    clearTimeout(inputTimer);
    generation++;
    state.localSearch?.setSearchCompleteCallback(() => {});
  };
  const reset = () => {
    state.target = null;
    state.pois = false;
    state.suggests = false;
    state.statistics = false;
    state.area = false;
    state.prompt = false;
    state.lineData = false;
    state.total = 0;
  };
  function setKeyword(keyword: string) {
    if (state.keyword === keyword) return;
    state.keyword = keyword;
    emit("update:keyword", keyword);
  }
  function clear() {
    cancel();
    state.localSearch?.clearResults();
    setKeyword("");
    reset();
    state.current = 1;
    state.loading = false;
    state.hasSearched = false;
    state.error = null;
    emit("update:page", 1);
  }
  function search(type = state.queryType, keyword = state.keyword, adminCode = options.adminCode(), page = 1) {
    cancel();
    setKeyword(keyword);
    state.queryType = type;
    activeAdminCode = adminCode;
    if (!keyword.trim()) {
      clear();
      return;
    }
    if (!state.tdtMap || disposed) return;
    const id = generation;
    reset();
    state.loading = true;
    state.hasSearched = true;
    state.error = null;
    state.current = Math.max(1, Math.floor(Number.isFinite(page) ? page : 1));
    emit("update:page", state.current);
    let needsPage = state.current > 1;
    const fail = (reason: unknown) => {
      if (disposed || id !== generation) return;
      generation++;
      clearTimeout(timer);
      state.loading = false;
      state.error = toServiceError(reason);
      emit("search-error", state.error);
    };
    try {
      const instance = markRaw(
        new T.LocalSearch(state.tdtMap, {
          pageCapacity: pageCapacity(options.pageCapacity()),
          onSearchComplete(result) {
            if (disposed || id !== generation) return;
            try {
              if (!result) throw new Error(options.messages().search.invalidResult);
              if (needsPage) {
                needsPage = false;
                const pages = Math.max(
                  1,
                  Math.ceil((Number(result.count) || 0) / pageCapacity(options.pageCapacity()))
                );
                state.current = Math.min(state.current, pages);
                emit("update:page", state.current);
                if (state.current > 1) {
                  instance.gotoPage(state.current);
                  return;
                }
              }
              clearTimeout(timer);
              generation++;
              state.loading = false;
              state.pois = result.pois || false;
              state.suggests = result.suggests || false;
              state.statistics = result.statistics || false;
              state.area = result.area || false;
              state.prompt = result.prompt || false;
              state.lineData = result.lineData || false;
              state.total = Math.max(0, Number(result.count) || 0);
              emit("search-complete", result);
            } catch (reason) {
              fail(reason);
            }
          }
        })
      );
      state.localSearch = instance;
      instance.setSpecifyAdminCode(adminCode);
      timer = setTimeout(
        () => fail(new Error(options.messages().search.timeoutError)),
        requestTimeout(options.timeout())
      );
      instance.search(keyword, type);
    } catch (reason) {
      fail(reason);
    }
  }
  function onInput(keyword: string) {
    if (keyword === state.keyword) return;
    cancel();
    setKeyword(keyword);
    if (!keyword.trim()) {
      clear();
      return;
    }
    inputTimer = setTimeout(() => search(4, keyword), 100);
  }
  function onPoiClick(poi: T.LocalSearchPoi) {
    const point = coordinates(poi.lonlat);
    if (point.length) {
      state.tdtMap?.panTo(toLngLat(point));
      state.target = [point[0], point[1]];
    }
    state.content = `<strong>${escapeHtml(poi.name)}</strong><div>${escapeHtml(
      options.messages().search.address
    )}${escapeHtml(poi.address)}</div>`;
    emit("poi-click", poi);
  }
  function onSuggestClick(suggest: T.LocalSearchSuggest) {
    search(1, suggest.name, Number(suggest.gbCode) || options.adminCode());
    emit("suggest-click", suggest);
  }
  function onPageChange(page: PageProps) {
    search(state.queryType, state.keyword, activeAdminCode, page.current || 1);
  }
  onBeforeUnmount(() => {
    disposed = true;
    cancel();
    state.localSearch?.clearResults();
    state.localSearch = null;
  });
  return { search, clear, onInput, onPoiClick, onSuggestClick, onPageChange };
}
