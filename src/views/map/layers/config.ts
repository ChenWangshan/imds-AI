import {
  baseLayerDefs,
  jobSiteLayerDefs,
  type StyleMap,
} from "./constants";

export type SubLayerConfig = {
  visible: boolean;
  minzoom: number | null;
  maxzoom: number | null;
  layout: Record<string, unknown>;
  paint: Record<string, unknown>;
  filter?: unknown[];
};

export type LayerStyleConfig = {
  key: string;
  group: "base" | "jobSite";
  label: string;
  /** 全图层预览时是否包含 */
  previewVisible: boolean;
  subLayers: Record<string, SubLayerConfig>;
};

const STORAGE_KEY = "imds-layer-style-configs";

/** 子图层未显式声明时使用的项目约定默认可见层级 */
const DEFAULT_MINZOOM = 0;
const DEFAULT_MAXZOOM = 22;

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const pickNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export function cloneStyleMapToConfig(styleMap: StyleMap): Record<string, SubLayerConfig> {
  const result: Record<string, SubLayerConfig> = {};
  Object.entries(styleMap).forEach(([subKey, entry]) => {
    result[subKey] = {
      visible: true,
      minzoom: pickNumber(entry.minzoom) ?? DEFAULT_MINZOOM,
      maxzoom: pickNumber(entry.maxzoom) ?? DEFAULT_MAXZOOM,
      layout: deepClone(entry.layout || {}),
      paint: deepClone(entry.paint || {}),
      filter: entry.filter ? deepClone(entry.filter) : undefined,
    };
  });
  return result;
}

export function createDefaultConfigs(): LayerStyleConfig[] {
  const configs: LayerStyleConfig[] = [];

  baseLayerDefs.forEach((def) => {
    configs.push({
      key: def.jsonName,
      group: "base",
      label: def.label,
      previewVisible: true,
      subLayers: cloneStyleMapToConfig(def.styleMap),
    });
  });

  jobSiteLayerDefs.forEach((def) => {
    configs.push({
      key: def.key,
      group: "jobSite",
      label: def.label,
      previewVisible: true,
      subLayers: cloneStyleMapToConfig(def.styleMap),
    });
  });

  return configs;
}

/** 加载配置：默认配置与已保存配置合并（按 key 覆盖，新增图层自动补齐） */
export function loadConfigs(): LayerStyleConfig[] {
  const defaults = createDefaultConfigs();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;

    const saved = JSON.parse(raw) as LayerStyleConfig[];
    if (!Array.isArray(saved)) return defaults;

    defaults.forEach((def) => {
      const matched = saved.find(
        (item) => item.key === def.key && item.group === def.group,
      );
      if (matched?.subLayers) {
        Object.entries(matched.subLayers).forEach(([subKey, sub]) => {
          const target = def.subLayers[subKey];
          if (!target) return;
          if (typeof sub?.visible === "boolean") target.visible = sub.visible;
          const savedMinzoom = pickNumber(sub?.minzoom);
          if (savedMinzoom !== null) target.minzoom = savedMinzoom;
          const savedMaxzoom = pickNumber(sub?.maxzoom);
          if (savedMaxzoom !== null) target.maxzoom = savedMaxzoom;
          if (sub?.paint && typeof sub.paint === "object") {
            Object.entries(sub.paint).forEach(([k, v]) => {
              target.paint[k] = v;
            });
          }
          if (sub?.layout && typeof sub.layout === "object") {
            Object.entries(sub.layout).forEach(([k, v]) => {
              target.layout[k] = v;
            });
          }
        });
      }
      if (typeof matched?.previewVisible === "boolean") {
        def.previewVisible = matched.previewVisible;
      }
    });

    return defaults;
  } catch {
    return defaults;
  }
}

export function saveConfigs(configs: LayerStyleConfig[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

/** 导出为可落库 / 供 eq-fleetcmder-web 消费的样式 JSON */
export function exportConfigsJson(configs: LayerStyleConfig[]) {
  const styleMap: Record<string, Record<string, unknown>> = {};

  configs.forEach((config) => {
    const map: Record<string, unknown> = {};
    Object.entries(config.subLayers).forEach(([subKey, sub]) => {
      const entry: Record<string, unknown> = {};
      if (sub.filter) entry.filter = sub.filter;
      if (sub.minzoom != null) entry.minzoom = sub.minzoom;
      if (sub.maxzoom != null) entry.maxzoom = sub.maxzoom;
      if (sub.layout && Object.keys(sub.layout).length) entry.layout = sub.layout;
      if (sub.paint && Object.keys(sub.paint).length) entry.paint = sub.paint;
      map[subKey] = entry;
    });
    styleMap[config.key] = map;
  });

  return JSON.stringify(styleMap, null, 2);
}
