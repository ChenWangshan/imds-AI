<template>
  <section class="layer-page">
    <header class="layer-page__header">
      <div class="layer-page__brand">
        <span class="layer-page__eyebrow">EQ-FLEETCMDER · LAYER STYLE STUDIO</span>
        <h2>图层管理</h2>
        <p>管理 eq-fleetcmder-web 地图监控「基础图层 / 功能区图层」样式，配置完成后支持单图层与全图层预览。</p>
      </div>

      <div class="layer-page__conn">
        <label class="conn-field conn-field--token">
          <span class="conn-field__label">eq-fleet token</span>
          <el-input v-model="conn.token" size="small" type="password" show-password placeholder="8989 控制台 localStorage eq-token" />
        </label>
        <label class="conn-field">
          <span class="conn-field__label">orgId</span>
          <el-input v-model="conn.orgId" size="small" placeholder="组织 ID" />
        </label>
        <label class="conn-field">
          <span class="conn-field__label">userOrgId</span>
          <el-input v-model="conn.userOrgId" size="small" placeholder="用户组织 ID" />
        </label>
        <label class="conn-field">
          <span class="conn-field__label">mapId</span>
          <el-input v-model="conn.mapId" size="small" placeholder="矿区 mapId" clearable />
        </label>
        <el-button class="conn-field__action" size="small" :loading="loadingMines" @click="loadMines">加载矿区</el-button>
      </div>

      <div class="layer-page__actions">
        <span class="layer-page__basemap">
          <el-switch v-model="showBasemap" size="small" @change="onBasemapChange" />
          <em>底图</em>
        </span>
        <el-button size="small" type="primary" :loading="loading" @click="previewFull">
          <el-icon><FullScreen /></el-icon>
          全图层预览
        </el-button>
        <el-button size="small" @click="saveConfigs">
          <el-icon><Check /></el-icon>
          保存配置
        </el-button>
        <el-button size="small" @click="exportJson">
          <el-icon><Download /></el-icon>
          导出 JSON
        </el-button>
      </div>
    </header>

    <div class="layer-page__body">
      <aside class="layer-page__panel layer-page__list">
        <div class="layer-page__panel-head">
          <span>图层</span>
          <span class="layer-page__panel-count">{{ configs.length }}</span>
        </div>
        <el-scrollbar class="layer-page__scroll">
          <div v-for="group in layerGroups" :key="group.label" class="layer-page__group">
            <button type="button" class="layer-page__group-title" @click="toggleGroup(group.label)">
              <el-icon class="layer-page__group-caret" :class="{ 'is-collapsed': collapsedGroups[group.label] }">
                <ArrowDown />
              </el-icon>
              <span class="layer-page__group-label">{{ group.label }}</span>
              <span class="layer-page__group-count">{{ group.items.length }}</span>
            </button>
            <div v-show="!collapsedGroups[group.label]" class="layer-page__group-body">
              <div
                v-for="cfg in group.items"
                :key="`${cfg.group}-${cfg.key}`"
                class="layer-page__layer"
                :class="{ 'is-active': selectedKey === cfg.key }"
              >
                <EaCheckbox v-model="cfg.previewVisible" size="small" @change="onPreviewVisibleChange(cfg)" />
                <button type="button" class="layer-page__layer-main" @click="selectLayer(cfg)">
                  <span class="layer-page__layer-label">{{ cfg.label }}</span>
                  <span class="layer-page__layer-key">{{ cfg.key }}</span>
                </button>
                <el-tooltip content="单图层预览" placement="top">
                  <button type="button" class="layer-page__row-btn" @click="previewSingle(cfg)">
                    <el-icon><VideoPlay /></el-icon>
                  </button>
                </el-tooltip>
                <el-tooltip content="恢复默认样式" placement="top">
                  <button type="button" class="layer-page__row-btn" @click="resetLayer(cfg)">
                    <el-icon><RefreshLeft /></el-icon>
                  </button>
                </el-tooltip>
              </div>
            </div>
          </div>
        </el-scrollbar>
      </aside>

      <main class="layer-page__map">
        <div ref="mapElRef" class="layer-page__map-el"></div>

        <div v-if="!mapReady" class="layer-page__map-overlay">
          <div class="layer-page__map-overlay-card">
            <el-icon class="layer-page__map-overlay-icon"><MapLocation /></el-icon>
            <p>地图引擎初始化中…</p>
          </div>
        </div>

        <div v-else-if="previewMode === 'none'" class="layer-page__map-overlay">
          <div class="layer-page__map-overlay-card">
            <el-icon class="layer-page__map-overlay-icon"><MapLocation /></el-icon>
            <p>配置左侧图层样式后，点击「单图层预览」或「全图层预览」</p>
            <span>图层数据经 /eqfleet 代理实时拉取 eq-fleetcmder-web 网关</span>
          </div>
        </div>

        <div v-loading="loading" class="layer-page__map-loading" />

        <div class="layer-page__map-status">
          <span class="layer-page__map-dot" :class="{ 'is-on': previewMode !== 'none' }" />
          <template v-if="previewMode === 'none'">未预览</template>
          <template v-else-if="previewMode === 'single'">
            单图层预览 · {{ selectedConfig?.label }} · {{ renderedCount }} 个子图层
          </template>
          <template v-else>
            全图层预览 · {{ renderedLayerCount }} 个图层 / {{ renderedCount }} 个子图层
          </template>
        </div>
      </main>

      <aside class="layer-page__panel layer-page__editor">
        <template v-if="selectedConfig">
          <div class="layer-page__panel-head">
            <span>{{ selectedConfig.label }}</span>
            <span class="layer-page__panel-count">{{ selectedConfig.group === "base" ? "基础图层" : "功能区图层" }}</span>
          </div>

          <div class="layer-page__editor-actions">
            <el-button size="small" link type="primary" @click="previewSingle(selectedConfig)">
              <el-icon><VideoPlay /></el-icon>
              预览该图层
            </el-button>
            <el-button size="small" link @click="resetLayer(selectedConfig)">
              <el-icon><RefreshLeft /></el-icon>
              恢复默认
            </el-button>
          </div>

          <el-scrollbar class="layer-page__scroll">
            <el-collapse v-model="openSubLayers">
              <el-collapse-item v-for="(sub, subKey) in selectedConfig.subLayers" :key="String(subKey)" :name="String(subKey)">
                <template #title>
                  <span class="layer-page__sub-title">
                    <i class="layer-page__sub-dot" :class="`is-${subKey}`" />
                    {{ SUB_LAYER_LABEL_MAP[String(subKey)] || String(subKey) }}
                    <em class="layer-page__sub-type">{{ SUB_LAYER_TYPE_MAP[String(subKey)] }}</em>
                  </span>
                </template>

                <div class="layer-page__sub-body">
                  <div class="layer-page__settings">
                    <div class="layer-page__setting">
                      <span class="layer-page__setting-label">显示</span>
                      <el-switch v-model="sub.visible" size="small" @change="touchStyle" />
                    </div>
                    <div class="layer-page__setting">
                      <span class="layer-page__setting-label">最小层级</span>
                      <el-input-number v-model="sub.minzoom" size="small" :min="0" :max="24" :step="1" :controls="false" class="layer-page__zoom-input" @change="touchStyle" />
                    </div>
                    <div class="layer-page__setting">
                      <span class="layer-page__setting-label">最大层级</span>
                      <el-input-number v-model="sub.maxzoom" size="small" :min="0" :max="24" :step="1" :controls="false" class="layer-page__zoom-input" @change="touchStyle" />
                    </div>
                  </div>

                  <div
                    v-for="section in (['paint', 'layout'] as const)"
                    v-show="fieldListOf(sub, section).length"
                    :key="section"
                    class="layer-page__section"
                  >
                    <div class="layer-page__section-head">
                      <span class="layer-page__section-title" :class="`is-${section}`">{{ section }}</span>
                      <i class="layer-page__section-line" />
                      <span class="layer-page__section-count">{{ fieldListOf(sub, section).length }}</span>
                    </div>

                    <div
                      v-for="field in fieldListOf(sub, section)"
                      :key="`${section}-${field.key}`"
                      class="layer-page__field"
                      :class="{ 'is-expression': field.kind === 'expression' }"
                    >
                      <div class="layer-page__field-head">
                        <span class="layer-page__field-key" :title="field.key">{{ field.key }}</span>
                        <template v-if="field.kind === 'expression'">
                          <span class="layer-page__field-tag">表达式</span>
                          <el-button
                            v-if="field.convertible"
                            size="small"
                            link
                            type="primary"
                            @click="convertToFixed(sub, section, field.key)"
                          >
                            改为固定值
                          </el-button>
                        </template>
                      </div>

                      <div class="layer-page__field-control">
                        <el-color-picker
                          v-if="field.kind === 'color'"
                          v-model="sub[section][field.key]"
                          size="small"
                          show-alpha
                          :predefine="PREDEFINED_COLORS"
                          @change="touchStyle"
                        />
                        <el-input-number
                          v-else-if="field.kind === 'number'"
                          v-model="sub[section][field.key]"
                          size="small"
                          :step="field.step"
                          :min="field.min"
                          :controls="false"
                          class="layer-page__field-input"
                          @change="touchStyle"
                        />
                        <el-input
                          v-else-if="field.kind === 'text'"
                          v-model="sub[section][field.key]"
                          size="small"
                          class="layer-page__field-input"
                          @change="touchStyle"
                        />
                        <el-input
                          v-else
                          :model-value="stringifyExpression(field.value)"
                          type="textarea"
                          :rows="2"
                          size="small"
                          class="layer-page__expr-input"
                          @change="(val: string) => onExpressionChange(sub, section, field.key, val)"
                        />
                      </div>
                    </div>
                  </div>

                  <div v-if="sub.filter" class="layer-page__filter">
                    <span class="layer-page__filter-title">filter</span>
                    <code>{{ stringifyExpression(sub.filter) }}</code>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-scrollbar>
        </template>

        <div v-else class="layer-page__editor-empty">
          <el-icon><Collection /></el-icon>
          <p>选择左侧图层</p>
          <span>在此处配置面 / 线 / 注记 / 点等子图层样式</span>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  ArrowDown,
  Check,
  Collection,
  Download,
  FullScreen,
  MapLocation,
  RefreshLeft,
  VideoPlay,
} from "@element-plus/icons-vue";

