export type RouteType = 0 | 1 | 2;
export type DrivingPolicy = 0 | 1 | 2;
export type TransitPolicy = 1 | 2 | 4 | 8;
export type DrivingPlan = Pick<T.DrivingRouteResult["results"], "routelatlon" | "distance" | "duration"> & {
  routes: { item: { strguide: string }[] };
  sdkPlan?: T.DrivingRoutePlan;
};
export type TransitPlan = T.TransitRouteResult["results"]["lines"][number];
export interface RouteCompleteEvent {
  routeType: RouteType;
  start: number[];
  end: number[];
  result: T.DrivingRouteResult | T.TransitRouteResult;
}
export interface RouteErrorEvent {
  routeType: RouteType;
  start: number[];
  end: number[];
  error: Error;
  code?: number;
}
export interface RoutePlanChangeEvent {
  routeType: RouteType;
  index: number;
  plan: DrivingPlan | TransitPlan;
}
export interface RouteExposed {
  search(): void;
}
export interface SearchState {
  tdtMap: T.Map | null;
  localSearch: T.LocalSearch | null;
  startKeyword: string;
  /** 未选择时为 []；非空时包含两个坐标分量 */
  startMarker: number[];
  endKeyword: string;
  /** 未选择时为 []；非空时包含两个坐标分量 */
  endMarker: number[];
  routeType: RouteType;
  routeTypes: RouteType[];
  poiType: "start" | "end";
  pois: T.LocalSearchPoi[] | false;
  current: number;
  total: number;
}
export interface DrivingState {
  drivingRoute: T.DrivingRoute | null;
  drivingLines: VT.LngLats[];
  drivingPolicy: DrivingPolicy;
  drivingPlans: DrivingPlan[];
  drivingPlanIndex: number;
}
export interface TransitState {
  transitRoute: T.TransitRoute | null;
  transitPolicy: TransitPolicy;
  transitPlans: TransitPlan[];
  transitPlanIndex: number;
  walkLines: VT.LngLats[];
  busLines: VT.LngLats[];
  busMarkers: VT.LngLat[];
  metroMarkers: VT.LngLat[];
}
export interface RouteLifecycleState {
  loading: boolean;
  error: Error | null;
  queryTimeout: number;
  autoViewport: boolean;
  requestVersion: number;
  onRouteComplete(event: RouteCompleteEvent): void;
  onRouteError(event: RouteErrorEvent): void;
  onPlanChange(event: RoutePlanChangeEvent): void;
}
export type RouteState = SearchState & DrivingState & TransitState & RouteLifecycleState;
