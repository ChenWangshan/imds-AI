<template>
  <section class="login-card">
    <div class="login-card__title-wrap">
      <span class="login-card__eyebrow">EACON ACCESS</span>
      <p v-if="authStore.currentUser">
        {{ t("common.currentUser") }}: {{ authStore.currentUser.username }}
      </p>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="loginRules"
      :validate-on-rule-change="false"
      label-position="top"
      size="large"
      status-icon
    >
      <el-form-item :label="t('common.username')" prop="username">
        <el-input v-model="form.username" :placeholder="t('common.usernamePlaceholder')" />
      </el-form-item>
      <el-form-item :label="t('common.password')" prop="password">
        <el-input
          v-model="form.password"
          show-password
          type="password"
          :placeholder="t('common.passwordPlaceholder')"
        />
      </el-form-item>

      <el-form-item prop="agreed">
        <el-checkbox v-model="form.agreed">
          {{ t("common.agreement") }}
          <span class="login-card__privacy">{{ t("common.privacy") }}</span>
        </el-checkbox>
      </el-form-item>

      <el-button class="login-card__submit" type="primary" @click="handleSubmit">
        {{ t("common.login") }}
      </el-button>
    </el-form>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import { useAuthStore } from "@/stores/modules/auth";

const { t } = useI18n();
const router = useRouter();
const formRef = ref<FormInstance>();
const authStore = useAuthStore();

const form = reactive({
  agreed: true,
  password: "",
  username: "",
});

const loginRules: FormRules = {
  agreed: [
    {
      validator: (_rule, value, callback) => {
        if (value) callback();
        else callback(new Error(t("common.privacy")));
      },
      trigger: "change",
    },
  ],
  password: [{ required: true, message: t("common.passwordPlaceholder"), trigger: "blur" }],
  username: [{ required: true, message: t("common.usernamePlaceholder"), trigger: "blur" }],
};

async function handleSubmit() {
  await formRef.value?.validate();

  try {
    await authStore.login(form.username, form.password);
    ElMessage.success(t("common.loginSuccess"));
    router.replace("/home");
  } catch (error) {
    if (typeof error === "object" && error && "message" in error) {
      const message = String(error.message);
      const messageMap: Record<string, string> = {
        用户名或密码错误: t("common.invalidCredentials"),
      };

      ElMessage.error(messageMap[message] ?? message ?? t("common.networkError"));
      return;
    }

    ElMessage.error(t("common.networkError"));
  }
}
</script>

<style scoped lang="scss">
.login-card {
  position: relative;
  z-index: 1;
  width: min(100%, 420px);
  justify-self: end;
  padding: 28px;
  border: 1px solid var(--ea-border-color);
  border-radius: 28px;
  background: var(--ea-panel-background);
  box-shadow: var(--ea-shadow);
  backdrop-filter: var(--ea-panel-backdrop);
}

.login-card__title-wrap {
  margin: 8px 0 18px;
  text-align: center;
}

.login-card__eyebrow {
  display: inline-flex;
  justify-content: center;
  margin-bottom: 12px;
  padding: 8px 16px;
  border: 1px solid var(--ea-border-color);
  border-radius: 999px;
  background: var(--ea-fill-color3);
  color: var(--ea-primary);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.36em;
}

.login-card__title-wrap p {
  margin: 0;
  color: var(--ea-text-light2);
  font-size: 14px;
  line-height: 1.7;
}

.login-card__privacy {
  color: var(--ea-primary);
}

.login-card__submit {
  width: 100%;
  height: 42px;
  margin-top: 8px;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--ea-primary) 0%, #7caef7 100%);
}

.login-card :deep(.el-form-item__label),
.login-card :deep(.el-checkbox__label) {
  color: var(--ea-text-light);
}

.login-card :deep(.el-input__wrapper) {
  min-height: 40px;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: none;
}

html.dark .login-card :deep(.el-input__wrapper) {
  background: rgba(5, 10, 20, 0.42);
}

@media (max-width: 960px) {
  .login-card {
    justify-self: center;
    padding: 24px;
  }
}

@media (max-width: 640px) {
  .login-card {
    width: min(100%, 380px);
    padding: 20px;
    border-radius: 22px;
  }

  .login-card__eyebrow {
    font-size: 13px;
    letter-spacing: 0.28em;
  }
}
</style>
