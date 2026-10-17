export {};

// Let Vue Language Tools resolve globally registered components.
// Vue 3 merges this into its own GlobalComponents interface; Vue 2.7 users
// keep working because the augmentation only adds a new interface member.
declare module "vue" {
  export interface GlobalComponents {
    TdtMap: typeof import("../../map").TdtMap;
    TdtControl: typeof import("../../control").TdtControl;
    TdtMousetool: typeof import("../../mousetool").TdtMousetool;
    TdtMarker: typeof import("../../overlay/marker").TdtMarker;
    TdtLabel: typeof import("../../overlay/label").TdtLabel;
    TdtPolyline: typeof import("../../overlay/polyline").TdtPolyline;
    TdtPolygon: typeof import("../../overlay/polygon").TdtPolygon;
    TdtRectangle: typeof import("../../overlay/rectangle").TdtRectangle;
    TdtCircle: typeof import("../../overlay/circle").TdtCircle;
    TdtInfowindow: typeof import("../../overlay/infowindow").TdtInfowindow;
    TdtCloudMarkerCollection: typeof import("../../overlay/cloudMarkerCollection").TdtCloudMarkerCollection;
    TdtMarkerClusterer: typeof import("../../overlay/markerClusterer").TdtMarkerClusterer;
    TdtHeatmap: typeof import("../../overlay/heatmap").TdtHeatmap;
    TdtCustomOverlay: typeof import("../../overlay/custom").TdtCustomOverlay;
    TdtTilelayer: typeof import("../../tilelayer/tilelayer").TdtTilelayer;
    TdtTilelayerTdt: typeof import("../../tilelayer/tdt").TdtTilelayerTdt;
    TdtTilelayerWms: typeof import("../../tilelayer/wms").TdtTilelayerWms;
    TdtGridlineLayer: typeof import("../../tilelayer/gridlineLayer").TdtGridlineLayer;
    TdtSearch: typeof import("../../service/search").TdtSearch;
    TdtRoute: typeof import("../../service/route").TdtRoute;
    TdtCarTrack: typeof import("../../extra/cartrack").TdtCarTrack;
  }
}
