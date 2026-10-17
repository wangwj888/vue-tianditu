import { configureApiLoader } from "./use";
import type { LoadConfig } from "./use";
import * as components from "./components";

interface ComponentRegistry {
  component(name: string, component: any): unknown;
}

export default {
  install: (app: ComponentRegistry, config: LoadConfig = {}): void => {
    configureApiLoader(config);
    Object.entries(components).forEach(([name, component]) => {
      app.component(component.name || name, component);
    });
  }
};
