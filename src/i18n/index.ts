import { createI18n } from "vue-i18n";

const messages = {
  zh: {
    common: {
      appName: "智慧矿山综管平台",
      login: "登录",
      username: "用户名",
      usernamePlaceholder: "请输入用户名",
      password: "密码",
      passwordPlaceholder: "请输入密码",
      agreement: "我已阅读并同意",
      privacy: "《隐私协议》",
      loginSuccess: "登录成功，欢迎回来。",
      invalidCredentials: "用户名或密码不正确。",
      currentUser: "当前登录用户",
      networkError: "接口调用失败，请确认 java-AI 服务已启动。",
      welcomeTitle: "欢迎来到智慧矿山综管平台",
      welcomeSubtitle: "登录已完成，当前账号已同步到 Pinia 并持久化缓存。刷新页面后，用户信息会自动从缓存恢复。",
      backToLogin: "返回登录页",
      logout: "退出登录",
      switchTheme: "切换主题",
      switchLanguage: "切换语言",
      welcome: "矿山业务统一入口",
      copyright:
        "©2024 易控智驾科技股份有限公司 闽ICP备2024064024号-1 闽公网安备35082302000240号",
    },
  },
  en: {
    common: {
      appName: "Smart Mine Operations Platform",
      login: "Sign In",
      username: "Username",
      usernamePlaceholder: "Enter username",
      password: "Password",
      passwordPlaceholder: "Enter password",
      agreement: "I have read and agree to the",
      privacy: "Privacy Policy",
      loginSuccess: "Signed in successfully.",
      invalidCredentials: "Invalid username or password.",
      currentUser: "Current user",
      networkError: "Request failed. Please make sure the java-AI service is running.",
      welcomeTitle: "Welcome to the Smart Mine Operations Platform",
      welcomeSubtitle: "Your sign-in state is now stored in Pinia and persisted locally. Refreshing the page will restore the cached user information automatically.",
      backToLogin: "Back to Login",
      logout: "Sign Out",
      switchTheme: "Switch theme",
      switchLanguage: "Switch language",
      welcome: "Unified entry for mining operations",
      copyright:
        "Copyright © 2024 Smart Mine Technology Platform | ICP 2024064024-1 | Public Security 35082302000240",
    },
  },
};

const i18n = createI18n({
  legacy: false,
  locale: "zh",
  fallbackLocale: "zh",
  messages,
});

export default i18n;
