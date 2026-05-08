<template>
  <section class="role-management-page">
    <EaTablePageWithCurd
      ref="tablePageRef"
      title="角色管理"
      :description="description"
      :tab-options="tabOptions"
    >
      <template #InsertTitleButton>
        <EaButton @click="openVersionDrawer">新增版本</EaButton>
        <EaButton :disabled="!currentQuery.roleVersion" @click="exportRoleVersion">导出</EaButton>
      </template>

      <template #roleName="{ row }">
        <div class="role-name-cell">
          <strong>{{ row.roleName }}</strong>
          <span>{{ row.roleCode }}</span>
        </div>
      </template>

      <template #permissionCodes="{ row }">
        <div class="permission-cell">
          <span>{{ row.permissionCodes?.length ?? 0 }} 项权限</span>
          <small>{{ row.permissionCodes?.slice(0, 3).join("、") || "-" }}</small>
        </div>
      </template>
    </EaTablePageWithCurd>

    <EaDrawer
      v-model="versionDrawerVisible"
      title="新增角色版本"
      size-type="small"
      :loading="versionSubmitting"
      @confirm="submitVersion"
    >
      <EaForm v-model="versionForm" :options="versionFormOptions" :attrs="{ labelPosition: 'top' }" />
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
  fetchAllSystemMenus,
  fetchSystemMenuVersions,
  type SystemMenu,
  type SystemMenuVersion,
} from "@/api/menuManagement";
import {
  createSystemRoleVersion,
  deleteSystemRole,
  exportSystemRoleVersion,
  fetchAllSystemRoles,
  fetchSystemRoleDetail,
  fetchSystemRolePage,
  fetchSystemRoleVersions,
  saveSystemRole,
  type RoleStatus,
  type RoleVersionStatus,
  type SystemRole,
  type SystemRoleVersion,
} from "@/api/roleManagement";

type Option = {
  label: string;
  value: string;
};

type PermissionTreeNode = Option & {
  children?: PermissionTreeNode[];
  disabled?: boolean;
};

type RoleFormData = Omit<SystemRole, "createdAt" | "updatedAt">;

const DEFAULT_ROLE_VERSION = "5.20.0.0-role-default";
const DEFAULT_MENU_VERSION = "5.20.0.0";

const tablePageRef = ref<any>();
const roleVersions = ref<SystemRoleVersion[]>([]);
const menuVersions = ref<SystemMenuVersion[]>([]);
const sourceRoles = ref<SystemRole[]>([]);
const versionDrawerVisible = ref(false);
const versionSubmitting = ref(false);

const description = [
  "按角色版本维护角色，角色版本必须绑定一个菜单版本。",
  "新增或编辑角色时，授权树会跟随绑定菜单版本，并可复用已有角色版本中的角色权限。",
];

const versionStatusOptions: Option[] = [
  { label: "草稿", value: "DRAFT" },
  { label: "待发布", value: "REVIEW" },
  { label: "已发布", value: "PUBLISHED" },
  { label: "已废弃", value: "ARCHIVED" },
];

const roleStatusOptions: Option[] = [
  { label: "启用", value: "enabled" },
  { label: "停用", value: "disabled" },
];

const versionForm = reactive({
  menuVersionCode: "",
  versionCode: "",
});

const currentQuery = computed(() => {
  const queryValue = tablePageRef.value?.queryValue ?? {};
  return {
    keyword: String(queryValue.keyword ?? ""),
    roleVersion: String(queryValue.roleVersion ?? DEFAULT_ROLE_VERSION),
    status: String(queryValue.status ?? ""),
  };
});

const currentRoleVersion = computed(() =>
  roleVersions.value.find((item) => item.versionCode === currentQuery.value.roleVersion),
);

function getRoleVersionOptions() {
  return roleVersions.value.map((item) => ({
    label: `${item.versionCode}（菜单 ${item.menuVersionCode}）`,
    value: item.versionCode,
  }));
}

