import { computed, ref } from "vue";
import { defineStore } from "pinia";

export type AppTheme = "dark" | "white";
export type AppLanguage = "zh" | "en";

const THEME_KEY = "vue3-ai-theme";
const LANGUAGE_KEY = "vue3-ai-language";
const MENU_COLLAPSED_KEY = "vue3-ai-menu-collapsed";

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  return (value as T) ?? fallback;
}

export const useGlobalStore = defineStore("global", () => {
  const theme = ref<AppTheme>(readStorage<AppTheme>(THEME_KEY, "dark"));
  const language = ref<AppLanguage>(readStorage<AppLanguage>(LANGUAGE_KEY, "zh"));
  const lastRoute = ref("/login");
  const menuCollapsed = ref(readStorage(MENU_COLLAPSED_KEY, "false") === "true");

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

  return {
    isDark,
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
