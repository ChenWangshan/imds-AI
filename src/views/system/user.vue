<template>
  <div class="system-page">
    <header class="system-page__header">
      <h1>用户管理</h1>
      <p>查看当前系统中的登录账号与账号状态。</p>
    </header>

    <div class="system-page__cards">
      <article class="info-card">
        <span>当前登录用户</span>
        <strong>{{ authStore.currentUser?.username || "-" }}</strong>
      </article>
      <article class="info-card">
        <span>账号状态</span>
        <strong>{{ authStore.currentUser?.enabled ? "启用" : "禁用" }}</strong>
      </article>
      <article class="info-card">
        <span>缓存同步</span>
        <strong>已开启</strong>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/modules/auth";

const authStore = useAuthStore();
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

.system-page__cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.info-card {
  padding: 22px;
  border: 1px solid var(--ea-border-color);
  border-radius: 20px;
  background: var(--ea-fill-color5);
}

.info-card span {
  color: var(--ea-text-light2);
}

.info-card strong {
  display: block;
  margin-top: 14px;
  color: var(--ea-text);
  font-size: 28px;
}

@media (max-width: 960px) {
  .system-page__cards {
    grid-template-columns: 1fr;
  }
}
</style>
