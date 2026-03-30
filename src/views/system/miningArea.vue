<template>
  <div class="system-page">
    <header class="system-page__header">
      <h1>矿区管理</h1>
      <p>展示矿区配置入口，为后续区域、设备与组织关联预留结构。</p>
    </header>

    <div class="mine-list">
      <article v-for="item in mines" :key="item.name" class="mine-card">
        <h2>{{ item.name }}</h2>
        <p>{{ item.desc }}</p>
        <span>{{ item.status }}</span>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
const mines = [
  { name: "北区矿区", desc: "负责主运输链路与产量监控。", status: "运行中" },
  { name: "南区矿区", desc: "负责采装调度与设备保障。", status: "运行中" },
  { name: "西区矿区", desc: "预留扩展区域，可接入新站点。", status: "规划中" },
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

.mine-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.mine-card {
  padding: 22px;
  border: 1px solid var(--ea-border-color);
  border-radius: 22px;
  background: linear-gradient(180deg, var(--ea-fill-color5) 0%, var(--ea-fill-color6) 100%);
}

.mine-card h2 {
  margin: 0 0 12px;
  color: var(--ea-text);
}

.mine-card p {
  margin: 0 0 16px;
  color: var(--ea-text-light2);
  line-height: 1.7;
}

.mine-card span {
  color: var(--ea-primary);
}

@media (max-width: 960px) {
  .mine-list {
    grid-template-columns: 1fr;
  }
}
</style>
