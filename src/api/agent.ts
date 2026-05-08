import { apiRequest } from "@/lib/api";

const AGENT_API_PREFIX = "/agent-api/api/agent";

export type AgentSession = {
  id: number;
  sessionCode: string;
  title: string;
  userId: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AgentMessage = {
  id: number;
  sessionId: number;
  role: "user" | "assistant" | "tool" | string;
  content: string;
  messageType: string;
  createdAt: string;
};

export type AgentToolLog = {
  id: number;
  sessionId: number;
  messageId: number | null;
  toolName: string;
  requestPayload: string;
  responsePayload: string;
  status: string;
  createdAt: string;
};

export type AgentPromptTemplate = {
  id: number;
  agentCode: string;
  promptName: string;
  promptContent: string;
  enabled: boolean;
  createdAt: string;
};

export type AgentDependencyStatus = {
  code: string;
  name: string;
  url: string;
  status: string;
};

export type AgentHealth = {
  status: string;
  llmProvider: string;
  dependencies: AgentDependencyStatus[];
};

export type AgentMessageExchange = {
  userMessage: AgentMessage;
  assistantMessage: AgentMessage;
};

export async function createAgentSession(payload?: { title?: string; userId?: number | null }) {
  return apiRequest<AgentSession>(`${AGENT_API_PREFIX}/sessions`, {
    method: "POST",
    body: payload ?? {},
  });
}

export async function fetchAgentSessions() {
  return apiRequest<AgentSession[]>(`${AGENT_API_PREFIX}/sessions`);
}

export async function fetchAgentSessionDetail(id: number | string) {
  return apiRequest<AgentSession>(`${AGENT_API_PREFIX}/sessions/${id}`);
}

export async function sendAgentMessage(id: number | string, content: string) {
  return apiRequest<AgentMessageExchange>(`${AGENT_API_PREFIX}/sessions/${id}/messages`, {
    method: "POST",
    body: { content },
  });
}

export async function fetchAgentMessages(id: number | string) {
  return apiRequest<AgentMessage[]>(`${AGENT_API_PREFIX}/sessions/${id}/messages`);
}

export async function fetchAgentToolLogs(id: number | string) {
  return apiRequest<AgentToolLog[]>(`${AGENT_API_PREFIX}/sessions/${id}/tool-logs`);
}

export async function fetchAgentPromptTemplates() {
  return apiRequest<AgentPromptTemplate[]>(`${AGENT_API_PREFIX}/prompt-templates`);
}

export async function fetchAgentHealth() {
  return apiRequest<AgentHealth>(`${AGENT_API_PREFIX}/health`);
}
