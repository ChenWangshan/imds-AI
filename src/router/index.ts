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
          path: "/system",
          name: "system",
          redirect: "/system/dictionary",
          meta: {
            icon: "setting",
            title: "系统管理",
          },
          children: [
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
              path: "/system/user",
              name: "user",
              component: () => import("@/views/system/user.vue"),
              meta: {
                icon: "user",
                title: "用户管理",
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
