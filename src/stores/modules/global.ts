import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { fetchAllI18nConfigs } from "@/api/i18nConfig";
import i18n, {
  applyI18nConfigRows,
  I18N_CONFIG_STORAGE_KEY,
  type I18nConfigRow,
  type I18nLanguage,
} from "@/i18n";

export type AppTheme = "dark" | "white";
export type AppLanguage = I18nLanguage;

const THEME_KEY = "vue3-ai-theme";
const LANGUAGE_KEY = "vue3-ai-language";
const MENU_COLLAPSED_KEY = "vue3-ai-menu-collapsed-v2";

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  return (value as T) ?? fallback;
}

export const useGlobalStore = defineStore("global", () => {
  const theme = ref<AppTheme>(readStorage<AppTheme>(THEME_KEY, "dark"));
  const language = ref<AppLanguage>(readStorage<AppLanguage>(LANGUAGE_KEY, "zh"));
  const i18nLoading = ref(false);
  const i18nReady = ref(false);
  const lastRoute = ref("/login");
  const menuCollapsed = ref(readStorage(MENU_COLLAPSED_KEY, "true") === "true");

  const isDark = computed(() => theme.value === "dark");

  function setTheme(value: AppTheme) {
    theme.value = value;
    window.localStorage.setItem(THEME_KEY, value);
  }

  function toggleTheme() {
    setTheme(theme.value === "dark" ? "white" : "dark");
  }

  function setLanguage(value: AppLanguage) {
    language.value = value;
    window.localStorage.setItem(LANGUAGE_KEY, value);
    i18n.global.locale.value = value;
  }

  function setLastRoute(value: string) {
    lastRoute.value = value;
  }

  function setMenuCollapsed(value: boolean) {
    menuCollapsed.value = value;
    window.localStorage.setItem(MENU_COLLAPSED_KEY, String(value));
  }

  function toggleMenuCollapsed() {
    setMenuCollapsed(!menuCollapsed.value);
  }

  async function initializeI18nConfig() {
    if (i18nLoading.value) return;
    i18nLoading.value = true;

    try {
      const rows = await fetchAllI18nConfigs();
      const normalizedRows: I18nConfigRow[] = rows.map((item) => ({
        configKey: item.configKey,
        enValue: item.enValue ?? "",
        jaValue: item.jaValue ?? "",
        zhValue: item.zhValue ?? "",
      }));
      applyI18nConfigRows(normalizedRows);
      window.localStorage.setItem(I18N_CONFIG_STORAGE_KEY, JSON.stringify(normalizedRows));
      i18nReady.value = true;
    } finally {
      i18nLoading.value = false;
    }
  }

  return {
    isDark,
    i18nLoading,
    i18nReady,
    initializeI18nConfig,
    language,
    lastRoute,
    menuCollapsed,
    setLanguage,
    setLastRoute,
    setMenuCollapsed,
    setTheme,
    theme,
    toggleMenuCollapsed,
    toggleTheme,
  };
});
