import { configureApiLoader } from "./use";
import type { LoadConfig } from "./use";
import { configureLocale, type LocaleInput } from "./locale";
import * as components from "./components";

interface ComponentRegistry {
  component(name: string, component: any): unknown;
}

export interface InstallConfig extends LoadConfig {
  /** 组件库默认语言；也可在应用启动后调用 configureLocale 动态切换。 */
  locale?: LocaleInput;
}

export default {
  install: (app: ComponentRegistry, config: InstallConfig = {}): void => {
    const { locale, ...loadConfig } = config;
    if (locale !== undefined) configureLocale(locale);
    configureApiLoader(loadConfig);
    Object.entries(components).forEach(([name, component]) => {
      app.component(component.name || name, component);
    });
  }
};
