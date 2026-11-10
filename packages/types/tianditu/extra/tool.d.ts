declare namespace T {
  /** 天地图交互工具基类（由 Tool 扩展提供）。 */
  class Tool {
    constructor(...args: any[]);
    static extend(opts: Record<string, any>): new (...args: any[]) => Tool;
    enable(): void;
    disable(): void;
    on(event: string, handler: (...args: any[]) => void, context?: unknown): void;
    off(event: string, handler: (...args: any[]) => void, context?: unknown): void;
    trigger(event: string, data?: unknown): void;
  }
}
