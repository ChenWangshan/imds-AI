<template>
  <section class="menu-management-page">
    <EaTablePageWithCurd
      ref="tablePageRef"
      title="菜单管理"
      :description="description"
      :tab-options="tabOptions"
    >
      <template #InsertTitleButton>
        <EaButton @click="openVersionDialog">新增版本</EaButton>
        <EaButton :disabled="!currentQuery.menuVersion" @click="exportMenuVersion">导出</EaButton>
      </template>

      <template #versionInfo>
        <div class="version-info-cell" v-if="currentVersion">
          <span>{{ currentVersion.versionCode }}</span>
          <small>{{ currentVersion.snapshotHash || "待生成菜单指纹" }}</small>
        </div>
      </template>
    </EaTablePageWithCurd>

    <EaDialog
      v-model="versionDialogVisible"
      title="新增菜单版本"
      width="480px"
      destroy-on-close
      append-to-body
    >
      <EaForm v-model="versionForm" :options="versionFormOptions" :attrs="{ labelPosition: 'top' }" />
      <template #footer>
        <EaButton @click="versionDialogVisible = false">取消</EaButton>
        <EaButton type="primary" :loading="versionSubmitting" @click="submitVersion">确定</EaButton>
      </template>
    </EaDialog>

    <EaDrawer
      v-model="childDrawerVisible"
      title="新增菜单节点"
      size-type="small"
      :loading="childSubmitting"
      @confirm="submitChildMenu"
    >
      <EaForm v-model="childForm" :options="menuFormOptions" :attrs="{ labelPosition: 'top' }" />
    </EaDrawer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type {
  IDetailOption,
  IFormOption,
  ITableOption,
  ITablePageWithCurdOption,
} from "eacon-components";

import {
  createSystemMenuVersion,
  deleteSystemMenu,
  exportSystemMenuVersion,
  fetchAllSystemMenus,
  fetchSystemMenuDetail,
  fetchSystemMenuVersions,
  saveSystemMenu,
  type MenuModelStatus,
  type MenuType,
  type SystemMenu,
  type SystemMenuVersion,
} from "@/api/menuManagement";

type Option = {
  label: string;
  value: string;
};

type MenuTreeNode = SystemMenu & {
  children?: MenuTreeNode[];
  treeKey: string;
};

type TreeSelectNode = Option & {
  children?: TreeSelectNode[];
  disabled?: boolean;
};

type MenuFormData = Omit<SystemMenu, "createdAt" | "updatedAt">;

const DEFAULT_MENU_VERSION = "5.20.0.0";
const DEFAULT_SYSTEM_CODE = "integrated";

const tablePageRef = ref<any>();
const versionOptions = ref<SystemMenuVersion[]>([]);
const allMenus = ref<SystemMenu[]>([]);
const editingMenuCode = ref("");
const versionDialogVisible = ref(false);
const childDrawerVisible = ref(false);
const versionSubmitting = ref(false);
const childSubmitting = ref(false);

const description = [
  "按菜单版本维护目录、菜单、按钮、权限编码与 API 绑定。",
  "菜单指纹会随版本导出，用于边端导入时校验同名版本内容一致性。",
];

const systemOptions: Option[] = [
  { label: "生产调度平台", value: "dispatch" },
  { label: "管理后台", value: "admin" },
  { label: "智慧矿山综管平台（当前平台）", value: "integrated" },
];

const menuTypeOptions: Option[] = [
  { label: "目录", value: "DIRECTORY" },
  { label: "菜单", value: "MENU" },
  { label: "按钮", value: "BUTTON" },
];

const statusOptions: Option[] = [
  { label: "草稿", value: "DRAFT" },
  { label: "待发布", value: "REVIEW" },
  { label: "已发布", value: "PUBLISHED" },
  { label: "已废弃", value: "ARCHIVED" },
];

const versionForm = reactive({
  baseVersionCode: "",
  versionCode: "",
});

const childForm = reactive<MenuFormData>(createEmptyMenuForm());

