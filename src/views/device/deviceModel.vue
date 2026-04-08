<template>
  <section class="device-model-page">
    <EaTablePageWithCurd
      title="设备型号"
      :description="description"
      :tab-options="tabOptions"
    />
  </section>
</template>

<script setup lang="ts">
import type {
  IDetailOption,
  IFormOption,
  ITableOption,
  ITablePageWithCurdOption,
} from "eacon-components";

import {
  createDeviceModel,
  deleteDeviceModel,
  fetchDeviceModelDetail,
  fetchDeviceModelPage,
  updateDeviceModel,
} from "@/api/device";

type DeviceModelCategory = "transport" | "loading" | "auxiliary";

type DeviceModelFormData = {
  id?: number | string;
  modelName: string;
  deviceType: string;
  carLength: string;
  carWidth: string;
};

const description = ["对接 device-center-AI 后端，实现设备型号真实分页查询与增删改查。"];

const categoryLabelMap: Record<DeviceModelCategory, string> = {
  auxiliary: "辅助设备型号",
  loading: "采装设备型号",
  transport: "运输设备型号",
};

const deviceTypeOptionsMap: Record<DeviceModelCategory, { label: string; value: string }[]> = {
  auxiliary: [
    { label: "指挥车", value: "指挥车" },
    { label: "洒水车", value: "洒水车" },
    { label: "装载机", value: "装载机" },
    { label: "压路机", value: "压路机" },
  ],
  loading: [{ label: "挖机", value: "挖机" }],
  transport: [
    { label: "无人矿卡", value: "无人矿卡" },
    { label: "有人矿卡", value: "有人矿卡" },
  ],
};

function normalizeFormData(data: Partial<DeviceModelFormData>) {
  return {
    modelName: String(data.modelName ?? "").trim(),
    deviceType: String(data.deviceType ?? "").trim(),
    carLength: Number(data.carLength),
    carWidth: Number(data.carWidth),
  };
}

function isDeviceTypeInCategory(deviceType: string, category: DeviceModelCategory) {
  return deviceTypeOptionsMap[category].some((item) => item.value === deviceType);
}

const queryOptions: IFormOption[] = [
  {
    label: "型号名称",
    prop: "modelName",
    componentAttrs: {
      clearable: true,
      placeholder: "请输入型号名称",
    },
  },
];

function createFormOptions(category: DeviceModelCategory): IFormOption[] {
  return [
    {
      label: "型号名称",
      prop: "modelName",
      itemAttrs: {
        rules: [{ required: true, message: "请输入型号名称", trigger: "blur" }],
      },
      componentAttrs: {
        clearable: true,
        placeholder: "请输入型号名称",
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
        options: deviceTypeOptionsMap[category],
        placeholder: "请选择设备类型",
      },
    },
    {
      label: "车长",
      prop: "carLength",
      itemAttrs: {
        rules: [{ required: true, message: "请输入车长", trigger: "blur" }],
      },
      componentAttrs: {
        clearable: true,
        placeholder: "请输入车长",
      },
    },
    {
      label: "车宽",
      prop: "carWidth",
      itemAttrs: {
        rules: [{ required: true, message: "请输入车宽", trigger: "blur" }],
      },
      componentAttrs: {
        clearable: true,
        placeholder: "请输入车宽",
      },
    },
  ];
}

const detailOptions: IDetailOption[] = [
  {
    label: "型号名称",
    prop: "modelName",
  },
  {
    label: "设备类型",
    prop: "deviceType",
  },
  {
    label: "车长",
    prop: "carLength",
  },
  {
    label: "车宽",
    prop: "carWidth",
  },
];

const tableOptions: ITableOption[] = [
  {
    label: "型号名称",
    prop: "modelName",
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
    label: "车长",
    prop: "carLength",
    itemAttrs: {
      minWidth: 160,
    },
  },
  {
    label: "车宽",
    prop: "carWidth",
    itemAttrs: {
      minWidth: 160,
    },
  },
];

function createTabOption(category: DeviceModelCategory): ITablePageWithCurdOption {
  return {
    label: categoryLabelMap[category],
    value: category,
    queryOptions,
    queryValue: {
      modelName: "",
    },
    tableAttrs: {
      border: false,
    },
    tableButtons: ["detail", "put", "delete"],
    getTableOptions: async () => ({
      data: tableOptions,
    }),
    getTableData: async (params) => {
      const currentPage = Number(params.currentPage ?? 1);
      const pageSize = Number(params.pageSize ?? 20);
      const modelName = String(params.modelName ?? "");

      const response = await fetchDeviceModelPage({
        currentPage: 1,
        pageSize: 1000,
        modelName,
      });

      const filtered = response.data.filter((item) =>
        isDeviceTypeInCategory(item.deviceType, category),
      );

      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;

      return {
        data: filtered.slice(start, end),
        recordsTotal: filtered.length,
      };
    },
    getDetailData: async (row) => fetchDeviceModelDetail(String(row.id)),
    getPostData: async () => ({
      modelName: "",
      deviceType: deviceTypeOptionsMap[category][0]?.value ?? "",
      carLength: "",
      carWidth: "",
    }),
    getPutData: async (row) => {
      const detail = await fetchDeviceModelDetail(String(row.id));

      return {
        id: detail.id,
        modelName: detail.modelName ?? "",
        deviceType: detail.deviceType ?? "",
        carLength: String(detail.carLength ?? ""),
        carWidth: String(detail.carWidth ?? ""),
      };
    },
    handlePost: async (data) => {
      await createDeviceModel(normalizeFormData(data));
    },
    handlePut: async (data) => {
      await updateDeviceModel(String(data.id), normalizeFormData(data));
    },
    handleDelete: async (data) => {
      await deleteDeviceModel(String(data.id));
    },
    postOptions: createFormOptions(category),
    putOptions: createFormOptions(category),
    detailOptions,
    disabledConfirmBeforeCancelEdit: false,
  };
}

const tabOptions: ITablePageWithCurdOption[] = [
  createTabOption("transport"),
  createTabOption("loading"),
  createTabOption("auxiliary"),
];
</script>

<style scoped lang="scss">
.device-model-page {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  height: 100%;
  width: 100%;
  min-height: 0;
  min-width: 0;
}

.device-model-page :deep(.EaconComponentsTablePageWithCurd),
.device-model-page :deep(.EaconComponentsTablePageWithCurdContainer),
.device-model-page :deep(.EaconComponentsTablePageWithCurdContainerContent),
.device-model-page :deep(.EaconComponentsTablePageWithCurdContainerRight),
.device-model-page :deep(.EaconComponentsTablePageWithCurdTable),
.device-model-page :deep(.EaconComponentsTableContainer) {
  min-height: 0;
  min-width: 0;
}

.device-model-page :deep(.EaconComponentsTablePageWithCurd) {
  flex: 1 1 auto;
  height: 100%;
}

.device-model-page :deep(.EaconComponentsTable .el-table__inner-wrapper .cell) {
  white-space: normal;
  word-break: break-all;
  line-height: 22px;
}

.device-model-page :deep(.EaconComponentsTable .el-table__body .el-table__cell) {
  vertical-align: top;
}

.device-model-page :deep(.EaconComponentsTable .span) {
  display: block;
  white-space: normal;
  word-break: break-all;
}

.device-model-page :deep(.EaconComponentsTable .el-scrollbar__bar.is-horizontal) {
  display: flex;
}
</style>
