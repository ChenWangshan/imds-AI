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
    </EaTablePageWithCurd>
    <template v-if="versionDialogVisible">
      <EaDialog
      class="menu-management-version-dialog"
      v-model="versionDialogVisible"
      title="新增菜单版本"
      width="480px"
      destroy-on-close
      append-to-body
    >
      <EaForm
        :key="versionFormRenderKey"
        v-model="versionForm"
        :options="versionFormOptions"
        :attrs="{ labelPosition: 'top' }"
      />
      <template #footer>
        <div class="menu-management-version-dialog__footer">
          <EaButton @click="versionDialogVisible = false">取消</EaButton>
          <EaButton type="primary" :loading="versionSubmitting" @click="submitVersion">确定</EaButton>
        </div>
      </template>
    </EaDialog>
    </template>


    <EaDrawer
      class="menu-management-menu-drawer"
      v-model="childDrawerVisible"
      title="新增菜单节点"
      size-type="small"
      :loading="childSubmitting"
      @confirm="submitChildMenu"
    >
      <EaForm
        class="menu-management-menu-form"
        v-model="childForm"
        :options="menuFormOptions"
        :attrs="{ labelPosition: 'top' }"
      />
    </EaDrawer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { TableColumnCtx } from "element-plus";
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
import {
  DEFAULT_SYSTEM_CODE,
  getSystemLabel,
  systemOptions,
} from "@/constants/system";

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

const tablePageRef = ref<any>();
const versionOptions = ref<SystemMenuVersion[]>([]);
const allMenus = ref<SystemMenu[]>([]);
const editingMenuCode = ref("");
const versionDialogVisible = ref(false);
const childDrawerVisible = ref(false);
/** 行内「新增」打开抽屉时锁定父级菜单为当前行且不可改 */
const childDrawerLocksParentMenu = ref(false);
const versionSubmitting = ref(false);
const childSubmitting = ref(false);
const versionFormRenderKey = ref(0);

