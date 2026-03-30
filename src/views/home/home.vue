<template>
  <div class="page">
    <section class="hero">
      <p class="hero__eyebrow">HOME</p>
      <h1>智慧矿山数据管理总览</h1>
      <p class="hero__desc">
        当前登录账号为 <strong>{{ authStore.currentUser?.username || "-" }}</strong
        >，系统管理入口已按数据管理平台的后台框架方式接入。
      </p>
    </section>

    <section class="stats">
      <article v-for="item in stats" :key="item.label" class="card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <p>{{ item.desc }}</p>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { useAuthStore } from "@/stores/modules/auth";

const authStore = useAuthStore();

const stats = computed(() => [
  { label: "在线模块", value: "04", desc: "首页、字典管理、用户管理、矿区管理" },
  { label: "当前主题", value: authStore.currentUser ? "已同步" : "待同步", desc: "主题色沿用数据管理平台色板" },
  { label: "登录状态", value: "ACTIVE", desc: "用户信息已进入 Pinia 与本地缓存" },
]);
</script>

<style scoped lang="scss">
.page {
  padding: 28px;
}

.hero {
  padding: 32px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, var(--ea-primary-disabled) 0%, transparent 24%),
    linear-gradient(135deg, var(--ea-fill-color5) 0%, var(--ea-fill-color6) 100%);
}

.hero__eyebrow {
  margin: 0 0 12px;
  color: var(--ea-primary);
  letter-spacing: 0.3em;
}

.hero h1 {
  margin: 0 0 14px;
  color: var(--ea-text);
  font-size: clamp(32px, 5vw, 48px);
}

.hero__desc {
  max-width: 680px;
  margin: 0;
  color: var(--ea-text-light2);
  line-height: 1.8;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.card {
  padding: 22px;
  border: 1px solid var(--ea-border-color);
  border-radius: 20px;
  background: var(--ea-fill-color5);
}

.card span {
  color: var(--ea-text-light2);
}

.card strong {
  display: block;
  margin: 14px 0 8px;
  color: var(--ea-text);
  font-size: 28px;
}

.card p {
  margin: 0;
  color: var(--ea-text-light2);
  line-height: 1.7;
}

@media (max-width: 960px) {
  .stats {
    grid-template-columns: 1fr;
  }
}
</style>
