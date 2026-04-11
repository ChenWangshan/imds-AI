import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_JAVA_AI_PROXY_TARGET || "http://127.0.0.1:8081";
  const deviceCenterProxyTarget =
    env.VITE_DEVICE_CENTER_PROXY_TARGET || "http://127.0.0.1:8082";
  const dispatchCenterProxyTarget =
    env.VITE_DISPATCH_CENTER_PROXY_TARGET || "http://127.0.0.1:8083";

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/device-api": {
          target: deviceCenterProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/device-api/, ""),
        },
        "/dispatch-api": {
          target: dispatchCenterProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/dispatch-api/, ""),
        },
      },
    },
    preview: {
      host: "0.0.0.0",
    },
  };
});