import EaCheckbox from "@/components/Checkbox/Checkbox.vue";

import {
  baseLayerDefs,
  jobSiteLayerDefs,
  SUB_LAYER_LABEL_MAP,
  SUB_LAYER_TYPE_MAP,
  type StyleMap,
} from "./layers/constants";
import {
  fetchBaseLayerData,
  fetchEqMineList,
  fetchJobSiteLayerData,
  generateBaseLayerDataSource,
  generateJobSiteGeojsonData,
  readStoredEqConnection,
  readStoredEqToken,
  storeEqConnection,
  storeEqToken,
  type EqFleetMine,
  type JobSiteRawItem,
} from "./layers/api";
import {
  cloneStyleMapToConfig,
  createDefaultConfigs,
  exportConfigsJson,
  loadConfigs,
  saveConfigs as persistConfigs,
  type LayerStyleConfig,
  type SubLayerConfig,
} from "./layers/config";
import {
  LayerPreviewMap,
  type FeatureCollection,
  type PreviewItem,
  type PreviewSubLayer,
} from "./layers/preview";

/* ------------------------------ 状态 ------------------------------ */

const mapElRef = ref<HTMLElement | null>(null);
const engine = new LayerPreviewMap();

const mapReady = ref(false);
const loading = ref(false);
const loadingMines = ref(false);
const showBasemap = ref(false);

