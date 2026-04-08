import { createRouter, createWebHashHistory } from "vue-router";

import pinia from "@/stores";
import { useAuthStore } from "@/stores/modules/auth";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/layouts/layouts.vue"),
      redirect: "/home",
      children: [
        {
          path: "/home",
          name: "home",
          component: () => import("@/views/home/home.vue"),
          meta: {
            icon: "home",
            title: "首页",
          },
        },
        {
          path: "/dispatch",
          name: "dispatch-root",
          redirect: "/dispatch/map-monitor",
          meta: {
            icon: "compass",
            title: "智能调度",
          },
          children: [
            {
              path: "/dispatch/map-monitor",
              name: "map-monitor",
              component: () => import("@/views/dispatch/mapMonitor.vue"),
              meta: {
                icon: "location",
                title: "地图监控",
              },
            },
          ],
        },
        {
          path: "/production",
          name: "production-root",
          redirect: "/production/blending-plan",
          meta: {
            icon: "histogram",
            title: "生产管理",
          },
          children: [
            {
              path: "/production/blending-plan",
              name: "blending-plan",
              component: () => import("@/views/production/blendingPlan.vue"),
              meta: {
                icon: "memo",
                title: "配矿计划",
              },
            },
            {
              path: "/production/material-progress",
              name: "material-progress",
              component: () => import("@/views/production/materialProgress.vue"),
              meta: {
                icon: "dataAnalysis",
                title: "物料进度监控",
              },
            },
          ],
        },
        {
          path: "/device",
          name: "device-root",
          redirect: "/device/manage",
          meta: {
            icon: "monitor",
            title: "设备管理",
          },
          children: [
            {
              path: "/device/manage",
              name: "device-manage",
              component: () => import("@/views/system/device.vue"),
              meta: {
                icon: "monitor",
                title: "设备管理",
              },
            },
            {
              path: "/device/model",
              name: "device-model",
              component: () => import("@/views/device/deviceModel.vue"),
              meta: {
                icon: "memo",
                title: "设备型号",
              },
            },
          ],
        },
        {
          path: "/system",
          name: "system",
          redirect: "/system/user",
          meta: {
            icon: "setting",
            title: "系统管理",
          },
          children: [
            {
              path: "/system/user",
              name: "user",
              component: () => import("@/views/system/user.vue"),
              meta: {
                icon: "user",
                title: "用户管理",
              },
            },
            {
              path: "/system/dictionary",
              name: "dictionary",
              component: () => import("@/views/system/dictionary.vue"),
              meta: {
                icon: "memo",
                title: "字典管理",
              },
            },
            {
              path: "/system/mining-area",
              name: "mining-area",
              component: () => import("@/views/system/miningArea.vue"),
              meta: {
                icon: "location",
                title: "矿区管理",
              },
            },
          ],
        },
      ],
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/login/login.vue"),
      meta: {
        menu: false,
      },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/home",
      meta: {
        menu: false,
      },
    },
  ],
  scrollBehavior: () => ({ top: 0, left: 0 }),
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore(pinia);

  if (authStore.token && !authStore.profile) {
    try {
      await authStore.fetchCurrentUser();
    } catch {
      authStore.logout();
    }
  }

  if (to.path === "/login" && authStore.isLoggedIn) {
    return "/home";
  }

  if (to.path !== "/login" && !authStore.isLoggedIn) {
    return "/login";
  }
});

export default router;
