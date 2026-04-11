<template>
  <header class="layouts-header">
    <div class="layouts-header__brand" @click="router.push('/home')">
      <img class="layouts-header__logo" :src="brandLogoSrc" alt="智慧矿山综管平台" />
      <div class="layouts-header__divider" />
      <div class="layouts-header__title">智慧矿山综管平台</div>
    </div>

    <div class="layouts-header__actions">
      <el-button circle class="layouts-header__action" @click="globalStore.toggleMenuCollapsed">
        <el-icon v-if="globalStore.menuCollapsed"><Expand /></el-icon>
        <el-icon v-else><Fold /></el-icon>
      </el-button>

      <el-button circle class="layouts-header__action" @click="globalStore.toggleTheme">
        <el-icon v-if="globalStore.isDark"><Sunny /></el-icon>
        <el-icon v-else><Moon /></el-icon>
      </el-button>

      <div class="layouts-header__avatar">
        <span>{{ (authStore.currentUser?.username || "U").slice(0, 1).toUpperCase() }}</span>
      </div>

      <el-button class="layouts-header__logout" @click="handleLogout">退出</el-button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Expand, Fold, Moon, Sunny } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";

import { useAuthStore } from "@/stores/modules/auth";
import { useGlobalStore } from "@/stores/modules/global";

const router = useRouter();
const authStore = useAuthStore();
const globalStore = useGlobalStore();
const brandLogoSrc = computed(() => (globalStore.isDark ? "/brand-logo.svg" : "/brand-logo-light.svg"));

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
  min-height: 72px;
  padding: 0 22px;
  border-bottom: 1px solid var(--app-header-border);
  background: var(--app-header-bg);
  box-shadow: inset 0 -1px 0 rgba(132, 150, 182, 0.18);
}

.layouts-header__brand,
.layouts-header__actions {
  display: flex;
  align-items: center;
}

.layouts-header__brand {
  gap: 18px;
  cursor: pointer;
}

.layouts-header__logo {
  display: block;
  width: 220px;
  height: 64px;
  object-fit: contain;
  object-position: left center;
  filter: drop-shadow(0 8px 16px rgba(10, 16, 28, 0.18));
}

.layouts-header__divider {
  width: 1px;
  height: 34px;
  background: var(--app-shell-border);
}

.layouts-header__title {
  color: var(--ea-text1);
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.layouts-header__actions {
  gap: 16px;
}

.layouts-header__action {
  width: 48px;
  height: 48px;
  border: 1px solid var(--app-header-action-border);
  background: var(--app-header-action-bg);
  color: var(--ea-text2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.layouts-header__avatar {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 1px solid var(--app-header-action-border);
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.22), transparent 40%),
    var(--app-avatar-bg);
  color: var(--ea-text5);
  font-size: 18px;
  font-weight: 700;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.layouts-header__logout {
  height: 40px;
  padding: 0 18px;
  border: 1px solid var(--app-header-action-border);
  border-radius: 12px;
  background: var(--app-header-action-bg);
  color: var(--ea-text1);
}

@media (max-width: 1200px) {
  .layouts-header__logo {
    width: 180px;
    height: 54px;
  }

  .layouts-header__title {
    font-size: 20px;
  }
}

@media (max-width: 960px) {
  .layouts-header {
    flex-wrap: wrap;
    gap: 14px;
    padding: 14px 18px;
  }

  .layouts-header__brand {
    gap: 12px;
  }

  .layouts-header__title {
    font-size: 18px;
  }

  .layouts-header__logo {
    width: 144px;
    height: 44px;
  }
}
</style>