const description = [
  "按菜单版本维护目录、菜单、按钮、权限编码与 API 绑定。",
  "菜单指纹会随版本导出，用于边端导入时校验同名版本内容一致性。",
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
  return versionOptions.value.map((item) => {
    const statusLabel = getStatusLabel(item.status);
    const suffix = statusLabel === "草稿" ? "" : `（${statusLabel}）`;
    return {
      label: `${item.versionCode}${suffix}`,
      value: item.versionCode,
    };
  });
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

const versionSelectOptions = computed(() => {
  const options = getVersionSelectOptions();
  if (options.length) return options;
  return [{ label: `${DEFAULT_MENU_VERSION}（默认版本）`, value: DEFAULT_MENU_VERSION }];
});

const VERSION_FORM_FIRST_OPTION: IFormOption = {
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
};

const versionFormOptions = computed<IFormOption[]>(() => [
  VERSION_FORM_FIRST_OPTION,
  {
    label: "基于版本",
    prop: "baseVersionCode",
    is: "ea-select",
    componentAttrs: {
      clearable: false,
      filterable: false,
      teleported: true,
      placeholder: "请选择菜单版本",
      options: versionSelectOptions.value.map((item) => ({ ...item })),
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
    disabled: () => childDrawerLocksParentMenu.value,
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
    label: "菜单中文名称",
    prop: "menuName",
    itemAttrs: {
      rules: [{ required: true, message: "请输入菜单中文名称", trigger: "blur" }],
    },
    componentAttrs: {
      clearable: true,
      placeholder: "请输入菜单中文名称",
    },
  },
  {
    label: "菜单英文名称",
    prop: "menuNameEn",
    itemAttrs: {
      rules: [{ required: true, message: "请输入菜单英文名称", trigger: "blur" }],
    },
    componentAttrs: {
      clearable: true,
      placeholder: "请输入菜单英文名称",
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
    label: "API 绑定",
    prop: "apiBindings",
    itemAttrs: {
      class: "menu-management-form-item--wide",
    } as IFormOption["itemAttrs"],
    componentAttrs: {
      placeholder: "一行一个，例如 GET /api/system/menus",
      rows: 5,
      type: "textarea",
    },
    size: "large",
  },
]);

const detailOptions: IDetailOption[] = [
  { label: "菜单版本", prop: "modelCode" },
  { label: "系统名称", prop: "systemCode", componentAttrs: { formatter: getSystemLabel } },
  { label: "父级菜单", prop: "parentMenuCode" },
  { label: "菜单中文名称", prop: "menuName" },
  { label: "菜单英文名称", prop: "menuNameEn" },
  { label: "菜单类型", prop: "menuType", componentAttrs: { formatter: getMenuTypeLabel } },
  { label: "API 绑定", prop: "apiBindings" },
];

const tableOptions: ITableOption[] = [
  {
    label: "菜单中文名称",
    prop: "menuName",
    itemAttrs: {
      fixed: "left",
      minWidth: 180,
      showOverflowTooltip: true,
    },
  },
  {
    label: "菜单英文名称",
    prop: "menuNameEn",
    itemAttrs: {
      fixed: "left",
      minWidth: 180,
      showOverflowTooltip: true,
    },
  },
  {
    label: "菜单类型",
    prop: "menuType",
    itemAttrs: {
      fixed: "left",
      formatter: (_row: MenuTreeNode, _column: TableColumnCtx<MenuTreeNode>, value: unknown) =>
        getMenuTypeLabel(value),
      minWidth: 120,
    },
  },
  {
    label: "菜单版本",
    prop: "modelCode",
    itemAttrs: {
      minWidth: 140,
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
    label: "系统名称",
    prop: "systemCode",
    itemAttrs: {
      formatter: (_row: MenuTreeNode, _column: TableColumnCtx<MenuTreeNode>, value: unknown) =>
        getSystemLabel(value),
      minWidth: 120,
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
        show: (row: MenuTreeNode) => row.menuType !== "BUTTON",
        buttonClickEvent: (row: MenuTreeNode) => openChildDrawer(row),
      },
      "put",
      "delete",
    ],
    pagination: false,
    getTableOptions: async () => ({
      data: tableOptions,
    }),
    getTableData,
    getDetailData: async (row: MenuTreeNode) => fetchSystemMenuDetail(String(row.id)),
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
    getPutData: async (row: MenuTreeNode) => {
      const detail = await fetchSystemMenuDetail(String(row.id));
      editingMenuCode.value = detail.menuCode;
      await ensureMenuCache(detail.modelCode, detail.systemCode);
      syncParentMenuOptions(detail.systemCode, detail.menuCode);
      return detail;
    },
    handlePost: async (data: Record<string, unknown>) => {
      await saveSystemMenu(normalizeMenuForm(data as Partial<SystemMenu>));
      await loadVersions();
    },
    handlePut: async (data: Record<string, unknown>) => {
      await saveSystemMenu({
        id: data.id as SystemMenu["id"],
        ...normalizeMenuForm(data as Partial<SystemMenu>),
      });
      await loadVersions();
    },
    handleDelete: async (data: Record<string, unknown>) => {
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
    menuNameEn: "",
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

function resolveMenuCode(data: Partial<SystemMenu>) {
  const explicit = String(data.menuCode ?? "").trim();
  if (explicit) return explicit;
  if (editingMenuCode.value) return editingMenuCode.value;

  const parent = String(data.parentMenuCode ?? "").trim();
  const routePath = String(data.routePath ?? "")
    .trim()
    .split("/")
    .map((seg) => seg.trim())
    .filter(Boolean)
    .join(".");

  if (routePath) return routePath;

  const leaf = String(data.menuName ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const code = leaf || `menu-${Date.now().toString(36)}`;
  return parent ? `${parent}.${code}` : code;
}

function normalizeMenuForm(data: Partial<SystemMenu>) {
  return {
    apiBindings: cleanMultiline(data.apiBindings),
    componentPath: String(data.componentPath ?? "").trim(),
    description: String(data.description ?? "").trim(),
    enabled: Boolean(data.enabled ?? true),
    icon: String(data.icon ?? "").trim(),
    menuCode: resolveMenuCode(data),
    menuName: String(data.menuName ?? "").trim(),
    menuNameEn: String(data.menuNameEn ?? "").trim(),
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
        label: item.menuName,
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
  const options = versionSelectOptions.value.map((item) => ({ ...item }));
  queryOptions[0] = {
    ...queryOptions[0],
    componentAttrs: {
      ...queryOptions[0].componentAttrs,
      options,
    },
  };
}

function setParentMenuFieldLocked(locked: boolean) {
  childDrawerLocksParentMenu.value = locked;
  const opt = menuFormOptions.find((o: IFormOption) => o.prop === "parentMenuCode");
  if (opt?.componentAttrs && typeof opt.componentAttrs === "object") {
    opt.componentAttrs.clearable = !locked;
    if (locked) {
      opt.componentAttrs.placeholder = "由当前行自动带出";
    } else {
      opt.componentAttrs.placeholder = "根级菜单可不选";
    }
  }
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

async function openVersionDialog() {
  await loadVersions();
  versionForm.versionCode = "";
  versionForm.baseVersionCode =
    currentQuery.value.menuVersion ||
    versionOptions.value.find((item) => item.versionCode === DEFAULT_MENU_VERSION)?.versionCode ||
    versionOptions.value[0]?.versionCode ||
    "";
  versionFormRenderKey.value += 1;
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
  setParentMenuFieldLocked(true);
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
  if (!payload.menuName) {
    ElMessage.warning("请输入菜单名称");
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

watch(childDrawerVisible, (open) => {
  if (!open) {
    setParentMenuFieldLocked(false);
  }
});

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

.menu-management-page :deep(.TablePageWithCurdDrawerContent),
.menu-management-page :deep(.menu-management-menu-form) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 16px;
  width: 100%;
  max-width: 100%;
  padding-right: 0;
}

.menu-management-page :deep(.TablePageWithCurdDrawerContent .EaconComponentsFormItem),
.menu-management-page :deep(.menu-management-menu-form .EaconComponentsFormItem) {
  min-width: 0;
  max-width: 100%;
}

.menu-management-page :deep(.TablePageWithCurdDrawerContent .menu-management-form-item--wide),
.menu-management-page :deep(.menu-management-menu-form .menu-management-form-item--wide) {
  grid-column: 1 / -1;
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
.api-cell {
  display: flex;
  min-width: 0;
}

.menu-name-cell {
  align-items: flex-start;
  gap: 8px;
}

.menu-name-cell-main,
.api-cell {
  flex-direction: column;
  gap: 2px;
}

.menu-name-cell-main strong,
.api-cell span {
  color: var(--ea-text1);
  font-weight: 600;
  line-height: 20px;
}

.menu-name-cell-main span,
.api-cell small {
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

.menu-management-version-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
}

</style>

<style lang="scss">
/* append-to-body：弹框不透明 + 表单项铺满（与 EaDialog / EaForm 变量一致） */
.white .menu-management-version-dialog.EaconComponentsDialog {
  --bg: rgb(248, 251, 255);
}

.dark .menu-management-version-dialog.EaconComponentsDialog {
  --bg: rgb(12, 25, 36);
}

.menu-management-version-dialog .EaconComponentsForm {
  --ea-form-item-width: 100%;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  padding-left: 0;
  padding-right: 0;
}

.menu-management-version-dialog .EaconComponentsFormItem {
  flex: 1 1 100%;
  max-width: 100%;
}

.menu-management-version-dialog .EaconComponentsFormItem .el-form-item__content {
  width: 100%;
}

.menu-management-version-dialog .EaconComponentsFormItem .el-form-item__content > .EaconComponentsInput,
.menu-management-version-dialog .EaconComponentsFormItem .el-form-item__content > .EaconComponentsSelect {
  width: 100%;
}

/* 新增版本弹框内「基于版本」下拉：选项文字区域勿被组件库 width:10px 压成不可见；弹出层需在 Dialog 遮罩之上 */
.menu-management-version-dialog .el-dialog__body {
  overflow: visible;
}

.el-popper.EaconComponentsSelectPopper,
.el-popper.EaconComponentsTreeSelectPopper {
  z-index: 3020 !important;
}

.el-popper.EaconComponentsSelectPopper .EaconComponentsSelectOptionLabel {
  width: auto !important;
  min-width: 0;
  flex: 1 1 auto !important;
  color: inherit;
}

/* 新增菜单节点抽屉底部按钮间距（抽屉挂载到 body） */
.menu-management-menu-drawer .EaconComponentsDrawerFooterButtons {
  gap: 20px;
}

.EaconComponentsDrawer .TablePageWithCurdDrawerContent,
.EaconComponentsDrawer .menu-management-menu-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 16px;
  width: 100%;
  max-width: 100%;
  padding-right: 0;
}

.EaconComponentsDrawer .TablePageWithCurdDrawerContent .EaconComponentsFormItem,
.EaconComponentsDrawer .menu-management-menu-form .EaconComponentsFormItem {
  min-width: 0;
  max-width: 100%;
}

.EaconComponentsDrawer .TablePageWithCurdDrawerContent .menu-management-form-item--wide,
.EaconComponentsDrawer .menu-management-menu-form .menu-management-form-item--wide {
  grid-column: 1 / -1;
}
</style>
