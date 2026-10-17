import { createApp } from "vue";
import App from "./App.vue";
import VueTianditu from "vue-map-tianditu";
import "vue-map-tianditu/lib/style.css";
createApp(App).use(VueTianditu).mount("#app");