const currentQuery = computed(() => {
  const queryValue = tablePageRef.value?.queryValue ?? {};
  return {
    keyword: String(queryValue.keyword ?? ""),
    menuType: String(queryValue.menuType ?? ""),
    menuVersion: String(queryValue.menuVersion ?? DEFAULT_MENU_VERSION),
    systemCode: String(queryValue.systemCode ?? DEFAULT_SYSTEM_CODE),
  };
});

const currentVersion = computed(() =>
  versionOptions.value.find((item) => item.versionCode === currentQuery.value.menuVersion),
);

function getVersionSelectOptions() {
  return versionOptions.value.map((item) => ({
    label: `${item.versionCode}（${getStatusLabel(item.status)}）`,
    value: item.versionCode,
  }));
}

const queryOptions = reactive<IFormOption[]>([
  {
    label: "菜单版本",
    prop: "menuVersion",
    is: "ea-select",
    itemAttrs: {
      rules: [{ required: true, message: "请选择菜单版本", trigger: "change" }],
    },
    componentAttrs: {
      clearable: false,
      options: [],
      placeholder: "请选择菜单版本",
    },
    componentEvents: {
      change: () => refreshTable(),
    },
  },
  {
    label: "系统名称",
    prop: "systemCode",
    is: "ea-select",
    componentAttrs: {
      clearable: false,
      options: systemOptions,
      placeholder: "请选择系统名称",
    },
    componentEvents: {
      change: () => refreshTable(),
    },
  },
  {
    label: "菜单类型",
    prop: "menuType",
    is: "ea-select",
    componentAttrs: {
      clearable: true,
      options: menuTypeOptions,
      placeholder: "请选择菜单类型",
    },
  },
  {
    label: "关键字",
    prop: "keyword",
    componentAttrs: {
      clearable: true,
      placeholder: "菜单名称 / 编码 / 权限 / API",
    },
  },
]);

const versionFormOptions = reactive<IFormOption[]>([
  {
    label: "菜单版本号",
    prop: "versionCode",
    itemAttrs: {
      rules: [
        { required: true, message: "请输入菜单版本号", trigger: "blur" },
        {
          pattern: /^[A-Za-z0-9._-]+$/,
          message: "仅支持字母、数字、点、短横线、下划线",
          trigger: "blur",
        },
      ],
    },
    componentAttrs: {
      clearable: true,
      placeholder: "请输入版本号",
    },
  },
  {
    label: "基于版本",
    prop: "baseVersionCode",
    is: "ea-select",
    componentAttrs: {
      clearable: true,
      options: [],
      placeholder: "请选择已存在版本",
    },
  },
]);

