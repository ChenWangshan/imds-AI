<template>
  <section class="blending-plan-page">
    <EaTablePageWithCurd
      ref="tablePageRef"
      title="配矿计划"
      :description="description"
      :tab-options="tabOptions"
    >
      <template #InsertTitleButton>
        <EaButton type="primary" @click="openImportDialog">导入</EaButton>
        <EaButton type="primary" @click="handleExportTemplate">模版导出</EaButton>
      </template>
    </EaTablePageWithCurd>

    <ElDialog
      v-model="importDialogVisible"
      title="导入配矿计划"
      width="560px"
      destroy-on-close
      @closed="resetImportState"
    >
      <EaUpload
        :key="uploadKey"
        ref="uploadRef"
        accept=".xlsx,.xls"
        :auto-upload="false"
        :limit="1"
        :multiple="false"
        :show-file-list="false"
        @change="handleImportFileChange"
        @exceed="handleImportExceed"
      >
        <div class="blending-plan-page__upload-panel">
          <div class="blending-plan-page__upload-icon">XLSX</div>
          <div class="blending-plan-page__upload-title">
            {{ selectedImportFileName ? "已选择导入文件" : "将文件拖到此处，或点击上传" }}
          </div>
          <div class="blending-plan-page__upload-name">
            {{ selectedImportFileName || "支持 .xlsx / .xls，按计划ID自动新增或更新" }}
          </div>
        </div>
      </EaUpload>
      <template #footer>
        <div class="blending-plan-page__dialog-footer">
          <EaButton @click="importDialogVisible = false">取消</EaButton>
          <EaButton type="primary" :loading="importing" @click="handleImportSubmit">开始导入</EaButton>
        </div>
      </template>
    </ElDialog>
  </section>
</template>

<script setup lang="ts">
import { markRaw, ref } from "vue";
import { ElMessage, type UploadFile, type UploadFiles } from "element-plus";
import type { IFormOption } from "eacon-components/src/components/Form/Form.vue";
import type { ITableOption } from "eacon-components/src/components/Table/TableColumn.vue";
import type { ITablePageWithCurdOption } from "eacon-components/src/advancedComponents/TablePageWithCurd/TablePageWithCurd.vue";

import {
  createBlendingPlan,
  deleteBlendingPlan,
  downloadBlendingPlanTemplate,
  fetchBlendingPlanDetail,
  fetchBlendingPlanPage,
  importBlendingPlans,
  updateBlendingPlan,
} from "@/api/blendingPlan";
import BlendingPlanEditor from "./components/BlendingPlanEditor.vue";

type ShiftType = "早班" | "晚班";
type ModeType = "产量模式" | "比例模式";
type OrganizationType = "580车队" | "650车队";
type StatusType = "执行中" | "待执行" | "已结束";

type BlendingPlanRecord = {
  id: number;
  planId: string;
  planName: string;
  planDate: string;
  planShift: ShiftType;
  blendingMode: ModeType;
  organization: OrganizationType;
  stockpileCount: number;
  dumpAreaCount: number;
  totalTonnage: number;
  creator: string;
  createdAt: string;
  status: StatusType;
  completionRatio: number;
  planGroups?: Record<string, unknown>[];
};

type BlendingPlanFormData = Omit<BlendingPlanRecord, "id" | "creator" | "createdAt"> & {
  id?: number;
};

const description = ["参照公共组件库构建计划管理页，并通过 dispatch-center-AI 后端接口完成真实增删改查。"];

const shiftOptions = [
  { label: "早班", value: "早班" },
  { label: "晚班", value: "晚班" },
];

const modeOptions = [
  { label: "产量模式", value: "产量模式" },
  { label: "比例模式", value: "比例模式" },
];

const organizationOptions = [
  { label: "580车队", value: "580车队" },
  { label: "650车队", value: "650车队" },
];

const statusOptions = [
  { label: "执行中", value: "执行中" },
  { label: "待执行", value: "待执行" },
  { label: "已结束", value: "已结束" },
];

const tablePageRef = ref<{ getTableData: () => Promise<void> } | null>(null);
const uploadRef = ref<unknown>(null);
const importDialogVisible = ref(false);
const importing = ref(false);
const uploadKey = ref(0);
const selectedImportFile = ref<File | null>(null);
const selectedImportFileName = ref("");

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function createPlanId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function normalizeModeValue(mode: unknown): ModeType {
  return String(mode ?? "").trim() === "比例模式" ? "比例模式" : "产量模式";
}

