<template>
  <div class="plan-editor">
    <section class="plan-editor__section">
      <div class="plan-editor__section-header">
        <h3>基础信息</h3>
      </div>
      <EaForm
        v-model:model-value="formModel"
        :options="basicOptions"
        :attrs="formAttrs"
      />
    </section>

    <section class="plan-editor__section">
      <div class="plan-editor__section-header plan-editor__section-header--between">
        <h3>配矿计划</h3>
        <EaButton type="primary" @click="addParentGroup">＋ 新增父级</EaButton>
      </div>

      <div
        v-for="(group, groupIndex) in planGroups"
        :key="group.id"
        class="plan-editor__group"
      >
        <div class="plan-editor__group-toolbar">
          <div class="plan-editor__group-title">父级 {{ groupIndex + 1 }}</div>
          <EaButton
            v-if="planGroups.length > 1"
            plain
            @click="removeParentGroup(groupIndex)"
          >删除父级</EaButton>
        </div>

        <div class="plan-editor__group-body">
          <div class="plan-editor__group-panel plan-editor__group-panel--parent">
            <div class="plan-editor__panel-title">父级内容</div>
            <EaForm
              :model-value="group"
              :options="getParentOptions()"
              :attrs="formAttrs"
              @update:model-value="updateParentGroup(groupIndex, $event)"
            />
          </div>

          <div class="plan-editor__group-panel plan-editor__group-panel--children">
            <div class="plan-editor__children-header">
              <div class="plan-editor__panel-title">子级内容</div>
              <EaButton type="primary" @click="addChildGroup(groupIndex)">＋ 新增子级</EaButton>
            </div>

            <div
              v-for="(child, childIndex) in group.children"
              :key="child.id"
              class="plan-editor__child"
            >
              <div class="plan-editor__child-toolbar">
                <span>子级 {{ childIndex + 1 }}</span>
                <EaButton
                  v-if="group.children.length > 1"
                  plain
                  @click="removeChildGroup(groupIndex, childIndex)"
                >删除子级</EaButton>
              </div>
              <EaForm
                :model-value="child"
                :options="getChildOptions()"
                :attrs="formAttrs"
                @update:model-value="updateChildGroup(groupIndex, childIndex, $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { ElMessage } from "element-plus";
import type { IFormOption } from "eacon-components/src/components/Form/Form.vue";

type PlanMode = "产量模式" | "比例模式";

type PlanChild = {
  id: string;
  loadingPointId: string;
  plannedOutput: string | number;
  unloadRatio: string | number;
};

type PlanGroup = {
  id: string;
  dumpPoint: string;
  totalQuantity: string | number;
  unit: string;
  productionPlanType: string;
  productionTarget: string | number;
  children: PlanChild[];
};

type EditorModel = Record<string, any> & {
  blendingMode?: string;
  organization?: string;
  planName?: string;
  planDate?: string;
  planShift?: string;
  totalTonnage?: number;
  dumpAreaCount?: number;
  stockpileCount?: number;
  planGroups?: PlanGroup[];
};

const formModel = defineModel<EditorModel>("modelValue", { default: {} });

const organizationOptions = [
  { label: "580车队", value: "580车队" },
  { label: "650车队", value: "650车队" },
];
const shiftOptions = [
  { label: "早班", value: "早班" },
  { label: "晚班", value: "晚班" },
];
const modeOptions = [
  { label: "产量模式", value: "产量模式" },
  { label: "比例模式", value: "比例模式" },
];
const unitOptions = [
  { label: "吨", value: "吨" },
  { label: "方", value: "方" },
];
const dumpPointOptions = [
  { label: "北侧卸载点", value: "north-dump" },
  { label: "东侧卸载点", value: "east-dump" },
  { label: "南侧卸载点", value: "south-dump" },
];
const loadPointOptions = [
  { label: "装载点 A-01", value: "load-a01" },
  { label: "装载点 B-03", value: "load-b03" },
  { label: "装载点 C-07", value: "load-c07" },
  { label: "装载点 D-12", value: "load-d12" },
];
const productionPlanTypeOptions = [
  { label: "连续生产", value: "连续生产" },
  { label: "定量生产", value: "定量生产" },
];

const formAttrs = {
  labelPosition: "top",
};