function getMenuVersionOptions() {
  return menuVersions.value.map((item) => ({
    label: item.versionCode,
    value: item.versionCode,
  }));
}

const queryOptions = reactive<IFormOption[]>([
  {
    label: "角色版本",
    prop: "roleVersion",
    is: "ea-select",
    itemAttrs: {
      rules: [{ required: true, message: "请选择角色版本", trigger: "change" }],
    },
    componentAttrs: {
      clearable: false,
      options: [],
      placeholder: "请选择角色版本",
    },
    componentEvents: {
      change: () => refreshTable(),
    },
  },
  {
    label: "角色状态",
    prop: "status",
    is: "ea-select",
    componentAttrs: {
      clearable: true,
      options: roleStatusOptions,
      placeholder: "请选择角色状态",
    },
  },
  {
    label: "关键字",
    prop: "keyword",
    componentAttrs: {
      clearable: true,
      placeholder: "角色名称 / 编码 / 说明",
    },
  },
]);

const versionFormOptions = reactive<IFormOption[]>([
  {
    label: "角色版本号",
    prop: "versionCode",
    itemAttrs: {
      rules: [
        { required: true, message: "请输入角色版本号", trigger: "blur" },
        {
          pattern: /^[A-Za-z0-9._-]+$/,
          message: "仅支持字母、数字、点、短横线、下划线",
          trigger: "blur",
        },
      ],
    },
    componentAttrs: {
      clearable: true,
      placeholder: "请输入角色版本号",
    },
  },
  {
    label: "菜单版本",
    prop: "menuVersionCode",
    is: "ea-select",
    itemAttrs: {
      rules: [{ required: true, message: "请选择菜单版本", trigger: "change" }],
    },
    componentAttrs: {
      clearable: false,
      options: [],
      placeholder: "请选择菜单版本",
    },
  },
]);

