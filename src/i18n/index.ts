import { createI18n } from "vue-i18n";

export type I18nLanguage = "zh" | "en" | "ja";

export type I18nConfigRow = {
  configKey: string;
  zhValue: string;
  enValue: string;
  jaValue: string;
};

export const I18N_CONFIG_STORAGE_KEY = "vue3-ai-i18n-configs";

export const languageOptions = [
  { label: "中文", value: "zh" },
  { label: "English", value: "en" },
  { label: "日本語", value: "ja" },
] as const;

const defaultMessages = {
  zh: {
    common: {
      add: "新增",
      appName: "智慧矿山综管平台",
      backToLogin: "返回登录页",
      cancel: "取消",
      confirm: "确认",
      currentUser: "当前登录用户",
      delete: "删除",
      edit: "编辑",
      invalidCredentials: "用户名或密码不正确。",
      login: "登录",
      loginSuccess: "登录成功，欢迎回来。",
      logout: "退出",
      networkError: "接口调用失败，请确认服务已启动。",
      password: "密码",
      passwordPlaceholder: "请输入密码",
      privacy: "《隐私协议》",
      refresh: "刷新",
      save: "保存",
      search: "搜索",
      switchLanguage: "切换语言",
      switchTheme: "切换主题",
      systemOnline: "系统在线运行",
      username: "用户名",
      usernamePlaceholder: "请输入用户名",
      agreement: "我已阅读并同意",
      welcome: "矿山业务统一入口",
      welcomeSubtitle: "登录已完成，当前账号已同步到 Pinia 并持久化缓存。",
      welcomeTitle: "欢迎来到智慧矿山综管平台",
      copyright: "©2024 易控智驾科技股份有限公司 闽ICP备2024064024号-1 闽公网安备35082302000240号",
    },
    route: {
      agent: "Agent 工作台",
      blendingPlan: "配矿计划",
      deviceManage: "设备管理",
      deviceModel: "设备型号",
      deviceRoot: "设备管理",
      dictionary: "字典管理",
      dispatch: "智能调度",
      home: "首页",
      i18nConfig: "国际化配置",
      layerManagement: "图层管理",
      mapMonitor: "地图监控",
      mapRoot: "地图管理",
      materialProgress: "物料进度监控",
      menuManagement: "菜单管理",
      miningArea: "矿区管理",
      production: "生产管理",
      roleManagement: "角色管理",
      system: "系统管理",
      user: "用户管理",
    },
    i18n: {
      add: "新增配置",
      configKeyPlaceholder: "例如 common.appName",
      description: "说明",
      enValue: "英文",
      jaValue: "日文",
      loadFailed: "国际化配置加载失败，已使用本地缓存。",
      pageDescription: "维护中文、英文、日文文案配置，保存后全站语言切换立即生效。",
      pageTitle: "国际化配置",
      refresh: "刷新配置",
      save: "保存配置",
      saveSuccess: "国际化配置已保存",
      searchKey: "配置项",
      zhValue: "中文",
    },
    home: {
      title: "智慧矿山中枢",
      subtitle: "以生产、设备、调度和系统数据为核心，构建简洁可靠的矿山运营入口。",
    },
    agent: {
      title: "Agent 工作台",
      subtitle: "在一个统一入口里承接会话、业务工具、结果解释与模块跳转。",
    },
    layerManagement: {
      description: "对 eq-fleetcmder-web 地图监控的图层进行管理，包括图层样式配置。",
    },
  },
  en: {
    common: {
      add: "Add",
      appName: "Smart Mine Operations Platform",
      backToLogin: "Back to Login",
      cancel: "Cancel",
      confirm: "Confirm",
      currentUser: "Current user",
      delete: "Delete",
      edit: "Edit",
      invalidCredentials: "Invalid username or password.",
      login: "Sign In",
      loginSuccess: "Signed in successfully.",
      logout: "Sign Out",
      networkError: "Request failed. Please make sure services are running.",
      password: "Password",
      passwordPlaceholder: "Enter password",
      privacy: "Privacy Policy",
      refresh: "Refresh",
      save: "Save",
      search: "Search",
      switchLanguage: "Switch language",
      switchTheme: "Switch theme",
      systemOnline: "System online",
      username: "Username",
      usernamePlaceholder: "Enter username",
      agreement: "I have read and agree to the",
      welcome: "Unified entry for mining operations",
      welcomeSubtitle: "Your sign-in state is now stored in Pinia and persisted locally.",
      welcomeTitle: "Welcome to the Smart Mine Operations Platform",
      copyright: "Copyright © 2024 EACON Intelligent Driving Technology Co., Ltd.",
    },
    route: {
      agent: "Agent Workbench",
      blendingPlan: "Ore Blending Plan",
      deviceManage: "Device Management",
      deviceModel: "Device Model",
      deviceRoot: "Device Management",
      dictionary: "Dictionary",
      dispatch: "Smart Dispatch",
      home: "Home",
      i18nConfig: "I18n Config",
      layerManagement: "Layer Management",
      mapMonitor: "Map Monitor",
      mapRoot: "Map Management",
      materialProgress: "Material Progress",
      menuManagement: "Menu Management",
      miningArea: "Mining Area",
      production: "Production",
      roleManagement: "Role Management",
      system: "System Management",
      user: "User Management",
    },
    i18n: {
      add: "Add Config",
      configKeyPlaceholder: "e.g. common.appName",
      description: "Description",
      enValue: "English",
      jaValue: "Japanese",
      loadFailed: "Failed to load i18n config. Local cache is used.",
      pageDescription: "Maintain Chinese, English, and Japanese copy. Changes take effect after saving.",
      pageTitle: "Internationalization Config",
      refresh: "Refresh",
      save: "Save Config",
      saveSuccess: "I18n config saved.",
      searchKey: "Config Key",
      zhValue: "Chinese",
    },
    home: {
      title: "Smart Mine Hub",
      subtitle: "A focused operations entry for production, devices, dispatching, and system data.",
    },
    agent: {
      title: "Agent Workbench",
      subtitle: "Use one entry for conversations, business tools, result explanations, and module navigation.",
    },
    layerManagement: {
      description: "Manage map layers of the eq-fleetcmder-web map monitor, including layer style configuration.",
    },
  },
  ja: {
    common: {
      add: "追加",
      appName: "スマート鉱山総合管理プラットフォーム",
      backToLogin: "ログインへ戻る",
      cancel: "キャンセル",
      confirm: "確認",
      currentUser: "現在のユーザー",
      delete: "削除",
      edit: "編集",
      invalidCredentials: "ユーザー名またはパスワードが正しくありません。",
      login: "ログイン",
      loginSuccess: "ログインしました。",
      logout: "ログアウト",
      networkError: "リクエストに失敗しました。サービスの起動を確認してください。",
      password: "パスワード",
      passwordPlaceholder: "パスワードを入力してください",
      privacy: "プライバシーポリシー",
      refresh: "更新",
      save: "保存",
      search: "検索",
      switchLanguage: "言語切替",
      switchTheme: "テーマ切替",
      systemOnline: "システム稼働中",
      username: "ユーザー名",
      usernamePlaceholder: "ユーザー名を入力してください",
      agreement: "以下を読み、同意します",
      welcome: "鉱山業務の統一入口",
      welcomeSubtitle: "ログイン状態は Pinia に保存され、ローカルにも保持されます。",
      welcomeTitle: "スマート鉱山総合管理プラットフォームへようこそ",
      copyright: "©2024 EACON Intelligent Driving Technology Co., Ltd.",
    },
    route: {
      agent: "Agent ワークベンチ",
      blendingPlan: "配鉱計画",
      deviceManage: "設備管理",
      deviceModel: "設備モデル",
      deviceRoot: "設備管理",
      dictionary: "辞書管理",
      dispatch: "スマート配車",
      home: "ホーム",
      i18nConfig: "国際化設定",
      layerManagement: "レイヤー管理",
      mapMonitor: "マップ監視",
      mapRoot: "地図管理",
      materialProgress: "材料進捗監視",
      menuManagement: "メニュー管理",
      miningArea: "鉱区管理",
      production: "生産管理",
      roleManagement: "ロール管理",
      system: "システム管理",
      user: "ユーザー管理",
    },
    i18n: {
      add: "設定を追加",
      configKeyPlaceholder: "例 common.appName",
      description: "説明",
      enValue: "英語",
      jaValue: "日本語",
      loadFailed: "国際化設定の読み込みに失敗しました。ローカルキャッシュを使用します。",
      pageDescription: "中国語、英語、日本語の文言を管理します。保存後すぐに反映されます。",
      pageTitle: "国際化設定",
      refresh: "更新",
      save: "設定を保存",
      saveSuccess: "国際化設定を保存しました。",
      searchKey: "設定キー",
      zhValue: "中国語",
    },
    home: {
      title: "スマート鉱山ハブ",
      subtitle: "生産、設備、配車、システムデータを中心にした鉱山運営入口です。",
    },
    agent: {
      title: "Agent ワークベンチ",
      subtitle: "会話、業務ツール、結果説明、画面遷移を一つの入口で扱います。",
    },
    layerManagement: {
      description: "eq-fleetcmder-web の地図監視レイヤーを管理し、レイヤースタイルの設定を行います。",
    },
  },
};