const basicOptions = computed<IFormOption[]>(() => [
  {
    label: "所属组织",
    prop: "organization",
    is: "ea-select",
    componentAttrs: {
      options: organizationOptions,
      placeholder: "请选择所属组织",
      clearable: false,
    },
  },
  {
    label: "计划名称",
    prop: "planName",
    is: "ea-input",
    componentAttrs: {
      placeholder: "请输入计划名称",
      clearable: true,
    },
  },
  {
    label: "执行日期",
    prop: "planDate",
    is: "ea-date-picker",
    componentAttrs: {
      type: "date",
      valueFormat: "YYYY-MM-DD",
      placeholder: "请选择执行日期",
      clearable: false,
    },
  },
  {
    label: "班次",
    prop: "planShift",
    is: "ea-select",
    componentAttrs: {
      options: shiftOptions,
      placeholder: "请选择班次",
      clearable: false,
    },
  },
  {
    label: "配矿模式",
    prop: "blendingMode",
    is: "ea-select",
    componentAttrs: {
      options: modeOptions,
      placeholder: "请选择配矿模式",
      clearable: false,
    },
  },
]);

function getParentOptions(): IFormOption[] {
  if (isProductionMode.value) {
    return [
      {
        label: "卸载点",
        prop: "dumpPoint",
        is: "ea-select",
        componentAttrs: {
          options: dumpPointOptions,
          placeholder: "请选择卸载点",
          clearable: false,
        },
      },
      {
        label: "计划总产量",
        prop: "totalQuantity",
        is: "ea-input",
        componentAttrs: {
          placeholder: "自动汇总子级计划产量",
          disabled: true,
        },
      },
      {
        label: "计划单位",
        prop: "unit",
        is: "ea-select",
        componentAttrs: {
          options: unitOptions,
          placeholder: "请选择计划单位",
          clearable: false,
        },
      },
    ];
  }

  return [
    {
      label: "卸载点",
      prop: "dumpPoint",
      is: "ea-select",
      componentAttrs: {
        options: dumpPointOptions,
        placeholder: "请选择卸载点",
        clearable: false,
      },
    },
    {
      label: "生产计划方式",
      prop: "productionPlanType",
      is: "ea-select",
      componentAttrs: {
        options: productionPlanTypeOptions,
        placeholder: "请选择生产计划方式",
        clearable: false,
      },
    },
    {
      label: "生产计划总量",
      prop: "productionTarget",
      is: "ea-input",
      componentAttrs: {
        type: "number",
        inputmode: "decimal",
        placeholder: "请输入总产量",
      },
    },
    {
      label: "物料单位",
      prop: "unit",
      is: "ea-select",
      componentAttrs: {
        options: unitOptions,
        placeholder: "请选择物料单位",
        clearable: false,
      },
    },
  ];
}

function getChildOptions(): IFormOption[] {
  if (isProductionMode.value) {
    return [
      {
        label: "装载点唯一标识",
        prop: "loadingPointId",
        is: "ea-select",
        componentAttrs: {
          options: loadPointOptions,
          placeholder: "请选择装载点",
          clearable: false,
        },
      },
      {
        label: "计划产量",
        prop: "plannedOutput",
        is: "ea-input",
        componentAttrs: {
          type: "number",
          inputmode: "decimal",
          placeholder: "请输入计划产量",
        },
      },
    ];
  }

  return [
    {
      label: "装载点唯一标识",
      prop: "loadingPointId",
      is: "ea-select",
      componentAttrs: {
        options: loadPointOptions,
        placeholder: "请选择装载点",
        clearable: false,
      },
    },
    {
      label: "卸载比例",
      prop: "unloadRatio",
      is: "ea-input",
      componentAttrs: {
        type: "number",
        inputmode: "decimal",
        placeholder: "请输入卸载比例",
      },
    },
  ];
}

const planGroups = computed<PlanGroup[]>(() => {
  if (!Array.isArray(formModel.value.planGroups)) {
    formModel.value.planGroups = [];
  }
  return formModel.value.planGroups;
});

const isProductionMode = computed(() => normalizeMode(formModel.value.blendingMode) === "产量模式");

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeMode(mode?: string): PlanMode {
  return mode === "比例模式" ? "比例模式" : "产量模式";
}

function toNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function createChild(seed: Partial<PlanChild> = {}): PlanChild {
  return {
    id: seed.id ?? createId("child"),
    loadingPointId: seed.loadingPointId ?? loadPointOptions[0].value,
    plannedOutput: seed.plannedOutput ?? "",
    unloadRatio: seed.unloadRatio ?? "",
  };
}

function createGroup(seed: Partial<PlanGroup> = {}): PlanGroup {
  return {
    id: seed.id ?? createId("group"),
    dumpPoint: seed.dumpPoint ?? dumpPointOptions[0].value,
    totalQuantity: seed.totalQuantity ?? "",
    unit: seed.unit ?? "吨",
    productionPlanType: seed.productionPlanType ?? "连续生产",
    productionTarget: seed.productionTarget ?? "",
    children: Array.isArray(seed.children) && seed.children.length
      ? seed.children.map((child) => createChild(child))
      : [createChild()],
  };
}

