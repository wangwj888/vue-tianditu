import Vue from "vue";
import App from "./App.vue";
import VueTianditu from "vue-tianditu";
import "vue-tianditu/style.css";
Vue.use(VueTianditu);
new Vue({ render: h => h(App) }).$mount("#app");
