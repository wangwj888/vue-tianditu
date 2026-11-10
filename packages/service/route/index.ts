import type { SharedComponent } from "../../types";
import { defineComponent, provide, watch, type PropType } from "vue";
import { useMapTask } from "../../use";
import { h, fixMapPropagation } from "../../utils";
import { coordinates } from "../utils";
import { useInit, useState, useWatch } from "./use";
import type {
  DrivingPolicy,
  TransitPolicy,
  RouteType,
  RouteCompleteEvent,
  RouteErrorEvent,
  RoutePlanChangeEvent,
  RouteExposed
} from "./types";
import { RouteMapView, RoutePlans, RoutePolicies, RouteSearch, RouteTypes } from "./components";
import "../../styles/tdt-icon.scss";
import "./styles/tdt-route.scss";
export type {
  DrivingPlan,
  TransitPlan,
  DrivingPolicy,
  TransitPolicy,
  RouteType,
  RouteCompleteEvent,
  RouteErrorEvent,
  RoutePlanChangeEvent,
  RouteExposed
} from "./types";
const PROPS = {
  start: { type: Array as unknown as PropType<readonly number[]>, default: () => [] },
  end: { type: Array as unknown as PropType<readonly number[]>, default: () => [] },
  startKeyword: { type: String, default: "" },
  endKeyword: { type: String, default: "" },
  routeType: { type: Number as PropType<RouteType>, default: 0 },
  routeTypes: { type: Array as PropType<readonly RouteType[]>, default: () => [0, 1, 2] },
  drivingPolicy: { type: Number as PropType<DrivingPolicy>, default: 0 },
  transitPolicy: { type: Number as PropType<TransitPolicy>, default: 1 },
  autoViewport: { type: Boolean, default: true },
  queryTimeout: { type: Number, default: 15000 }
};
const EVENTS = {
  "route-complete": (_event: RouteCompleteEvent) => true,
  "route-error": (_event: RouteErrorEvent) => true,
  "plan-change": (_event: RoutePlanChangeEvent) => true,
  "update:routeType": (_type: RouteType) => true,
  "update:start": (_point: number[]) => true,
  "update:end": (_point: number[]) => true,
  "update:drivingPolicy": (_policy: DrivingPolicy) => true,
  "update:transitPolicy": (_policy: TransitPolicy) => true
};
export const TdtRoute = defineComponent({
  name: "TdtRoute",
  props: PROPS,
  emits: EVENTS,
  setup(props, { emit, expose }) {
    const state = useState(false);
    provide("routeState", state);
    state.onRouteComplete = event => emit("route-complete", event);
    state.onRouteError = event => emit("route-error", event);
    state.onPlanChange = event => emit("plan-change", event);
    watch(
      () => props.start,
      point => {
        const next = coordinates(point);
        if (String(next) !== String(state.startMarker)) state.startMarker = next;
      },
      { immediate: true, deep: true }
    );
    watch(
      () => props.end,
      point => {
        const next = coordinates(point);
        if (String(next) !== String(state.endMarker)) state.endMarker = next;
      },
      { immediate: true, deep: true }
    );
    watch(
      () => props.startKeyword,
      value => {
        state.startKeyword = value;
      },
      { immediate: true }
    );
    watch(
      () => props.endKeyword,
      value => {
        state.endKeyword = value;
      },
      { immediate: true }
    );
    watch(
      () => [props.routeType, props.routeTypes] as const,
      ([type, types]) => {
        state.routeTypes = [...new Set(types.filter(value => [0, 1, 2].includes(value)))];
        if (!state.routeTypes.length) state.routeTypes = [0, 1, 2];
        state.routeType = state.routeTypes.includes(type) ? type : state.routeTypes[0];
      },
      { immediate: true, deep: true }
    );
    watch(
      () => props.drivingPolicy,
      value => {
        state.drivingPolicy = [0, 1, 2].includes(value) ? value : 0;
      },
      { immediate: true }
    );
    watch(
      () => props.transitPolicy,
      value => {
        state.transitPolicy = [1, 2, 4, 8].includes(value) ? value : 1;
      },
      { immediate: true }
    );
    watch(
      () => props.autoViewport,
      value => {
        state.autoViewport = value;
      },
      { immediate: true }
    );
    watch(
      () => props.queryTimeout,
      value => {
        state.queryTimeout = value;
      },
      { immediate: true }
    );
    watch(
      () => state.routeType,
      value => {
        if (value !== props.routeType) emit("update:routeType", value);
      }
    );
    watch(
      () => state.startMarker,
      value => {
        if (String(value) !== String(props.start)) emit("update:start", [...value]);
      },
      { deep: true }
    );
    watch(
      () => state.endMarker,
      value => {
        if (String(value) !== String(props.end)) emit("update:end", [...value]);
      },
      { deep: true }
    );
    watch(
      () => state.drivingPolicy,
      value => {
        if (value !== props.drivingPolicy) emit("update:drivingPolicy", value);
      }
    );
    watch(
      () => state.transitPolicy,
      value => {
        if (value !== props.transitPolicy) emit("update:transitPolicy", value);
      }
    );
    expose({
      search: () => {
        state.requestVersion++;
      }
    });
    useMapTask((map, onCleanup) => {
      onCleanup(useInit(state, map));
      useWatch(state);
    });
    return () =>
      h("div", { class: "tdt-route", on: fixMapPropagation(state.tdtMap) }, [
        h(RouteTypes),
        h(RouteSearch),
        h(RoutePolicies),
        state.loading ? h("div", { attrs: { role: "status" }, class: "tdt-route-status" }, "路线规划中…") : null,
        state.error ? h("div", { attrs: { role: "alert" }, class: "tdt-route-status" }, state.error.message) : null,
        h(RoutePlans),
        h(RouteMapView)
      ]);
  }
}) as unknown as SharedComponent<typeof PROPS, typeof EVENTS, RouteExposed>;
export type TdtRoute = InstanceType<typeof TdtRoute>;
