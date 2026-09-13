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

    <template v-if="versionDialogVisible">
      <EaDialog
        class="role-management-version-dialog"
        v-model="versionDialogVisible"
        title="新增角色版本"
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
          <div class="role-management-version-dialog__footer">
            <EaButton @click="versionDialogVisible = false">取消</EaButton>
            <EaButton type="primary" :loading="versionSubmitting" @click="submitVersion">确定</EaButton>
          </div>
        </template>
      </EaDialog>
    </template>
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
  type SystemRole,
  type SystemRoleVersion,
} from "@/api/roleManagement";
import {
  DEFAULT_SYSTEM_CODE,
  getSystemLabel,
  systemOptions,
} from "@/constants/system";

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
const mineAreaOptions: Option[] = [
  { label: "南露天剥离", value: "南露天剥离" },
  { label: "将一矿", value: "将一矿" },
  { label: "马朗矿", value: "马朗矿" },
  { label: "白石湖矿", value: "白石湖矿" },
  { label: "准东矿", value: "准东矿" },
];

const tablePageRef = ref<any>();
const roleVersions = ref<SystemRoleVersion[]>([]);
const menuVersions = ref<SystemMenuVersion[]>([]);
const sourceRoles = ref<SystemRole[]>([]);
const versionDialogVisible = ref(false);
const versionSubmitting = ref(false);
const versionFormRenderKey = ref(0);

const description = [
  "按角色版本维护角色，角色版本必须绑定一个菜单版本。",
  "新增或编辑角色时，需指定所属系统，授权树会跟随绑定菜单版本与该系统过滤菜单，并可复用同一系统下已有角色版本中的角色权限。",
];

const versionForm = reactive({
  menuVersionCode: "",
  versionCode: "",
});

const currentQuery = computed(() => {
  const queryValue = tablePageRef.value?.queryValue ?? {};
  return {
    keyword: String(queryValue.keyword ?? ""),
    mineAreas: Array.isArray(queryValue.mineAreas)
      ? queryValue.mineAreas.map((item: unknown) => String(item))
      : [],
    roleVersion: String(queryValue.roleVersion ?? DEFAULT_ROLE_VERSION),
    systemCode: String(queryValue.systemCode ?? DEFAULT_SYSTEM_CODE),
  };
});

const currentRoleVersion = computed(() =>
  roleVersions.value.find((item) => item.versionCode === currentQuery.value.roleVersion),
);

function getRoleVersionOptions() {
  return roleVersions.value.map((item) => ({
    label: formatRoleVersionLabel(item.versionCode),
    value: item.versionCode,
  }));
}

