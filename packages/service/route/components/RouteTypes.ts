import { defineComponent } from "vue";
import { h } from "../../../utils";
import { useState } from "../use";
import "../styles/route-types.scss";
import type { RouteType } from "../types";

export const RouteTypes = defineComponent({
  setup() {
    const state = useState();
    const routeTypes = { 0: "驾车", 1: "公交", 2: "步行" };

    return () =>
      h(
        "div",
        {
          class: "route-types"
        },
        [
          ...Object.entries(routeTypes)
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
