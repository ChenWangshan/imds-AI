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
  const agentCenterProxyTarget =
    env.VITE_AGENT_CENTER_PROXY_TARGET || "http://127.0.0.1:8084";
  const eqfleetProxyTarget =
    env.VITE_EQFLEET_PROXY_TARGET || "https://gateway-test12.eqfleetcmder.com";

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    // 本地 file: 链到 eacon-components 时，包内容更新不一定改 lockfile；
    // 若走 optimizeDeps 缓存，易出现 lib JS 与 index.css 的 scoped hash 不一致，
    // 导致 Icon/Button 等组件样式全部失效（图标变成 300x150）。
    optimizeDeps: {
      exclude: ["eacon-components"],
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
        "/agent-api": {
          target: agentCenterProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/agent-api/, ""),
        },
        "/eqfleet": {
          target: eqfleetProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/eqfleet/, ""),
        },
      },
    },
    preview: {
      host: "0.0.0.0",
    },
  };
});
