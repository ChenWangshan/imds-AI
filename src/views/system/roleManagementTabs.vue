<template>
  <section class="role-management-tabs">
    <EaPageTabs
      class="role-management-tabs__bar"
      :options="tabOptions"
      v-model="activeTab"
    />
    <div class="role-management-tabs__body">
      <RoleManagement v-if="activeTab?.value === 'role'" />
      <MenuManagement v-else />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import type { IPageTabsOption } from "eacon-components";

import RoleManagement from "./roleManagement.vue";
import MenuManagement from "./menuManagement.vue";

const { t } = useI18n();

const tabOptions: IPageTabsOption[] = [
  { label: t("route.roleManagement"), value: "role" },
  { label: t("route.roleMenu"), value: "menu" },
];

const activeTab = ref<IPageTabsOption>(tabOptions[0]);
</script>

<style scoped lang="scss">
.role-management-tabs {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.role-management-tabs__bar {
  flex: 0 0 auto;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--ea-border-color);
}

.role-management-tabs__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
</style>
