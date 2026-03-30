import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import components from "eacon-components";

import App from "./App.vue";
import pinia from "./stores";
import router from "./router";
import i18n from "./i18n";
import "./styles/index.scss";
import "eacon-components/index.css";

createApp(App).use(pinia).use(router).use(i18n).use(ElementPlus).use(components).mount("#app");