const menuFormOptions = reactive<IFormOption[]>([
  {
    label: "菜单版本",
    prop: "modelCode",
    disabled: () => true,
  },
  {
    label: "系统名称",
    prop: "systemCode",
    is: "ea-select",
    itemAttrs: {
      rules: [{ required: true, message: "请选择系统名称", trigger: "change" }],
    },
    componentAttrs: {
      clearable: false,
      options: systemOptions,
      placeholder: "请选择系统名称",
    },
  },
  {
    label: "父级菜单",
    prop: "parentMenuCode",
    is: "ea-tree-select",
    componentAttrs: {
      checkStrictly: true,
      clearable: true,
      data: [],
      filterable: true,
      placeholder: "根级菜单可不选",
      props: {
        disabled: "disabled",
        label: "label",
        value: "value",
      },
    },
  },
  {
    label: "菜单编码",
    prop: "menuCode",
    itemAttrs: {
      rules: [{ required: true, message: "请输入菜单编码", trigger: "blur" }],
    },
    componentAttrs: {
      clearable: true,
      placeholder: "例如 system.menu",
    },
  },
  {
    label: "菜单名称",
    prop: "menuName",
    itemAttrs: {
      rules: [{ required: true, message: "请输入菜单名称", trigger: "blur" }],
    },
    componentAttrs: {
      clearable: true,
      placeholder: "请输入菜单名称",
    },
  },
  {
    label: "菜单类型",
    prop: "menuType",
    is: "ea-select",
    itemAttrs: {
      rules: [{ required: true, message: "请选择菜单类型", trigger: "change" }],
    },
    componentAttrs: {
      clearable: false,
      options: menuTypeOptions,
      placeholder: "请选择菜单类型",
    },
  },
  {
    label: "路由路径",
    prop: "routePath",
    componentAttrs: {
      clearable: true,
      placeholder: "例如 /system/menu-management",
    },
  },
  {
    label: "组件路径",
    prop: "componentPath",
    componentAttrs: {
      clearable: true,
      placeholder: "例如 @/views/system/menuManagement.vue",
    },
  },
  {
    label: "图标",
    prop: "icon",
    componentAttrs: {
      clearable: true,
      placeholder: "例如 grid、setting、user",
    },
  },
  {
    label: "排序",
    prop: "sortNo",
    is: "ea-input",
    componentAttrs: {
      placeholder: "请输入排序号",
      type: "number",
    },
  },
  {
    label: "是否显示",
    prop: "visible",
    is: "ea-switch",
    componentAttrs: {
      activeText: "显示",
      inactiveText: "隐藏",
    },
  },
  {
    label: "是否启用",
    prop: "enabled",
    is: "ea-switch",
    componentAttrs: {
      activeText: "启用",
      inactiveText: "停用",
    },
  },
  {
    label: "权限编码",
    prop: "permissionCodes",
    componentAttrs: {
      placeholder: "一行一个，或用逗号分隔，例如 system.menu.view",
      rows: 4,
      type: "textarea",
    },
    size: "large",
  },
  {
    label: "API 绑定",
    prop: "apiBindings",
    componentAttrs: {
      placeholder: "一行一个，例如 GET /api/system/menus",
      rows: 5,
      type: "textarea",
    },
    size: "large",
  },
  {
    label: "说明",
    prop: "description",
    componentAttrs: {
      clearable: true,
      placeholder: "请输入说明",
    },
  },
]);

const detailOptions: IDetailOption[] = [
  { label: "菜单版本", prop: "modelCode" },
  { label: "系统名称", prop: "systemCode", componentAttrs: { formatter: getSystemLabel } },
  { label: "父级菜单", prop: "parentMenuCode" },
  { label: "菜单编码", prop: "menuCode" },
  { label: "菜单名称", prop: "menuName" },
  { label: "菜单类型", prop: "menuType", componentAttrs: { formatter: getMenuTypeLabel } },
  { label: "路由路径", prop: "routePath" },
  { label: "组件路径", prop: "componentPath" },
  { label: "权限编码", prop: "permissionCodes" },
  { label: "API 绑定", prop: "apiBindings" },
  { label: "说明", prop: "description" },
];

const tableOptions: ITableOption[] = [
  {
    label: "菜单类型",
    prop: "menuType",
    itemAttrs: {
      fixed: "left",
      formatter: (_row, _column, value) => getMenuTypeLabel(value),
      minWidth: 120,
    },
  },
  {
    label: "菜单编码",
    prop: "menuCode",
    itemAttrs: {
      fixed: "left",
      minWidth: 220,
      showOverflowTooltip: true,
    },
  },
  {
    label: "菜单名称",
    prop: "menuName",
    itemAttrs: {
      fixed: "left",
      minWidth: 180,
      showOverflowTooltip: true,
    },
  },
  {
    label: "权限编码",
    prop: "permissionCodes",
    itemAttrs: {
      minWidth: 260,
      showOverflowTooltip: true,
    },
  },
  {
    label: "API 绑定",
    prop: "apiBindings",
    itemAttrs: {
      minWidth: 280,
      showOverflowTooltip: true,
    },
  },
  {
    label: "路由路径",
    prop: "routePath",
    itemAttrs: {
      minWidth: 220,
      showOverflowTooltip: true,
    },
  },
  {
    label: "组件路径",
    prop: "componentPath",
    itemAttrs: {
      minWidth: 260,
      showOverflowTooltip: true,
    },
  },
  {
    label: "系统名称",
    prop: "systemCode",
    itemAttrs: {
      formatter: (_row, _column, value) => getSystemLabel(value),
      minWidth: 120,
    },
  },
  {
    label: "排序",
    prop: "sortNo",
    itemAttrs: {
      minWidth: 80,
    },
  },
  {
    label: "状态",
    prop: "enabled",
    itemAttrs: {
      formatter: (_row, _column, value) => (value ? "启用" : "停用"),
      minWidth: 90,
    },
  },
];