function buildInitialGroups() {
  const dumpAreaCount = Math.max(1, toNumber(formModel.value.dumpAreaCount || 1));
  const stockpileCount = Math.max(1, toNumber(formModel.value.stockpileCount || 1));
  const totalTonnage = Math.max(0, toNumber(formModel.value.totalTonnage || 0));
  const mode = normalizeMode(formModel.value.blendingMode);
  const baseChildCount = Math.max(1, Math.ceil(stockpileCount / dumpAreaCount));
  const groupTarget = dumpAreaCount > 0 ? totalTonnage / dumpAreaCount : totalTonnage;
  const childTarget = baseChildCount > 0 ? groupTarget / baseChildCount : groupTarget;
  const ratioValue = baseChildCount > 0 ? Number((100 / baseChildCount).toFixed(2)) : 100;

  return Array.from({ length: dumpAreaCount }, (_, index) => createGroup({
    dumpPoint: dumpPointOptions[index % dumpPointOptions.length].value,
    totalQuantity: mode === "产量模式" ? Number(groupTarget.toFixed(2)) : "",
    productionTarget: mode === "比例模式" ? Number(groupTarget.toFixed(2)) : "",
    children: Array.from({ length: baseChildCount }, (_, childIndex) => createChild({
      loadingPointId: loadPointOptions[(index + childIndex) % loadPointOptions.length].value,
      plannedOutput: mode === "产量模式" ? Number(childTarget.toFixed(2)) : "",
      unloadRatio: mode === "比例模式" ? ratioValue : "",
    })),
  }));
}

function ensureInitialized() {
  formModel.value.blendingMode = normalizeMode(formModel.value.blendingMode);
  formModel.value.organization ||= organizationOptions[0].value;
  formModel.value.planShift ||= shiftOptions[0].value;
  formModel.value.planDate ||= new Date().toISOString().slice(0, 10);
  if (!Array.isArray(formModel.value.planGroups) || !formModel.value.planGroups.length) {
    formModel.value.planGroups = buildInitialGroups();
  } else {
    formModel.value.planGroups = formModel.value.planGroups.map((group) => createGroup(group));
  }
  syncSummary();
}

function syncSummary() {
  formModel.value.blendingMode = normalizeMode(formModel.value.blendingMode);
  const mode = normalizeMode(formModel.value.blendingMode);
  for (const group of planGroups.value) {
    if (!Array.isArray(group.children) || !group.children.length) {
      group.children = [createChild()];
    }
    if (mode === "产量模式") {
      group.totalQuantity = Number(
        group.children.reduce((sum, child) => sum + toNumber(child.plannedOutput), 0).toFixed(2),
      );
    }
  }

  const totalTonnage = mode === "产量模式"
    ? planGroups.value.reduce((sum, group) => sum + toNumber(group.totalQuantity), 0)
    : planGroups.value.reduce((sum, group) => sum + toNumber(group.productionTarget), 0);

  formModel.value.totalTonnage = Number(totalTonnage.toFixed(2));
  formModel.value.dumpAreaCount = planGroups.value.length;
  formModel.value.stockpileCount = planGroups.value.reduce(
    (sum, group) => sum + group.children.length,
    0,
  );
}

function addParentGroup() {
  planGroups.value.push(createGroup());
  syncSummary();
}

function removeParentGroup(index: number) {
  planGroups.value.splice(index, 1);
  if (!planGroups.value.length) {
    planGroups.value.push(createGroup());
  }
  syncSummary();
}

function addChildGroup(groupIndex: number) {
  planGroups.value[groupIndex]?.children.push(createChild());
  syncSummary();
}

function updateParentGroup(groupIndex: number, nextGroup: PlanGroup) {
  planGroups.value[groupIndex] = createGroup(nextGroup);
  syncSummary();
}

function updateChildGroup(groupIndex: number, childIndex: number, nextChild: PlanChild) {
  const targetGroup = planGroups.value[groupIndex];
  if (!targetGroup) return;
  targetGroup.children[childIndex] = createChild(nextChild);
  syncSummary();
}

function removeChildGroup(groupIndex: number, childIndex: number) {
  const targetGroup = planGroups.value[groupIndex];
  if (!targetGroup) return;
  targetGroup.children.splice(childIndex, 1);
  if (!targetGroup.children.length) {
    targetGroup.children.push(createChild());
  }
  syncSummary();
}

function validateText(value: unknown) {
  return String(value ?? "").trim();
}

