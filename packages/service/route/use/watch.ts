import { markRaw, onScopeDispose, watch } from "vue";
import type { RouteState } from "../types";
import { toLngLat, toLngLats } from "../../../utils";
import { coordinates, lineCoordinates, requestTimeout, toServiceError } from "../../utils";

export function useWatch(state: RouteState) {
  let generation = 0;
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const resetRoutes = () => {
    state.drivingLines = [];
    state.walkLines = [];
    state.busLines = [];
    state.busMarkers = [];
    state.metroMarkers = [];
  };
  onScopeDispose(() => {
    disposed = true;
    generation++;
    clearTimeout(timer);
  });
  watch(
    () => ({
      start: [...state.startMarker],
      end: [...state.endMarker],
      routeType: state.routeType,
      drivingPolicy: state.drivingPolicy,
      transitPolicy: state.transitPolicy,
      version: state.requestVersion
    }),
    ({ start, end, routeType, drivingPolicy, transitPolicy }) => {
      const id = ++generation;
      clearTimeout(timer);
      state.loading = false;
      state.error = null;
      state.drivingPlans = [];
      state.transitPlans = [];
      state.drivingPlanIndex = 0;
      state.transitPlanIndex = 0;
      resetRoutes();
      if (!state.tdtMap || !coordinates(start).length || !coordinates(end).length) return;
      state.loading = true;
      const fail = (reason: unknown, code?: number) => {
        if (disposed || id !== generation) return;
        generation++;
        clearTimeout(timer);
        state.loading = false;
        state.error = toServiceError(reason);
        state.onRouteError({ routeType, start, end, error: state.error, code });
      };
      const success = (result: T.DrivingRouteResult | T.TransitRouteResult) => {
        generation++;
        clearTimeout(timer);
        state.loading = false;
        state.onRouteComplete({ routeType, start, end, result });
      };
      try {
        timer = setTimeout(
          () => fail(new Error("路线规划请求超时，请检查网络和天地图服务权限。")),
          requestTimeout(state.queryTimeout)
        );
        if (routeType === 1) {
          const instance = markRaw(
            new T.TransitRoute(state.tdtMap, {
              policy: transitPolicy,
              onSearchComplete(result) {
                if (disposed || id !== generation) return;
                try {
                  const code = Number(result?.resultCode || 0);
                  if (code !== 0) {
                    fail(new Error(`公交规划失败，状态码：${code}`), code);
                    return;
                  }
                  const plans =
                    result?.results?.lines ||
                    (typeof result?.getNumPlans === "function"
                      ? Array.from({ length: result.getNumPlans() }, (_, index) => {
                          const plan = result.getPlan(index);
                          return {
                            lineName: plan.getLineName().join("，"),
                            segments: Array.from({ length: plan.getNumSegments() }, (_, item) => {
                              const line = plan.getDetails(item);
                              return {
                                segmentType: line.getSegmentType(),
                                segmentLine: line.getSegmentLine(),
                                stationStart: line.getStationStart(),
                                stationEnd: line.getStationEnd()
                              };
                            })
                          };
                        })
                      : []);
                  if (!plans.length) {
                    fail(new Error("未找到可用公交方案。"));
                    return;
                  }
                  state.transitPlans = plans;
                  success(result);
                } catch (reason) {
                  fail(reason);
                }
              }
            })
          );
          state.transitRoute = instance;
          instance.search(toLngLat(start), toLngLat(end));
        } else {
          const instance = markRaw(
            new T.DrivingRoute(state.tdtMap, {
              policy: routeType === 2 ? 3 : drivingPolicy,
              onSearchComplete(result) {
                if (disposed || id !== generation) return;
                try {
                  const plans = result?.results?.routelatlon
                    ? [result.results]
                    : typeof result?.getNumPlans === "function"
                      ? Array.from({ length: result.getNumPlans() }, (_, index) => {
                          const plan = result.getPlan(index);
                          return {
                            sdkPlan: markRaw(plan),
                            routelatlon: plan
                              .getPath()
                              .map(point => `${point.lng},${point.lat}`)
                              .join(";"),
                            duration: plan.getDuration(),
                            distance: plan.getDistance(),
                            routes: {
                              item: Array.from({ length: plan.getNumRoutes() }, (_, routeIndex) => {
                                const route = plan.getRoute(routeIndex);
                                return Array.from({ length: route.getNumSteps() }, (_, stepIndex) => ({
                                  strguide: route.getStep(stepIndex).getDescription()
                                }));
                              }).flat()
                            }
                          };
                        })
                      : [];
                  if (!plans.length) {
                    fail(new Error("未找到可用路线。"));
                    return;
                  }
                  state.drivingPlans = plans;
                  success(result);
                } catch (reason) {
                  fail(reason);
                }
              }
            })
          );
          state.drivingRoute = instance;
          instance.search(toLngLat(start), toLngLat(end));
        }
      } catch (reason) {
        fail(reason);
      }
    },
    { immediate: true, deep: true }
  );

  watch(
    () =>
      [
        state.drivingPlans,
        state.drivingPlanIndex,
        state.transitPlans,
        state.transitPlanIndex,
        state.routeType
      ] as const,
    () => {
      resetRoutes();
      const plan =
        state.routeType === 1 ? state.transitPlans[state.transitPlanIndex] : state.drivingPlans[state.drivingPlanIndex];
      if (!plan) return;
      if ("routelatlon" in plan) state.drivingLines = [lineCoordinates(plan.routelatlon)];
      else
        (plan.segments || []).forEach(segment => {
          const lines = (segment.segmentLine || [])
            .map(line => lineCoordinates(line.linePoint))
            .filter(line => line.length);
          if (segment.segmentType === 1 || segment.segmentType === 4) state.walkLines.push(...lines);
          else {
            state.busLines.push(...lines);
            const markers = [segment.stationStart, segment.stationEnd]
              .map(station => coordinates(station?.lonlat))
              .filter(point => point.length);
            (segment.segmentType === 3 ? state.metroMarkers : state.busMarkers).push(...markers);
          }
        });
      const points = [...state.drivingLines, ...state.walkLines, ...state.busLines].flat();
      if (state.autoViewport && points.length) state.tdtMap?.setViewport(toLngLats(points));
      state.onPlanChange({
        routeType: state.routeType,
        index: state.routeType === 1 ? state.transitPlanIndex : state.drivingPlanIndex,
        plan
      });
    },
    { immediate: true }
  );
}
