/// <reference types="vite/client" />

declare module "eacon-components" {
  import type { Plugin } from "vue";
  const plugin: Plugin;
  export default plugin;
}

declare module "eacon-components/index.css";
