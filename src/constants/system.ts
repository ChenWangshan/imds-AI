export type SystemOption = {
  label: string;
  value: string;
};

export const DEFAULT_SYSTEM_CODE = "integrated";

export const DEFAULT_MENU_VERSION = "5.20.0.0";

export const systemOptions: SystemOption[] = [
  { label: "生产调度平台", value: "dispatch" },
  { label: "后台管理系统", value: "admin" },
  { label: "智慧矿山综管平台", value: "integrated" },
  { label: "辅助设备", value: "auxiliary" },
  { label: "矿卡客户端", value: "truck-client" },
];

export const mineAreaOptions: SystemOption[] = [
  { label: "南露天剥离", value: "南露天剥离" },
  { label: "将一矿", value: "将一矿" },
  { label: "马朗矿", value: "马朗矿" },
  { label: "白石湖矿", value: "白石湖矿" },
  { label: "准东矿", value: "准东矿" },
];

export function getSystemLabel(value: unknown) {
  return systemOptions.find((item) => item.value === String(value ?? ""))?.label ?? String(value ?? "");
}
