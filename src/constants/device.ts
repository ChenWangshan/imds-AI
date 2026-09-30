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

/** 菜单管理-「设备类型下拉」分组节点：优先按编码定位，兼容按名称定位 */
export const DEVICE_TYPE_DROPDOWN_MENU_CODE = "device.manage.type-dropdown";
export const DEVICE_TYPE_DROPDOWN_MENU_NAME = "设备类型下拉";

/** 菜单节点（仅取构建下拉所需字段，避免与 api 类型强耦合） */
export type DeviceTypeMenuNode = {
  menuCode: string;
  menuName: string;
  parentMenuCode: string;
  permissionCodes: string;
  sortNo?: number;
};

export function getDeviceTypeLabel(value: unknown) {
  return (
    deviceTypeOptions.find((item) => item.value === String(value ?? ""))?.label ??
    String(value ?? "")
  );
}

function splitPermissionCodes(value: string | null | undefined) {
  return String(value ?? "")
    .split(/[,，\s]+/)
    .map((code) => code.trim())
    .filter(Boolean);
}

/**
 * 按用户权限过滤设备类型下拉项；无权限编码的选项始终展示。
 * 作为菜单未配置时的兜底。
 */
export function getVisibleDeviceTypeOptions(
  hasPermission: (code: string) => boolean,
): DeviceTypeOption[] {
  return deviceTypeOptions.filter((item) => !item.permission || hasPermission(item.permission));
}

/**
 * 由菜单管理「设备类型下拉」节点的子节点生成下拉项：
 * label 取菜单名称，value / 权限编码由前端常量 deviceTypeOptions 按权限编码映射。
 * 仅返回当前用户有权限的项；菜单中无对应权限编码的子节点忽略。
 */
export function buildDeviceTypeOptionsFromMenus(
  menus: DeviceTypeMenuNode[],
  hasPermission: (code: string) => boolean,
): DeviceTypeOption[] {
  const dropdown = menus.find(
    (item) =>
      item.menuCode === DEVICE_TYPE_DROPDOWN_MENU_CODE ||
      item.menuName === DEVICE_TYPE_DROPDOWN_MENU_NAME,
  );
  if (!dropdown) return [];

  const children = menus
    .filter((item) => item.parentMenuCode === dropdown.menuCode)
    .slice()
    .sort(
      (a, b) =>
        Number(a.sortNo ?? 0) - Number(b.sortNo ?? 0) || a.menuName.localeCompare(b.menuName),
    );

  const options: DeviceTypeOption[] = [];
  const seen = new Set<string>();
  children.forEach((child) => {
    splitPermissionCodes(child.permissionCodes).forEach((code) => {
      const matched = deviceTypeOptions.find((item) => item.permission === code);
      if (!matched || seen.has(matched.value)) return;
      if (hasPermission(code)) {
        seen.add(matched.value);
        options.push({ label: child.menuName, value: matched.value, permission: code });
      }
    });
  });

  return options;
}
