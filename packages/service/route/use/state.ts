import { reactive, inject } from "vue";
import type { RouteState } from "../types";
export function useState(inherit = true): RouteState {
  const parent = inherit ? inject<RouteState | undefined>("routeState", undefined) : undefined;
  return (
    parent ||
    reactive<RouteState>({
      tdtMap: null,
      localSearch: null,
      startKeyword: "",
      startMarker: [],
      endKeyword: "",
      endMarker: [],
      routeType: 0,
      routeTypes: [0, 1, 2],
      poiType: "start",
      pois: [],
      current: 1,
      total: 0,
      drivingRoute: null,
      drivingLines: [],
      drivingPolicy: 0,
      drivingPlans: [],
      drivingPlanIndex: 0,
      transitRoute: null,
      transitPolicy: 1,
      transitPlans: [],
      transitPlanIndex: 0,
      walkLines: [],
      busLines: [],
      busMarkers: [],
      metroMarkers: [],
      loading: false,
      error: null,
      queryTimeout: 15000,
      autoViewport: true,
      requestVersion: 0,
      onRouteComplete: () => {},
      onRouteError: () => {},
      onPlanChange: () => {}
    })
  );
}
