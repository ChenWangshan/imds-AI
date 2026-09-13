export type SystemOption = {
  label: string;
  value: string;
};

export const DEFAULT_SYSTEM_CODE = "integrated";

export const systemOptions: SystemOption[] = [
  { label: "生产调度平台", value: "dispatch" },
  { label: "后台管理系统", value: "admin" },
  { label: "智慧矿山综管平台", value: "integrated" },
  { label: "辅助设备", value: "auxiliary" },
  { label: "矿卡客户端", value: "truck-client" },
];

export function getSystemLabel(value: unknown) {
  return systemOptions.find((item) => item.value === String(value ?? ""))?.label ?? String(value ?? "");
}
