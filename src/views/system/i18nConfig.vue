<template>
  <section class="i18n-config-page">
    <EaTablePageWithCurd
      :title="t('i18n.pageTitle')"
      :description="description"
      :tab-options="tabOptions"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type {
  IDetailOption,
  IFormOption,
  ITableOption,
  ITablePageWithCurdOption,
} from "eacon-components";

import {
  deleteI18nConfig,
  fetchI18nConfigPage,
  saveI18nConfig,
  type I18nConfig,
} from "@/api/i18nConfig";
import { useGlobalStore } from "@/stores/modules/global";

type I18nConfigFormData = {
  id?: number | string;
  configKey: string;
  zhValue: string;
  enValue: string;
  jaValue: string;
  description: string;
};

const { t } = useI18n();
const globalStore = useGlobalStore();

const description = computed(() => [t("i18n.pageDescription")]);

function normalizeFormData(data: Partial<I18nConfigFormData>) {
  return {
    configKey: String(data.configKey ?? "").trim(),
    description: String(data.description ?? "").trim(),
    enValue: String(data.enValue ?? "").trim(),
    jaValue: String(data.jaValue ?? "").trim(),
    zhValue: String(data.zhValue ?? "").trim(),
  };
}

const queryOptions = computed<IFormOption[]>(() => [
  {
    label: t("i18n.searchKey"),
    prop: "keyword",
    componentAttrs: {
      clearable: true,
      placeholder: t("i18n.searchKey"),
    },
  },
  {
    label: t("i18n.zhValue"),
    prop: "zhValue",
    componentAttrs: {
      clearable: true,
      placeholder: t("i18n.zhValue"),
    },
  },
  {
    label: t("i18n.enValue"),
    prop: "enValue",
    componentAttrs: {
      clearable: true,
      placeholder: t("i18n.enValue"),
    },
  },
  {
    label: t("i18n.jaValue"),
    prop: "jaValue",
    componentAttrs: {
      clearable: true,
      placeholder: t("i18n.jaValue"),
    },
  },
]);

const formOptions = computed<IFormOption[]>(() => [
  {
    label: t("i18n.searchKey"),
    prop: "configKey",
    itemAttrs: {
      rules: [{ required: true, message: t("i18n.configKeyPlaceholder"), trigger: "blur" }],
    },
    componentAttrs: {
      clearable: true,
      placeholder: t("i18n.configKeyPlaceholder"),
    },
  },
  {
    label: t("i18n.zhValue"),
    prop: "zhValue",
    itemAttrs: {
      rules: [{ required: true, message: t("i18n.zhValue"), trigger: "blur" }],
    },
    componentAttrs: {
      clearable: true,
      placeholder: t("i18n.zhValue"),
    },
  },
  {
    label: t("i18n.enValue"),
    prop: "enValue",
    itemAttrs: {
      rules: [{ required: true, message: t("i18n.enValue"), trigger: "blur" }],
    },
    componentAttrs: {
      clearable: true,
      placeholder: t("i18n.enValue"),
    },
  },
  {
    label: t("i18n.jaValue"),
    prop: "jaValue",
    itemAttrs: {
      rules: [{ required: true, message: t("i18n.jaValue"), trigger: "blur" }],
    },
    componentAttrs: {
      clearable: true,
      placeholder: t("i18n.jaValue"),
    },
  },
  {
    label: t("i18n.description"),
    prop: "description",
    componentAttrs: {
      clearable: true,
      placeholder: t("i18n.description"),
    },
  },
]);

const detailOptions = computed<IDetailOption[]>(() => [
  {
    label: t("i18n.searchKey"),
    prop: "configKey",
  },
  {
    label: t("i18n.zhValue"),
    prop: "zhValue",
  },
  {
    label: t("i18n.enValue"),
    prop: "enValue",
  },
  {
    label: t("i18n.jaValue"),
    prop: "jaValue",
  },
  {
    label: t("i18n.description"),
    prop: "description",
  },
]);

