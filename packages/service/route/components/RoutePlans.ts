import { defineComponent } from "vue";
import { h } from "../../../utils";
import { formatMessage, useLocale } from "../../../locale";
import { useState } from "../use";
import "../styles/route-plans.scss";

export const RoutePlans = defineComponent({
  setup() {
    const state = useState();
    const messages = useLocale();

    return () =>
      h(
        "div",
        {
          class: "route-plans"
        },
        [
          // 驾车方案
          state.drivingPlans.length
            ? h(
                "div",
                null,
                state.drivingPlans.map((plan, planIndex) => {
                  const title = formatMessage(messages.value.route.planTitle, { index: planIndex + 1 });
                  return h(
                    "details",
                    {
                      on: {
                        click: () => {
                          state.drivingPlanIndex = planIndex;
                        }
                      }
                    },
                    [
                      h(
                        "summary",
                        null,
                        formatMessage(messages.value.route.drivingSummary, {
                          title,
                          duration: plan.duration,
                          distance: plan.distance
                        })
                      ),
                      ...(plan.routes?.item || []).map((item, itemIndex) => {
                        return h(
                          "div",
                          null,
                          formatMessage(messages.value.route.step, { index: itemIndex + 1, guide: item.strguide })
                        );
                      })
                    ]
                  );
                })
              )
            : "",
          // 公交方案
          state.transitPlans.length
            ? h(
                "div",
                null,
                state.transitPlans.map((plan, planIndex) => {
                  const title = formatMessage(messages.value.route.planTitle, { index: planIndex + 1 });
                  return h(
                    "details",
                    {
                      on: {
                        click: () => {
                          state.transitPlanIndex = planIndex;
                        }
                      }
                    },
                    [
                      h(
                        "summary",
                        null,
                        formatMessage(messages.value.route.transitSummary, { title, lineName: plan.lineName })
                      ),
                      (plan.segments || [])
                        .map(segment => {
                          const segmentLine = segment.segmentLine?.[0];

                          //经过的公交或地铁的站数
                          if (!segmentLine) return "";
                          const stations = segmentLine.segmentStationCount
                            ? formatMessage(messages.value.route.stations, {
                                count: segmentLine.segmentStationCount
                              })
                            : "";

                          switch (segment.segmentType) {
                            case 1:
                              return formatMessage(messages.value.route.walk, {
                                distance: segmentLine.segmentDistance,
                                station: segment.stationEnd.name
                              });
                            case 2:
                            case 3:
                              return formatMessage(messages.value.route.ride, {
                                direction: segmentLine.direction,
                                stations,
                                station: segment.stationEnd.name
                              });
                            case 4:
                              return messages.value.route.transfer;
                            default:
                              return "";
                          }
                        })
                        .join(messages.value.route.separator) + messages.value.route.destination
                    ]
                  );
                })
              )
            : ""
        ]
      );
  }
});
