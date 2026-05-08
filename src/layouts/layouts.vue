<template>
  <div class="app-layout">
    <LayoutsHeader />

    <div
      class="app-layout__content"
      :class="{ 'app-layout__content--menu-hidden': globalStore.menuCollapsed }"
    >
      <aside
        class="app-layout__menu"
        :class="{ 'app-layout__menu--hidden': globalStore.menuCollapsed }"
      >
        <div class="app-layout__menu-shell">
          <el-scrollbar class="app-layout__menu-scrollbar">
            <el-menu
              ref="menuRef"
              :default-active="activeMenuPath"
              :default-openeds="openedMenus"
              :unique-opened="true"
              class="layout-menu"
              router
            >
              <LayoutsMenuItem
                v-for="item in menuRoutes"
                :key="item.path"
                :route="item"
              />
            </el-menu>
          </el-scrollbar>
        </div>
      </aside>

      <section class="app-layout__main">
        <div class="app-layout__main-shell">
          <RouterView />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

import { useGlobalStore } from "@/stores/modules/global";
import LayoutsHeader from "./layoutsHeader.vue";
import LayoutsMenuItem from "./layoutsMenuItem.vue";

const HOME_PATH = "/home";

const route = useRoute();
const router = useRouter();
const globalStore = useGlobalStore();
const menuRef = ref<{ open: (index: string) => void; close: (index: string) => void } | null>(
  null,
);

type MenuMatch = {
  activePath: string;
  openPaths: string[];
};

const menuRoutes = computed(() => {
  const rootRoute = router.options.routes.find((item) => item.path === "/");
  return rootRoute?.children?.filter((item) => item.meta?.menu !== false) ?? [];
});

const allSubMenuPaths = computed(() => collectSubMenuPaths(menuRoutes.value));

const currentMenuMatch = computed(
  () => findMenuMatch(menuRoutes.value, route.path) ?? findMenuMatch(menuRoutes.value, HOME_PATH),
);

const activeMenuPath = computed(() => currentMenuMatch.value?.activePath ?? HOME_PATH);

const openedMenus = computed(() => {
  if (globalStore.menuCollapsed) {
    return [];
  }

  return currentMenuMatch.value?.openPaths ?? [];
});

function collectSubMenuPaths(routes: RouteRecordRaw[]) {
  return routes.reduce<string[]>((paths, item) => {
    if (item.meta?.menu === false) {
      return paths;
    }

    if (item.children?.length) {
      paths.push(item.path, ...collectSubMenuPaths(item.children));
    }

    return paths;
  }, []);
}

function findMenuMatch(
  routes: RouteRecordRaw[],
  targetPath: string,
  parentPaths: string[] = [],
): MenuMatch | null {
  for (const item of routes) {
    if (item.meta?.menu === false) {
      continue;
    }

    if (item.path === targetPath) {
      return {
        activePath: item.path,
        openPaths: parentPaths,
      };
    }

    if (item.children?.length) {
      const childMatch = findMenuMatch(item.children, targetPath, [...parentPaths, item.path]);
      if (childMatch) {
        return childMatch;
      }
    }
  }

  return null;
}

async function syncOpenedMenus(openPaths: string[]) {
  await nextTick();

  const menu = menuRef.value;
  if (!menu) {
    return;
  }

  const openPathSet = new Set(openPaths);
  allSubMenuPaths.value.forEach((path) => {
    if (!openPathSet.has(path)) {
      menu.close(path);
    }
  });

  openPaths.forEach((path) => {
    menu.open(path);
  });
}

watch(openedMenus, syncOpenedMenus, { immediate: true });
</script>

<style scoped lang="scss">
.app-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100dvh;
  background: transparent;
}

.app-layout__content {
  display: flex;
  align-items: stretch;
  flex: 1 1 auto;
  min-height: 0;
  padding: 18px;
  overflow: hidden;
}

.app-layout__content--menu-hidden .app-layout__main {
  margin-left: 0;
}

.app-layout__menu,
.app-layout__main {
  min-height: 0;
}

.app-layout__menu {
  flex: 0 0 298px;
  display: flex;
  transition:
    flex-basis var(--ea-transition),
    width var(--ea-transition),
    margin-right var(--ea-transition),
    opacity var(--ea-transition);
}

.app-layout__menu--hidden {
  flex-basis: 0;
  width: 0;
  margin-right: 0;
  opacity: 0;
  pointer-events: none;
}

.app-layout__main {
  flex: 1 1 auto;
  min-width: 0;
  margin-left: 18px;
  transition: margin-left var(--ea-transition);
}

.app-layout__menu-shell,
.app-layout__main-shell {
  border: 1px solid var(--app-shell-border);
  border-radius: 16px;
  background: var(--app-shell-bg);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 0 0 1px var(--app-shell-ring);
}

.app-layout__menu-shell {
  display: flex;
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  overflow: hidden;
  height: calc(100dvh - 126px);
  max-height: calc(100dvh - 126px);
}

.app-layout__menu-scrollbar {
  flex: 1 1 auto;
  min-height: 0;
}

.app-layout__menu-scrollbar :deep(.el-scrollbar__wrap),
.app-layout__menu-scrollbar :deep(.el-scrollbar__view) {
  min-height: 100%;
}

.layout-menu {
  height: 100%;
  width: 100%;
  min-height: 100%;
  padding: 16px 14px 20px;
  border: 0;
  background: var(--app-menu-bg);
  --el-menu-bg-color: transparent;
  --el-menu-text-color: var(--app-menu-text);
  --el-menu-active-color: var(--ea-primary);
  --el-menu-hover-bg-color: var(--app-menu-hover);
}

.layout-menu :deep(.el-menu) {
  border-right: 0;
  background: transparent;
}

.layout-menu :deep(.el-menu-item),
.layout-menu :deep(.el-sub-menu__title) {
  height: 48px;
  margin-bottom: 6px;
  padding: 0 16px;
  border-radius: 12px;
}

.layout-menu :deep(.el-menu-item:hover),
.layout-menu :deep(.el-sub-menu__title:hover) {
  background: var(--app-menu-hover);
}

.layout-menu :deep(.el-menu-item.is-active) {
  background: var(--app-menu-active-bg);
  box-shadow: var(--app-menu-active-shadow);
}

.layout-menu :deep(.el-sub-menu .el-menu-item) {
  min-width: 0;
  height: 42px;
  margin-left: 12px;
  padding-left: 18px;
  color: var(--app-menu-subtext);
  opacity: 0.9;
}

.layout-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: var(--ea-primary);
}

.app-layout__main-shell {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: calc(100dvh - 126px);
  padding: 22px;
  overflow: auto;
  max-height: calc(100dvh - 126px);
}

.app-layout__main-shell :deep(> *) {
  flex: 1 1 auto;
  min-height: 0;
}

@media (max-width: 1100px) {
  .app-layout__content {
    flex-direction: column;
    overflow: visible;
  }

  .app-layout__menu {
    flex-basis: auto;
    width: 100%;
  }

  .app-layout__menu-shell,
  .app-layout__main-shell {
    height: auto;
    max-height: none;
  }
}

@media (max-width: 640px) {
  .app-layout__content {
    gap: 14px;
    padding: 14px;
  }

  .app-layout__main-shell {
    padding: 14px;
  }
}
</style>
