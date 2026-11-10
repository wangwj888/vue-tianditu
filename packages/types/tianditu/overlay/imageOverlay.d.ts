declare namespace T {
  /**
   * 图片覆盖物，由 ImageOverlay 扩展提供（需加载 ImageOverLayer 插件）。
   * 图片随地图缩放和移动，范围由 bounds 决定。
   */
  class ImageOverlay extends Overlay {
    constructor(url: string, bounds: LngLatBounds, opts?: ImageOverlayOptions);
    setOpacity(opacity: number): this;
    getOpacity(): number;
    setImageUrl(url: string): this;
    getImageUrl(): string;
    setBounds(bounds: LngLatBounds): void;
    getBounds(): LngLatBounds;
    getElement(): HTMLImageElement;
    bringToFront(): this;
    bringToBack(): this;
  }

  interface ImageOverlayOptions {
    /** 图片透明度，范围 0-1，默认 1 */
    opacity?: number;
    /** 图片替代文本 */
    alt?: string;
  }
}
