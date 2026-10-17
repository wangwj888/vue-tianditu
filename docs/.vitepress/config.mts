import { defineConfig } from "vitepress";
export default defineConfig({
  base: "/vue-tianditu/",
  lang: "zh-CN",
  title: "VueTianditu",
  description: "支持 Vue 2.7 和 Vue 3 的天地图组件库",
  vite: {
    // 文档的 Vite root 是 docs 目录，把 envDir 指回仓库根目录，复用根目录 .env.local
    envDir: "../",
    css: { preprocessorOptions: { scss: { api: "modern" } } }
  },
  themeConfig: {
    repo: "wangwj888/vue-tianditu",
    nav: [
      { text: "3.x 迁移指南", link: "/migration" },
      { text: "天地图官网", link: "https://www.tianditu.gov.cn/" }
    ],
    search: { provider: "local" },
    sidebar: [
      { text: "开始", link: "/" },
      { text: "迁移到 3.x", link: "/migration" },
      { text: "API 加载器", link: "/api-loader" },
      { text: "更新日志", link: "/CHANGELOG" },
      {
        text: "地图",
        items: [
          { text: "基础地图", link: "/map/map" },
          { text: "控件", link: "/map/control" },
          { text: "地图工具", link: "/mousetool/mousetool" }
        ]
      },
      {
        text: "图层",
        items: [
          { text: "自定义图层", link: "/tilelayer/tilelayer" },
          { text: "天地图矢量图层", link: "/tilelayer/tilelayer-tdt" },
          { text: "WMS 服务图层", link: "/tilelayer/tilelayer-wms" },
          { text: "网格图层", link: "/tilelayer/gridline-layer" }
        ]
      },
      {
        text: "覆盖物",
        items: [
          { text: "自定义 DOM 覆盖物", link: "/overlay/custom-overlay" },
          { text: "热力图", link: "/overlay/heatmap" },
          { text: "文本标注", link: "/overlay/label" },
          { text: "点标注", link: "/overlay/marker" },
          { text: "信息窗口", link: "/overlay/infowindow" },
          { text: "折线", link: "/overlay/polyline" },
          { text: "多边形", link: "/overlay/polygon" },
          { text: "矩形", link: "/overlay/rectangle" },
          { text: "圆形", link: "/overlay/circle" },
          { text: "点聚合", link: "/overlay/marker-clusterer" },
          { text: "海量密集点", link: "/overlay/cloud-marker-collection" }
        ]
      },
      {
        text: "服务",
        items: [
          { text: "搜索", link: "/service/search" },
          { text: "导航", link: "/service/route" }
        ]
      },
      { text: "扩展", items: [{ text: "车辆轨迹", link: "/extra/car-track" }] }
    ]
  }
});
