import { useEvent as bindEvents } from "../../use";
import type { ToolInstances } from "../types";
import type { Emit } from "./";

export function useEvent({ emit, instances }: { emit: Emit; instances: ToolInstances }): void {
  const bind = (instance: unknown, events: Record<string, string>) => {
    if (!instance) return;
    bindEvents({ events: Object.keys(events), instance, emit: (name: string, event: any) => (emit as any)(events[name], event) });
  };
  bind(instances.markTool, { mouseup: "mark-mouseup" });
  bind(instances.polygonTool, { draw: "polygon-draw", addpoint: "polygon-addpoint" });
  bind(instances.polylineTool, { draw: "polyline-draw", addpoint: "polyline-addpoint" });
  bind(instances.rectangleTool, { draw: "rectangle-draw" });
  bind(instances.circleTool, { draw: "circle-draw", drawend: "circle-drawend" });
}
