<template>
  <section class="blending-plan-page">
    <EaTablePageWithCurd
      title="配矿计划"
      :description="description"
      :tab-options="tabOptions"
    />
  </section>
</template>

<script setup lang="ts">
import type { IFormOption } from "eacon-components/src/components/Form/Form.vue";
import type { ITableOption } from "eacon-components/src/components/Table/TableColumn.vue";
import type { ITablePageWithCurdOption } from "eacon-components/src/advancedComponents/TablePageWithCurd/TablePageWithCurd.vue";

import {
  createBlendingPlan,
  deleteBlendingPlan,
  fetchBlendingPlanDetail,
  fetchBlendingPlanPage,
  updateBlendingPlan,
} from "@/api/blendingPlan";

type ShiftType = "早班" | "晚班";
type ModeType = "数值模式" | "比例模式";
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
  { label: "数值模式", value: "数值模式" },
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

function normalizeFormData(data: Partial<BlendingPlanFormData>) {
  // 统一把表单值整理成后端需要的请求结构，避免新增和编辑各自处理一遍。
  return {
    blendingMode: String(data.blendingMode ?? "数值模式") as ModeType,
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
  };
}

const queryOptions: IFormOption[] = [
  {
    label: "计划名称",
    prop: "planName",
    componentAttrs: {
      clearable: true,
      placeholder: "请输入计划名称或计划ID",
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
  { label: "创建时间", prop: "createdAt", itemAttrs: { minWidth: 180 } },
  { label: "状态", prop: "status", itemAttrs: { minWidth: 110 } },
  { label: "完成比例", prop: "completionRatioText", itemAttrs: { minWidth: 110 } },
];

function toDisplayRecord(item: BlendingPlanRecord, sequence: number) {
  // 表格展示层补充序号、吨位和完成比例文案，不改动后端原始字段。
  return {
    ...item,
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
    planName: String(params.planName ?? ""),
    status: String(params.status ?? ""),
  });
  const start = (currentPage - 1) * pageSize;
  const data = response.data.map((item, index) =>
    toDisplayRecord(item, start + index + 1),
  );

  return {
    data,
    recordsTotal: response.recordsTotal,
  };
}

async function getDetailData(row: Record<string, unknown>) {
  const detail = await fetchBlendingPlanDetail(String(row.id));
  return toDisplayRecord(detail, Number(row.sequence ?? 0));
}

async function getPutData(row: Record<string, unknown>) {
  const target = await fetchBlendingPlanDetail(String(row.id));
  return {
    ...target,
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

const tabOptions: ITablePageWithCurdOption[] = [
  {
    label: "计划列表",
    value: "plan-list",
    queryOptions,
    queryValue: {
      planName: "",
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
    // 新增时先给一组合理默认值，减少用户重复输入。
    getPostData: async () => ({
      blendingMode: "数值模式",
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
    // 当前页面已经切到 dispatch-center-AI 的真实 CRUD，不再使用本地 mock。
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

.blending-plan-page :deep(.EaconComponentsTable .el-scrollbar__bar.is-horizontal) {
  display: flex;
}
</style>
