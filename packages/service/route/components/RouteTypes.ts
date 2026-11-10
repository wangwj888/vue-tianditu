import { defineComponent, computed } from "vue";
import { h } from "../../../utils";
import { useLocale } from "../../../locale";
import { useState } from "../use";
import "../styles/route-types.scss";
import type { RouteType } from "../types";

export const RouteTypes = defineComponent({
  setup() {
    const state = useState();
    const messages = useLocale();
    const routeTypes = computed<Record<number, string>>(() => ({
      0: messages.value.route.types.driving,
      1: messages.value.route.types.transit,
      2: messages.value.route.types.walking
    }));

    return () =>
      h(
        "div",
        {
          class: "route-types"
        },
        [
          ...Object.entries(routeTypes.value)
            .filter(([key]) => state.routeTypes.includes(Number(key) as RouteType))
            .map(([key, value]) =>
              h(
                "div",
                {
                  class: "route-types-item" + (state.routeType == Number(key) ? " active" : ""),
                  on: {
                    click: () => (state.routeType = Number(key) as RouteType)
                  }
                },
                value
              )
            )
        ]
      );
  }
});
