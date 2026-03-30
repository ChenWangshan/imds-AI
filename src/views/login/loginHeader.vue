<template>
  <header class="login-header">
    <div class="login-header__left">
      <div class="login-header__logo">EA</div>
      <div class="login-header__divider" />
      <div class="login-header__title">{{ t("common.appName") }}</div>
    </div>
    <div class="login-header__right">
      <el-select
        :model-value="store.language"
        class="login-header__select"
        size="large"
        @change="handleLanguageChange"
      >
        <el-option label="中文" value="zh" />
        <el-option label="English" value="en" />
      </el-select>
      <el-button
        circle
        class="login-header__theme"
        size="large"
        @click="store.toggleTheme"
      >
        <el-icon v-if="store.isDark"><Sunny /></el-icon>
        <el-icon v-else><Moon /></el-icon>
      </el-button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { watch } from "vue";
import { Moon, Sunny } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";

import i18n from "@/i18n";
import { useGlobalStore, type AppLanguage } from "@/stores/modules/global";

const { t } = useI18n();
const store = useGlobalStore();

watch(
  () => store.language,
  (language) => {
    i18n.global.locale.value = language;
  },
  { immediate: true },
);

function handleLanguageChange(language: AppLanguage) {
  store.setLanguage(language);
}
</script>

<style scoped lang="scss">
.login-header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px clamp(24px, 5vw, 72px) 0;
}

.login-header__left,
.login-header__right {
  display: flex;
  align-items: center;
}

.login-header__logo {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--ea-border-color);
  border-radius: 14px;
  background: var(--ea-panel-background);
  box-shadow: var(--ea-shadow);
  color: var(--ea-primary);
  font-weight: 700;
  letter-spacing: 0.08em;
}

.login-header__divider {
  width: 1px;
  height: 16px;
  margin: 0 16px;
  background: var(--app-shell-border);
}

.login-header__title {
  color: var(--ea-text-light);
  font-size: 20px;
  font-weight: 600;
}

.login-header__right {
  gap: 12px;
}

.login-header__select {
  width: 148px;
}

.login-header__theme {
  border: 1px solid var(--ea-border-color);
  background: var(--ea-panel-background);
  box-shadow: none;
  backdrop-filter: var(--ea-panel-backdrop);
}

.login-header__theme {
  color: var(--ea-text-light);
}

@media (max-width: 960px) {
  .login-header {
    padding-top: 12px;
  }

  .login-header__title {
    font-size: 18px;
  }
}
</style>
