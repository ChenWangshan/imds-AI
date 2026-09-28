export type DeviceTypeOption = {
  label: string;
  value: string;
  permission?: string;
};

export const DEVICE_TYPE_ENUM = {
  TRANSPORT: "1",
  LOADING: "2",
  AUXILIARY: "3",
} as const;

/**
 * 设备管理-检索区域「设备类型」下拉配置。
 * value 为设备类型枚举值（运输设备=1、装载设备=2、辅助设备=3），与后端保持一致。
 * permission 为对应的权限编码，需与菜单管理的按钮节点、角色授权保持一致。
 */
export const deviceTypeOptions: DeviceTypeOption[] = [
  {
    label: "运输设备",
    value: DEVICE_TYPE_ENUM.TRANSPORT,
    permission: "device.type.transport",
  },
  {
    label: "装载设备",
    value: DEVICE_TYPE_ENUM.LOADING,
    permission: "device.type.loading",
  },
  {
    label: "辅助设备",
    value: DEVICE_TYPE_ENUM.AUXILIARY,
    permission: "device.type.auxiliary",
  },
];

export function getDeviceTypeLabel(value: unknown) {
  return (
    deviceTypeOptions.find((item) => item.value === String(value ?? ""))?.label ??
    String(value ?? "")
  );
}

/**
 * 按用户权限过滤设备类型下拉项；无权限编码的选项始终展示。
 */
export function getVisibleDeviceTypeOptions(
  hasPermission: (code: string) => boolean,
): DeviceTypeOption[] {
  return deviceTypeOptions.filter((item) => !item.permission || hasPermission(item.permission));
}
