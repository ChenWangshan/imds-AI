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
import { onMounted, reactive } from "vue";
import type {
  IDetailOption,
  IFormOption,
  ITableOption,
  ITablePageWithCurdOption,
} from "eacon-components";

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

const deviceTypeOptions = [
  {
    label: "运输设备",
    value: "运输设备",
  },
  {
    label: "采装设备",
    value: "采装设备",
  },
  {
    label: "辅助设备",
    value: "辅助设备",
  },
];

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
      options: deviceTypeOptions,
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

const tableOptions: ITableOption[] = [
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

const tabOptions: ITablePageWithCurdOption[] = [
  {
    label: "设备列表",
    value: "device-list",
    queryOptions,
    queryValue: {
      deviceCode: "",
    },
    tableAttrs: {
      border: false,
    },
    tableButtons: ["detail", "put", "delete"],
    getTableOptions: async () => ({
      data: tableOptions,
    }),
    getTableData: async (params) =>
      fetchDevicePage({
        currentPage: Number(params.currentPage ?? 1),
        pageSize: Number(params.pageSize ?? 20),
        deviceCode: String(params.deviceCode ?? ""),
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
];

onMounted(() => {
  void loadDeviceModelOptions();
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