const tabOptions: ITablePageWithCurdOption[] = [
  {
    label: "菜单列表",
    value: "system-menus",
    queryOptions,
    queryValue: {
      keyword: "",
      menuType: "",
      menuVersion: DEFAULT_MENU_VERSION,
      systemCode: DEFAULT_SYSTEM_CODE,
    },
    tableAttrs: {
      border: false,
      defaultExpandAll: true,
      rowKey: "treeKey",
      treeProps: {
        children: "children",
      },
    },
    tableButtons: [
      "detail",
      {
        label: "新增",
        show: (row) => row.menuType !== "BUTTON",
        buttonClickEvent: (row) => openChildDrawer(row as SystemMenu),
      },
      "put",
      "delete",
    ],
    pagination: false,
    getTableTitle: () => {
      if (!currentVersion.value) return "";
      return `${currentVersion.value.versionCode} · ${getStatusLabel(currentVersion.value.status)} · ${currentVersion.value.snapshotHash || "待生成菜单指纹"}`;
    },
    getTableOptions: async () => ({
      data: tableOptions,
    }),
    getTableData,
    getDetailData: async (row) => fetchSystemMenuDetail(String(row.id)),
    getPostData: async () => {
      editingMenuCode.value = "";
      await ensureMenuCache(currentQuery.value.menuVersion, currentQuery.value.systemCode);
      syncParentMenuOptions(currentQuery.value.systemCode);
      return createEmptyMenuForm({
        modelCode: currentQuery.value.menuVersion,
        modelName: currentVersion.value?.versionName || currentQuery.value.menuVersion,
        modelStatus: currentVersion.value?.status || "DRAFT",
        modelVersion: currentQuery.value.menuVersion,
        systemCode: currentQuery.value.systemCode,
      });
    },
    getPutData: async (row) => {
      const detail = await fetchSystemMenuDetail(String(row.id));
      editingMenuCode.value = detail.menuCode;
      await ensureMenuCache(detail.modelCode, detail.systemCode);
      syncParentMenuOptions(detail.systemCode, detail.menuCode);
      return detail;
    },
    handlePost: async (data) => {
      await saveSystemMenu(normalizeMenuForm(data as Partial<SystemMenu>));
      await loadVersions();
    },
    handlePut: async (data) => {
      await saveSystemMenu({
        id: data.id as SystemMenu["id"],
        ...normalizeMenuForm(data as Partial<SystemMenu>),
      });
      await loadVersions();
    },
    handleDelete: async (data) => {
      await deleteSystemMenu(String(data.id));
      await loadVersions();
    },
    postOptions: menuFormOptions,
    putOptions: menuFormOptions,
    detailOptions,
    disabledConfirmBeforeCancelEdit: false,
  },
];

function createEmptyMenuForm(extra: Partial<MenuFormData> = {}): MenuFormData {
  return {
    apiBindings: "",
    componentPath: "",
    description: "",
    enabled: true,
    icon: "",
    id: undefined,
    menuCode: "",
    menuName: "",
    menuType: "MENU",
    modelCode: DEFAULT_MENU_VERSION,
    modelName: DEFAULT_MENU_VERSION,
    modelStatus: "DRAFT",
    modelVersion: DEFAULT_MENU_VERSION,
    parentMenuCode: "",
    permissionCodes: "",
    routePath: "",
    sortNo: 0,
    systemCode: DEFAULT_SYSTEM_CODE,
    visible: true,
    ...extra,
  };
}

