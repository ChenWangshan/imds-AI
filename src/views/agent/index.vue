<template>
  <div class="agent-workbench">
    <section class="agent-workbench__masthead">
      <div class="agent-workbench__masthead-copy">
        <p class="agent-workbench__eyebrow">SMART MINE AGENT CENTER</p>
        <h1>{{ t("agent.title") }}</h1>
        <p>
          {{ t("agent.subtitle") }}
        </p>
      </div>

      <div class="agent-workbench__masthead-side">
        <div class="signal-card">
          <span>当前会话</span>
          <strong>{{ agentStore.currentSession?.title || "未创建" }}</strong>
          <p>{{ agentStore.currentSession?.sessionCode || "等待初始化" }}</p>
        </div>
        <div class="signal-card">
          <span>内置模板</span>
          <strong>{{ agentStore.promptTemplates.length }}</strong>
          <p>已加载的 Agent 提示词模板数量</p>
        </div>
        <div class="signal-card">
          <span>运行状态</span>
          <strong>{{ agentStore.health?.status || "检查中" }}</strong>
          <p>LLM：{{ agentStore.health?.llmProvider || "rule-based" }}</p>
        </div>
      </div>
    </section>

    <section class="agent-workbench__body">
      <aside class="agent-panel agent-panel--sessions">
        <div class="panel-head panel-head--between">
          <div>
            <span class="panel-head__eyebrow">会话区</span>
            <h2>最近会话</h2>
          </div>
          <EaButton type="primary" @click="handleCreateSession">新建会话</EaButton>
        </div>

        <div class="session-list">
          <button
            v-for="session in agentStore.sessions"
            :key="session.id"
            type="button"
            class="session-item"
            :class="{ 'session-item--active': session.id === agentStore.currentSessionId }"
            @click="handleSelectSession(session.id)"
          >
            <strong>{{ session.title }}</strong>
            <span>{{ session.sessionCode }}</span>
          </button>
        </div>
      </aside>

      <main class="agent-panel agent-panel--chat">
        <div class="panel-head">
          <span class="panel-head__eyebrow">输入区 / 会话消息流</span>
          <h2>自然语言问答</h2>
        </div>

        <div ref="messageScrollRef" class="message-stream">
          <div v-if="agentStore.messages.length === 0" class="message-empty">
            <strong>从一个高频业务问题开始</strong>
            <p>你可以直接输入问题，也可以点击下方推荐问题快速发起一次 Agent 会话。</p>
          </div>

          <article
            v-for="message in agentStore.messages"
            :key="message.id"
            class="message-bubble"
            :class="`message-bubble--${message.role}`"
          >
            <span class="message-bubble__role">{{ roleLabelMap[message.role] || message.role }}</span>
            <div class="message-bubble__content">{{ message.content }}</div>
            <time>{{ formatTime(message.createdAt) }}</time>
          </article>
        </div>

        <div class="composer">
          <div class="recommendations">
            <button
              v-for="item in agentStore.recommendations"
              :key="item.id"
              type="button"
              class="recommendation-chip"
              @click="applyRecommendation(item.prompt)"
            >
              {{ item.title }}
            </button>
          </div>

          <ElInput
            :model-value="agentStore.input"
            type="textarea"
            :rows="4"
            resize="none"
            placeholder="请输入业务问题，例如：查询今天早班的配矿计划，并总结总吨位和执行状态。"
            @update:model-value="agentStore.setInput($event)"
            @keydown.ctrl.enter.prevent="handleSubmit"
          />

          <div class="composer__footer">
            <p>支持 `Ctrl + Enter` 快速发送，建议明确日期、班次、组织或设备类型。</p>
            <EaButton type="primary" :loading="agentStore.sending" @click="handleSubmit">发送问题</EaButton>
          </div>
        </div>
      </main>

      <aside class="agent-panel agent-panel--context">
        <div class="panel-head">
          <span class="panel-head__eyebrow">推荐问题 / 工具调用日志 / 结果结构化展示</span>
          <h2>上下文区</h2>
        </div>

        <div class="context-scroll">
          <section class="context-block">
            <header>
              <strong>推荐问题</strong>
              <span>可直接跳转到相关业务模块</span>
            </header>
            <div class="shortcut-list">
              <button
                v-for="item in agentStore.recommendations"
                :key="`${item.id}-shortcut`"
                type="button"
                class="shortcut-item"
                @click="handleGoRoute(item.route, item.prompt)"
              >
                <strong>{{ item.title }}</strong>
                <p>{{ item.description }}</p>
              </button>
            </div>
          </section>

          <section class="context-block">
            <header>
              <strong>使用条件</strong>
              <span>Agent 与业务中心连接状态</span>
            </header>
            <div class="dependency-list">
              <article
                v-for="item in agentStore.health?.dependencies || []"
                :key="item.code"
                class="dependency-item"
              >
                <div>
                  <strong>{{ item.name }}</strong>
                  <p>{{ item.url }}</p>
                </div>
                <span :class="`dependency-item__status dependency-item__status--${item.status.toLowerCase()}`">
                  {{ statusLabelMap[item.status] || item.status }}
                </span>
              </article>
              <div v-if="!agentStore.health" class="context-empty">正在检查 Agent 使用条件</div>
            </div>
          </section>

          <section class="context-block">
            <header>
              <strong>工具日志</strong>
              <span>最近一次会话调用记录</span>
            </header>
            <div class="log-list">
              <article v-for="log in recentToolLogs" :key="log.id" class="log-item">
                <strong>{{ log.toolName }}</strong>
                <span>{{ log.status }}</span>
                <p>{{ formatTime(log.createdAt) }}</p>
              </article>
              <div v-if="recentToolLogs.length === 0" class="context-empty">当前还没有工具调用记录</div>
            </div>
          </section>

          <section class="context-block">
            <header>
              <strong>结构化结果</strong>
              <span>最近一次工具响应</span>
            </header>
            <div v-if="latestToolResult" class="result-panel">
              <div class="result-panel__summary">{{ latestToolResult.summary }}</div>
              <dl>
                <div>
                  <dt>来源</dt>
                  <dd>{{ latestToolResult.source }}</dd>
                </div>
                <div>
                  <dt>总数</dt>
                  <dd>{{ latestToolResult.recordsTotal }}</dd>
                </div>
              </dl>
              <div v-if="latestToolResult.rows.length" class="result-rows">
                <article v-for="(row, index) in latestToolResult.rows" :key="index">
                  <strong>{{ row.title }}</strong>
                  <span>{{ row.description }}</span>
                </article>
              </div>
            </div>
            <div v-else class="context-empty">发送问题后，这里会展示最近一次工具返回的数据摘要</div>
          </section>

          <section class="context-block">
            <header>
              <strong>业务入口</strong>
              <span>与现有模块联动</span>
            </header>
            <div class="business-links">
              <button type="button" class="business-link" @click="goTo('/production/blending-plan')">配矿计划</button>
              <button type="button" class="business-link" @click="goTo('/device/manage')">设备管理</button>
              <button type="button" class="business-link" @click="goTo('/device/model')">设备型号</button>
              <button type="button" class="business-link" @click="goTo('/dispatch/map-monitor')">地图监控</button>
              <button type="button" class="business-link" @click="goTo('/system/user')">用户管理</button>
            </div>
          </section>
        </div>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { ElInput, ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAgentStore } from "@/stores/modules/agent";