const conn = reactive({
  token: readStoredEqToken(),
  mapId: "",
  orgId: "",
  userOrgId: "",
});
Object.assign(conn, readStoredEqConnection());

const mines = ref<EqFleetMine[]>([]);

const configs = reactive<LayerStyleConfig[]>(loadConfigs());
const selectedKey = ref<string | null>(null);
const openSubLayers = ref<string[]>([]);
const previewMode = ref<"none" | "single" | "full">("none");

const dataCache = new Map<string, FeatureCollection>();
const previewedKeys = ref<string[]>([]);

const PREDEFINED_COLORS = [
  "#1AB394",
  "#22D6FB",
  "#E46565",
  "#ED9D3B",
  "#273774",
  "#18A59F",
  "#5DC4CE",
  "#3365A4",
  "#5DBBFF",
  "#D9E2F4",
  "#BACE68",
  "#EF9800",
  "#EA9502",
  "#FFD200",
  "#8FC94D",
  "#F7E438",
  "#842B8A",
  "#D19473",
  "#C3963D",
  "#E2F3FF",
];

/* ------------------------------ 图层分组 ------------------------------ */

const layerGroups = computed(() => [
  { label: "基础图层", items: configs.filter((item) => item.group === "base") },
  { label: "功能区图层", items: configs.filter((item) => item.group === "jobSite") },
]);