function normalizeFormData(data: Partial<BlendingPlanFormData>) {
  // 统一把表单值整理成后端需要的请求结构，避免新增和编辑各自处理一遍。
  return {
    blendingMode: normalizeModeValue(data.blendingMode),
    completionRatio: Number(data.completionRatio ?? 1),
    dumpAreaCount: Number(data.dumpAreaCount ?? 1),
    organization: String(data.organization ?? "580车队") as OrganizationType,
    planDate: String(data.planDate ?? ""),
    planId: String(data.planId ?? "").trim().slice(0, 8).toUpperCase(),
    planName: String(data.planName ?? "").trim(),
    planShift: String(data.planShift ?? "早班") as ShiftType,
    status: String(data.status ?? "待执行") as StatusType,
    stockpileCount: Number(data.stockpileCount ?? 1),
    totalTonnage: Number(data.totalTonnage ?? 0),
    planGroups: Array.isArray(data.planGroups) ? data.planGroups : [],
  };
}

const queryOptions: IFormOption[] = [
  {
    label: "计划ID",
    prop: "planId",
    componentAttrs: {
      clearable: true,
      placeholder: "请输入计划ID",
    },
  },
  {
    label: "计划名称",
    prop: "planName",
    componentAttrs: {
      clearable: true,
      placeholder: "请输入计划名称",
    },
  },
  {
    label: "计划日期",
    prop: "planDate",
    is: "ea-date-picker",
    componentAttrs: {
      clearable: true,
      placeholder: "请选择计划日期",
      type: "date",
      valueFormat: "YYYY-MM-DD",
    },
  },
  {
    label: "计划班次",
    prop: "planShift",
    is: "ea-select",
    componentAttrs: {
      clearable: true,
      options: shiftOptions,
      placeholder: "请选择计划班次",
    },
  },
  {
    label: "配矿模式",
    prop: "blendingMode",
    is: "ea-select",
    componentAttrs: {
      clearable: true,
      options: modeOptions,
      placeholder: "请选择配矿模式",
    },
  },
  {
    label: "执行组织",
    prop: "organization",
    is: "ea-select",
    componentAttrs: {
      clearable: true,
      options: organizationOptions,
      placeholder: "请选择执行组织",
    },
  },
  {
    label: "创建时间",
    prop: "createdAt",
    is: "ea-date-picker",
    componentAttrs: {
      clearable: true,
      placeholder: "请选择创建时间",
      type: "date",
      valueFormat: "YYYY-MM-DD",
    },
  },
  {
    label: "状态",
    prop: "status",
    is: "ea-select",
    componentAttrs: {
      clearable: true,
      options: statusOptions,
      placeholder: "请选择状态",
    },
  },
];

