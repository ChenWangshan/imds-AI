<template>
  <el-config-provider :locale="elementLocale">
    <RouterView />
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { RouterView } from "vue-router";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import en from "element-plus/es/locale/lang/en";
import ja from "element-plus/es/locale/lang/ja";

import i18n from "@/i18n";
import { useAuthStore } from "@/stores/modules/auth";
import { useGlobalStore } from "@/stores/modules/global";

const globalStore = useGlobalStore();
const authStore = useAuthStore();

const elementLocaleMap = {
  en,
  ja,
  zh: zhCn,
};

const elementLocale = computed(() => elementLocaleMap[globalStore.language]);

function updateFavicon(theme: "dark" | "white") {
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!favicon) return;
  favicon.href = theme === "dark" ? "/favicon.svg" : "/favicon-light.svg";
}

watch(
  () => globalStore.theme,
  (theme) => {
    document.documentElement.className = theme;
    updateFavicon(theme);
  },
  { immediate: true },
);

watch(
  () => globalStore.language,
  (language) => {
    document.body.className = language;
    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
    i18n.global.locale.value = language;
  },
  { immediate: true },
);

onMounted(async () => {
  try {
    await globalStore.initializeI18nConfig();
  } catch {
    // Local cached i18n messages are applied before mount; failed refresh should not block the app.
  }

  if (authStore.token && !authStore.profile) {
    try {
      await authStore.fetchCurrentUser();
    } catch {
      authStore.logout();
    }
  }
});
</script>
