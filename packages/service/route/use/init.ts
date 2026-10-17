import { RouteState } from "../types";
import { useMethods } from ".";
import { markRaw } from "vue";

export function useInit(state: RouteState, map: T.Map) {
  let active = true;
  const { onSearchComplete, onDrivingComplete, onTransitComplete } = useMethods(state);

  state.tdtMap = markRaw(map);
  state.localSearch = markRaw(new T.LocalSearch(state.tdtMap, {
    pageCapacity: 10,
    onSearchComplete: result => { if (active) onSearchComplete(result); }
  }));
  state.drivingRoute = markRaw(new T.DrivingRoute(state.tdtMap, {
    policy: state.drivingPolicy,
    onSearchComplete: result => { if (active) onDrivingComplete(result); }
  }));
  state.transitRoute = markRaw(new T.TransitRoute(state.tdtMap, {
    policy: state.transitPolicy,
    onSearchComplete: result => { if (active) onTransitComplete(result); }
  }));
  return () => {
    active = false;
    state.localSearch?.clearResults();
    state.drivingRoute?.clearResults();
    state.transitRoute?.clearResults();
    state.localSearch = state.drivingRoute = state.transitRoute = null;
    state.tdtMap = null;
  };
}
