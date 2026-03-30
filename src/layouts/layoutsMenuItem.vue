<template>
  <el-sub-menu v-if="route.children?.length" :index="route.path">
    <template #title>
      <div class="menu-item">
        <el-icon class="menu-item__icon"><component :is="iconComponent" /></el-icon>
        <span class="menu-item__label">{{ route.meta?.title }}</span>
      </div>
    </template>
    <LayoutsMenuItem v-for="item in route.children" :key="item.path" :route="item" />
  </el-sub-menu>

  <el-menu-item v-else :index="route.path">
    <div class="menu-item">
      <el-icon class="menu-item__icon"><component :is="iconComponent" /></el-icon>
      <span class="menu-item__label">{{ route.meta?.title }}</span>
    </div>
  </el-menu-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  Briefcase,
  Coin,
  Compass,
  DataAnalysis,
  Grid,
  Histogram,
  House,
  Location,
  Memo,
  Monitor,
  Opportunity,
  PieChart,
  Setting,
  Stopwatch,
  User,
} from "@element-plus/icons-vue";
import type { RouteRecordRaw } from "vue-router";

const props = defineProps<{
  route: RouteRecordRaw;
}>();

const iconMap = {
  briefcase: Briefcase,
  coin: Coin,
  compass: Compass,
  data: DataAnalysis,
  grid: Grid,
  histogram: Histogram,
  home: House,
  location: Location,
  memo: Memo,
  monitor: Monitor,
  opportunity: Opportunity,
  pie: PieChart,
  setting: Setting,
  stopwatch: Stopwatch,
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
  width: 100%;
  gap: 12px;
}

.menu-item__icon {
  font-size: 18px;
}

.menu-item__label {
  min-width: 0;
  overflow: hidden;
  color: inherit;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
