<template>
  <div class="system-page">
    <header class="system-page__header">
      <h1>字典管理</h1>
      <p>维护系统基础字典项，便于前后端统一口径。</p>
    </header>

    <div class="system-page__table">
      <div class="row row--head">
        <span>字典名称</span>
        <span>字典编码</span>
        <span>状态</span>
      </div>
      <div v-for="item in rows" :key="item.code" class="row">
        <span>{{ item.name }}</span>
        <span>{{ item.code }}</span>
        <span>{{ item.status }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const rows = [
  { name: "设备状态", code: "DEVICE_STATUS", status: "启用" },
  { name: "矿区等级", code: "MINE_LEVEL", status: "启用" },
  { name: "任务来源", code: "TASK_SOURCE", status: "启用" },
];
</script>

<style scoped lang="scss">
.system-page {
  padding: 28px;
}

.system-page__header h1 {
  margin: 0 0 8px;
  color: var(--ea-text);
}

.system-page__header p {
  margin: 0 0 18px;
  color: var(--ea-text-light2);
}

.system-page__table {
  border: 1px solid var(--ea-border-color);
  border-radius: 20px;
  overflow: hidden;
}

.row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 120px;
  gap: 16px;
  padding: 16px 20px;
  background: var(--ea-fill-color5);
  color: var(--ea-text-light);
}

.row + .row {
  border-top: 1px solid var(--ea-border-color);
}

.row--head {
  background: var(--ea-fill-color3);
  color: var(--ea-text);
  font-weight: 700;
}
</style>
