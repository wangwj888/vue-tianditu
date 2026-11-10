# 主题与国际化

搜索、路线规划等内置界面提供两层定制能力：

- **主题**：通过 CSS 变量调整颜色、圆角、阴影和字号，支持暗色主题。
- **国际化**：通过 `locale` prop 或全局 `configureLocale()` 切换中英文，并允许局部覆盖文案。

## 示例

<ClientOnly>
<demo-locale-theme></demo-locale-theme>
</ClientOnly>

<code-details>

<<< @/.vitepress/components/demo-locale-theme/index.vue

</code-details>

## CSS 变量

以下变量定义在 `:root`，可在任意祖先节点或单个组件上覆盖：

| 变量                         | 亮色默认值                     | 暗色默认值                   | 说明           |
| ---------------------------- | ------------------------------ | ---------------------------- | -------------- |
| `--tdt-color-primary`        | `#2c64a7`                      | `#7aa7e0`                    | 选中态、强调色 |
| `--tdt-color-primary-active` | `#1f4f86`                      | `#a3c4ef`                    | 强调色按下态   |
| `--tdt-color-text`           | `#333`                         | `#e8e8e8`                    | 主文本         |
| `--tdt-color-text-secondary` | `#555`                         | `#c2c2c2`                    | 次要文本       |
| `--tdt-color-text-muted`     | `#999`                         | `#9a9a9a`                    | 弱化文本       |
| `--tdt-color-bg`             | `#fff`                         | `#1b1b1f`                    | 背景           |
| `--tdt-color-bg-hover`       | `#f5f5f5`                      | `#2b2b31`                    | 悬停背景       |
| `--tdt-color-border`         | `#eee`                         | `#3a3a40`                    | 边框、分隔线   |
| `--tdt-color-divider`        | `#aaa`                         | `#55555c`                    | 分段按钮分隔线 |
| `--tdt-radius`               | `2px`                          | `2px`                        | 圆角           |
| `--tdt-shadow`               | `2px 2px 2px rgb(0 0 0 / 15%)` | `0 2px 8px rgb(0 0 0 / 55%)` | 阴影           |
| `--tdt-font-family`          | `inherit`                      | `inherit`                    | 字体           |
| `--tdt-font-size`            | `14px`                         | `14px`                       | 主字号         |
| `--tdt-font-size-sm`         | `12px`                         | `12px`                       | 小字号         |
| `--tdt-font-size-xs`         | `10px`                         | `10px`                       | 辅助字号       |
| `--tdt-control-height`       | `30px`                         | `30px`                       | 搜索框高度     |

```css
.my-map-panel {
  --tdt-color-primary: #0f766e;
  --tdt-radius: 6px;
}
```

## 暗色主题

三种方式任选其一：

```html
<!-- 只作用于某个容器 -->
<div data-tdt-theme="dark">...</div>

<!-- 或使用类名 -->
<div class="tdt-dark">...</div>
```

VitePress 等默认使用 `.dark` 类切换暗色的站点会直接生效；也可以把 `data-tdt-theme="light"` 设在局部容器上以强制亮色。

暗色样式只覆盖 CSS 变量，不修改天地图底图。底图暗色请使用 `mapStyle="black"` 或自定义瓦片。

## 国际化

### 组件级

`TdtSearch`、`TdtRoute` 增加 `locale` prop：

```vue
<tdt-search locale="en-US" />
<tdt-search :locale="{ search: { placeholder: '查找地点' } }" />
```

类型：

```ts
type LocaleInput =
  | "zh-CN"
  | "en-US"
  | {
      common?: Partial<LocaleMessages["common"]>;
      search?: Partial<LocaleMessages["search"]>;
      route?: Partial<LocaleMessages["route"]>;
    };
```

`TdtSearch` 中内嵌的路线规划会自动继承同一语言；`TdtRoute` 也可以单独设置。

### 全局配置

```ts
import { configureLocale } from "vue-map-tianditu";

configureLocale("en-US");
// 或只覆盖部分文案
configureLocale({
  search: { placeholder: "查找地点" },
  route: { planning: "正在规划…" }
});
```

也可以在安装时指定：

```ts
app.use(VueTianditu, { tk: "你的 Key", locale: "en-US" });
```

`configureLocale()` 会触发已挂载组件重新渲染，适合运行时切换语言。

### 导出字典

```ts
import { zhCN, enUS, formatMessage } from "vue-map-tianditu";

const text = formatMessage(enUS.route.drivingSummary, {
  title: "Route 1",
  duration: 120,
  distance: 3.5
});
```

自定义语言时，以 `zhCN` 或 `enUS` 为模板覆盖所需字段即可；未覆盖的字段回退到默认中文或父级组件语言。

## 当前覆盖范围

主题变量覆盖搜索与路线规划的内置界面、右键菜单和新增工具的默认样式。要素颜色（折线 `color`、圆 `fillColor`、热力图色阶等）仍由各自 props 控制，不使用主题变量，避免影响业务数据的语义配色。
