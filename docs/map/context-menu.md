# 右键菜单

天地图 4.0 没有官方 `T.ContextMenu` 类，只提供地图 `contextmenu` 事件。`TdtContextMenu` 基于该事件实现一个可访问的 DOM 菜单，支持默认菜单项、完全自定义插槽、键盘导航和受控显隐。

## 示例

<ClientOnly>
<demo-context-menu></demo-context-menu>
</ClientOnly>

<code-details>

<<< @/.vitepress/components/demo-context-menu/index.vue

</code-details>

## 按需引入

```ts
import { TdtMap, TdtContextMenu } from "vue-map-tianditu";
import type { ContextMenuEntry, ContextMenuContext, ContextMenuItem } from "vue-map-tianditu";
```

将组件直接放在 `TdtMap` 内。组件渲染一个绝对定位的锚点，菜单定位在地图容器内；不要放进 `TdtLayerGroup` 等会隐藏子节点的容器。

## 属性

| 属性            | 类型                 | 默认值 | 说明                                   |
| --------------- | -------------------- | ------ | -------------------------------------- |
| `items`         | `ContextMenuEntry[]` | []     | 菜单项；`{ type: "divider" }` 为分隔线 |
| `enabled`       | boolean              | true   | 是否响应地图右键                       |
| `visible`       | boolean              | —      | 受控显隐；不传时由组件内部管理         |
| `offset`        | `[number, number]`   | [0, 0] | 相对鼠标位置的偏移                     |
| `closeOnSelect` | boolean              | true   | 点击菜单项后是否自动关闭               |
| `closeOnMove`   | boolean              | true   | 地图平移、缩放、拖拽时是否关闭         |
| `minWidth`      | number               | 160    | 菜单最小宽度，单位像素                 |
| `maxWidth`      | number               | 320    | 菜单最大宽度，单位像素                 |
| `zIndex`        | number               | 1200   | 菜单层级                               |

菜单项字段：

```ts
interface ContextMenuItem {
  key: string;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  iconUrl?: string;
}
```

## 事件

| 事件             | 参数                                        | 说明                               |
| ---------------- | ------------------------------------------- | ---------------------------------- |
| `open`           | `{ lnglat, containerPoint, originalEvent }` | 菜单打开                           |
| `close`          | 无                                          | 菜单关闭                           |
| `select`         | `(item, context)`                           | 点击菜单项                         |
| `update:visible` | boolean                                     | 显隐变化，可用于 `v-model:visible` |

`context.lnglat` 为 `[经度, 纬度]`，`containerPoint` 为相对地图容器的像素坐标。

## 方法

| 方法                     | 说明               |
| ------------------------ | ------------------ |
| `open(lnglat, options?)` | 在指定坐标打开菜单 |
| `close()`                | 关闭菜单           |
| `getMenuElement()`       | 获取菜单 DOM 元素  |

## 自定义菜单

默认插槽会替换整个菜单内容，插槽参数包含 `lnglat`、`containerPoint`、`items`、`visible`、`select` 和 `close`：

```vue
<tdt-context-menu @select="onSelect">
  <template #default="{ lnglat, close }">
    <div class="my-menu">
      <button @click="addPoint(lnglat); close()">添加点</button>
      <button @click="showWeather(lnglat); close()">查看天气</button>
    </div>
  </template>
</tdt-context-menu>
```

需要自定义单项外观时，使用 `item` 插槽。插槽内容负责自己的点击与键盘行为；需要保留默认行为时，请直接使用默认菜单项渲染。

```vue
<tdt-context-menu :items="items">
  <template #item="{ item }">
    <span class="my-item">{{ item.label }}</span>
  </template>
</tdt-context-menu>
```

## 交互与可访问性

- 菜单使用 `role="menu"` / `role="menuitem"`，打开后自动聚焦第一项。
- `↑` / `↓` / `Home` / `End` 移动焦点，`Enter` / 空格触发，`Esc` 关闭。
- 点击菜单外部、地图左键或地图移动时关闭。
- 右键事件会阻止浏览器默认菜单；`enabled=false` 时不拦截。
- 菜单打开期间会保存并恢复之前的焦点。

## API 表

<ApiTable component="TdtContextMenu" />