const formOptions: IFormOption[] = [
  {
    label: "计划ID",
    prop: "planId",
    itemAttrs: {
      rules: [
        { required: true, message: "请输入计划ID", trigger: "blur" },
        {
          pattern: /^[A-Za-z0-9]{8}$/,
          message: "计划ID需为8位数字字母组合",
          trigger: ["blur", "change"],
        },
      ],
    },
    componentAttrs: {
      clearable: true,
      maxlength: 8,
      placeholder: "请输入8位数字字母组合",
    },
  },
  {
    label: "计划名称",
    prop: "planName",
    itemAttrs: {
      rules: [{ required: true, message: "请输入计划名称", trigger: "blur" }],
    },
    componentAttrs: {
      clearable: true,
      placeholder: "请输入计划名称",
    },
  },
  {
    label: "计划日期",
    prop: "planDate",
    itemAttrs: {
      rules: [{ required: true, message: "请选择计划日期", trigger: "change" }],
    },
    is: "ea-date-picker",
    componentAttrs: {
      clearable: true,
      placeholder: "请选择计划日期",
      type: "date",
      valueFormat: "YYYY-MM-DD",
    },
  },
  {
    label: "计划班次",
    prop: "planShift",
    is: "ea-select",
    itemAttrs: {
      rules: [{ required: true, message: "请选择计划班次", trigger: "change" }],
    },
    componentAttrs: {
      clearable: false,
      options: shiftOptions,
      placeholder: "请选择计划班次",
    },
  },
  {
    label: "配矿模式",
    prop: "blendingMode",
    is: "ea-select",
    itemAttrs: {
      rules: [{ required: true, message: "请选择配矿模式", trigger: "change" }],
    },
    componentAttrs: {
      clearable: false,
      options: modeOptions,
      placeholder: "请选择配矿模式",
    },
  },
  {
    label: "执行组织",
    prop: "organization",
    is: "ea-select",
    itemAttrs: {
      rules: [{ required: true, message: "请选择执行组织", trigger: "change" }],
    },
    componentAttrs: {
      clearable: false,
      options: organizationOptions,
      placeholder: "请选择执行组织",
    },
  },
  {
    label: "爆堆数量",
    prop: "stockpileCount",
    itemAttrs: {
      rules: [{ required: true, message: "请输入爆堆数量", trigger: "blur" }],
    },
    componentAttrs: {
      max: 10,
      min: 1,
      placeholder: "请输入1-10",
    },
  },
  {
    label: "卸载区数量",
    prop: "dumpAreaCount",
    itemAttrs: {
      rules: [{ required: true, message: "请输入卸载区数量", trigger: "blur" }],
    },
    componentAttrs: {
      max: 10,
      min: 1,
      placeholder: "请输入1-10",
    },
  },
  {
    label: "计划矿量总吨位",
    prop: "totalTonnage",
    itemAttrs: {
      rules: [{ required: true, message: "请输入计划矿量总吨位", trigger: "blur" }],
    },
    componentAttrs: {
      min: 1,
      placeholder: "请输入计划矿量总吨位",
    },
  },
  {
    label: "状态",
    prop: "status",
    is: "ea-select",
    itemAttrs: {
      rules: [{ required: true, message: "请选择状态", trigger: "change" }],
    },
    componentAttrs: {
      clearable: false,
      options: statusOptions,
      placeholder: "请选择状态",
    },
  },
  {
    label: "完成比例",
    prop: "completionRatio",
    itemAttrs: {
      rules: [{ required: true, message: "请输入完成比例", trigger: "blur" }],
    },
    componentAttrs: {
      max: 100,
      min: 1,
      placeholder: "请输入1-100",
    },
  },
];

const detailOptions: NonNullable<ITablePageWithCurdOption["detailOptions"]> = [
  { label: "计划ID", prop: "planId" },
  { label: "计划名称", prop: "planName" },
  { label: "计划日期", prop: "planDate" },
  { label: "计划班次", prop: "planShift" },
  { label: "配矿模式", prop: "blendingMode" },
  { label: "执行组织", prop: "organization" },
  { label: "爆堆数量", prop: "stockpileCount" },
  { label: "卸载区数量", prop: "dumpAreaCount" },
  { label: "计划矿量总吨位", prop: "totalTonnage" },
  { label: "创建人", prop: "creator" },
  { label: "创建时间", prop: "createdAt" },
  { label: "状态", prop: "status" },
  { label: "完成比例", prop: "completionRatioText" },
];

const tableOptions: ITableOption[] = [
  { label: "计划ID", prop: "planId", itemAttrs: { minWidth: 120 } },
  { label: "计划名称", prop: "planName", itemAttrs: { minWidth: 220 } },
  { label: "计划日期", prop: "planDate", itemAttrs: { minWidth: 140 } },
  { label: "计划班次", prop: "planShift", itemAttrs: { minWidth: 110 } },
  { label: "配矿模式", prop: "blendingMode", itemAttrs: { minWidth: 120 } },
  { label: "执行组织", prop: "organization", itemAttrs: { minWidth: 120 } },
  { label: "爆堆数量", prop: "stockpileCount", itemAttrs: { minWidth: 110 } },
  { label: "卸载区数量", prop: "dumpAreaCount", itemAttrs: { minWidth: 120 } },
  { label: "计划矿量总吨位", prop: "totalTonnageText", itemAttrs: { minWidth: 150 } },
  { label: "创建人", prop: "creator", itemAttrs: { minWidth: 140 } },
  {
    label: "创建时间",
    prop: "createdAt",
    itemAttrs: {
      minWidth: 200,
      showOverflowTooltip: true,
    },
  },
  { label: "状态", prop: "status", itemAttrs: { minWidth: 110 } },
  { label: "完成比例", prop: "completionRatioText", itemAttrs: { minWidth: 110 } },
];

