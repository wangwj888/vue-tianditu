import { Props } from "./";

export function useInit(props: Props, map: T.Map) {
  const { girdSize, maxZoom } = props;
  // Markers are added by the initial run of useWatch so the diff can track them.
  return new T.MarkerClusterer(map, { girdSize, maxZoom });
}
