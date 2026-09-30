<template>
  <section class="device-page">
    <EaTablePageWithCurd
      title="设备管理"
      :description="description"
      :tab-options="tabOptions"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type {
  IDetailOption,
  IFormOption,
  ITableOption,
  ITablePageWithCurdOption,
} from "eacon-components";
import SelectV2 from "@/components/SelectV2/SelectV2.vue";
import {
  buildDeviceTypeOptionsFromMenus,
  type DeviceTypeOption,
  getDeviceTypeLabel,
  getVisibleDeviceTypeOptions,
} from "@/constants/device";
import { DEFAULT_MENU_VERSION, DEFAULT_SYSTEM_CODE } from "@/constants/system";
import { resolveVisibleListFieldKeys } from "@/constants/listFields";
import { fetchAllSystemMenus } from "@/api/menuManagement";
import { useAuthStore } from "@/stores/modules/auth";

import {
  createDevice,
  deleteDevice,
  fetchDeviceDetail,
  fetchDeviceModelPage,
  fetchDevicePage,
  updateDevice,
} from "@/api/device";

type DeviceFormData = {
  id?: number | string;
  deviceCode: string;
  deviceType: string;
  organization: string;
  vin: string;
  deviceModel: string;
};

const description = ["对接 device-center-AI 后端，实现设备真实分页查询与增删改查。"];

const authStore = useAuthStore();

/**
 * 设备类型下拉项：来源于菜单管理「设备类型下拉」的子节点，按当前用户权限过滤。
 * 菜单还未加载时先用常量兜底，保证下拉可用。
 */
const visibleDeviceTypeOptions = reactive<DeviceTypeOption[]>(
  getVisibleDeviceTypeOptions(authStore.hasPermission),
);

/**
 * 列表字段可见项：来源于菜单管理「列表字段」的子节点，按当前用户权限过滤。
 * 仅影响表格列的展示（菜单类型 / 菜单版本 / API绑定），不影响数据请求。
 */
const visibleListFieldKeys = ref<string[]>(
  resolveVisibleListFieldKeys([], authStore.hasPermission),
);

async function loadDeviceTypeOptions() {
  try {
    const menus = await fetchAllSystemMenus({
      menuVersion: DEFAULT_MENU_VERSION,
      systemCode: DEFAULT_SYSTEM_CODE,
    });
    const options = buildDeviceTypeOptionsFromMenus(menus, authStore.hasPermission);
    visibleDeviceTypeOptions.splice(0, visibleDeviceTypeOptions.length, ...options);
    visibleListFieldKeys.value = resolveVisibleListFieldKeys(menus, authStore.hasPermission);
  } catch {
    visibleDeviceTypeOptions.splice(
      0,
      visibleDeviceTypeOptions.length,
      ...getVisibleDeviceTypeOptions(authStore.hasPermission),
    );
    visibleListFieldKeys.value = resolveVisibleListFieldKeys([], authStore.hasPermission);
  }
}

async function getDeviceModelOptions() {
  try {
    const response = await fetchDeviceModelPage({
      currentPage: 1,
      pageSize: 200,
    });

    const records = Array.isArray(response.data) ? response.data : [];

    return records.map((item) => ({
      label: item.modelName,
      value: item.modelName,
    }));
  } catch {
    return [];
  }
}

function normalizeFormData(data: Partial<DeviceFormData>) {
  return {
    deviceCode: String(data.deviceCode ?? "").trim(),
    deviceModel: String(data.deviceModel ?? "").trim(),
    deviceType: String(data.deviceType ?? "").trim(),
    organization: String(data.organization ?? "").trim(),
    vin: String(data.vin ?? "").trim(),
  };
}

const queryOptions: IFormOption[] = [
  {
    label: "设备编号",
    prop: "deviceCode",
    componentAttrs: {
      clearable: true,
      placeholder: "请输入设备编号",
    },
  },
  {
    label: "设备类型",
    prop: "deviceType",
    is: SelectV2,
    componentAttrs: {
      options: visibleDeviceTypeOptions,
      clearable: true,
      // multiple: true,
      placeholder: "请选择设备类型",
    },
  },
  // {
  //   label: "设备类型",
  //   prop: "deviceType1",
  //   is: "ea-select",
  //   componentAttrs: {
  //     options: visibleDeviceTypeOptions,
  //     clearable: true,
  //     placeholder: "请选择设备类型",
  //   },
  // },
];

const deviceModelOptions = reactive<{ label: string; value: string }[]>([]);

async function loadDeviceModelOptions() {
  const options = await getDeviceModelOptions();
  deviceModelOptions.splice(0, deviceModelOptions.length, ...options);
}

const deviceFormOptions: IFormOption[] = [
  {
    label: "设备编号",
    prop: "deviceCode",
    itemAttrs: {
      rules: [{ required: true, message: "请输入设备编号", trigger: "blur" }],
    },
    componentAttrs: {
      clearable: true,
      placeholder: "请输入设备编号",
    },
  },
  {
    label: "设备类型",
    prop: "deviceType",
    is: "ea-select",
    itemAttrs: {
      rules: [{ required: true, message: "请选择设备类型", trigger: "change" }],
    },
    componentAttrs: {
      clearable: false,
      options: visibleDeviceTypeOptions,
      placeholder: "请选择设备类型",
    },
  },
  {
    label: "所属组织",
    prop: "organization",
    itemAttrs: {
      rules: [{ required: true, message: "请输入所属组织", trigger: "blur" }],
    },
    componentAttrs: {
      clearable: true,
      placeholder: "请输入所属组织",
    },
  },
  {
    label: "VIN",
    prop: "vin",
    itemAttrs: {
      rules: [{ required: true, message: "请输入VIN", trigger: "blur" }],
    },
    componentAttrs: {
      clearable: true,
      placeholder: "请输入VIN",
    },
  },
  {
    label: "设备型号",
    prop: "deviceModel",
    is: "ea-select",
    itemAttrs: {
      rules: [{ required: true, message: "请选择设备型号", trigger: "change" }],
    },
    componentAttrs: {
      clearable: false,
      options: deviceModelOptions,
      placeholder: "请选择设备型号",
    },
  },
];

