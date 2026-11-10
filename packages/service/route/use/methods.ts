import { markRaw, onScopeDispose, getCurrentScope } from "vue";
import type { RouteState } from "../types";
import type { PageProps } from "../../search/components";
import { coordinates, toServiceError } from "../../utils";

export function useMethods(state: RouteState) {
  let generation = 0;
  let disposed = false;
  if (getCurrentScope())
    onScopeDispose(() => {
      disposed = true;
      generation++;
    });
  function onSearch(queryType: number, keyword: string, poiType: "start" | "end") {
    if (state[`${poiType}Keyword`] === keyword) return;
    generation++;
    const id = generation;
    state.pois = [];
    state.current = 1;
    state.total = 0;
    state.poiType = poiType;
    state[`${poiType}Keyword`] = keyword;
    // Editing an endpoint invalidates the previously selected coordinate.
    state[`${poiType}Marker`] = [];
    if (!keyword.trim() || !state.tdtMap) return;
    try {
      state.localSearch?.setSearchCompleteCallback(() => {});
      state.localSearch = markRaw(
        new T.LocalSearch(state.tdtMap, {
          pageCapacity: 10,
          onSearchComplete(result) {
            if (
              disposed ||
              id !== generation ||
              state.poiType !== poiType ||
              state[`${poiType}Keyword`] !== keyword ||
              state[`${poiType}Marker`].length
            )
              return;
            state.pois = result?.pois || [];
            state.total = Math.max(0, Number(result?.count) || 0);
          }
        })
      );
      state.localSearch.search(keyword, queryType);
    } catch (reason) {
      generation++;
      state.error = toServiceError(reason);
      state.onRouteError({
        routeType: state.routeType,
        start: [...state.startMarker],
        end: [...state.endMarker],
        error: state.error
      });
    }
  }
  function onFocus(poiType: "start" | "end") {
    if (state.poiType !== poiType) {
      generation++;
      state.pois = [];
    }
    state.poiType = poiType;
  }
  function onPoiClick(poi: T.LocalSearchPoi) {
    const point = coordinates(poi.lonlat);
    if (!point.length) return;
    generation++;
    state[`${state.poiType}Keyword`] = poi.name;
    state[`${state.poiType}Marker`] = point;
    state.pois = [];
  }
  function onPageChange(page: PageProps) {
    state.current = page.current || 1;
    state.localSearch?.gotoPage(state.current);
  }
  return { onSearch, onPoiClick, onPageChange, onFocus };
}
