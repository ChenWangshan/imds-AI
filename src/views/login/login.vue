<template>
  <div class="login-page">
    <div class="login-page__aurora login-page__aurora--left" />
    <div class="login-page__aurora login-page__aurora--right" />
    <LoginHeader />
    <main class="login-page__main">
      <section class="login-page__hero">
        <p class="hero__eyebrow">EACON MINING</p>
        <h1>{{ t("common.appName") }}</h1>
        <p class="hero__subtitle">{{ t("common.welcome") }}</p>
      </section>
      <LoginContent />
    </main>
    <LoginFooter />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import LoginContent from "./loginContent.vue";
import LoginFooter from "./loginFooter.vue";
import LoginHeader from "./loginHeader.vue";

const { t } = useI18n();
</script>

<style scoped lang="scss">
.login-page {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  height: 100dvh;
  overflow: hidden;
  color: var(--ea-text);
}

.login-page__main {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(360px, 460px);
  align-items: center;
  justify-items: stretch;
  gap: clamp(20px, 3vw, 48px);
  min-height: 0;
  padding: 12px clamp(24px, 5vw, 72px) 20px;
}

.login-page__hero {
  width: min(100%, 640px);
}

.login-page__hero h1 {
  margin: 0 0 16px;
  font-size: clamp(44px, 6vw, 72px);
  line-height: 1;
}

.hero__eyebrow {
  margin: 0 0 16px;
  color: var(--ea-primary);
  font-size: 14px;
  letter-spacing: 0.32em;
}

.hero__subtitle {
  margin: 0;
  color: var(--ea-text-light);
  font-size: clamp(18px, 2vw, 24px);
}

.login-page__aurora {
  position: absolute;
  border-radius: 999px;
  filter: blur(20px);
  opacity: 0.85;
}

.login-page__aurora--left {
  top: 12%;
  left: -120px;
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, var(--ea-primary-soft) 0%, transparent 68%);
}

.login-page__aurora--right {
  right: -120px;
  bottom: 8%;
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, var(--app-aurora-secondary) 0%, transparent 72%);
}

@media (max-width: 960px) {
  .login-page__main {
    grid-template-columns: 1fr;
    align-content: center;
    justify-items: center;
    gap: 16px;
    padding-top: 8px;
    padding-bottom: 12px;
  }

  .login-page__hero {
    padding-top: 0;
    width: min(100%, 560px);
    text-align: center;
  }
}

@media (max-width: 640px) {
  .login-page__main {
    padding-inline: 16px;
  }

  .login-page__hero {
    width: 100%;
  }

  .login-page__hero h1 {
    font-size: clamp(30px, 9vw, 44px);
  }

  .hero__subtitle {
    font-size: 16px;
  }
}

@media (max-height: 780px) {
  .login-page__main {
    gap: 16px;
    padding-top: 8px;
    padding-bottom: 12px;
  }

  .login-page__hero h1 {
    margin-bottom: 10px;
    font-size: clamp(34px, 5vw, 56px);
  }

  .hero__eyebrow {
    margin-bottom: 10px;
  }
}
</style>