function toDisplayRecord(item: BlendingPlanRecord, sequence: number) {
  // 表格展示层补充序号、吨位和完成比例文案，不改动后端原始字段。
  return {
    ...item,
    blendingMode: normalizeModeValue(item.blendingMode),
    completionRatioText: `${item.completionRatio}%`,
    createdAt: String(item.createdAt ?? "").replace("T", " "),
    sequence,
    totalTonnageText: `${item.totalTonnage.toLocaleString()} t`,
  };
}

async function getTableData(params: Record<string, unknown>) {
  // TablePageWithCurd 约定返回 data + recordsTotal，这里顺手补齐分页序号。
  const currentPage = Number(params.currentPage ?? 1);
  const pageSize = Number(params.pageSize ?? 20);
  const response = await fetchBlendingPlanPage({
    currentPage,
    pageSize,
    planId: String(params.planId ?? ""),
    planName: String(params.planName ?? ""),
    planDate: String(params.planDate ?? ""),
    planShift: String(params.planShift ?? ""),
    blendingMode: String(params.blendingMode ?? ""),
    organization: String(params.organization ?? ""),
    createdAt: String(params.createdAt ?? ""),
    status: String(params.status ?? ""),
  });
  const start = (currentPage - 1) * pageSize;
  const data = response.data.map((item, index) => toDisplayRecord(item, start + index + 1));

  return {
    data,
    recordsTotal: response.recordsTotal,
  };
}

async function getDetailData(row: Record<string, unknown>) {
  try {
    const detail = await fetchBlendingPlanDetail(String(row.id));
    return toDisplayRecord(detail, Number(row.sequence ?? 0));
  } catch (error) {
    ElMessage.error("详情加载失败，已展示当前列表数据");
    return row;
  }
}

async function getPutData(row: Record<string, unknown>) {
  try {
    const target = await fetchBlendingPlanDetail(String(row.id));
    return {
      ...target,
      blendingMode: normalizeModeValue(target.blendingMode),
    };
  } catch (error) {
    ElMessage.error("编辑数据加载失败，已使用当前列表数据打开");
    return {
      ...row,
      blendingMode: normalizeModeValue(row.blendingMode),
    };
  }
}

async function getPutDrawerAttrs() {
  return {
    confirmButtonText: "保存",
    is: markRaw(BlendingPlanEditor),
    modal: true,
    sizeType: "xl",
  };
}

async function handlePost(data: Record<string, unknown>) {
  await createBlendingPlan(normalizeFormData(data));
}

async function handlePut(data: Record<string, unknown>) {
  await updateBlendingPlan(String(data.id), normalizeFormData(data));
}

async function handleDelete(data: Record<string, unknown>) {
  await deleteBlendingPlan(String(data.id));
}

function openImportDialog() {
  importDialogVisible.value = true;
}

function resetImportState() {
  selectedImportFile.value = null;
  selectedImportFileName.value = "";
  importing.value = false;
  uploadKey.value += 1;
}

function handleImportExceed() {
  ElMessage.warning("一次只能选择一个导入文件");
}

function handleImportFileChange(uploadFile: UploadFile, uploadFiles: UploadFiles) {
  const currentFile = uploadFiles.at(-1) ?? uploadFile;
  const fileName = currentFile.name?.toLowerCase() ?? "";
  const rawFile = currentFile.raw ?? null;

  if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
    selectedImportFile.value = null;
    selectedImportFileName.value = "";
    ElMessage.error("请上传 Excel 文件（.xlsx 或 .xls）");
    uploadKey.value += 1;
    return;
  }

  selectedImportFile.value = rawFile;
  selectedImportFileName.value = currentFile.name ?? rawFile?.name ?? "";
}

async function handleImportSubmit() {
  if (!selectedImportFile.value) {
    ElMessage.warning("请先选择要导入的 Excel 文件");
    return;
  }

  importing.value = true;
  try {
    const response = await importBlendingPlans(selectedImportFile.value);
    ElMessage.success(response.message || `成功导入 ${response.importedCount} 条配矿计划`);
    importDialogVisible.value = false;
    await tablePageRef.value?.getTableData();
  } catch (error) {
    const message =
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : "导入失败，请稍后重试";
    ElMessage.error(message);
  } finally {
    importing.value = false;
  }
}

