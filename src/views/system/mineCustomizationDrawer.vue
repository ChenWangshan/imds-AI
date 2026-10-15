<template>
  <EaDrawer
    v-model="visible"
    class="mine-customization-drawer"
    :title="drawerTitle"
    :size="1100"
    :auto-scroll="false"
  >
    <div v-loading="loading" class="mine-customization-drawer__body">
      <div class="mine-customization-drawer__left">
        <h3 class="mine-customization-drawer__section-title">基础信息</h3>
        <EaForm
          v-model="form"
          :options="formOptions"
          :attrs="{ labelPosition: 'top' }"
        />
      </div>
      <div class="mine-customization-drawer__right">
        <h3 class="mine-customization-drawer__section-title">系统菜单</h3>
        <div class="mine-customization-drawer__right-content">
          <EaTabs
            v-if="systemTabs.length"
            v-model="activeSystem"
            class="mine-customization-drawer__tabs"
          >
            <EaTabPane
              v-for="tab in systemTabs"
              :key="tab.value"
              :label="tab.label"
              :name="tab.value"
            />
          </EaTabs>
          <span v-else class="mine-customization-drawer__tab-empty">
            该基线版本暂无系统菜单
          </span>
          <div class="mine-customization-drawer__tree">
            <EaTree
              v-if="activeTab?.tree?.length"
              ref="treeRef"
              :key="treeKey"
              :data="activeTab.tree"
              :props="treeProps"
              show-checkbox
              node-key="menuCode"
              default-expand-all
              :expand-on-click-node="false"
              @check="syncActiveChecks"
            />
            <el-empty v-else :image-size="80" description="该系统暂无菜单" />
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="mine-customization-drawer__footer">
        <EaButton @click="visible = false">{{ isDetail ? "关闭" : "取消" }}</EaButton>
        <EaButton
          v-if="!isDetail"
          type="primary"
          :loading="submitting"
          @click="submit"
        >
          保存
        </EaButton>
      </div>
    </template>
  </EaDrawer>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { IFormOption } from "eacon-components";

import {
  fetchAllSystemMenus,
  fetchSystemMenuVersions,
  type SystemMenu,
  type SystemMenuVersion,
} from "@/api/menuManagement";
import {
  createSystemMineCustomization,
  fetchSystemMineCustomizationDetail,
  updateSystemMineCustomization,
  type MineCustomizationMenu,
} from "@/api/mineCustomization";
import { getSystemLabel, mineAreaOptions, systemOptions } from "@/constants/system";

type DrawerMode = "create" | "edit" | "detail";

type MenuTreeNode = {
  menuCode: string;
  menuName: string;
  children?: MenuTreeNode[];
};

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    mode?: DrawerMode;
    id?: number | string | null;
  }>(),
  {
    mode: "create",
    id: null,
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "saved"): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const isDetail = computed(() => props.mode === "detail");

const drawerTitle = computed(() => {
  if (props.mode === "create") return "新增矿区定制功能菜单";
  if (props.mode === "edit") return "编辑矿区定制功能菜单";
  return "矿区定制功能菜单详情";
});

const form = reactive({
  baseVersionCode: "",
  mineAreas: [] as string[],
  versionName: "",
});

const versionOptions = ref<SystemMenuVersion[]>([]);
const allMenus = ref<SystemMenu[]>([]);
const activeSystem = ref("");
const checkedBySystem = reactive<Record<string, string[]>>({});
const loading = ref(false);
const submitting = ref(false);
const treeRef = ref();

const treeProps = computed(() => ({
  children: "children",
  label: "menuName",
  disabled: () => isDetail.value,
}));

const formOptions = computed<IFormOption[]>(() => [
  {
    label: "所属矿区",
    prop: "mineAreas",
    is: "ea-select",
    disabled: () => isDetail.value,
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
    label: "基线版本",
    prop: "baseVersionCode",
    is: "ea-select",
    disabled: () => isDetail.value,
    itemAttrs: {
      rules: [{ required: true, message: "请选择基线版本", trigger: "change" }],
    },
    componentAttrs: {
      clearable: false,
      options: versionOptions.value.map((item) => ({
        label: item.versionCode,
        value: item.versionCode,
      })),
      placeholder: "请选择基线版本",
    },
    componentEvents: {
      change: () => handleBaseVersionChange(),
    },
  },
  {
    label: "版本名称",
    prop: "versionName",
    disabled: () => isDetail.value,
    itemAttrs: {
      rules: [{ required: true, message: "请输入版本名称", trigger: "blur" }],
    },
    componentAttrs: {
      clearable: true,
      placeholder: "请输入版本名称",
    },
  },
]);

