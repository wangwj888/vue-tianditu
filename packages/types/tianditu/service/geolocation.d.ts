declare namespace T {
  /** SDK H5定位；组件TdtGeolocation直接使用浏览器API，不使用SDK的城市降级结果。 */
  class Geolocation {
    constructor();
    /** 失败时result为null。官方未列明options的具体字段。 */
    getCurrentPosition(callback: (this: Geolocation, result: GeolocationResult | null) => void, options?: object): void;
    /** SDK状态码；请勿与浏览器GeolocationPositionError.code混用。 */
    getStatus(): number;
  }

  interface GeolocationResult {
    lnglat: LngLat;
    /** 定位精度，单位米。 */
    accuracyNumber: number;
    /** 官方H5示例使用的城市降级建议缩放级别。 */
    level?: number;
  }
}
