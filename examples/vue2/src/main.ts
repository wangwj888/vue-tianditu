import Vue from "vue";
import App from "./App.vue";
import VueTianditu from "vue-map-tianditu";
import "vue-map-tianditu/style.css";
Vue.use(VueTianditu);
new Vue({ render: h => h(App) }).$mount("#app");