function validateNumber(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

async function validate() {
  const requiredBasicFields = [
    ["所属组织", formModel.value.organization],
    ["计划名称", formModel.value.planName],
    ["执行日期", formModel.value.planDate],
    ["班次", formModel.value.planShift],
    ["配矿模式", formModel.value.blendingMode],
  ] as const;

  for (const [label, value] of requiredBasicFields) {
    if (!validateText(value)) {
      const message = `请完善${label}`;
      ElMessage.error(message);
      throw new Error(message);
    }
  }

  const mode = normalizeMode(formModel.value.blendingMode);

  for (const [groupIndex, group] of planGroups.value.entries()) {
    if (!validateText(group.dumpPoint)) {
      const message = `请完善父级 ${groupIndex + 1} 的卸载点`;
      ElMessage.error(message);
      throw new Error(message);
    }
    if (!validateText(group.unit)) {
      const message = `请完善父级 ${groupIndex + 1} 的单位`;
      ElMessage.error(message);
      throw new Error(message);
    }

    if (mode === "产量模式") {
      if (toNumber(group.totalQuantity) <= 0) {
        const message = `父级 ${groupIndex + 1} 的计划总产量需大于 0`;
        ElMessage.error(message);
        throw new Error(message);
      }
    } else {
      if (!validateText(group.productionPlanType)) {
        const message = `请完善父级 ${groupIndex + 1} 的生产计划方式`;
        ElMessage.error(message);
        throw new Error(message);
      }
      if (toNumber(group.productionTarget) <= 0) {
        const message = `父级 ${groupIndex + 1} 的生产计划总量需大于 0`;
        ElMessage.error(message);
        throw new Error(message);
      }
    }

    for (const [childIndex, child] of group.children.entries()) {
      if (!validateText(child.loadingPointId)) {
        const message = `请完善父级 ${groupIndex + 1} 子级 ${childIndex + 1} 的装载点唯一标识`;
        ElMessage.error(message);
        throw new Error(message);
      }

      if (mode === "产量模式") {
        if (toNumber(child.plannedOutput) <= 0) {
          const message = `请完善父级 ${groupIndex + 1} 子级 ${childIndex + 1} 的计划产量`;
          ElMessage.error(message);
          throw new Error(message);
        }
      } else {
        const ratio = validateNumber(child.unloadRatio);
        if (ratio === null) {
          const message = `父级 ${groupIndex + 1} 子级 ${childIndex + 1} 的卸载比例只能输入数字`;
          ElMessage.error(message);
          throw new Error(message);
        }
      }
    }
  }

  syncSummary();
}

watch(
  () => formModel.value.blendingMode,
  () => {
    formModel.value.blendingMode = normalizeMode(formModel.value.blendingMode);
    syncSummary();
  },
);

ensureInitialized();

defineExpose({
  validate,
});
</script>

<style scoped lang="scss">
.plan-editor {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 4px 8px 20px;
}

.plan-editor__section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.plan-editor__section-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.plan-editor__section-header h3 {
  margin: 0;
  color: var(--ea-text1);
  font-size: 18px;
  font-weight: 700;
}

.plan-editor__section-header--between {
  justify-content: space-between;
}

.plan-editor__group {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--app-panel-border);
  border-radius: 16px;
  background: var(--app-panel-bg-soft);
}

.plan-editor__group-toolbar,
.plan-editor__children-header,
.plan-editor__child-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.plan-editor__group-title,
.plan-editor__panel-title,
.plan-editor__child-toolbar span {
  color: var(--ea-text1);
  font-weight: 700;
}

.plan-editor__group-body {
  display: grid;
  grid-template-columns: minmax(260px, 0.92fr) minmax(360px, 1.08fr);
  gap: 16px;
}

.plan-editor__group-panel {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--app-panel-border);
  border-radius: 14px;
  background: var(--ea-panel-background);
}

.plan-editor__group-panel--children {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.plan-editor__child {
  padding: 14px;
  border: 1px dashed var(--app-panel-border);
  border-radius: 12px;
  background: var(--app-panel-bg-soft);
}

.plan-editor :deep(.EaconComponentsForm) {
  width: 100%;
}

.plan-editor :deep(.EaconComponentsForm .el-form) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 16px;
}

.plan-editor__group-panel--parent :deep(.EaconComponentsForm .el-form),
.plan-editor__child :deep(.EaconComponentsForm .el-form) {
  grid-template-columns: 1fr;
}

.plan-editor :deep(.EaconComponentsFormItem) {
  margin-bottom: 16px;
}

@media (max-width: 1100px) {
  .plan-editor__group-body {
    grid-template-columns: 1fr;
  }
}
</style>