function systemOrder(systemCode: string) {
  const index = systemOptions.findIndex((item) => item.value === systemCode);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function buildTree(menus: SystemMenu[]): MenuTreeNode[] {
  const nodes = new Map<string, MenuTreeNode>();
  menus
    .slice()
    .sort(
      (a, b) =>
        Number(a.sortNo ?? 0) - Number(b.sortNo ?? 0) ||
        a.menuCode.localeCompare(b.menuCode),
    )
    .forEach((menu) => {
      nodes.set(menu.menuCode, {
        menuCode: menu.menuCode,
        menuName: menu.menuName,
        children: [],
      });
    });

  const roots: MenuTreeNode[] = [];
  menus.forEach((menu) => {
    const node = nodes.get(menu.menuCode);
    if (!node) return;
    const parent = nodes.get(menu.parentMenuCode || "");
    if (parent) {
      parent.children = parent.children ?? [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

const systemTabs = computed(() => {
  const groups = new Map<string, SystemMenu[]>();
  allMenus.value.forEach((menu) => {
    const group = groups.get(menu.systemCode) ?? [];
    group.push(menu);
    groups.set(menu.systemCode, group);
  });

  return [...groups.keys()]
    .sort(
      (a, b) =>
        systemOrder(a) - systemOrder(b) ||
        getSystemLabel(a).localeCompare(getSystemLabel(b)),
    )
    .map((systemCode) => ({
      value: systemCode,
      label: getSystemLabel(systemCode),
      tree: buildTree(groups.get(systemCode) ?? []),
    }));
});

const activeTab = computed(
  () =>
    systemTabs.value.find((tab) => tab.value === activeSystem.value) ??
    systemTabs.value[0],
);

const treeKey = computed(() => `${form.baseVersionCode}::${activeSystem.value}`);

function clearChecked() {
  Object.keys(checkedBySystem).forEach((key) => {
    delete checkedBySystem[key];
  });
}

function syncActiveChecks() {
  if (!treeRef.value?.component || !activeSystem.value) return;
  checkedBySystem[activeSystem.value] =
    treeRef.value.component.getCheckedKeys(true);
}

async function loadMenus(menuVersion: string) {
  allMenus.value = menuVersion
    ? await fetchAllSystemMenus({ menuVersion })
    : [];
}

async function applyCheckedKeys() {
  await nextTick();
  treeRef.value?.component?.setCheckedKeys(
    checkedBySystem[activeSystem.value] ?? [],
  );
}

async function handleBaseVersionChange() {
  clearChecked();
  await loadMenus(form.baseVersionCode);
  activeSystem.value = systemTabs.value[0]?.value ?? "";
  await applyCheckedKeys();
}

async function initialize() {
  loading.value = true;
  try {
    versionOptions.value = await fetchSystemMenuVersions();
    clearChecked();
    form.mineAreas = [];
    form.versionName = "";
    form.baseVersionCode = versionOptions.value[0]?.versionCode ?? "";

    if (props.mode !== "create" && props.id !== null && props.id !== undefined && props.id !== "") {
      const record = await fetchSystemMineCustomizationDetail(props.id);
      form.baseVersionCode = record.baseVersionCode || form.baseVersionCode;
      form.mineAreas = [...(record.mineAreas ?? [])];
      form.versionName = record.versionName ?? "";
      await loadMenus(form.baseVersionCode);
      (record.menus ?? []).forEach((menu) => {
        checkedBySystem[menu.systemCode] = [
          ...(checkedBySystem[menu.systemCode] ?? []),
          menu.menuCode,
        ];
      });
    } else {
      await loadMenus(form.baseVersionCode);
    }

    activeSystem.value = systemTabs.value[0]?.value ?? "";
    await applyCheckedKeys();
  } finally {
    loading.value = false;
  }
}

async function submit() {
  const versionName = form.versionName.trim();
  if (!form.baseVersionCode) {
    ElMessage.warning("请选择基线版本");
    return;
  }
  if (!form.mineAreas.length) {
    ElMessage.warning("请选择所属矿区");
    return;
  }
  if (!versionName) {
    ElMessage.warning("请输入版本名称");
    return;
  }

  syncActiveChecks();
  const menus: MineCustomizationMenu[] = [];
  Object.entries(checkedBySystem).forEach(([systemCode, menuCodes]) => {
    (menuCodes ?? []).forEach((menuCode) => menus.push({ systemCode, menuCode }));
  });
  if (!menus.length) {
    ElMessage.warning("请在系统菜单中选择菜单");
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      baseVersionCode: form.baseVersionCode,
      versionName,
      mineAreas: [...form.mineAreas],
      status: "DRAFT",
      description: "",
      menus,
    };

    if (props.mode === "edit" && props.id !== null && props.id !== undefined && props.id !== "") {
      await updateSystemMineCustomization(props.id, payload);
    } else {
      await createSystemMineCustomization(payload);
    }
    ElMessage.success("矿区定制功能菜单已保存");
    emit("saved");
    visible.value = false;
  } finally {
    submitting.value = false;
  }
}

watch(activeSystem, () => {
  void applyCheckedKeys();
});

watch(visible, (open) => {
  if (open) void initialize();
});
</script>

<style scoped lang="scss">
.mine-customization-drawer__body {
  display: flex;
  gap: 24px;
  height: 100%;
  min-height: 0;
}

.mine-customization-drawer__left {
  flex: 0 0 320px;
  min-width: 0;
  overflow: auto;
}

.mine-customization-drawer__right {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.mine-customization-drawer__section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  color: var(--ea-text);
  font-size: 15px;
  font-weight: 700;
}

.mine-customization-drawer__section-title::before {
  content: "";
  flex: 0 0 auto;
  width: 4px;
  height: 16px;
  background: var(--ea-primary);
}

.mine-customization-drawer__right-content {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: 16px;
  border: 1px solid var(--ea-border-color);
  border-radius: 12px;
}

.mine-customization-drawer__tabs {
  :deep(.el-tabs__content) {
    display: none;
  }
}

.mine-customization-drawer__tab-empty {
  display: block;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ea-line1);
  color: var(--ea-text-light2);
  font-size: 13px;
}

.mine-customization-drawer__tree {
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 12px;
  overflow: auto;
}

.mine-customization-drawer__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