const tableOptions = computed<ITableOption[]>(() => [
  {
    label: t("i18n.searchKey"),
    prop: "configKey",
    itemAttrs: {
      fixed: "left",
      minWidth: 220,
    },
  },
  {
    label: t("i18n.zhValue"),
    prop: "zhValue",
    itemAttrs: {
      minWidth: 240,
      showOverflowTooltip: true,
    },
  },
  {
    label: t("i18n.enValue"),
    prop: "enValue",
    itemAttrs: {
      minWidth: 260,
      showOverflowTooltip: true,
    },
  },
  {
    label: t("i18n.jaValue"),
    prop: "jaValue",
    itemAttrs: {
      minWidth: 260,
      showOverflowTooltip: true,
    },
  },
  {
    label: t("i18n.description"),
    prop: "description",
    itemAttrs: {
      minWidth: 200,
      showOverflowTooltip: true,
    },
  },
]);

async function refreshI18nMessages() {
  await globalStore.initializeI18nConfig();
}

async function getTableData(params: Record<string, unknown>) {
  return fetchI18nConfigPage({
    currentPage: Number(params.currentPage ?? 1),
    enValue: String(params.enValue ?? ""),
    jaValue: String(params.jaValue ?? ""),
    pageSize: Number(params.pageSize ?? 20),
    keyword: String(params.keyword ?? ""),
    zhValue: String(params.zhValue ?? ""),
  });
}

async function createConfig(data: Record<string, unknown>) {
  await saveI18nConfig(normalizeFormData(data));
  await refreshI18nMessages();
}

async function updateConfig(data: Record<string, unknown>) {
  await saveI18nConfig({
    id: data.id as I18nConfig["id"],
    ...normalizeFormData(data),
  });
  await refreshI18nMessages();
}

async function removeConfig(data: Record<string, unknown>) {
  await deleteI18nConfig(String(data.id));
  await refreshI18nMessages();
}

const tabOptions = computed<ITablePageWithCurdOption[]>(() => [
  {
    label: t("route.i18nConfig"),
    value: "i18n-configs",
    queryOptions: queryOptions.value,
    queryValue: {
      enValue: "",
      jaValue: "",
      keyword: "",
      zhValue: "",
    },
    tableAttrs: {
      border: false,
    },
    tableButtons: ["detail", "put", "delete"],
    getTableOptions: async () => ({
      data: tableOptions.value,
    }),
    getTableData,
    getDetailData: async (row) => row,
    getPostData: async () => ({
      configKey: "",
      description: "",
      enValue: "",
      jaValue: "",
      zhValue: "",
    }),
    getPutData: async (row) => ({
      configKey: String(row.configKey ?? ""),
      description: String(row.description ?? ""),
      enValue: String(row.enValue ?? ""),
      id: row.id as I18nConfig["id"],
      jaValue: String(row.jaValue ?? ""),
      zhValue: String(row.zhValue ?? ""),
    }),
    handlePost: createConfig,
    handlePut: updateConfig,
    handleDelete: removeConfig,
    postOptions: formOptions.value,
    putOptions: formOptions.value,
    detailOptions: detailOptions.value,
    disabledConfirmBeforeCancelEdit: false,
  },
]);
</script>

<style scoped lang="scss">
.i18n-config-page {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.i18n-config-page :deep(.EaconComponentsTablePageWithCurd),
.i18n-config-page :deep(.EaconComponentsTablePageWithCurdContainer),
.i18n-config-page :deep(.EaconComponentsTablePageWithCurdContainerContent),
.i18n-config-page :deep(.EaconComponentsTablePageWithCurdContainerRight),
.i18n-config-page :deep(.EaconComponentsTablePageWithCurdTable),
.i18n-config-page :deep(.EaconComponentsTableContainer) {
  min-width: 0;
  min-height: 0;
}

.i18n-config-page :deep(.EaconComponentsTablePageWithCurd) {
  flex: 1 1 auto;
  height: 100%;
}

.i18n-config-page :deep(.EaconComponentsTable .el-table__inner-wrapper .cell) {
  white-space: normal;
  word-break: break-word;
  line-height: 22px;
}

.i18n-config-page :deep(.EaconComponentsTable .el-table__body .el-table__cell) {
  vertical-align: top;
}

.i18n-config-page :deep(.EaconComponentsTable .el-scrollbar__bar.is-horizontal) {
  display: flex;
}
</style>
