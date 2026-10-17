import defaultTheme from "vitepress/theme";
import VueTianditu from "../../../packages";
import components from "../components";
import "./style.css";

const demoToken = "7f013d0186775b063d6a046977bbefc6";
const token = import.meta.env.VITE_TDT_TOKEN;

if (import.meta.env.DEV && !token) {
  console.warn(
    "[vue-map-tianditu docs] 未设置 VITE_TDT_TOKEN，将使用演示 Key。" +
      "该 Key 绑定了文档站域名，本地访问地图瓦片会返回 403（域名不匹配）。" +
      "请在仓库根目录的 .env.local 中配置自己的天地图 Key。"
  );
}

export default {
  extends: defaultTheme,
  enhanceApp({ app }) {
    app.use(VueTianditu, {
      v: "4.0",
      tk: token || demoToken
    });
    app.use(components);
  }
};