const collapsedGroups = reactive<Record<string, boolean>>({});

function toggleGroup(label: string) {
  collapsedGroups[label] = !collapsedGroups[label];
}

const selectedConfig = computed(
  () => configs.find((item) => item.key === selectedKey.value) ?? null,
);

const renderedCount = computed(() => {
  if (!selectedConfig && previewMode.value !== "full") return 0;
  if (previewMode.value === "single") {
    return Object.values(selectedConfig.value?.subLayers ?? {}).filter((s) => s.visible).length;
  }
  return configs
    .filter((c) => c.previewVisible)
    .reduce((acc, c) => acc + Object.values(c.subLayers).filter((s) => s.visible).length, 0);
});

const renderedLayerCount = computed(
  () => configs.filter((c) => c.previewVisible && dataCache.has(c.key)).length,
);

/* ------------------------------ 连接配置 ------------------------------ */

watch(
  conn,
  () => {
    storeEqToken(conn.token);
    storeEqConnection({ mapId: conn.mapId, orgId: conn.orgId, userOrgId: conn.userOrgId });
  },
  { deep: true },
);

async function loadMines() {
  if (!conn.token || !conn.orgId) {
    ElMessage.warning("请先填写 eq-fleet token 与 orgId");
    return;
  }
  loadingMines.value = true;
  try {
    const list = await fetchEqMineList({ ...conn, userOrgId: conn.userOrgId || conn.orgId });
    mines.value = list ?? [];
    if (!conn.mapId && list?.length) {
      conn.mapId = String(list[0].mapId);
    }
    ElMessage.success(`获取到 ${list?.length ?? 0} 个矿区`);
  } catch (error) {
    ElMessage.error((error as Error).message || "矿区列表获取失败");
  } finally {
    loadingMines.value = false;
  }
}

function validateConn() {
  if (!conn.token) {
    ElMessage.warning("请填写 eq-fleet token");
    return null;
  }
  if (!conn.mapId) {
    ElMessage.warning("请先选择矿区 mapId（或点击「加载矿区」）");
    return null;
  }
  if (!conn.orgId) {
    ElMessage.warning("请填写 orgId");
    return null;
  }
  return {
    token: conn.token,
    mapId: conn.mapId,
    orgId: conn.orgId,
    userOrgId: conn.userOrgId || conn.orgId,
  };
}

/* ------------------------------ 取数 ------------------------------ */

async function fetchDataForConfig(config: LayerStyleConfig): Promise<FeatureCollection> {
  const connData = validateConn();
  if (!connData) throw new Error("连接参数不完整");

  if (config.group === "base") {
    const def = baseLayerDefs.find((item) => item.jsonName === config.key);
    const data = await fetchBaseLayerData(connData, [config.key]);
    const fc: FeatureCollection = (data?.[config.key] as FeatureCollection) ?? {
      type: "FeatureCollection",
      features: [],
    };
    return generateBaseLayerDataSource(fc, def?.featureType ?? "line");
  }

  const def = jobSiteLayerDefs.find((item) => item.key === config.key);
  if (!def) return { type: "FeatureCollection", features: [] };
  const datas = await fetchJobSiteLayerData(connData, def);
  return generateJobSiteGeojsonData(config.key, datas as JobSiteRawItem[]);
}

async function ensureData(config: LayerStyleConfig) {
  if (dataCache.has(config.key)) return;
  const fc = await fetchDataForConfig(config);
  dataCache.set(config.key, fc);
}

/* ------------------------------ 预览渲染 ------------------------------ */

/** 过滤掉被清空的字段（null / undefined），避免 MapLibre 因非法样式值报错 */
const compactStyle = (record: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(record).filter(([, value]) => value !== null && value !== undefined));

