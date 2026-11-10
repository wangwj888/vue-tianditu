declare namespace VT {
  /** [经度, 纬度] */
  type LngLat = [number, number];

  type LngLats = LngLat[];

  /** [[西南角经度, 西南角纬度], [东北角经度, 东北角纬度]] */
  type Bounds = [LngLat, LngLat];

  /** [x, y] */
  type Point = [number, number];

  interface IconOptions extends Omit<T.IconOptions, "iconSize" | "iconAnchor"> {
    iconSize?: Point;
    iconAnchor?: Point;
  }

  interface MarkerOptions extends Omit<T.MarkerOptions, "icon"> {
    icon?: IconOptions | string;
  }

  type ControlName = "Zoom" | "Scale" | "Copyright" | "OverviewMap" | "MapType";

  type ControlOptions = Partial<
    T.ControlZoomOptions &
      T.ControlScaleOptions &
      ControlCopyrightOptions &
      T.ControlOverviewMapOptions &
      ControlMapTypeOptions
  > & {
    name: ControlName;
  };

  interface ControlMapTypeOptions {
    mapTypes?: {
      title: string;
      icon: string;
      layer:
        "TMAP_NORMAL_MAP" | "TMAP_SATELLITE_MAP" | "TMAP_HYBRID_MAP" | "TMAP_TERRAIN_MAP" | "TMAP_TERRAIN_HYBRID_MAP";
    }[];
  }

  interface ControlCopyrightOptions extends Omit<T.ControlCopyrightOptions, "bounds"> {
    bounds: Bounds;
  }

  interface MarkerClustererStyle extends Omit<T.MarkerClustererStyle, "offset"> {
    offset?: Point;
  }

  type PassOneNode = (lnglat: LngLat, index: number, length: number) => void;
}