const router = useRouter();
const { t } = useI18n();
const agentStore = useAgentStore();
const messageScrollRef = ref<HTMLDivElement | null>(null);

const roleLabelMap: Record<string, string> = {
  user: "用户",
  assistant: "Agent",
  tool: "工具",
};

const statusLabelMap: Record<string, string> = {
  CONFIGURED: "已配置",
  MISSING: "缺失",
  READY: "就绪",
  UNREADY: "未就绪",
};

const recentToolLogs = computed(() => agentStore.toolLogs.slice(0, 4));
const latestToolResult = computed(() => {
  const latestLog = agentStore.toolLogs[0];
  if (!latestLog?.responsePayload) return null;

  try {
    const payload = JSON.parse(latestLog.responsePayload) as Record<string, unknown>;
    const rows = Array.isArray(payload.data) ? payload.data.map((item) => formatResultRow(item)) : [];

    return {
      recordsTotal: Number(payload.recordsTotal ?? rows.length),
      rows,
      source: String(payload.source ?? latestLog.toolName),
      summary: String(payload.summary ?? "已返回工具结果"),
    };
  } catch {
    return null;
  }
});

function formatTime(value: string) {
  if (!value) return "";
  return value.replace("T", " ");
}

function formatResultRow(value: unknown) {
  if (!value || typeof value !== "object") {
    return {
      description: "",
      title: String(value ?? "-"),
    };
  }

  const row = value as Record<string, unknown>;
  const title =
    row.planName ??
    row.deviceCode ??
    row.modelName ??
    row.username ??
    row.id ??
    "业务数据";
  const description = Object.entries(row)
    .filter(([key]) => !["id", "password", "createdBy", "updatedBy"].includes(key))
    .map(([key, item]) => `${key}: ${String(item ?? "-")}`)
    .join(" / ");

  return {
    description,
    title: String(title),
  };
}

function scrollToBottom() {
  nextTick(() => {
    const target = messageScrollRef.value;
    if (!target) return;
    target.scrollTop = target.scrollHeight;
  });
}

async function handleCreateSession() {
  try {
    await agentStore.createSession();
    ElMessage.success("已创建新的 Agent 会话");
  } catch (error) {
    handleError(error, "创建会话失败");
  }
}

