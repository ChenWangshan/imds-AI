<template>
  <div class="app-layout">
    <LayoutsHeader />
    <div class="app-layout__content">
      <aside class="app-layout__menu">
        <el-scrollbar>
          <el-menu
            :default-active="route.path"
            :default-openeds="['/system']"
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
      </aside>

      <section class="app-layout__main">
        <RouterView />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";

import LayoutsHeader from "./layoutsHeader.vue";
import LayoutsMenuItem from "./layoutsMenuItem.vue";

const route = useRoute();
const router = useRouter();

const menuRoutes = computed(() => {
  const rootRoute = router.options.routes.find((item) => item.path === "/");
  return rootRoute?.children?.filter((item) => item.meta?.menu !== false) ?? [];
});
</script>

<style scoped lang="scss">
.app-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100dvh;
}

.app-layout__content {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  padding: 14px;
  gap: 14px;
}

.app-layout__menu {
  width: 220px;
  border: 1px solid var(--ea-border-color);
  border-radius: var(--ea-radius-large);
  background: var(--ea-fill-color6);
  overflow: hidden;
}

.layout-menu {
  min-height: 100%;
  padding: 12px;
  border: 0;
  background: transparent;
  --el-menu-bg-color: transparent;
  --el-menu-active-color: var(--ea-primary);
  --el-menu-text-color: var(--ea-text-light2);
  --el-menu-hover-bg-color: var(--ea-primary-disabled);
}

.layout-menu :deep(.el-menu-item),
.layout-menu :deep(.el-sub-menu__title) {
  height: 40px;
  border-radius: 10px;
}

.layout-menu :deep(.el-menu) {
  border-right: 0;
  background: transparent;
}

.layout-menu :deep(.el-menu-item.is-active) {
  background: var(--ea-primary-disabled);
}

.app-layout__main {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--ea-border-color);
  border-radius: var(--ea-radius-large);
  background: var(--ea-fill-color6);
  overflow: auto;
}

@media (max-width: 960px) {
  .app-layout__content {
    flex-direction: column;
  }

  .app-layout__menu {
    width: 100%;
  }
}
</style>