const detailOptions: IDetailOption[] = [
  {
    label: "设备编号",
    prop: "deviceCode",
  },
  {
    label: "设备类型",
    prop: "deviceType",
    formatter: (value: unknown) => getDeviceTypeLabel(value),
  },
  {
    label: "所属组织",
    prop: "organization",
  },
  {
    label: "VIN",
    prop: "vin",
  },
  {
    label: "设备型号",
    prop: "deviceModel",
  },
];

const baseTableOptions: ITableOption[] = [
  {
    label: "设备编号",
    prop: "deviceCode",
    itemAttrs: {
      minWidth: 220,
    },
  },
  {
    label: "设备类型",
    prop: "deviceType",
    itemAttrs: {
      minWidth: 220,
      formatter: (_row: unknown, _column: unknown, value: unknown) =>
        getDeviceTypeLabel(value),
    },
  },
  {
    label: "所属组织",
    prop: "organization",
    itemAttrs: {
      minWidth: 220,
    },
  },
  {
    label: "VIN",
    prop: "vin",
    itemAttrs: {
      minWidth: 220,
    },
  },
  {
    label: "设备型号",
    prop: "deviceModel",
    itemAttrs: {
      minWidth: 220,
    },
  },
];

/** 可选列表字段：仅当用户在菜单「列表字段」中被授予对应权限时展示该列 */
const optionalTableOptions: Record<string, ITableOption> = {
  menuType: {
    label: "菜单类型",
    prop: "menuType",
    itemAttrs: {
      minWidth: 160,
    },
  },
  modelCode: {
    label: "菜单版本",
    prop: "modelCode",
    itemAttrs: {
      minWidth: 160,
      showOverflowTooltip: true,
    },
  },
  apiBindings: {
    label: "API绑定",
    prop: "apiBindings",
    itemAttrs: {
      minWidth: 240,
      showOverflowTooltip: true,
    },
  },
};

const tableOptions = computed<ITableOption[]>(() => [
  ...baseTableOptions,
  ...visibleListFieldKeys.value
    .map((key) => optionalTableOptions[key])
    .filter((item): item is ITableOption => Boolean(item)),
]);

const tabOptions = computed<ITablePageWithCurdOption[]>(() => [
  {
    label: "设备列表",
    value: "device-list",
    queryOptions,
    queryValue: {
      deviceCode: "",
      deviceType: "",
    },
    tableAttrs: {
      border: false,
    },
    tableButtons: ["detail", "put", "delete"],
    getTableOptions: async () => ({
      data: tableOptions.value,
    }),
    getTableData: async (params) =>
      fetchDevicePage({
        currentPage: Number(params.currentPage ?? 1),
        pageSize: Number(params.pageSize ?? 20),
        deviceCode: String(params.deviceCode ?? ""),
        deviceType: String(params.deviceType ?? ""),
      }),
    getDetailData: async (row) => fetchDeviceDetail(String(row.id)),
    getPostData: async () => ({
      deviceCode: "",
      deviceModel: "",
      deviceType: "",
      organization: "",
      vin: "",
    }),
    getPutData: async (row) => fetchDeviceDetail(String(row.id)),
    handlePost: async (data) => {
      await createDevice(normalizeFormData(data));
    },
    handlePut: async (data) => {
      await updateDevice(String(data.id), normalizeFormData(data));
    },
    handleDelete: async (data) => {
      await deleteDevice(String(data.id));
    },
    postOptions: deviceFormOptions,
    putOptions: deviceFormOptions,
    detailOptions,
    disabledConfirmBeforeCancelEdit: false,
  },
]);

onMounted(() => {
  void loadDeviceModelOptions();
  void loadDeviceTypeOptions();
});
</script>

<style scoped lang="scss">
.device-page {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  height: 100%;
  width: 100%;
  min-height: 0;
  min-width: 0;
}

.device-page :deep(.EaconComponentsTablePageWithCurd),
.device-page :deep(.EaconComponentsTablePageWithCurdContainer),
.device-page :deep(.EaconComponentsTablePageWithCurdContainerContent),
.device-page :deep(.EaconComponentsTablePageWithCurdContainerRight),
.device-page :deep(.EaconComponentsTablePageWithCurdTable),
.device-page :deep(.EaconComponentsTableContainer) {
  min-height: 0;
  min-width: 0;
}

.device-page :deep(.EaconComponentsTablePageWithCurd) {
  flex: 1 1 auto;
  height: 100%;
}

.device-page :deep(.EaconComponentsTable .el-table__inner-wrapper .cell) {
  white-space: normal;
  word-break: break-all;
  line-height: 22px;
}

.device-page :deep(.EaconComponentsTable .el-table__body .el-table__cell) {
  vertical-align: top;
}

.device-page :deep(.EaconComponentsTable .span) {
  display: block;
  white-space: normal;
  word-break: break-all;
}

.device-page :deep(.EaconComponentsTable .el-scrollbar__bar.is-horizontal) {
  display: flex;
}
</style>