async function handleSelectSession(id: number) {
  try {
    await agentStore.selectSession(id);
  } catch (error) {
    handleError(error, "加载会话失败");
  }
}

function applyRecommendation(prompt: string) {
  agentStore.setInput(prompt);
}

async function handleSubmit() {
  try {
    const exchange = await agentStore.submitMessage();
    if (exchange) {
      scrollToBottom();
    }
  } catch (error) {
    handleError(error, "发送消息失败");
  }
}

function goTo(path: string) {
  router.push(path);
}

function handleGoRoute(path?: string, prompt?: string) {
  if (prompt) {
    agentStore.setInput(prompt);
  }
  if (path) {
    goTo(path);
  }
}

function handleError(error: unknown, fallback: string) {
  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
      ? error.message
      : fallback;
  ElMessage.error(message);
}

watch(() => agentStore.messages.length, scrollToBottom);

onMounted(async () => {
  try {
    await agentStore.bootstrap();
    scrollToBottom();
  } catch (error) {
    handleError(error, "初始化 Agent 工作台失败");
  }
});
</script>

<style scoped lang="scss">
.agent-workbench {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 100%;
  height: 100%;
  min-width: 0;
}

.agent-workbench__masthead {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  flex: 0 0 auto;
  padding: 28px 30px;
  border: 1px solid var(--app-panel-border);
  border-radius: 26px;
  background:
    radial-gradient(circle at right top, rgba(92, 235, 245, 0.18), transparent 36%),
    linear-gradient(145deg, var(--app-panel-bg-strong), var(--app-panel-bg));
  box-shadow: var(--app-panel-shadow);
}

.agent-workbench__masthead-copy,
.agent-workbench__masthead-side,
.agent-workbench__body,
.agent-panel,
.context-scroll,
.session-list,
.message-stream,
.shortcut-list,
.log-list {
  min-width: 0;
  min-height: 0;
}

.agent-workbench__masthead-copy {
  max-width: 760px;
}

