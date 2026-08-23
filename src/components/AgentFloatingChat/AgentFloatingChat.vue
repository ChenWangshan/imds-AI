<template>
  <Teleport to="body">
    <div class="agent-float" :class="{ 'agent-float--open': open }">
      <Transition name="agent-float-panel">
        <section v-if="open" class="agent-float__panel" aria-label="Agent 聊天窗口">
          <header class="agent-float__header">
            <div>
              <span>Agent</span>
              <strong>智能助手</strong>
            </div>
            <el-button circle class="agent-float__icon-button" @click="closePanel">
              <el-icon><Close /></el-icon>
            </el-button>
          </header>

          <div ref="messageScrollRef" class="agent-float__messages">
            <div v-if="agentStore.bootstrapping" class="agent-float__empty">
              正在连接 Agent 服务
            </div>

            <div
              v-else-if="agentStore.messages.length === 0"
              class="agent-float__empty agent-float__empty--ready"
            >
              <strong>设备查询已就绪</strong>
              <button type="button" @click="applyExample">设备编号DEV-1002的vin是多少？</button>
            </div>

            <article
              v-for="message in visibleMessages"
              :key="message.id"
              class="agent-float__message"
              :class="`agent-float__message--${message.role}`"
            >
              <span>{{ roleLabelMap[message.role] || message.role }}</span>
              <p>{{ message.content }}</p>
            </article>
          </div>

          <footer class="agent-float__composer">
            <ElInput
              v-model="draft"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              resize="none"
              placeholder="输入业务问题"
              @keydown.ctrl.enter.prevent="submit"
            />
            <div class="agent-float__composer-actions">
              <span>{{ statusText }}</span>
              <el-button
                type="primary"
                :disabled="!canSubmit"
                :loading="agentStore.sending"
                @click="submit"
              >
                <el-icon><Promotion /></el-icon>
                发送
              </el-button>
            </div>
          </footer>
        </section>
      </Transition>

      <el-tooltip content="智能助手" placement="left">
        <button type="button" class="agent-float__trigger" @click="togglePanel">
          <el-icon v-if="open"><ArrowDown /></el-icon>
          <el-icon v-else><ChatDotRound /></el-icon>
        </button>
      </el-tooltip>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { ElInput, ElMessage } from "element-plus";
import { ArrowDown, ChatDotRound, Close, Promotion } from "@element-plus/icons-vue";
import { useAgentStore } from "@/stores/modules/agent";

const EXAMPLE_PROMPT = "设备编号DEV-1002的vin是多少？";
const MAX_VISIBLE_MESSAGES = 24;

const agentStore = useAgentStore();
const open = ref(false);
const initialized = ref(false);
const draft = ref("");
const messageScrollRef = ref<HTMLDivElement | null>(null);

const roleLabelMap: Record<string, string> = {
  assistant: "Agent",
  tool: "工具",
  user: "我",
};

const visibleMessages = computed(() => agentStore.messages.slice(-MAX_VISIBLE_MESSAGES));
const canSubmit = computed(() => Boolean(draft.value.trim()) && !agentStore.sending && !agentStore.bootstrapping);
const statusText = computed(() => {
  if (agentStore.sending) return "查询中";
  if (agentStore.health?.status) return agentStore.health.status;
  return initialized.value ? "已就绪" : "未连接";
});

function closePanel() {
  open.value = false;
}

async function togglePanel() {
  open.value = !open.value;
  if (open.value) {
    await ensureInitialized();
    scrollToBottom();
  }
}

async function ensureInitialized() {
  if (initialized.value || agentStore.bootstrapping) return;

  try {
    await agentStore.bootstrap();
    initialized.value = true;
  } catch (error) {
    handleError(error, "Agent 初始化失败");
  }
}

function applyExample() {
  draft.value = EXAMPLE_PROMPT;
}

async function submit() {
  const content = draft.value.trim();
  if (!content || agentStore.sending) return;

  await ensureInitialized();
  if (!agentStore.currentSessionId) {
    try {
      await agentStore.createSession();
    } catch (error) {
      handleError(error, "创建 Agent 会话失败");
      return;
    }
  }

  try {
    const exchange = await agentStore.submitMessage(content);
    if (exchange) {
      draft.value = "";
      scrollToBottom();
    }
  } catch (error) {
    handleError(error, "发送消息失败");
  }
}