function buildPreviewItems(keys: string[]): PreviewItem[] {
  const items: PreviewItem[] = [];

  keys.forEach((key) => {
    const config = configs.find((item) => item.key === key);
    const data = dataCache.get(key);
    if (!config || !data) return;

    const sourceId = config.group === "base" ? `preview-base-${key}` : `preview-job-${key}`;
    const layers: PreviewSubLayer[] = [];

    Object.entries(config.subLayers).forEach(([subKey, sub]) => {
      if (!sub.visible) return;
      const maplibreType = SUB_LAYER_TYPE_MAP[subKey] as PreviewSubLayer["maplibreType"] | undefined;
      if (!maplibreType) return;

      layers.push({
        id: `${sourceId}-${subKey}`,
        maplibreType,
        def: {
          filter: sub.filter,
          layout: compactStyle(sub.layout),
          paint: compactStyle(sub.paint),
          minzoom: sub.minzoom ?? undefined,
          maxzoom: sub.maxzoom ?? undefined,
        },
      });
    });

    items.push({ sourceId, data, layers });
  });

  return items;
}

function renderCached(keys: string[]) {
  const items = buildPreviewItems(keys);
  engine.render(items);
}

function refreshPreview() {
  if (previewMode.value === "none") return;
  const keys =
    previewMode.value === "single"
      ? selectedKey.value
        ? [selectedKey.value]
        : []
      : configs.filter((c) => c.previewVisible).map((c) => c.key);
  previewedKeys.value = keys;
  renderCached(keys.filter((key) => dataCache.has(key)));
}

let renderTimer: ReturnType<typeof setTimeout> | null = null;
function touchStyle() {
  if (renderTimer) clearTimeout(renderTimer);
  renderTimer = setTimeout(refreshPreview, 260);
}

async function previewSingle(config: LayerStyleConfig) {
  selectLayer(config);
  previewMode.value = "single";
  loading.value = true;
  try {
    await ensureData(config);
    previewedKeys.value = [config.key];
    renderCached([config.key]);
  } catch (error) {
    ElMessage.error((error as Error).message || "图层数据获取失败");
  } finally {
    loading.value = false;
  }
}

async function previewFull() {
  previewMode.value = "full";
  loading.value = true;
  const visibleConfigs = configs.filter((c) => c.previewVisible);
  try {
    await Promise.allSettled(visibleConfigs.map((c) => ensureData(c)));
    previewedKeys.value = visibleConfigs.map((c) => c.key);
    renderCached(previewedKeys.value.filter((key) => dataCache.has(key)));
  } catch (error) {
    ElMessage.error((error as Error).message || "图层数据获取失败");
  } finally {
    loading.value = false;
  }
}

function onPreviewVisibleChange(config: LayerStyleConfig) {
  if (previewMode.value === "full") {
    if (config.previewVisible && !dataCache.has(config.key)) {
      loading.value = true;
      ensureData(config)
        .then(refreshPreview)
        .catch((error) => ElMessage.error((error as Error).message || "图层数据获取失败"))
        .finally(() => {
          loading.value = false;
        });
    } else {
      refreshPreview();
    }
  }
}

/* ------------------------------ 样式编辑 ------------------------------ */

type FieldKind = "color" | "number" | "text" | "expression";

type FieldRow = {
  key: string;
  value: unknown;
  kind: FieldKind;
  step?: number;
  min?: number;
  convertible: boolean;
};

const COLOR_RE = /(^|-)color$|halo-color/;
const isColorKey = (key: string) => COLOR_RE.test(key);

function classifyField(key: string, value: unknown): FieldKind {
  if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
    return "expression";
  }
  // 清空 el-input-number 时会短暂/持久变为 null，需保持原控件类型，避免切换成表达式输入框
  if (value === null || value === undefined) {
    return isColorKey(key) ? "color" : "number";
  }
  if (typeof value === "number") return "number";
  if (typeof value === "string") return isColorKey(key) ? "color" : "text";
  return "expression";
}

