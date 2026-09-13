<template>
  <section class="layer-management-page">
    <div class="layer-management-page__placeholder">
      <el-icon class="layer-management-page__icon"><Tickets /></el-icon>
      <h2>{{ $t("route.layerManagement") }}</h2>
      <p>{{ $t("layerManagement.description") }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Tickets } from "@element-plus/icons-vue";
</script>

<style scoped>
.layer-management-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: 24px;
}

.layer-management-page__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.layer-management-page__icon {
  font-size: 48px;
  color: var(--el-color-primary);
}

.layer-management-page__placeholder h2 {
  margin: 0;
  font-size: 20px;
  color: var(--el-text-color-primary);
}

.layer-management-page__placeholder p {
  margin: 0;
  font-size: 14px;
}
</style>
