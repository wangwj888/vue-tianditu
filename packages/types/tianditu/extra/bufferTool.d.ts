declare namespace T {
  /**
   * 缓冲区分析工具，由 BufferTool 扩展提供（需先加载 turf 与 BufferTool 插件）。
   * 拖动传入的图形时生成缓冲区，可在地图上调整半径。
   */
  class BufferTool extends Tool {
    constructor(map: Map, overlayGroup: BufferToolLayer[], opts?: BufferToolOptions);
    options: BufferToolOptions;
    OverlayGroup: BufferToolLayer[];
    buffers: LayerGroup;
    enable(): void;
    disable(): void;
    open(): void;
    close(): void;
    clear(): void;
    addLayer(layer: BufferToolLayer): void;
    getBufferLayers(): GroupLayer[];
  }

  type BufferToolLayer = Polygon | Circle;

  interface BufferToolOptions {
    style?: BufferToolStyle;
  }

  interface BufferToolStyle {
    color?: string;
    weight?: number;
    opacity?: number;
    fillColor?: string;
    fillOpacity?: number;
    lineStyle?: "solid" | "dashed";
  }

  interface BufferToolEvent {
    layer: BufferToolLayer;
    buffer: Polygon | Circle;
    lnglat: LngLat;
    radius?: number;
  }
}
