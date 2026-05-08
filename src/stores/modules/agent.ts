import { computed, ref } from "vue";
import { defineStore } from "pinia";
import {
  createAgentSession,
  fetchAgentHealth,
  fetchAgentMessages,
  fetchAgentPromptTemplates,
  fetchAgentSessionDetail,
  fetchAgentSessions,
  fetchAgentToolLogs,
  sendAgentMessage,
  type AgentMessage,
  type AgentHealth,
  type AgentPromptTemplate,
  type AgentSession,
  type AgentToolLog,
} from "@/api/agent";
import { useAuthStore } from "@/stores/modules/auth";

export type AgentRecommendation = {
  id: string;
  title: string;
  prompt: string;
  route?: string;
  description: string;
};

const recommendations: AgentRecommendation[] = [
  {
    id: "blending-plan-today",
    title: "查询今日配矿计划",
    prompt: "查询今天早班的配矿计划，并总结总吨位和执行状态。",
    route: "/production/blending-plan",
    description: "聚焦生产管理中的配矿计划情况。",
  },
  {
    id: "transport-device-online",
    title: "统计运输设备在线数量",
    prompt: "统计当前运输设备在线数量，并说明设备状态分布。",
    route: "/device/manage",
    description: "面向设备管理场景的高频查询。",
  },
  {
    id: "map-monitor-overview",
    title: "查看地图监控态势",
    prompt: "总结当前地图监控覆盖区域、在线设备和重点监控对象。",
    route: "/dispatch/map-monitor",
    description: "适合调度岗快速查看全局态势。",
  },
  {
    id: "user-overview",
    title: "查询系统用户概况",
    prompt: "统计当前系统启用用户数量，并说明主要角色分布。",
    route: "/system/user",
    description: "帮助快速了解平台账号情况。",
  },
];

export const useAgentStore = defineStore("agent", () => {
  const sessions = ref<AgentSession[]>([]);
  const currentSessionId = ref<number | null>(null);
  const messages = ref<AgentMessage[]>([]);
  const toolLogs = ref<AgentToolLog[]>([]);
  const promptTemplates = ref<AgentPromptTemplate[]>([]);
  const health = ref<AgentHealth | null>(null);
  const input = ref("");
  const bootstrapping = ref(false);
  const sending = ref(false);
  const loadingSession = ref(false);

  const currentSession = computed(() =>
    sessions.value.find((item) => item.id === currentSessionId.value) ?? null,
  );

  async function bootstrap() {
    if (bootstrapping.value) return;
    bootstrapping.value = true;

    try {
      const [sessionList, templates, healthStatus] = await Promise.all([
        fetchAgentSessions(),
        fetchAgentPromptTemplates(),
        fetchAgentHealth(),
      ]);
      sessions.value = sessionList;
      promptTemplates.value = templates;
      health.value = healthStatus;

      if (sessionList.length > 0) {
        await selectSession(sessionList[0].id);
      } else {
        await createSession();
      }
    } finally {
      bootstrapping.value = false;
    }
  }

  async function createSession(title?: string) {
    const authStore = useAuthStore();
    const session = await createAgentSession({
      title,
      userId: authStore.currentUser?.id ? Number(authStore.currentUser.id) : null,
    });
    sessions.value = [session, ...sessions.value];
    await selectSession(session.id);
    return session;
  }

  async function selectSession(id: number) {
    if (loadingSession.value && currentSessionId.value === id) return;
    loadingSession.value = true;

    try {
      const [session, sessionMessages, sessionToolLogs] = await Promise.all([
        fetchAgentSessionDetail(id),
        fetchAgentMessages(id),
        fetchAgentToolLogs(id),
      ]);
      currentSessionId.value = id;
      messages.value = sessionMessages;
      toolLogs.value = sessionToolLogs;
      sessions.value = [
        session,
        ...sessions.value.filter((item) => item.id !== session.id),
      ];
    } finally {
      loadingSession.value = false;
    }
  }

  async function refreshCurrentSession() {
    if (!currentSessionId.value) return;
    const [session, sessionMessages, sessionToolLogs] = await Promise.all([
      fetchAgentSessionDetail(currentSessionId.value),
      fetchAgentMessages(currentSessionId.value),
      fetchAgentToolLogs(currentSessionId.value),
    ]);
    messages.value = sessionMessages;
    toolLogs.value = sessionToolLogs;
    sessions.value = [
      session,
      ...sessions.value.filter((item) => item.id !== session.id),
    ];
  }

  async function refreshHealth() {
    health.value = await fetchAgentHealth();
    return health.value;
  }

  async function submitMessage(rawContent?: string) {
    const content = String(rawContent ?? input.value).trim();
    if (!content || !currentSessionId.value || sending.value) return null;

    sending.value = true;
    try {
      const exchange = await sendAgentMessage(currentSessionId.value, content);
      messages.value = [...messages.value, exchange.userMessage, exchange.assistantMessage];
      input.value = "";
      await refreshCurrentSession();
      return exchange;
    } finally {
      sending.value = false;
    }
  }

  function setInput(value: string) {
    input.value = value;
  }

  return {
    bootstrapping,
    bootstrap,
    createSession,
    currentSession,
    currentSessionId,
    health,
    input,
    loadingSession,
    messages,
    promptTemplates,
    recommendations,
    refreshCurrentSession,
    refreshHealth,
    selectSession,
    sending,
    sessions,
    setInput,
    submitMessage,
    toolLogs,
  };
});
