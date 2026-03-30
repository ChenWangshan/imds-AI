import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { apiRequest } from "@/lib/api";
import type { AuthResponse, UserProfile } from "@/types/auth";

const TOKEN_KEY = "vue3-ai-token";
const AUTH_KEY = "vue3-ai-auth-response";
const PROFILE_KEY = "vue3-ai-user-profile";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) return fallback;

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string>(readJson<string>(TOKEN_KEY, ""));
  const auth = ref<AuthResponse | null>(readJson<AuthResponse | null>(AUTH_KEY, null));
  const profile = ref<UserProfile | null>(readJson<UserProfile | null>(PROFILE_KEY, null));

  const currentUser = computed(() => profile.value);
  const isLoggedIn = computed(() => Boolean(token.value));

  function persistToken() {
    window.localStorage.setItem(TOKEN_KEY, JSON.stringify(token.value));
  }

  function persistAuth() {
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(auth.value));
  }

  function persistProfile() {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile.value));
  }

  async function fetchCurrentUser() {
    if (!token.value) {
      profile.value = null;
      persistProfile();
      return null;
    }

    const current = await apiRequest<UserProfile>("/api/users/me", {
      token: token.value,
    });

    profile.value = current;
    persistProfile();

    return current;
  }

  async function login(username: string, password: string) {
    const response = await apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: {
        username: username.trim(),
        password,
      },
    });

    token.value = response.token;
    auth.value = response;
    persistToken();
    persistAuth();
    await fetchCurrentUser();

    return response;
  }

  function logout() {
    token.value = "";
    auth.value = null;
    profile.value = null;
    persistToken();
    persistAuth();
    persistProfile();
  }

  return {
    auth,
    currentUser,
    fetchCurrentUser,
    isLoggedIn,
    login,
    logout,
    profile,
    token,
  };
});
