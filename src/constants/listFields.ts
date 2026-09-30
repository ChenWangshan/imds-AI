export type ListFieldConfig = {
  /** 表格列 prop，同时作为列显示的唯一标识 */
  key: string;
  /** 菜单管理「列表字段」分组下对应子菜单名称 */
  menuName: string;
  /** 兜底权限编码：菜单子节点未配置 permission_codes 时使用 */
  permission?: string;
};

/** 菜单节点（仅取构建列表字段所需字段，避免与 api 类型强耦合） */
export type ListFieldMenuNode = {
  menuCode: string;
  menuName: string;
  parentMenuCode: string;
  permissionCodes: string;
  sortNo?: number;
};

/** 菜单管理-「列表字段」分组节点：按名称 + 所属父级菜单定位，避免依赖自动生成的菜单编码 */
export const LIST_FIELD_MENU_NAME = "列表字段";
export const DEVICE_MANAGE_MENU_CODE = "device.manage";

/** 设备管理-列表字段配置，需与菜单管理「列表字段」子节点、角色授权保持一致 */
export const deviceListFieldOptions: ListFieldConfig[] = [
  { key: "menuType", menuName: "菜单类型", permission: "device.field.menu-type" },
  { key: "modelCode", menuName: "菜单版本", permission: "device.field.menu-version" },
  { key: "apiBindings", menuName: "API绑定", permission: "device.field.api-bindings" },
];

function splitPermissionCodes(value: string | null | undefined) {
  return String(value ?? "")
    .split(/[,，\s]+/)
    .map((code) => code.trim())
    .filter(Boolean);
}

/**
 * 由菜单管理「列表字段」节点的子节点解析当前用户可见的表格列：
 * 每个子节点的 permission_codes 命中用户权限则展示对应列；
 * 子节点未配置权限编码时回退到前端配置的 permission（菜单未加载时的兜底）。
 */
export function resolveVisibleListFieldKeys(
  menus: ListFieldMenuNode[],
  hasPermission: (code: string) => boolean,
  options: ListFieldConfig[] = deviceListFieldOptions,
  groupName: string = LIST_FIELD_MENU_NAME,
  parentMenuCode: string = DEVICE_MANAGE_MENU_CODE,
): string[] {
  const group = menus.find(
    (item) => item.menuName === groupName && item.parentMenuCode === parentMenuCode,
  );

  const children = group
    ? menus.filter((item) => item.parentMenuCode === group.menuCode)
    : [];

  return options
    .filter((field) => {
      const child = children.find((item) => item.menuName === field.menuName);
      const codes = splitPermissionCodes(child?.permissionCodes);
      const effectiveCodes = codes.length ? codes : field.permission ? [field.permission] : [];
      if (!effectiveCodes.length) return false;
      return effectiveCodes.some((code) => hasPermission(code));
    })
    .map((field) => field.key);
}
