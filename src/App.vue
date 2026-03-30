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

import i18n from "@/i18n";
import { useAuthStore } from "@/stores/modules/auth";
import { useGlobalStore } from "@/stores/modules/global";

const globalStore = useGlobalStore();
const authStore = useAuthStore();

const elementLocale = computed(() =>
  globalStore.language === "zh" ? zhCn : en,
);

watch(
  () => globalStore.theme,
  (theme) => {
    document.documentElement.className = theme;
  },
  { immediate: true },
);

watch(
  () => globalStore.language,
  (language) => {
    document.body.className = language;
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    i18n.global.locale.value = language;
  },
  { immediate: true },
);

onMounted(async () => {
  if (authStore.token && !authStore.profile) {
    try {
      await authStore.fetchCurrentUser();
    } catch {
      authStore.logout();
    }
  }
});
</script>
