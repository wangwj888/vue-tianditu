import { defineComponent, computed } from "vue";
import { h } from "../../../utils";
import { useLocale } from "../../../locale";
import { useState } from "../use";
import "../styles/route-policies.scss";
import type { DrivingPolicy, TransitPolicy } from "../types";

export const RoutePolicies = defineComponent({
  setup() {
    const state = useState();
    const messages = useLocale();
    const drivingPolicies = computed(() =>
      messages.value.route.drivingPolicies.map((label, value) => ({ value, label }))
    );
    const transitPolicies = computed(() =>
      Object.entries(messages.value.route.transitPolicies).map(([value, label]) => ({
        value: Number(value),
        label
      }))
    );

    return () =>
      h(
        "div",
        {
          class: "route-policies"
        },
        [
          ...(state.routeType === 0
            ? drivingPolicies.value.map(({ value: key, label }) =>
                h(
                  "div",
                  {
                    class: "route-policies-item" + (state.drivingPolicy == key ? " active" : ""),
                    on: {
                      click: () => (state.drivingPolicy = key as DrivingPolicy)
                    }
                  },
                  label
                )
              )
            : []),
          ...(state.routeType === 1
            ? transitPolicies.value.map(({ value: key, label }) =>
                h(
                  "div",
                  {
                    class: "route-policies-item" + (state.transitPolicy == key ? " active" : ""),
                    on: {
                      click: () => (state.transitPolicy = key as TransitPolicy)
                    }
                  },
                  label
                )
              )
            : [])
        ]
      );
  }
});
