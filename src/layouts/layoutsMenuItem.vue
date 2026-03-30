<template>
  <el-sub-menu v-if="route.children?.length" :index="route.path">
    <template #title>
      <div class="menu-item">
        <el-icon><component :is="iconComponent" /></el-icon>
        <span>{{ route.meta?.title }}</span>
      </div>
    </template>
    <LayoutsMenuItem v-for="item in route.children" :key="item.path" :route="item" />
  </el-sub-menu>

  <el-menu-item v-else :index="route.path">
    <div class="menu-item">
      <el-icon><component :is="iconComponent" /></el-icon>
      <span>{{ route.meta?.title }}</span>
    </div>
  </el-menu-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { House, Location, Memo, Setting, User } from "@element-plus/icons-vue";
import type { RouteRecordRaw } from "vue-router";

const props = defineProps<{
  route: RouteRecordRaw;
}>();

const iconMap = {
  home: House,
  location: Location,
  memo: Memo,
  setting: Setting,
  user: User,
};

const iconComponent = computed(
  () => iconMap[props.route.meta?.icon as keyof typeof iconMap] ?? Memo,
);
</script>

<style scoped lang="scss">
.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