function getStatusLabel(value: unknown) {
  return statusOptions.find((item) => item.value === String(value ?? ""))?.label ?? String(value ?? "");
}

function getSystemLabel(value: unknown) {
  return systemOptions.find((item) => item.value === String(value ?? ""))?.label ?? String(value ?? "");
}

function getMenuTypeLabel(value: unknown) {
  return menuTypeOptions.find((item) => item.value === String(value ?? ""))?.label ?? String(value ?? "");
}

function cleanMultiline(value: unknown) {
  return String(value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join("\n");
}

function normalizeMenuForm(data: Partial<SystemMenu>) {
  return {
    apiBindings: cleanMultiline(data.apiBindings),
    componentPath: String(data.componentPath ?? "").trim(),
    description: String(data.description ?? "").trim(),
    enabled: Boolean(data.enabled ?? true),
    icon: String(data.icon ?? "").trim(),
    menuCode: String(data.menuCode ?? "").trim(),
    menuName: String(data.menuName ?? "").trim(),
    menuType: String(data.menuType ?? "MENU").trim() as MenuType,
    modelCode: String(data.modelCode ?? currentQuery.value.menuVersion).trim(),
    modelName: String(data.modelName ?? currentVersion.value?.versionName ?? currentQuery.value.menuVersion).trim(),
    modelStatus: String(data.modelStatus ?? currentVersion.value?.status ?? "DRAFT").trim() as MenuModelStatus,
    modelVersion: String(data.modelVersion ?? data.modelCode ?? currentQuery.value.menuVersion).trim(),
    parentMenuCode: String(data.parentMenuCode ?? "").trim(),
    permissionCodes: cleanMultiline(data.permissionCodes),
    routePath: String(data.routePath ?? "").trim(),
    sortNo: Number(data.sortNo ?? 0),
    systemCode: String(data.systemCode ?? currentQuery.value.systemCode).trim(),
    visible: Boolean(data.visible ?? true),
  };
}

function makeTreeKey(item: Pick<SystemMenu, "systemCode" | "menuCode">) {
  return `${item.systemCode}::${item.menuCode}`;
}

function filterRows(rows: SystemMenu[], params: Record<string, unknown>) {
  const keyword = String(params.keyword ?? "").trim().toLowerCase();
  const menuType = String(params.menuType ?? "").trim();
  return rows.filter((item) => {
    if (menuType && item.menuType !== menuType) {
      return false;
    }
    if (!keyword) {
      return true;
    }
    return [
      item.menuCode,
      item.menuName,
      item.parentMenuCode,
      item.permissionCodes,
      item.apiBindings,
      item.routePath,
      item.componentPath,
    ]
      .join(" ")
      .toLowerCase()
      .includes(keyword);
  });
}

function buildMenuTree(rows: SystemMenu[]) {
  const nodes = new Map<string, MenuTreeNode>();
  const roots: MenuTreeNode[] = [];

  rows
    .slice()
    .sort((a, b) => Number(a.sortNo ?? 0) - Number(b.sortNo ?? 0) || a.menuCode.localeCompare(b.menuCode))
    .forEach((item) => {
      nodes.set(makeTreeKey(item), {
        ...item,
        children: [],
        treeKey: makeTreeKey(item),
      });
    });

  nodes.forEach((node) => {
    const parent = nodes.get(`${node.systemCode}::${node.parentMenuCode || ""}`);
    if (parent) {
      parent.children = parent.children ?? [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function buildSelectTree(rows: SystemMenu[]) {
  const nodes = new Map<string, TreeSelectNode>();
  const roots: TreeSelectNode[] = [];

  rows
    .slice()
    .sort((a, b) => Number(a.sortNo ?? 0) - Number(b.sortNo ?? 0) || a.menuCode.localeCompare(b.menuCode))
    .forEach((item) => {
      nodes.set(item.menuCode, {
        label: `${item.menuName}（${item.menuCode}）`,
        value: item.menuCode,
        children: [],
      });
    });

  rows.forEach((item) => {
    const node = nodes.get(item.menuCode);
    if (!node) return;

    const parent = nodes.get(item.parentMenuCode || "");
    if (parent) {
      parent.children = parent.children ?? [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function collectDescendantCodes(menuCode: string, systemCode: string, target: Set<string>) {
  allMenus.value
    .filter((item) => item.systemCode === systemCode && item.parentMenuCode === menuCode)
    .forEach((child) => {
      if (target.has(child.menuCode)) return;
      target.add(child.menuCode);
      collectDescendantCodes(child.menuCode, systemCode, target);
    });
}

function syncVersionOptions() {
  const options = getVersionSelectOptions();
  queryOptions[0].componentAttrs = {
    ...queryOptions[0].componentAttrs,
    options,
  };
  versionFormOptions[1].componentAttrs = {
    ...versionFormOptions[1].componentAttrs,
    options,
  };
}

function syncParentMenuOptions(systemCode: string, disabledMenuCode = "") {
  const disabledCodes = new Set<string>();
  if (disabledMenuCode) {
    disabledCodes.add(disabledMenuCode);
    collectDescendantCodes(disabledMenuCode, systemCode, disabledCodes);
  }

  const rows = allMenus.value.filter(
    (item) =>
      item.systemCode === systemCode &&
      item.menuType !== "BUTTON" &&
      !disabledCodes.has(item.menuCode),
  );

  menuFormOptions[2].componentAttrs = {
    ...menuFormOptions[2].componentAttrs,
    data: buildSelectTree(rows),
  };
}

async function ensureMenuCache(menuVersion: string, systemCode: string) {
  allMenus.value = await fetchAllSystemMenus({
    menuVersion,
    systemCode,
  });
}

async function getTableData(params: Record<string, unknown>) {
  const menuVersion = String(params.menuVersion || DEFAULT_MENU_VERSION);
  const systemCode = String(params.systemCode || DEFAULT_SYSTEM_CODE);
  await ensureMenuCache(menuVersion, systemCode);
  const rows = filterRows(allMenus.value, params);
  const tree = buildMenuTree(rows);
  return {
    data: tree,
    recordsTotal: rows.length,
  };
}

function refreshTable() {
  window.setTimeout(() => {
    void tablePageRef.value?.getTableData?.();
  });
}

async function loadVersions() {
  const versions = await fetchSystemMenuVersions();
  versionOptions.value = versions;
  syncVersionOptions();

  const queryValue = tablePageRef.value?.queryValue;
  if (queryValue && !queryValue.menuVersion) {
    queryValue.menuVersion =
      versions.find((item) => item.versionCode === DEFAULT_MENU_VERSION)?.versionCode ||
      versions[0]?.versionCode ||
      DEFAULT_MENU_VERSION;
  }
}

function openVersionDialog() {
  versionForm.versionCode = "";
  versionForm.baseVersionCode = currentQuery.value.menuVersion;
  versionDialogVisible.value = true;
}

async function submitVersion() {
  const versionCode = versionForm.versionCode.trim();
  if (!versionCode) {
    ElMessage.warning("请输入菜单版本号");
    return;
  }
  if (!/^[A-Za-z0-9._-]+$/.test(versionCode)) {
    ElMessage.warning("菜单版本号仅支持字母、数字、点、短横线、下划线");
    return;
  }

  versionSubmitting.value = true;
  try {
    const created = await createSystemMenuVersion({
      baseVersionCode: versionForm.baseVersionCode,
      versionCode,
    });
    await loadVersions();
    const queryValue = tablePageRef.value?.queryValue;
    if (queryValue) {
      queryValue.menuVersion = created.versionCode;
    }
    versionDialogVisible.value = false;
    ElMessage.success("菜单版本已创建");
    refreshTable();
  } finally {
    versionSubmitting.value = false;
  }
}

async function openChildDrawer(parent: SystemMenu) {
  editingMenuCode.value = "";
  await ensureMenuCache(parent.modelCode, parent.systemCode);
  syncParentMenuOptions(parent.systemCode);
  Object.assign(
    childForm,
    createEmptyMenuForm({
      menuType: parent.menuType === "MENU" ? "BUTTON" : "MENU",
      modelCode: parent.modelCode,
      modelName: parent.modelName,
      modelStatus: parent.modelStatus,
      modelVersion: parent.modelVersion || parent.modelCode,
      parentMenuCode: parent.menuCode,
      systemCode: parent.systemCode,
    }),
  );
  childDrawerVisible.value = true;
}

async function submitChildMenu() {
  const payload = normalizeMenuForm(childForm);
  if (!payload.menuCode || !payload.menuName) {
    ElMessage.warning("请输入菜单编码和菜单名称");
    return;
  }
  if (payload.menuType === "MENU" && (!payload.routePath || !payload.componentPath)) {
    ElMessage.warning("菜单类型需填写路由路径和组件路径");
    return;
  }

  childSubmitting.value = true;
  try {
    await saveSystemMenu(payload);
    await loadVersions();
    childDrawerVisible.value = false;
    ElMessage.success("菜单节点已新增");
    refreshTable();
  } finally {
    childSubmitting.value = false;
  }
}

async function exportMenuVersion() {
  const menuVersion = currentQuery.value.menuVersion;
  if (!menuVersion) return;

  const exported = await exportSystemMenuVersion(menuVersion, currentQuery.value.systemCode);
  const blob = new Blob([JSON.stringify(exported, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `menu-version-${menuVersion}.json`;
  link.click();
  URL.revokeObjectURL(url);
  ElMessage.success("菜单版本已导出");
}

onMounted(async () => {
  await loadVersions();
  refreshTable();
});
</script>

<style scoped lang="scss">
.menu-management-page {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.menu-management-page :deep(.EaconComponentsTablePageWithCurd),
.menu-management-page :deep(.EaconComponentsTablePageWithCurdContainer),
.menu-management-page :deep(.EaconComponentsTablePageWithCurdContainerContent),
.menu-management-page :deep(.EaconComponentsTablePageWithCurdContainerRight),
.menu-management-page :deep(.EaconComponentsTablePageWithCurdTable),
.menu-management-page :deep(.EaconComponentsTableContainer) {
  min-width: 0;
  min-height: 0;
}

.menu-management-page :deep(.EaconComponentsTablePageWithCurd) {
  flex: 1 1 auto;
  height: 100%;
}

.menu-management-page :deep(.EaconComponentsTablePageWithCurdTitleButton) {
  gap: 12px;
}

.menu-management-page :deep(.EaconComponentsTable .el-table__inner-wrapper .cell) {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 22px;
}

.menu-management-page :deep(.EaconComponentsTable .el-table__body .el-table__cell) {
  vertical-align: top;
}

.menu-name-cell,
.api-cell,
.route-cell,
.version-info-cell {
  display: flex;
  min-width: 0;
}

.menu-name-cell {
  align-items: flex-start;
  gap: 8px;
}

.menu-name-cell-main,
.api-cell,
.route-cell,
.version-info-cell {
  flex-direction: column;
  gap: 2px;
}

.menu-name-cell-main strong,
.api-cell span,
.route-cell span,
.version-info-cell span {
  color: var(--ea-text1);
  font-weight: 600;
  line-height: 20px;
}

.menu-name-cell-main span,
.api-cell small,
.route-cell small,
.version-info-cell small {
  color: var(--ea-text3);
  font-size: 12px;
  line-height: 18px;
}

.menu-type {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 2px;
  color: var(--ea-text1);
  font-size: 12px;
  line-height: 22px;
  background: var(--ea-fill4);
}

.menu-type.is-directory {
  color: #8a5a00;
  background: #fff4d6;
}

.menu-type.is-menu {
  color: #1153b2;
  background: #e4f0ff;
}

.menu-type.is-button {
  color: #475467;
  background: #eef2f6;
}
</style>