function scrollToBottom() {
  nextTick(() => {
    const target = messageScrollRef.value;
    if (!target) return;
    target.scrollTop = target.scrollHeight;
  });
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
</script>

<style scoped lang="scss">
.agent-float {
  position: fixed;
  right: 28px;
  bottom: 28px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 14px;
  pointer-events: none;
}

.agent-float__panel,
.agent-float__trigger {
  pointer-events: auto;
}

.agent-float__panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: min(420px, calc(100vw - 32px));
  height: min(620px, calc(100dvh - 116px));
  min-height: 420px;
  overflow: hidden;
  border: 1px solid var(--app-panel-border);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 34%),
    var(--app-panel-bg);
  box-shadow:
    0 24px 70px rgba(8, 15, 26, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px);
}

.agent-float__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 16px 14px 18px;
  border-bottom: 1px solid var(--app-panel-border);
}

.agent-float__header span {
  display: block;
  color: var(--app-accent);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.agent-float__header strong {
  display: block;
  margin-top: 4px;
  color: var(--app-hero-title);
  font-size: 18px;
}

.agent-float__icon-button {
  width: 34px;
  height: 34px;
  border-color: var(--app-header-action-border);
  background: var(--app-header-action-bg);
  color: var(--ea-text2);
}

.agent-float__messages {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  padding: 16px;
  overflow: auto;
}

.agent-float__empty {
  display: grid;
  place-items: center;
  min-height: 100%;
  color: var(--app-hero-muted);
  text-align: center;
  line-height: 1.6;
}

.agent-float__empty--ready {
  align-content: center;
  gap: 12px;
}

.agent-float__empty strong {
  color: var(--app-hero-title);
  font-size: 16px;
}

.agent-float__empty button {
  max-width: 100%;
  padding: 9px 13px;
  border: 1px solid var(--app-panel-border);
  border-radius: 999px;
  background: var(--app-panel-bg-soft);
  color: var(--ea-text1);
  cursor: pointer;
  transition:
    border-color var(--ea-transition),
    transform var(--ea-transition);
}

.agent-float__empty button:hover {
  border-color: var(--app-accent);
  transform: translateY(-1px);
}

.agent-float__message {
  width: fit-content;
  max-width: 88%;
  padding: 10px 12px;
  border: 1px solid var(--app-panel-border);
  border-radius: 14px;
  background: var(--app-panel-bg-soft);
}

.agent-float__message--user {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--app-accent-soft), rgba(255, 255, 255, 0.03));
}

.agent-float__message--assistant,
.agent-float__message--tool {
  align-self: flex-start;
}

.agent-float__message span {
  display: block;
  color: var(--app-hero-muted);
  font-size: 11px;
  font-weight: 800;
}

.agent-float__message p {
  margin: 6px 0 0;
  color: var(--ea-text1);
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.agent-float__composer {
  padding: 14px;
  border-top: 1px solid var(--app-panel-border);
  background: rgba(10, 18, 30, 0.08);
}

.agent-float__composer :deep(.el-textarea__inner) {
  border-radius: 14px;
  border-color: var(--app-panel-border);
  background: var(--app-panel-bg-soft);
  color: var(--ea-text1);
  box-shadow: none;
}

.agent-float__composer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}

.agent-float__composer-actions span {
  color: var(--app-hero-muted);
  font-size: 12px;
}

.agent-float__composer-actions :deep(.el-button) {
  border-radius: 12px;
}

.agent-float__trigger {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 50%;
  background:
    radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.32), transparent 38%),
    var(--ea-primary-gradient);
  color: #ffffff;
  cursor: pointer;
  box-shadow:
    0 18px 44px rgba(12, 107, 218, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  transition:
    transform var(--ea-transition),
    box-shadow var(--ea-transition);
}

.agent-float__trigger:hover {
  transform: translateY(-2px);
  box-shadow:
    0 24px 54px rgba(12, 107, 218, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.agent-float__trigger .el-icon {
  font-size: 24px;
}

.agent-float-panel-enter-active,
.agent-float-panel-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.agent-float-panel-enter-from,
.agent-float-panel-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

@media (max-width: 720px) {
  .agent-float {
    right: 16px;
    bottom: 16px;
  }

  .agent-float__panel {
    height: min(590px, calc(100dvh - 96px));
    min-height: 360px;
  }

  .agent-float__message {
    max-width: 94%;
  }
}
</style>