function formatRoleVersionLabel(versionCode: string) {
  const value = String(versionCode ?? "").trim();
  return value.replace(/-role(?:-.+)?$/i, "") || value;
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
    label: "所属矿区",
    prop: "mineAreas",
    is: "ea-select",
    componentAttrs: {
      clearable: true,
      collapseTags: true,
      multiple: true,
      options: mineAreaOptions,
      placeholder: "请选择所属矿区",
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
      filterable: false,
      teleported: true,
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
    componentEvents: {
      change: async (value) => {
        value.permissionCodes = [];
        await syncPermissionOptions(
          String(value.menuVersionCode || currentRoleVersion.value?.menuVersionCode || DEFAULT_MENU_VERSION),
          String(value.systemCode ?? ""),
        );
        await loadSourceRoles(String(value.sourceRoleVersionCode ?? ""), String(value.systemCode ?? ""));
      },
    },
  },
  {
    label: "所属矿区",
    prop: "mineAreas",
    is: "ea-select",
    itemAttrs: {
      rules: [{ required: true, message: "请选择所属矿区", trigger: "change" }],
    },
    componentAttrs: {
      clearable: true,
      collapseTags: true,
      multiple: true,
      options: mineAreaOptions,
      placeholder: "请选择所属矿区",
    },
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
        await loadSourceRoles(
          String(value.sourceRoleVersionCode ?? ""),
          String(value.systemCode ?? ""),
        );
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
  { label: "系统名称", prop: "systemCode", componentAttrs: { formatter: getSystemLabel } },
  { label: "所属矿区", prop: "mineAreas", componentAttrs: { formatter: formatMineAreas } },
  { label: "角色编码", prop: "roleCode" },
  { label: "角色名称", prop: "roleName" },
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
    label: "系统名称",
    prop: "systemCode",
    itemAttrs: {
      formatter: (_row, _column, value) => getSystemLabel(value),
      minWidth: 140,
      showOverflowTooltip: true,
    },
  },
  {
    label: "所属矿区",
    prop: "mineAreas",
    itemAttrs: {
      formatter: (_row, _column, value) => formatMineAreas(value),
      minWidth: 220,
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
      mineAreas: [],
      roleVersion: DEFAULT_ROLE_VERSION,
      systemCode: DEFAULT_SYSTEM_CODE,
    },
    tableAttrs: {
      border: false,
    },
    tableButtons: ["detail", "put", "delete"],
    getTableOptions: async () => ({
      data: tableOptions,
    }),
    getTableData: async (params) =>
      fetchSystemRolePage({
        currentPage: Number(params.currentPage ?? 1),
        keyword: String(params.keyword ?? ""),
        mineAreas: normalizeMineAreas(params.mineAreas),
        pageSize: Number(params.pageSize ?? 20),
        roleVersion: String(params.roleVersion ?? ""),
        systemCode: String(params.systemCode ?? ""),
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
      await syncPermissionOptions(
        roleVersion?.menuVersionCode || DEFAULT_MENU_VERSION,
        "",
      );
      sourceRoles.value = [];
      syncSourceRoleOptions();
      return createEmptyRoleForm({
        menuVersionCode: roleVersion?.menuVersionCode || DEFAULT_MENU_VERSION,
        roleVersionCode: roleVersion?.versionCode || currentQuery.value.roleVersion,
      });
    },
    getPutData: async (row) => {
      const detail = await fetchSystemRoleDetail(String(row.id));
      await syncPermissionOptions(detail.menuVersionCode, detail.systemCode);
      await loadSourceRoles(detail.sourceRoleVersionCode, detail.systemCode);
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
    mineAreas: [],
    permissionCodes: [],
    roleCode: "",
    roleName: "",
    roleVersionCode: DEFAULT_ROLE_VERSION,
    sourceRoleCode: "",
    sourceRoleVersionCode: "",
    status: "enabled",
    systemCode: "",
    ...extra,
  };
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

function normalizeMineAreas(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value ?? "")
    .split(/\r?\n|,|，/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatMineAreas(value: unknown) {
  return normalizeMineAreas(value).join("、") || "-";
}

function normalizeRoleForm(data: Partial<SystemRole>) {
  return {
    description: String(data.description ?? "").trim(),
    menuVersionCode: String(data.menuVersionCode ?? "").trim(),
    mineAreas: normalizeMineAreas(data.mineAreas),
    permissionCodes: splitPermissionCodes(data.permissionCodes).filter((item) => !item.startsWith("__menu:")),
    roleCode: String(data.roleCode ?? "").trim(),
    roleName: String(data.roleName ?? "").trim(),
    roleVersionCode: String(data.roleVersionCode ?? currentQuery.value.roleVersion).trim(),
    sourceRoleCode: String(data.sourceRoleCode ?? "").trim(),
    sourceRoleVersionCode: String(data.sourceRoleVersionCode ?? "").trim(),
    status: "enabled",
    systemCode: String(data.systemCode ?? "").trim(),
  };
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
  const queryOption = queryOptions.find((item) => item.prop === "roleVersion");
  if (queryOption) {
    queryOption.componentAttrs = {
      ...queryOption.componentAttrs,
      options: getRoleVersionOptions(),
    };
  }
  const formOption = roleFormOptions.find((item) => item.prop === "sourceRoleVersionCode");
  if (formOption) {
    formOption.componentAttrs = {
      ...formOption.componentAttrs,
      options: getRoleVersionOptions(),
    };
  }
}

function syncMenuVersionOptions() {
  const options = getMenuVersionOptions().map((item) => ({ ...item }));
  versionFormOptions[1] = {
    ...versionFormOptions[1],
    componentAttrs: {
      ...versionFormOptions[1].componentAttrs,
      options,
      clearable: false,
      filterable: false,
      teleported: true,
      placeholder: "请选择菜单版本",
    },
  };
  versionFormRenderKey.value += 1;
}

function syncSourceRoleOptions() {
  const formOption = roleFormOptions.find((item) => item.prop === "sourceRoleCode");
  if (formOption) {
    formOption.componentAttrs = {
      ...formOption.componentAttrs,
      options: sourceRoles.value.map((item) => ({
        label: `${item.roleName}（${item.roleCode}）`,
        value: item.roleCode,
      })),
    };
  }
}

async function syncPermissionOptions(menuVersionCode: string, systemCode: string) {
  const menus = systemCode
    ? await fetchAllSystemMenus({
        menuVersion: menuVersionCode,
        systemCode,
      })
    : [];
  const formOption = roleFormOptions.find((item) => item.prop === "permissionCodes");
  if (formOption) {
    formOption.componentAttrs = {
      ...formOption.componentAttrs,
      data: buildPermissionTree(menus),
    };
  }
}

async function loadSourceRoles(roleVersionCode: string, systemCode: string) {
  sourceRoles.value = roleVersionCode
    ? await fetchAllSystemRoles(roleVersionCode, systemCode)
    : [];
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

async function openVersionDrawer() {
  await loadVersions();
  versionForm.versionCode = "";
  versionForm.menuVersionCode =
    currentRoleVersion.value?.menuVersionCode ||
    menuVersions.value.find((item) => item.versionCode === DEFAULT_MENU_VERSION)?.versionCode ||
    menuVersions.value[0]?.versionCode ||
    "";
  versionFormRenderKey.value += 1;
  versionDialogVisible.value = true;
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
    versionDialogVisible.value = false;
    ElMessage.success("角色版本已创建");
    refreshTable();
  } finally {
    versionSubmitting.value = false;
  }
}

async function exportRoleVersion() {
  const roleVersion = currentQuery.value.roleVersion;
  if (!roleVersion) return;

  const systemCode = currentQuery.value.systemCode;
  const exported = await exportSystemRoleVersion(roleVersion, systemCode);
  const blob = new Blob([JSON.stringify(exported, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `role-package-${roleVersion}-${systemCode}.json`;
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

.role-management-version-dialog__footer {
  display: flex;
  justify-content: flex-end;
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

<style lang="scss">
.white .role-management-version-dialog.EaconComponentsDialog {
  --bg: rgb(248, 251, 255);
}

.dark .role-management-version-dialog.EaconComponentsDialog {
  --bg: rgb(12, 25, 36);
}

.role-management-version-dialog .EaconComponentsForm {
  --ea-form-item-width: 100%;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  padding-left: 0;
  padding-right: 0;
}

.role-management-version-dialog .EaconComponentsFormItem {
  flex: 1 1 100%;
  max-width: 100%;
}

.role-management-version-dialog .EaconComponentsFormItem .el-form-item__content {
  width: 100%;
}

.role-management-version-dialog .EaconComponentsFormItem .el-form-item__content > .EaconComponentsInput,
.role-management-version-dialog .EaconComponentsFormItem .el-form-item__content > .EaconComponentsSelect {
  width: 100%;
}

/* 新增角色版本弹框内「菜单版本」下拉：与菜单管理「基于版本」一致（裁剪 / 层级 / 选项文案宽度） */
.role-management-version-dialog .el-dialog__body {
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

/* 「所属矿区」多选下拉复选框：未选中时 Element Plus 默认背景为 --el-fill-color-blank（白），
   与暗色主题下拉面板背景不一致，参照组件库 Checkbox 以 CSS 变量覆盖的方式改为透明 */
.el-popper.EaconComponentsSelectPopper .EaconComponentsCheckbox {
  --el-checkbox-bg-color: transparent;
}

/* 「授权权限」树形下拉复选框：同上，未选中背景改为透明，与下拉面板背景保持一致 */
.el-popper.EaconComponentsTreeSelectPopper .el-tree .el-checkbox {
  --el-checkbox-bg-color: transparent;
}
</style>