function assignMessage(target: Record<string, unknown>, path: string[], value: string) {
  const [head, ...rest] = path;
  if (!head) return;
  if (rest.length === 0) {
    target[head] = value;
    return;
  }

  if (!target[head] || typeof target[head] !== "object") {
    target[head] = {};
  }
  assignMessage(target[head] as Record<string, unknown>, rest, value);
}

export function rowsToMessages(rows: I18nConfigRow[]) {
  const messages: Record<I18nLanguage, Record<string, unknown>> = {
    en: {},
    ja: {},
    zh: {},
  };

  rows.forEach((row) => {
    const path = row.configKey.split(".").filter(Boolean);
    assignMessage(messages.zh, path, row.zhValue);
    assignMessage(messages.en, path, row.enValue);
    assignMessage(messages.ja, path, row.jaValue);
  });

  return messages;
}

export function applyI18nConfigRows(rows: I18nConfigRow[]) {
  const messages = rowsToMessages(rows);
  (Object.keys(messages) as I18nLanguage[]).forEach((language) => {
    i18n.global.mergeLocaleMessage(language, messages[language]);
  });
}

function applyStoredRows() {
  if (typeof window === "undefined") return;
  const stored = window.localStorage.getItem(I18N_CONFIG_STORAGE_KEY);
  if (!stored) return;

  try {
    applyI18nConfigRows(JSON.parse(stored) as I18nConfigRow[]);
  } catch {
    window.localStorage.removeItem(I18N_CONFIG_STORAGE_KEY);
  }
}

const i18n = createI18n({
  legacy: false,
  locale: "zh",
  fallbackLocale: "zh",
  messages: defaultMessages,
});

applyStoredRows();

export default i18n;