const roleFormOptions = reactive<IFormOption[]>([
  {
    label: "角色版本",
    prop: "roleVersionCode",
    disabled: () => true,
  },
  {
    label: "绑定菜单版本",
    prop: "menuVersionCode",
    disabled: () => true,
  },
  {
    label: "角色编码",
    prop: "roleCode",
    itemAttrs: {
      rules: [{ required: true, message: "请输入角色编码", trigger: "blur" }],
    },
    componentAttrs: {
      clearable: true,
      placeholder: "例如 dispatcher",
    },
  },
  {
    label: "角色名称",
    prop: "roleName",
    itemAttrs: {
      rules: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
    },
    componentAttrs: {
      clearable: true,
      placeholder: "请输入角色名称",
    },
  },
  {
    label: "状态",
    prop: "status",
    is: "ea-select",
    componentAttrs: {
      clearable: false,
      options: roleStatusOptions,
      placeholder: "请选择状态",
    },
  },
  {
    label: "来源角色版本",
    prop: "sourceRoleVersionCode",
    is: "ea-select",
    componentAttrs: {
      clearable: true,
      options: [],
      placeholder: "选择后可复用来源角色",
    },
    componentEvents: {
      change: async (value) => {
        value.sourceRoleCode = "";
        await loadSourceRoles(String(value.sourceRoleVersionCode ?? ""));
      },
    },
  },
  {
    label: "来源角色",
    prop: "sourceRoleCode",
    is: "ea-select",
    componentAttrs: {
      clearable: true,
      options: [],
      placeholder: "请选择来源角色",
    },
    componentEvents: {
      change: (value) => applySourceRole(value as Partial<SystemRole>),
    },
  },
  {
    label: "授权权限",
    prop: "permissionCodes",
    is: "ea-tree-select",
    componentAttrs: {
      data: [],
      filterable: true,
      multiple: true,
      placeholder: "请选择菜单、按钮、API 权限",
      props: {
        disabled: "disabled",
        label: "label",
        value: "value",
      },
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
  { label: "角色版本", prop: "roleVersionCode" },
  { label: "绑定菜单版本", prop: "menuVersionCode" },
  { label: "角色编码", prop: "roleCode" },
  { label: "角色名称", prop: "roleName" },
  { label: "状态", prop: "status" },
  { label: "来源角色版本", prop: "sourceRoleVersionCode" },
  { label: "来源角色", prop: "sourceRoleCode" },
  { label: "授权权限", prop: "permissionCodes" },
  { label: "说明", prop: "description" },
];

const tableOptions: ITableOption[] = [
  {
    label: "角色",
    prop: "roleName",
    slot: "roleName",
    itemAttrs: {
      fixed: "left",
      minWidth: 220,
    },
  },
  {
    label: "角色版本",
    prop: "roleVersionCode",
    itemAttrs: {
      minWidth: 220,
      showOverflowTooltip: true,
    },
  },
  {
    label: "菜单版本",
    prop: "menuVersionCode",
    itemAttrs: {
      minWidth: 160,
      showOverflowTooltip: true,
    },
  },
  {
    label: "授权权限",
    prop: "permissionCodes",
    slot: "permissionCodes",
    itemAttrs: {
      minWidth: 260,
      showOverflowTooltip: true,
    },
  },
  {
    label: "状态",
    prop: "status",
    itemAttrs: {
      formatter: (_row, _column, value) => getRoleStatusLabel(value),
      minWidth: 100,
    },
  },
  {
    label: "说明",
    prop: "description",
    itemAttrs: {
      minWidth: 220,
      showOverflowTooltip: true,
    },
  },
];

const tabOptions: ITablePageWithCurdOption[] = [
  {
    label: "角色列表",
    value: "system-roles",
    queryOptions,
    queryValue: {
      keyword: "",
      roleVersion: DEFAULT_ROLE_VERSION,
      status: "",
    },
    tableAttrs: {
      border: false,
    },
    tableButtons: ["detail", "put", "delete"],
    getTableTitle: () => {
      if (!currentRoleVersion.value) return "";
      return `${currentRoleVersion.value.versionCode} · 菜单版本 ${currentRoleVersion.value.menuVersionCode} · ${currentRoleVersion.value.menuSnapshotHash || "待生成菜单指纹"}`;
    },
    getTableOptions: async () => ({
      data: tableOptions,
    }),
    getTableData: async (params) =>
      fetchSystemRolePage({
        currentPage: Number(params.currentPage ?? 1),
        keyword: String(params.keyword ?? ""),
        pageSize: Number(params.pageSize ?? 20),
        roleVersion: String(params.roleVersion ?? ""),
        status: String(params.status ?? ""),
      }),
    getDetailData: async (row) => {
      const detail = await fetchSystemRoleDetail(String(row.id));
      return {
        ...detail,
        permissionCodes: detail.permissionCodes.join("\n"),
      };
    },
    getPostData: async () => {
      const roleVersion = currentRoleVersion.value;
      await syncPermissionOptions(roleVersion?.menuVersionCode || DEFAULT_MENU_VERSION);
      sourceRoles.value = [];
      syncSourceRoleOptions();
      return createEmptyRoleForm({
        menuVersionCode: roleVersion?.menuVersionCode || DEFAULT_MENU_VERSION,
        roleVersionCode: roleVersion?.versionCode || currentQuery.value.roleVersion,
      });
    },
    getPutData: async (row) => {
      const detail = await fetchSystemRoleDetail(String(row.id));
      await syncPermissionOptions(detail.menuVersionCode);
      await loadSourceRoles(detail.sourceRoleVersionCode);
      return detail;
    },
    handlePost: async (data) => {
      await saveSystemRole(normalizeRoleForm(data as Partial<SystemRole>));
    },
    handlePut: async (data) => {
      await saveSystemRole({
        id: data.id as SystemRole["id"],
        ...normalizeRoleForm(data as Partial<SystemRole>),
      });
    },
    handleDelete: async (data) => {
      await deleteSystemRole(String(data.id));
    },
    postOptions: roleFormOptions,
    putOptions: roleFormOptions,
    detailOptions,
    disabledConfirmBeforeCancelEdit: false,
  },
];

function createEmptyRoleForm(extra: Partial<RoleFormData> = {}): RoleFormData {
  return {
    description: "",
    id: undefined,
    menuVersionCode: DEFAULT_MENU_VERSION,
    permissionCodes: [],
    roleCode: "",
    roleName: "",
    roleVersionCode: DEFAULT_ROLE_VERSION,
    sourceRoleCode: "",
    sourceRoleVersionCode: "",
    status: "enabled",
    ...extra,
  };
}

function getRoleStatusLabel(value: unknown) {
  return roleStatusOptions.find((item) => item.value === String(value ?? ""))?.label ?? String(value ?? "");
}

function splitPermissionCodes(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeRoleForm(data: Partial<SystemRole>) {
  return {
    description: String(data.description ?? "").trim(),
    menuVersionCode: String(data.menuVersionCode ?? "").trim(),
    permissionCodes: splitPermissionCodes(data.permissionCodes).filter((item) => !item.startsWith("__menu:")),
    roleCode: String(data.roleCode ?? "").trim(),
    roleName: String(data.roleName ?? "").trim(),
    roleVersionCode: String(data.roleVersionCode ?? currentQuery.value.roleVersion).trim(),
    sourceRoleCode: String(data.sourceRoleCode ?? "").trim(),
    sourceRoleVersionCode: String(data.sourceRoleVersionCode ?? "").trim(),
    status: String(data.status ?? "enabled").trim() as RoleStatus,
  };
}

function getVersionStatusLabel(value: unknown) {
  return versionStatusOptions.find((item) => item.value === String(value ?? ""))?.label ?? String(value ?? "");
}

function splitMenuPermissionCodes(value: unknown) {
  return String(value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildPermissionTree(menus: SystemMenu[]) {
  const nodes = new Map<string, PermissionTreeNode>();
  const roots: PermissionTreeNode[] = [];

  menus
    .slice()
    .sort((a, b) => Number(a.sortNo ?? 0) - Number(b.sortNo ?? 0) || a.menuCode.localeCompare(b.menuCode))
    .forEach((menu) => {
      const permissionChildren = splitMenuPermissionCodes(menu.permissionCodes).map((permissionCode) => ({
        label: permissionCode,
        value: permissionCode,
      }));

      nodes.set(menu.menuCode, {
        label: `${menu.menuName}（${menu.menuCode}）`,
        value: `__menu:${menu.menuCode}`,
        children: permissionChildren,
      });
    });

  menus.forEach((menu) => {
    const node = nodes.get(menu.menuCode);
    if (!node) return;

    const parent = nodes.get(menu.parentMenuCode || "");
    if (parent) {
      parent.children = parent.children ?? [];
      parent.children.unshift(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function syncRoleVersionOptions() {
  queryOptions[0].componentAttrs = {
    ...queryOptions[0].componentAttrs,
    options: getRoleVersionOptions(),
  };
  roleFormOptions[5].componentAttrs = {
    ...roleFormOptions[5].componentAttrs,
    options: getRoleVersionOptions(),
  };
}

function syncMenuVersionOptions() {
  versionFormOptions[1].componentAttrs = {
    ...versionFormOptions[1].componentAttrs,
    options: getMenuVersionOptions(),
  };
}

function syncSourceRoleOptions() {
  roleFormOptions[6].componentAttrs = {
    ...roleFormOptions[6].componentAttrs,
    options: sourceRoles.value.map((item) => ({
      label: `${item.roleName}（${item.roleCode}）`,
      value: item.roleCode,
    })),
  };
}

async function syncPermissionOptions(menuVersionCode: string) {
  const menus = await fetchAllSystemMenus({
    menuVersion: menuVersionCode,
  });
  roleFormOptions[7].componentAttrs = {
    ...roleFormOptions[7].componentAttrs,
    data: buildPermissionTree(menus),
  };
}

async function loadSourceRoles(roleVersionCode: string) {
  sourceRoles.value = roleVersionCode ? await fetchAllSystemRoles(roleVersionCode) : [];
  syncSourceRoleOptions();
}

function applySourceRole(value: Partial<SystemRole>) {
  const sourceRole = sourceRoles.value.find((item) => item.roleCode === value.sourceRoleCode);
  if (!sourceRole) return;

  value.roleName = value.roleName || sourceRole.roleName;
  value.description = value.description || sourceRole.description;
  value.permissionCodes = sourceRole.permissionCodes;
}

function refreshTable() {
  window.setTimeout(() => {
    void tablePageRef.value?.getTableData?.();
  });
}

async function loadVersions() {
  const [roles, menus] = await Promise.all([
    fetchSystemRoleVersions(),
    fetchSystemMenuVersions(),
  ]);
  roleVersions.value = roles;
  menuVersions.value = menus;
  syncRoleVersionOptions();
  syncMenuVersionOptions();

  const queryValue = tablePageRef.value?.queryValue;
  if (queryValue && !roleVersions.value.some((item) => item.versionCode === queryValue.roleVersion)) {
    queryValue.roleVersion =
      roleVersions.value.find((item) => item.versionCode === DEFAULT_ROLE_VERSION)?.versionCode ||
      roleVersions.value[0]?.versionCode ||
      "";
  }
}

function openVersionDrawer() {
  versionForm.versionCode = "";
  versionForm.menuVersionCode =
    currentRoleVersion.value?.menuVersionCode ||
    menuVersions.value.find((item) => item.versionCode === DEFAULT_MENU_VERSION)?.versionCode ||
    menuVersions.value[0]?.versionCode ||
    "";
  versionDrawerVisible.value = true;
}

async function submitVersion() {
  const versionCode = versionForm.versionCode.trim();
  if (!versionCode) {
    ElMessage.warning("请输入角色版本号");
    return;
  }
  if (!versionForm.menuVersionCode) {
    ElMessage.warning("请选择菜单版本");
    return;
  }

  versionSubmitting.value = true;
  try {
    const created = await createSystemRoleVersion({
      menuVersionCode: versionForm.menuVersionCode,
      versionCode,
    });
    await loadVersions();
    const queryValue = tablePageRef.value?.queryValue;
    if (queryValue) {
      queryValue.roleVersion = created.versionCode;
    }
    versionDrawerVisible.value = false;
    ElMessage.success("角色版本已创建");
    refreshTable();
  } finally {
    versionSubmitting.value = false;
  }
}

async function exportRoleVersion() {
  const roleVersion = currentQuery.value.roleVersion;
  if (!roleVersion) return;

  const exported = await exportSystemRoleVersion(roleVersion);
  const blob = new Blob([JSON.stringify(exported, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `role-package-${roleVersion}.json`;
  link.click();
  URL.revokeObjectURL(url);
  ElMessage.success("角色版本已导出");
}

onMounted(async () => {
  await loadVersions();
  refreshTable();
});
</script>

<style scoped lang="scss">
.role-management-page {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.role-management-page :deep(.EaconComponentsTablePageWithCurd),
.role-management-page :deep(.EaconComponentsTablePageWithCurdContainer),
.role-management-page :deep(.EaconComponentsTablePageWithCurdContainerContent),
.role-management-page :deep(.EaconComponentsTablePageWithCurdContainerRight),
.role-management-page :deep(.EaconComponentsTablePageWithCurdTable),
.role-management-page :deep(.EaconComponentsTableContainer) {
  min-width: 0;
  min-height: 0;
}

.role-management-page :deep(.EaconComponentsTablePageWithCurd) {
  flex: 1 1 auto;
  height: 100%;
}

.role-management-page :deep(.EaconComponentsTablePageWithCurdTitleButton) {
  gap: 12px;
}

.role-name-cell,
.permission-cell {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.role-name-cell strong,
.permission-cell span {
  color: var(--ea-text1);
  font-weight: 600;
  line-height: 20px;
}

.role-name-cell span,
.permission-cell small {
  color: var(--ea-text3);
  font-size: 12px;
  line-height: 18px;
}
</style>