async function handleExportTemplate() {
  const blob = await downloadBlendingPlanTemplate();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "配矿计划模版.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

const tabOptions: ITablePageWithCurdOption[] = [
  {
    label: "计划列表",
    value: "plan-list",
    queryOptions,
    queryValue: {
      planId: "",
      planName: "",
      planDate: "",
      planShift: "",
      blendingMode: "",
      organization: "",
      createdAt: "",
      status: "",
    },
    tableAttrs: {
      border: false,
    },
    tableButtons: ["detail", "put", "delete"],
    getTableOptions: async () => ({
      data: tableOptions,
    }),
    getTableData,
    getDetailData,
    getPostData: async () => ({
      blendingMode: "产量模式",
      completionRatio: 1,
      dumpAreaCount: 1,
      organization: "580车队",
      planDate: formatDate(new Date()),
      planId: createPlanId(),
      planName: "",
      planShift: "早班",
      status: "待执行",
      stockpileCount: 1,
      totalTonnage: 10000,
    }),
    getPutData,
    getPutDrawerAttrs,
    handlePost,
    handlePut,
    handleDelete,
    postOptions: formOptions,
    putOptions: formOptions,
    detailOptions,
    disabledConfirmBeforeCancelEdit: false,
  },
];
</script>

<style scoped lang="scss">
.blending-plan-page {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  height: 100%;
  width: 100%;
  min-height: 0;
  min-width: 0;
}

.blending-plan-page :deep(.EaconComponentsTablePageWithCurd),
.blending-plan-page :deep(.EaconComponentsTablePageWithCurdContainer),
.blending-plan-page :deep(.EaconComponentsTablePageWithCurdContainerContent),
.blending-plan-page :deep(.EaconComponentsTablePageWithCurdContainerRight),
.blending-plan-page :deep(.EaconComponentsTablePageWithCurdTable),
.blending-plan-page :deep(.EaconComponentsTableContainer) {
  min-height: 0;
  min-width: 0;
}

.blending-plan-page :deep(.EaconComponentsTablePageWithCurd) {
  flex: 1 1 auto;
  height: 100%;
}

.blending-plan-page :deep(.EaconComponentsTablePageWithCurdTitleButton) {
  display: flex;
  flex-direction: row-reverse;
  gap: 12px;
}

.blending-plan-page :deep(.EaconComponentsTable .el-table__inner-wrapper .cell) {
  white-space: normal;
  word-break: break-all;
  line-height: 22px;
}

.blending-plan-page :deep(.EaconComponentsTable .el-table__body .el-table__cell) {
  vertical-align: top;
}

.blending-plan-page :deep(.EaconComponentsTable .span) {
  display: block;
  white-space: normal;
  word-break: break-all;
}

.blending-plan-page :deep(.EaconComponentsTable .el-table__body .el-table__cell:nth-child(12) .cell),
.blending-plan-page :deep(.EaconComponentsTable .el-table__header .el-table__cell:nth-child(12) .cell) {
  white-space: nowrap;
  word-break: normal;
}

.blending-plan-page :deep(.EaconComponentsTable .el-scrollbar__bar.is-horizontal) {
  display: flex;
}

.blending-plan-page__upload-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 196px;
  padding: 24px;
  border: 1px dashed var(--app-panel-border);
  border-radius: 12px;
  background: var(--app-panel-bg-soft);
  box-sizing: border-box;
  text-align: center;
}

.blending-plan-page__upload-icon {
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  margin-bottom: 16px;
  border-radius: 18px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.blending-plan-page__upload-title {
  color: var(--ea-text1);
  font-size: 16px;
  font-weight: 700;
}

.blending-plan-page__upload-name {
  margin-top: 10px;
  color: var(--ea-text3);
  font-size: 13px;
  line-height: 1.6;
  word-break: break-all;
}

.blending-plan-page :deep(.EaconComponentsUpload .el-upload-dragger) {
  border: none;
  background: transparent;
  box-shadow: none;
}

.blending-plan-page :deep(.EaconComponentsUploadContent) {
  width: 100%;
  height: auto;
  border: none;
  background: transparent;
}

.blending-plan-page__dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
