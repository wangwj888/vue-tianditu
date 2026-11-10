import type { RouteState } from "../types";
import { markRaw } from "vue";
export function useInit(state: RouteState, map: T.Map) {
  state.tdtMap = markRaw(map);
  return () => {
    state.localSearch?.setSearchCompleteCallback(() => {});
    state.drivingRoute?.setSearchCompleteCallback(() => {});
    state.transitRoute?.setSearchCompleteCallback(() => {});
    state.localSearch?.clearResults();
    state.drivingRoute?.clearResults();
    state.transitRoute?.clearResults();
    state.localSearch = state.drivingRoute = state.transitRoute = null;
    state.tdtMap = null;
  };
}