const findFirstColor = (expr: unknown): string | null => {
  if (!Array.isArray(expr)) return null;
  for (const item of expr) {
    if (typeof item === "string" && /^(#([0-9a-fA-F]{3,8})|rgba?\(|red|white|black|yellow|blue|green)/.test(item)) {
      return item;
    }
    const nested = findFirstColor(item);
    if (nested) return nested;
  }
  return null;
};

const findLastNumber = (expr: unknown): number | null => {
  if (!Array.isArray(expr)) return null;
  let last: number | null = null;
  for (const item of expr) {
    if (typeof item === "number" && Number.isFinite(item)) last = item;
    if (Array.isArray(item)) {
      const nested = findLastNumber(item);
      if (nested !== null) last = nested;
    }
  }
  return last;
};

function fieldListOf(sub: SubLayerConfig, section: "paint" | "layout"): FieldRow[] {
  const entries = Object.entries(sub[section] ?? {});
  return entries.map(([key, value]) => {
    const kind = classifyField(key, value);
    const row: FieldRow = {
      key,
      value,
      kind,
      convertible: false,
    };

    if (kind === "number") {
      if (key.includes("opacity")) {
        row.step = 0.05;
        row.min = 0;
      } else if (key.includes("width") || key.includes("blur")) {
        row.step = 0.5;
        row.min = 0;
      } else if (key.includes("radius") || key.includes("size")) {
        row.step = 0.5;
        row.min = 0;
      } else {
        row.step = 1;
        row.min = undefined;
      }
    }

    if (kind === "expression") {
      row.convertible = isColorKey(key) ? findFirstColor(value) !== null : findLastNumber(value) !== null;
    }

    return row;
  });
}

function convertToFixed(sub: SubLayerConfig, section: "paint" | "layout", key: string) {
  const value = sub[section][key];
  if (isColorKey(key)) {
    const color = findFirstColor(value);
    if (color) {
      sub[section][key] = color;
      touchStyle();
    }
    return;
  }
  const number = findLastNumber(value);
  if (number !== null) {
    sub[section][key] = number;
    touchStyle();
  }
}

function onExpressionChange(
  sub: SubLayerConfig,
  section: "paint" | "layout",
  key: string,
  text: string,
) {
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed) && typeof parsed !== "object") throw new Error("bad");
    sub[section][key] = parsed;
    touchStyle();
  } catch {
    ElMessage.warning("表达式 JSON 格式不正确，已保留原值");
  }
}

function stringifyExpression(value: unknown) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function selectLayer(config: LayerStyleConfig) {
  selectedKey.value = config.key;
  openSubLayers.value = Object.keys(config.subLayers).slice(0, 2);
}

function resetLayer(config: LayerStyleConfig) {
  const defStyleMap: StyleMap =
    config.group === "base"
      ? baseLayerDefs.find((item) => item.jsonName === config.key)?.styleMap ?? {}
      : jobSiteLayerDefs.find((item) => item.key === config.key)?.styleMap ?? {};
  config.subLayers = cloneStyleMapToConfig(defStyleMap);
  touchStyle();
  ElMessage.success(`${config.label} 已恢复默认样式`);
}

function saveConfigs() {
  persistConfigs(configs);
  ElMessage.success("图层样式配置已保存（本地缓存）");
}

function exportJson() {
  const json = exportConfigsJson(configs);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "layer-style-configs.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------ 地图生命周期 ------------------------------ */

onMounted(async () => {
  await nextTick();
  if (!mapElRef.value) return;
  await engine.init(mapElRef.value, { showBasemap: showBasemap.value });
  mapReady.value = true;
});

onBeforeUnmount(() => {
  engine.destroy();
});

function onBasemapChange(value: boolean | string | number) {
  engine.setBasemap(Boolean(value));
}
</script>

<style scoped lang="scss">
.layer-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 0;
}

/* ---------------- header ---------------- */

.layer-page__header {
  display: flex;
  align-items: center;
  gap: 22px;
  flex-wrap: wrap;
  padding: 16px 20px;
  border: 1px solid var(--ea-border-color);
  border-radius: 18px;
  background: var(--app-panel-bg);
}

.layer-page__brand {
  min-width: 240px;
}

.layer-page__eyebrow {
  display: block;
  font-size: 10px;
  letter-spacing: 0.22em;
  color: var(--ea-primary);
  margin-bottom: 4px;
}

.layer-page__brand h2 {
  margin: 0 0 4px;
  font-size: 20px;
  color: var(--ea-text);
}

