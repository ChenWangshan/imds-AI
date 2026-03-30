<template>
  <section class="user-page">
    <EaTablePageWithCurd
      title="用户管理"
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
  createUser as createSystemUser,
  deleteUser as deleteSystemUser,
  fetchUserDetail,
  fetchUserPage,
  updateUser as updateSystemUser,
} from "@/api/systemUser";

type UserFormData = {
  id?: number | string;
  username: string;
  phone: string;
  email: string;
  password: string;
};

const description = ["支持按用户名检索，并通过后端接口完成新增、详情、编辑、删除。"];

function normalizeFormData(data: Partial<UserFormData>) {
  return {
    username: String(data.username ?? "").trim(),
    phone: String(data.phone ?? "").trim(),
    email: String(data.email ?? "").trim(),
    password: String(data.password ?? ""),
  };
}

const queryOptions: IFormOption[] = [
  {
    label: "用户名",
    prop: "username",
    componentAttrs: {
      clearable: true,
      placeholder: "请输入用户名",
    },
  },
];

const userFormOptions: IFormOption[] = [
  {
    label: "用户名",
    prop: "username",
    itemAttrs: {
      rules: [{ required: true, message: "请输入用户名", trigger: "blur" }],
    },
    componentAttrs: {
      clearable: true,
      placeholder: "请输入用户名",
    },
  },
  {
    label: "手机号",
    prop: "phone",
    itemAttrs: {
      rules: [{ required: true, message: "请输入手机号", trigger: "blur" }],
    },
    componentAttrs: {
      clearable: true,
      placeholder: "请输入手机号",
    },
  },
  {
    label: "邮箱",
    prop: "email",
    itemAttrs: {
      rules: [
        { required: true, message: "请输入邮箱", trigger: "blur" },
        { type: "email", message: "请输入正确的邮箱格式", trigger: ["blur", "change"] },
      ],
    },
    componentAttrs: {
      clearable: true,
      placeholder: "请输入邮箱",
    },
  },
  {
    label: "密码",
    prop: "password",
    itemAttrs: {
      rules: [{ required: true, message: "请输入密码", trigger: "blur" }],
    },
    componentAttrs: {
      placeholder: "请输入密码",
      showPassword: true,
      type: "password",
    },
  },
];

const detailOptions: IDetailOption[] = [
  {
    label: "用户名",
    prop: "username",
  },
  {
    label: "手机号",
    prop: "phone",
  },
  {
    label: "邮箱",
    prop: "email",
  },
];

const tableOptions: ITableOption[] = [
  {
    label: "用户名",
    prop: "username",
    itemAttrs: {
      minWidth: 220,
    },
  },
  {
    label: "手机号",
    prop: "phone",
    itemAttrs: {
      minWidth: 220,
    },
  },
  {
    label: "邮箱",
    prop: "email",
    itemAttrs: {
      minWidth: 260,
    },
  },
];

async function getTableData(params: Record<string, unknown>) {
  return fetchUserPage({
    currentPage: Number(params.currentPage ?? 1),
    pageSize: Number(params.pageSize ?? 20),
    username: String(params.username ?? ""),
  });
}

async function getDetailData(row: Record<string, unknown>) {
  return fetchUserDetail(String(row.id));
}

async function createUser(data: Record<string, unknown>) {
  await createSystemUser(normalizeFormData(data));
}

async function updateUser(data: Record<string, unknown>) {
  await updateSystemUser(String(data.id), normalizeFormData(data));
}

async function deleteUser(data: Record<string, unknown>) {
  await deleteSystemUser(String(data.id));
}

const tabOptions: ITablePageWithCurdOption[] = [
  {
    label: "用户列表",
    value: "users",
    queryOptions,
    queryValue: {
      username: "",
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
    getPostData: async () => ({
      username: "",
      phone: "",
      email: "",
      password: "",
    }),
    getPutData: async (row) => {
      const detail = await fetchUserDetail(String(row.id));

      return {
        id: detail.id,
        username: detail.username ?? "",
        phone: detail.phone ?? "",
        email: detail.email ?? "",
        password: detail.password ?? "",
      };
    },
    handlePost: createUser,
    handlePut: updateUser,
    handleDelete: deleteUser,
    postOptions: userFormOptions,
    putOptions: userFormOptions,
    detailOptions,
    disabledConfirmBeforeCancelEdit: false,
  },
];
</script>

<style scoped lang="scss">
.user-page {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  height: 100%;
  width: 100%;
  min-height: 0;
  min-width: 0;
}

.user-page :deep(.EaconComponentsTablePageWithCurd),
.user-page :deep(.EaconComponentsTablePageWithCurdContainer),
.user-page :deep(.EaconComponentsTablePageWithCurdContainerContent),
.user-page :deep(.EaconComponentsTablePageWithCurdContainerRight),
.user-page :deep(.EaconComponentsTablePageWithCurdTable),
.user-page :deep(.EaconComponentsTableContainer) {
  min-height: 0;
  min-width: 0;
}

.user-page :deep(.EaconComponentsTablePageWithCurd) {
  flex: 1 1 auto;
  height: 100%;
}

.user-page :deep(.EaconComponentsTable .el-table__inner-wrapper .cell) {
  white-space: normal;
  word-break: break-all;
  line-height: 22px;
}

.user-page :deep(.EaconComponentsTable .el-table__body .el-table__cell) {
  vertical-align: top;
}

.user-page :deep(.EaconComponentsTable .span) {
  display: block;
  white-space: normal;
  word-break: break-all;
}

.user-page :deep(.EaconComponentsTable .el-scrollbar__bar.is-horizontal) {
  display: flex;
}
</style>
