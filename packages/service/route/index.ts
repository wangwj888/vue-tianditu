import type { SharedComponent } from "../../types";
import { defineComponent, provide } from "vue";
import { useMapTask } from "../../use";
import { h, fixMapPropagation } from "../../utils";
import { useInit, useState, useWatch } from "./use";
import { RouteMapView, RoutePlans, RoutePolicies, RouteSearch, RouteTypes } from "./components";
import "../../styles/tdt-icon.scss";
import "./styles/tdt-route.scss";

export const TdtRoute = defineComponent({
  name: "TdtRoute",
  setup() {
    const state = useState();
    provide("routeState", state);

    useMapTask((map, onCleanup) => {
      onCleanup(useInit(state, map));
      useWatch(state);
    });

    return () =>
      h(
        "div",
        {
          class: "tdt-route",
          on: {
            ...fixMapPropagation(state.tdtMap)
          }
        },
        [h(RouteTypes), h(RouteSearch), h(RoutePolicies), h(RoutePlans), h(RouteMapView)]
      );
  }
}) as unknown as SharedComponent;

export type TdtRoute = InstanceType<typeof TdtRoute>;
