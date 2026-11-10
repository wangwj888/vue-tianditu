import { reactive } from "vue";
import type { SearchState } from "../types";

export function useState() {
  return reactive<SearchState>({
    tdtMap: null,
    localSearch: null,
    keyword: "",
    queryType: 1,
    showRoute: false,
    loading: false,
    hasSearched: false,
    error: null,
    pois: false,
    statistics: false,
    area: false,
    suggests: false,
    prompt: false,
    lineData: false,
    target: null,
    content: "",
    current: 1,
    total: 0
  });
}
