import { afterEach, describe, expect, it } from "vitest";
import { createApp, defineComponent, h, nextTick, ref } from "vue";
import { configureLocale, provideLocale, useLocale } from "../packages/locale";

async function flush() {
  await Promise.resolve();
  await nextTick();
}

afterEach(() => {
  configureLocale("zh-CN");
  document.body.replaceChildren();
});

describe("locale injection", () => {
  it("updates descendants when the parent locale prop changes", async () => {
    const Child = defineComponent({
      name: "LocaleChild",
      setup() {
        const messages = useLocale();
        return () => h("span", messages.value.search.placeholder);
      }
    });
    const Parent = defineComponent({
      name: "LocaleParent",
      props: { locale: { type: String, default: undefined } },
      setup(props) {
        provideLocale(() => props.locale as never);
        return () => h(Child);
      }
    });
    const host = document.createElement("div");
    document.body.appendChild(host);
    const locale = ref<string | undefined>(undefined);
    const app = createApp({
      setup() {
        return () => h(Parent, { locale: locale.value });
      }
    });
    app.mount(host);
    await flush();
    expect(host.textContent).toBe("输入关键字搜索");

    locale.value = "en-US";
    await flush();
    expect(host.textContent).toBe("Search places");

    configureLocale("en-US");
    locale.value = undefined;
    await flush();
    expect(host.textContent).toBe("Search places");
    app.unmount();
  });

  it("merges a component override over the inherited language", async () => {
    const Child = defineComponent({
      name: "LocaleOverrideChild",
      setup() {
        const messages = useLocale(() => ({ search: { loading: "加载中" } }));
        return () => h("span", `${messages.value.search.loading}|${messages.value.search.empty}`);
      }
    });
    const Parent = defineComponent({
      name: "LocaleOverrideParent",
      setup() {
        provideLocale(() => "en-US");
        return () => h(Child);
      }
    });
    const host = document.createElement("div");
    document.body.appendChild(host);
    const app = createApp(Parent);
    app.mount(host);
    await flush();
    expect(host.textContent).toBe("加载中|No matching results");
    app.unmount();
  });
});
