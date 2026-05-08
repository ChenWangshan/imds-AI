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
            i18nKey: "route.home",
            title: "首页",
          },
        },
        {
          path: "/agent",
          name: "agent-root",
          redirect: "/agent/workbench",
          meta: {
            icon: "opportunity",
            i18nKey: "route.agent",
            title: "Agent 工作台",
          },
          children: [
            {
              path: "/agent/workbench",
              name: "agent-workbench",
              component: () => import("@/views/agent/index.vue"),
              meta: {
                icon: "opportunity",
                i18nKey: "route.agent",
                title: "Agent 工作台",
              },
            },
          ],
        },
        {
          path: "/dispatch",
          name: "dispatch-root",
          redirect: "/dispatch/map-monitor",
          meta: {
            icon: "compass",
            i18nKey: "route.dispatch",
            title: "智能调度",
          },
          children: [
            {
              path: "/dispatch/map-monitor",
              name: "map-monitor",
              component: () => import("@/views/dispatch/mapMonitor.vue"),
              meta: {
                icon: "location",
                i18nKey: "route.mapMonitor",
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
            i18nKey: "route.production",
            title: "生产管理",
          },
          children: [
            {
              path: "/production/blending-plan",
              name: "blending-plan",
              component: () => import("@/views/production/blendingPlan.vue"),
              meta: {
                icon: "memo",
                i18nKey: "route.blendingPlan",
                title: "配矿计划",
              },
            },
            {
              path: "/production/material-progress",
              name: "material-progress",
              component: () => import("@/views/production/materialProgress.vue"),
              meta: {
                icon: "dataAnalysis",
                i18nKey: "route.materialProgress",
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
            i18nKey: "route.deviceRoot",
            title: "设备管理",
          },
          children: [
            {
              path: "/device/manage",
              name: "device-manage",
              component: () => import("@/views/system/device.vue"),
              meta: {
                icon: "monitor",
                i18nKey: "route.deviceManage",
                title: "设备管理",
              },
            },
            {
              path: "/device/model",
              name: "device-model",
              component: () => import("@/views/device/deviceModel.vue"),
              meta: {
                icon: "memo",
                i18nKey: "route.deviceModel",
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
            i18nKey: "route.system",
            title: "系统管理",
          },
          children: [
            {
              path: "/system/user",
              name: "user",
              component: () => import("@/views/system/user.vue"),
              meta: {
                icon: "user",
                i18nKey: "route.user",
                title: "用户管理",
              },
            },
            {
              path: "/system/dictionary",
              name: "dictionary",
              component: () => import("@/views/system/dictionary.vue"),
              meta: {
                icon: "memo",
                i18nKey: "route.dictionary",
                title: "字典管理",
              },
            },
            {
              path: "/system/mining-area",
              name: "mining-area",
              component: () => import("@/views/system/miningArea.vue"),
              meta: {
                icon: "location",
                i18nKey: "route.miningArea",
                title: "矿区管理",
              },
            },
            {
              path: "/system/menu-management",
              name: "menu-management",
              component: () => import("@/views/system/menuManagement.vue"),
              meta: {
                icon: "grid",
                i18nKey: "route.menuManagement",
                title: "菜单管理",
              },
            },
            {
              path: "/system/role-management",
              name: "role-management",
              component: () => import("@/views/system/roleManagement.vue"),
              meta: {
                icon: "userFilled",
                i18nKey: "route.roleManagement",
                title: "角色管理",
              },
            },
            {
              path: "/system/i18n-config",
              name: "i18n-config",
              component: () => import("@/views/system/i18nConfig.vue"),
              meta: {
                icon: "grid",
                i18nKey: "route.i18nConfig",
                title: "国际化配置",
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