.layer-page__brand p {
  margin: 0;
  font-size: 12px;
  color: var(--ea-text-light2);
}

.layer-page__conn {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  flex: 1;
  min-width: 340px;
  flex-wrap: wrap;
}

.conn-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 118px;
  min-width: 0;
}

.conn-field--token {
  flex: 1;
  width: auto;
  min-width: 220px;
}

.conn-field__label {
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ea-text-light2);
}

.conn-field__action {
  margin-left: 2px;
}

.layer-page__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.layer-page__basemap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-right: 4px;
}

.layer-page__basemap em {
  font-style: normal;
  font-size: 12px;
  color: var(--ea-text-light2);
}

/* ---------------- body ---------------- */

.layer-page__body {
  display: grid;
  grid-template-columns: 264px minmax(0, 1fr) 348px;
  gap: 14px;
  flex: 1;
  min-height: 0;
}

.layer-page__panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid var(--ea-border-color);
  border-radius: 18px;
  background: var(--app-panel-bg);
  overflow: hidden;
}

.layer-page__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ea-text);
  border-bottom: 1px solid var(--app-panel-border);
}

.layer-page__panel-count {
  font-size: 11px;
  font-weight: 400;
  color: var(--ea-text-light2);
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--app-panel-bg-soft);
}

.layer-page__scroll {
  flex: 1;
  min-height: 0;

  :deep(.el-scrollbar__view) {
    padding: 8px;
  }
}

/* ---------------- layer list ---------------- */

.layer-page__group {
  margin-bottom: 8px;
}

.layer-page__group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px;
  border: 0;
  background: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--ea-primary);
  text-align: left;

  &:hover {
    background: var(--app-menu-hover);
    border-radius: 8px;
  }
}

.layer-page__group-caret {
  font-size: 13px;
  transition: transform 0.2s ease;

  &.is-collapsed {
    transform: rotate(-90deg);
  }
}

.layer-page__group-label {
  flex: 1;
}

.layer-page__group-count {
  font-size: 12px;
  color: var(--ea-text-light2);
}

.layer-page__group-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 18px;
}

.layer-page__layer {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 6px;
  border-radius: 10px;
  border: 1px solid transparent;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: var(--app-menu-hover);
  }

  &.is-active {
    border-color: var(--ea-primary);
    background: var(--app-menu-active-bg);
  }

  :deep(.el-checkbox) {
    margin-right: 2px;
  }
}

.layer-page__layer-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 2px 0;
  border: 0;
  background: none;
  cursor: pointer;
  text-align: left;
}

.layer-page__layer-label {
  font-size: 13px;
  color: var(--ea-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-page__layer-key {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 10px;
  color: var(--ea-text-light2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-page__row-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: var(--ea-text-light2);
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.15s ease,
    color 0.15s ease,
    background 0.15s ease;

  &:hover,
  &:focus-visible {
    color: var(--ea-primary);
    background: var(--app-accent-soft);
  }
}

.layer-page__layer:hover .layer-page__row-btn,
.layer-page__layer.is-active .layer-page__row-btn,
.layer-page__row-btn:focus-visible {
  opacity: 1;
}

/* ---------------- map ---------------- */

.layer-page__map {
  position: relative;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--ea-border-color);
  border-radius: 18px;
  overflow: hidden;
  background: var(--app-panel-bg-soft);
}

.layer-page__map-el {
  position: absolute;
  inset: 0;
}

.layer-page__map-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  padding: 24px;
  z-index: 3;
}

.layer-page__map-overlay-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-width: 420px;
  padding: 28px 32px;
  border-radius: 16px;
  text-align: center;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  box-shadow: var(--el-box-shadow);
}

.layer-page__map-overlay-icon {
  font-size: 40px;
  color: var(--ea-primary);
  opacity: 0.6;
}

.layer-page__map-overlay p {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.layer-page__map-overlay span {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.layer-page__map-loading {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}

.layer-page__map-status {
  position: absolute;
  left: 14px;
  bottom: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  box-shadow: var(--el-box-shadow-light);
  z-index: 4;
}

.layer-page__map-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ea-text-light2);

  &.is-on {
    background: var(--ea-primary);
    box-shadow: 0 0 8px var(--ea-primary);
  }
}

