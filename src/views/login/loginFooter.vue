<template>
  <footer class="login-footer">
    <span>{{ t("common.copyright") }}</span>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<style scoped lang="scss">
.login-footer {
  position: relative;
  z-index: 1;
  padding: 0 24px 12px;
  color: var(--ea-text-light2);
  font-size: 14px;
  text-align: center;
}

@media (max-height: 780px) {
  .login-footer {
    padding-bottom: 8px;
    font-size: 12px;
  }
}
</style>
