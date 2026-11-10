import { defineComponent, computed, watch, PropType } from "vue";
import { TdtMarker, TdtInfowindow } from "../../../components";
import { toLngLats, h } from "../../../utils";
import { useMapTask } from "../../../use";
import { coordinates } from "../../utils";

export const SearchMapView = defineComponent({
  props: {
    /** 显示在地图上的点数组 */
    pois: { type: Array as PropType<T.LocalSearchPoi[]>, default: () => [] },
    /** 显示信息窗口的坐标 */
    target: { type: Array as unknown as PropType<VT.LngLat | null>, default: () => null },
    /** 信息窗口的内容 */
    content: { type: String, default: "" }
  },
  emits: {
    /** 点击地图上的标点触发 */
    "poi-click": (e: T.LocalSearchPoi) => true,
    "update:target": (e: VT.LngLat | null) => true
  },
  setup(props, { emit }) {
    const markers = computed(() => {
      return props.pois.flatMap(poi => {
        const position = coordinates(poi.lonlat);
        return position.length === 2 ? [{ position: [position[0], position[1]] as VT.LngLat, extData: poi }] : [];
      });
    });

    useMapTask(tdtMap => {
      watch(
        markers,
        value => {
          if (value.length) tdtMap.setViewport(toLngLats(value.map(marker => marker.position)));
        },
        { immediate: true }
      );
    });

    return () =>
      h("div", null, [
        ...markers.value.map(item => {
          return h(TdtMarker, {
            props: { ...item },
            on: {
              click: () => emit("poi-click", item.extData)
            }
          });
        }),
        h(TdtInfowindow, {
          props: {
            target: props.target,
            content: props.content,
            offset: [0, -30],
            minWidth: 150
          },
          on: {
            "update:target": (e: VT.LngLat | null) => emit("update:target", e)
          }
        })
      ]);
  }
});
