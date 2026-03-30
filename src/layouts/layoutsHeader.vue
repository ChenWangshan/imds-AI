<template>
  <header class="layouts-header">
    <div class="layouts-header__brand" @click="router.push('/home')">
      <div class="layouts-header__logo">EA</div>
      <div class="layouts-header__divider" />
      <div class="layouts-header__title">数据管理平台</div>
    </div>

    <div class="layouts-header__actions">
      <el-button circle class="layouts-header__theme" @click="globalStore.toggleTheme">
        <el-icon v-if="globalStore.isDark"><Sunny /></el-icon>
        <el-icon v-else><Moon /></el-icon>
      </el-button>

      <div class="layouts-header__user">
        <span class="label">当前用户</span>
        <strong>{{ authStore.currentUser?.username || "-" }}</strong>
      </div>

      <el-button class="layouts-header__logout" @click="handleLogout">退出登录</el-button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Moon, Sunny } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";

import { useAuthStore } from "@/stores/modules/auth";
import { useGlobalStore } from "@/stores/modules/global";

const router = useRouter();
const authStore = useAuthStore();
const globalStore = useGlobalStore();

function handleLogout() {
  authStore.logout();
  router.replace("/login");
}
</script>

<style scoped lang="scss">
.layouts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 18px;
  border-bottom: 1px solid var(--ea-border-color);
  background: var(--ea-fill-color6);
}

.layouts-header__brand,
.layouts-header__actions {
  display: flex;
  align-items: center;
}

.layouts-header__brand {
  gap: 14px;
  min-height: 56px;
  cursor: pointer;
}

.layouts-header__logo {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--ea-primary-disabled);
  color: var(--ea-primary);
  font-weight: 700;
}

.layouts-header__divider {
  width: 1px;
  height: 18px;
  background: rgba(132, 148, 175, 0.4);
}

.layouts-header__title {
  color: var(--ea-text);
  font-size: 22px;
  font-weight: 700;
}

.layouts-header__actions {
  gap: 12px;
}

.layouts-header__theme {
  border: 1px solid var(--ea-border-color);
  background: var(--ea-fill-color5);
  color: var(--ea-text-light);
}

.layouts-header__user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid var(--ea-border-color);
  border-radius: 999px;
  background: var(--ea-fill-color5);
  color: var(--ea-text-light2);
}

.layouts-header__user strong {
  color: var(--ea-text);
}

.layouts-header__logout {
  border-radius: 999px;
}

@media (max-width: 960px) {
  .layouts-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 14px 18px;
  }

  .layouts-header__actions {
    flex-wrap: wrap;
  }
}
</style>