/* ---------------- editor ---------------- */

.layer-page__editor-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--app-panel-border);
}

.layer-page__editor-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--ea-text-light2);
  padding: 24px;
  text-align: center;
}

.layer-page__editor-empty .el-icon {
  font-size: 36px;
  opacity: 0.5;
}

.layer-page__editor-empty p {
  margin: 0;
  font-size: 14px;
  color: var(--ea-text);
}

.layer-page__editor-empty span {
  font-size: 12px;
}

.layer-page__sub-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ea-text);
}

.layer-page__sub-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ea-primary);

  &.is-line,
  &.is-lineFill,
  &.is-lineBorder,
  &.is-dumpedLine,
  &.is-advancementLine,
  &.is-baseline {
    background: #68bffd;
  }

  &.is-text,
  &.is-circle {
    background: #f7e438;
  }

  &.is-lock,
  &.is-lineArrow,
  &.is-arrow,
  &.is-baselineArrow {
    background: #e46565;
  }
}

.layer-page__sub-type {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-style: normal;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ea-text-light2);
  opacity: 0.7;
}

.layer-page__sub-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 2px 8px;
}

/* ---------------- sub-layer settings ---------------- */

.layer-page__settings {
  display: grid;
  grid-template-columns: 0.8fr 1fr 1fr;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--app-panel-border);
  border-radius: 10px;
  background: var(--app-panel-bg-soft);
}

.layer-page__setting {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.layer-page__setting-label {
  font-size: 11px;
  color: var(--ea-text-light2);
  white-space: nowrap;
}

.layer-page__zoom-input {
  width: 100%;
  border-radius: 6px;

  :deep(.el-input__wrapper) {
    padding: 0 6px;
    min-height: 24px;
  }

  :deep(.el-input__inner) {
    font-size: 12px;
  }
}

/* ---------------- sections ---------------- */

.layer-page__section {
  display: flex;
  flex-direction: column;
}

.layer-page__section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 2px 8px;
}

.layer-page__section-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ea-primary);

  &.is-layout {
    color: #68bffd;
  }
}

.layer-page__section-line {
  flex: 1;
  height: 1px;
  background: var(--app-panel-border);
}

.layer-page__section-count {
  font-size: 10px;
  color: var(--ea-text-light2);
}

/* ---------------- fields ---------------- */

.layer-page__field {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 2px;
  border-bottom: 1px solid var(--app-panel-border);

  &:last-child {
    border-bottom: 0;
  }

  &.is-expression {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }
}

.layer-page__field-head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.layer-page__field-key {
  flex: 1;
  min-width: 0;
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 12px;
  color: var(--ea-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-page__field-tag {
  flex: 0 0 auto;
  font-size: 10px;
  color: #f7e438;
  border: 1px dashed #f7e438;
  border-radius: 4px;
  padding: 0 5px;
  opacity: 0.9;
}

.layer-page__field-control {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 0 0 auto;
}

.is-expression .layer-page__field-control {
  width: 100%;
}

.layer-page__field-input {
  width: 132px;
  border-radius: 6px;

  :deep(.el-input__wrapper) {
    padding: 0 8px;
    min-height: 24px;
    border-radius: 6px;
  }

  :deep(.el-input__inner) {
    font-size: 12px;
  }
}

.layer-page__expr-input {
  width: 100%;

  :deep(.el-textarea__inner) {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 11px;
    line-height: 1.5;
    border-radius: 8px;
  }
}

/* ---------------- filter ---------------- */

.layer-page__filter {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border: 1px dashed var(--app-panel-border);
  border-radius: 10px;
}

.layer-page__filter-title {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 11px;
  color: var(--ea-text-light2);
}

.layer-page__filter code {
  font-size: 10px;
  color: var(--ea-text-light2);
  word-break: break-all;
  line-height: 1.5;
}

/* ---------------- 响应式 ---------------- */

@media (max-width: 1400px) {
  .layer-page__body {
    grid-template-columns: 220px minmax(0, 1fr) 300px;
  }
}

@media (max-width: 1100px) {
  .layer-page__body {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(420px, 1fr) auto;
    overflow-y: auto;
  }

  .layer-page__scroll {
    max-height: 220px;
  }
}
</style>