.agent-workbench__eyebrow,
.panel-head__eyebrow {
  margin: 0;
  color: var(--app-accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.agent-workbench__masthead-copy h1,
.panel-head h2 {
  margin: 12px 0 0;
  color: var(--app-hero-title);
  font-size: clamp(28px, 3.4vw, 46px);
  font-weight: 800;
  line-height: 1;
}

.panel-head h2 {
  font-size: 22px;
}

.agent-workbench__masthead-copy > p,
.signal-card p,
.shortcut-item p,
.context-empty,
.message-empty p,
.composer__footer p {
  margin: 14px 0 0;
  color: var(--app-hero-desc);
  line-height: 1.7;
}

.agent-workbench__masthead-side {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.signal-card,
.agent-panel,
.context-block,
.message-empty,
.message-bubble,
.session-item,
.shortcut-item,
.business-link,
.recommendation-chip {
  border: 1px solid var(--app-panel-border);
}

.signal-card {
  min-width: 0;
  padding: 16px 18px;
  border-radius: 20px;
  background: rgba(11, 20, 32, 0.26);
}

.signal-card span,
.context-block header span {
  color: var(--app-hero-muted);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.signal-card strong,
.context-block header strong {
  display: block;
  margin-top: 8px;
  color: var(--app-hero-title);
  font-size: 20px;
  line-height: 1.35;
}

.agent-workbench__body {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) minmax(380px, 0.32fr);
  gap: 18px;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.agent-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 20px;
  border-radius: 24px;
  background: var(--app-panel-bg);
  box-shadow: var(--app-panel-shadow);
  overflow: hidden;
}

.panel-head {
  margin-bottom: 16px;
}

.panel-head--between {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.session-list,
.log-list,
.shortcut-list,
.dependency-list,
.context-scroll {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.session-list,
.context-scroll {
  flex: 1 1 auto;
  overflow: auto;
  padding-right: 4px;
}

.session-item,
.shortcut-item,
.business-link,
.recommendation-chip {
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--app-panel-bg-soft);
  text-align: left;
  cursor: pointer;
  transition:
    transform var(--ea-transition),
    border-color var(--ea-transition),
    background var(--ea-transition),
    box-shadow var(--ea-transition);
}

.session-item:hover,
.shortcut-item:hover,
.business-link:hover,
.recommendation-chip:hover {
  border-color: var(--app-accent);
  transform: translateY(-1px);
}

.session-item strong,
.shortcut-item strong {
  display: block;
  color: var(--app-hero-title);
  font-size: 15px;
}

.session-item span {
  display: block;
  margin-top: 6px;
  color: var(--app-hero-muted);
  font-size: 12px;
}

.session-item--active {
  background: var(--app-menu-active-bg);
  box-shadow: var(--app-menu-active-shadow);
}

.agent-panel--chat {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 18%),
    var(--app-panel-bg);
}

.message-stream {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 2px 4px 0 0;
  overflow: auto;
}

.message-empty {
  padding: 18px 20px;
  border-radius: 20px;
  background: var(--app-panel-bg-soft);
}

.message-empty strong {
  color: var(--app-hero-title);
  font-size: 18px;
}

.message-bubble {
  max-width: min(88%, 720px);
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--app-panel-bg-soft);
}

.message-bubble--user {
  align-self: flex-end;
  background: linear-gradient(135deg, rgba(92, 235, 245, 0.2), rgba(92, 235, 245, 0.08));
}

.message-bubble--assistant,
.message-bubble--tool {
  align-self: flex-start;
}

.message-bubble__role {
  display: block;
  color: var(--app-hero-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.message-bubble__content {
  margin-top: 8px;
  color: var(--ea-text1);
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.8;
}

.message-bubble time,
.log-item p {
  display: block;
  margin-top: 8px;
  color: var(--app-hero-muted);
  font-size: 12px;
}

.composer {
  flex: 0 0 auto;
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--app-panel-border);
}

.recommendations {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.recommendation-chip {
  padding: 9px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.composer :deep(.el-textarea__inner) {
  min-height: 116px !important;
  border-radius: 18px;
  background: var(--app-panel-bg-soft);
  border-color: var(--app-panel-border);
  color: var(--ea-text1);
}

.composer__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 14px;
}

.composer__footer p {
  margin: 0;
  font-size: 13px;
}

.agent-panel--context {
  gap: 14px;
}

.context-block {
  min-width: 0;
  padding: 16px;
  border-radius: 20px;
  background: var(--app-panel-bg-soft);
}

.context-block + .context-block {
  margin-top: 2px;
}

.context-block header {
  margin-bottom: 12px;
}

.log-item {
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
}

.log-item strong,
.dependency-item strong {
  color: var(--app-hero-title);
}

.log-item span {
  display: inline-flex;
  margin-top: 6px;
  color: var(--app-accent);
  font-size: 12px;
  font-weight: 700;
}

.dependency-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
}

.dependency-item p {
  margin: 6px 0 0;
  overflow: hidden;
  color: var(--app-hero-muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dependency-item__status {
  flex: 0 0 auto;
  padding: 5px 9px;
  border-radius: 999px;
  color: var(--app-accent);
  font-size: 12px;
  font-weight: 800;
  background: rgba(92, 235, 245, 0.12);
}

.dependency-item__status--missing,
.dependency-item__status--unready {
  color: #ff9f43;
  background: rgba(255, 159, 67, 0.14);
}

.result-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-panel__summary {
  color: var(--ea-text1);
  line-height: 1.7;
}

.result-panel dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.result-panel dl div {
  min-width: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
}

.result-panel dt {
  color: var(--app-hero-muted);
  font-size: 12px;
}

.result-panel dd {
  margin: 6px 0 0;
  overflow: hidden;
  color: var(--app-hero-title);
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: min(46dvh, 520px);
  overflow: auto;
  padding-right: 4px;
}

.result-rows article {
  padding: 10px 12px;
  border: 1px solid var(--app-panel-border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
}

.result-rows strong,
.result-rows span {
  display: block;
  min-width: 0;
}

.result-rows strong {
  color: var(--app-hero-title);
}

.result-rows span {
  margin-top: 6px;
  color: var(--app-hero-desc);
  font-size: 12px;
  line-height: 1.6;
  word-break: break-word;
}

.context-empty {
  padding: 12px 0;
  font-size: 13px;
}

.business-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.business-link {
  color: var(--ea-text1);
  font-size: 13px;
  font-weight: 700;
}

@media (max-width: 1380px) {
  .agent-workbench__body {
    grid-template-columns: 240px minmax(0, 1fr) minmax(340px, 0.34fr);
  }
}

@media (max-width: 1220px) {
  .agent-workbench__body {
    grid-template-columns: 240px minmax(0, 1fr);
  }

  .agent-panel--context {
    grid-column: 1 / -1;
    max-height: min(52dvh, 520px);
  }
}

@media (max-width: 980px) {
  .agent-workbench__masthead,
  .agent-workbench__body {
    grid-template-columns: 1fr;
  }

  .agent-workbench__masthead {
    padding: 24px 22px;
  }

  .agent-workbench__masthead-side {
    grid-template-columns: 1fr;
  }

  .agent-panel {
    padding: 18px;
  }

  .agent-panel--sessions,
  .agent-panel--context {
    max-height: none;
  }

  .session-list,
  .context-scroll,
  .message-stream {
    overflow: visible;
  }

  .composer__footer,
  .panel-head--between {
    flex-direction: column;
    align-items: flex-start;
  }

  .message-bubble {
    max-width: 100%;
  }
}
</style>
