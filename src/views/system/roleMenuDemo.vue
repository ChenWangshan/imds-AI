<template>
  <div class="menu-demo">
    <header class="demo-header">
      <div class="demo-header__identity">
        <RouterLink to="/system/role-management" class="back-link">← 返回角色菜单</RouterLink>
        <span class="demo-mark">交互演示 · 本地数据</span>
      </div>
      <div class="demo-header__actions">
        <span class="save-state">{{ saveMessage }}</span>
        <el-button text @click="resetDemo">重置演示数据</el-button>
      </div>
    </header>

    <section class="demo-title">
      <div>
        <p class="eyebrow">角色菜单 / 矿区定制</p>
        <h1>一个基线，按矿区发布差异菜单</h1>
        <p>创建版本、调整菜单、查看差异，再用 mapId 预览实际发版结果。</p>
      </div>
      <div class="release-base">
        <label>当前发版基线</label>
        <div class="release-base__control">
          <el-select v-model="baseCandidate" placeholder="选择已发布基线" style="width: 190px">
            <el-option
              v-for="version in publishedBaselines"
              :key="version.code"
              :label="version.code"
              :value="version.code"
            />
          </el-select>
          <el-button :disabled="baseCandidate === state.activeBaseCode" @click="activateBase">设为基线</el-button>
        </div>
        <small>未定制的矿区自动使用此版本</small>
      </div>
    </section>

    <div class="demo-workspace">
      <aside class="version-panel">
        <div class="panel-heading">
          <div>
            <span class="panel-kicker">01 / 版本</span>
            <h2>菜单版本</h2>
          </div>
          <el-button type="primary" size="small" @click="openVersionDialog">新增版本</el-button>
        </div>

        <el-segmented v-model="versionScope" :options="scopeOptions" class="scope-switch" />
        <el-select
          v-if="versionScope === 'CUSTOM'"
          v-model="mineFilter"
          clearable
          filterable
          placeholder="筛选矿区名称 / mapId"
          class="mine-filter"
        >
          <el-option
            v-for="mine in mines"
            :key="mine.mapId"
            :label="`${mine.name} · ${mine.mapId}`"
            :value="mine.mapId"
          />
        </el-select>

        <div class="version-list">
          <button
            v-for="version in filteredVersions"
            :key="version.code"
            type="button"
            class="version-row"
            :class="{ 'version-row--active': selectedVersionCode === version.code }"
            @click="selectVersion(version)"
          >
            <span class="version-row__top">
              <strong>{{ version.name }}</strong>
              <span class="status-dot" :class="`status-dot--${version.status.toLowerCase()}`" />
            </span>
            <span class="version-row__code">{{ version.code }}</span>
            <span class="version-row__meta">
              {{ version.scope === 'CUSTOM' ? mineLabel(version.mapId) : '通用基线' }}
              <template v-if="version.code === state.activeBaseCode"> · 当前基线</template>
              <template v-else> · {{ version.status === 'PUBLISHED' ? '已发布' : '草稿' }}</template>
            </span>
          </button>
          <div v-if="!filteredVersions.length" class="empty-list">没有符合条件的版本</div>
        </div>
        <p class="panel-footnote">定制版本复制完整菜单快照；后续基线变更不会自动覆盖它。</p>
      </aside>

      <main class="menu-panel">
        <div v-if="selectedVersion" class="menu-panel__inner">
          <div class="panel-heading panel-heading--wide">
            <div>
              <span class="panel-kicker">02 / 菜单维护</span>
              <h2>{{ selectedVersion.name }}</h2>
              <p class="version-context">
                {{ selectedVersion.code }}
                <span>·</span>
                {{ selectedVersion.scope === 'CUSTOM' ? `${mineLabel(selectedVersion.mapId)}（${selectedVersion.mapId}）` : '通用基线' }}
                <template v-if="selectedVersion.baseVersionCode">
                  <span>·</span> 基于 {{ selectedVersion.baseVersionCode }}
                </template>
              </p>
            </div>
            <span class="status-label" :class="`status-label--${selectedVersion.status.toLowerCase()}`">
              {{ selectedVersion.status === 'PUBLISHED' ? '已发布 · 只读' : '草稿 · 可编辑' }}
            </span>
          </div>

          <div class="menu-toolbar">
            <el-select v-model="systemCode" style="width: 170px" aria-label="系统名称">
              <el-option v-for="item in systemOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <div class="menu-toolbar__actions">
              <el-button :disabled="!editable" @click="openMenuEditor()">新增根菜单</el-button>
              <el-button v-if="editable" type="primary" @click="publishVersion">发布版本</el-button>
              <el-button @click="exportCurrent">导出当前版本</el-button>
            </div>
          </div>

          <div class="tree-caption">
            <span>菜单结构</span>
            <span>{{ currentMenus.length }} 个节点 · {{ systemLabel(systemCode) }}</span>
          </div>
          <el-tree
            v-if="menuTree.length"
            :key="`${selectedVersion.code}-${systemCode}`"
            :data="menuTree"
            node-key="id"
            default-expand-all
            :expand-on-click-node="false"
            class="menu-tree"
          >
            <template #default="{ data }">
              <div class="menu-node">
                <div class="menu-node__main">
                  <span class="type-mark" :class="`type-mark--${data.type.toLowerCase()}`">{{ typeLabel(data.type) }}</span>
                  <span class="menu-node__name">{{ data.name }}</span>
                  <span class="menu-node__code">{{ data.code }}</span>
                  <span v-if="!data.enabled" class="muted-tag">已停用</span>
                </div>
                <div v-if="editable" class="menu-node__actions" @click.stop>
                  <el-button v-if="data.type !== 'BUTTON'" text size="small" @click="openMenuEditor(undefined, data)">新增子级</el-button>
                  <el-button text size="small" @click="openMenuEditor(data)">编辑</el-button>
                  <el-button text size="small" type="danger" @click="deleteMenu(data)">删除</el-button>
                </div>
              </div>
            </template>
          </el-tree>
          <div v-else class="tree-empty">
            <strong>这个系统还没有菜单</strong>
            <span>{{ editable ? '从根菜单开始建立结构。' : '此版本未配置该系统菜单。' }}</span>
            <el-button v-if="editable" type="primary" @click="openMenuEditor()">新增根菜单</el-button>
          </div>
        </div>
      </main>

      <aside class="inspect-panel">
        <div class="panel-heading">
          <div>
            <span class="panel-kicker">03 / 核对</span>
            <h2>差异与发版</h2>
          </div>
        </div>
        <el-segmented v-model="inspectorTab" :options="inspectorOptions" class="scope-switch" />

        <div v-if="inspectorTab === 'DIFF'" class="inspector-content">
          <template v-if="selectedVersion?.baseVersionCode">
            <p class="inspector-intro">对比 {{ selectedVersion.baseVersionCode }} · {{ systemLabel(systemCode) }}</p>
            <div class="diff-summary">
              <span><b>{{ diffCounts.added }}</b> 新增</span>
              <span><b>{{ diffCounts.changed }}</b> 修改</span>
              <span><b>{{ diffCounts.removed }}</b> 删除</span>
            </div>
            <div v-if="diffItems.length" class="diff-list">
              <div v-for="item in diffItems" :key="item.key" class="diff-row">
                <span class="diff-sign" :class="`diff-sign--${item.kind.toLowerCase()}`">{{ diffSymbol(item.kind) }}</span>
                <div>
                  <strong>{{ item.name }}</strong>
                  <small>{{ item.code }} · {{ diffDescription(item) }}</small>
                </div>
              </div>
            </div>
            <p v-else class="quiet-note">当前系统与来源版本一致。</p>
          </template>
          <p v-else class="quiet-note">此版本没有来源版本。基线版本可通过“新增版本”基于现有版本复制。</p>
        </div>

        <div v-else class="inspector-content">
          <p class="inspector-intro">输入发版矿区，查看最终命中的菜单版本。</p>
          <label class="field-label">目标矿区</label>
          <el-select v-model="previewMapId" filterable placeholder="选择矿区" style="width: 100%">
            <el-option
              v-for="mine in mines"
              :key="mine.mapId"
              :label="`${mine.name} · ${mine.mapId}`"
              :value="mine.mapId"
            />
          </el-select>
          <div class="resolve-result">
            <span class="resolve-result__eyebrow">{{ resolvedCustom ? '命中矿区定制' : '回退通用基线' }}</span>
            <strong>{{ resolvedVersion?.code || '尚无已发布基线' }}</strong>
            <span>{{ mineLabel(previewMapId) }} · {{ previewMapId }}</span>
            <span>{{ systemLabel(systemCode) }} · {{ resolvedMenus.length }} 个菜单节点</span>
            <span class="fingerprint">演示指纹 {{ resolvedFingerprint }}</span>
          </div>
          <el-button type="primary" class="full-button" :disabled="!resolvedVersion" @click="exportResolved">按匹配结果导出</el-button>
          <p class="quiet-note">只有已发布、且基于当前发版基线的矿区版本会被命中。</p>
        </div>
      </aside>
    </div>

    <el-dialog v-model="versionDialogVisible" title="新增菜单版本" width="500px" destroy-on-close>
      <el-form :model="versionForm" label-position="top" class="dialog-form">
        <el-form-item label="版本类型" required>
          <el-radio-group v-model="versionForm.scope">
            <el-radio-button value="BASE">基线版本</el-radio-button>
            <el-radio-button value="CUSTOM">矿区定制版本</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="versionForm.scope === 'CUSTOM' ? '来源基线版本' : '基于版本'" :required="versionForm.scope === 'CUSTOM'">
          <el-select v-model="versionForm.baseVersionCode" clearable placeholder="选择要复制的版本" style="width: 100%">
            <el-option
              v-for="version in versionFormSources"
              :key="version.code"
              :label="`${version.name} · ${version.code}`"
              :value="version.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="versionForm.scope === 'CUSTOM'" label="定制矿区" required>
          <el-select v-model="versionForm.mapId" filterable placeholder="搜索矿区名称或 mapId" style="width: 100%">
            <el-option
              v-for="mine in mines"
              :key="mine.mapId"
              :label="`${mine.name} · ${mine.mapId}`"
              :value="mine.mapId"
            />
          </el-select>
          <small v-if="versionForm.mapId" class="form-hint">匹配标识 mapId：{{ versionForm.mapId }}</small>
        </el-form-item>
        <el-form-item label="菜单版本号" required>
          <el-input v-model="versionForm.code" maxlength="80" placeholder="例如 5.21.0.0-mine-008" />
        </el-form-item>
        <el-form-item label="版本名称" required>
          <el-input v-model="versionForm.name" maxlength="120" placeholder="便于识别的版本名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="versionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createVersion">创建并进入菜单</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="menuDrawerVisible" :title="menuForm.id ? '编辑菜单节点' : '新增菜单节点'" size="480px" destroy-on-close>
      <el-form :model="menuForm" label-position="top" class="dialog-form">
        <el-form-item label="所属系统"><el-input :model-value="systemLabel(systemCode)" disabled /></el-form-item>
        <el-form-item label="父级菜单">
          <el-select v-model="menuForm.parentCode" clearable placeholder="不选则为根菜单" style="width: 100%">
            <el-option v-for="item in parentOptions" :key="item.code" :label="`${item.name} · ${item.code}`" :value="item.code" />
          </el-select>
        </el-form-item>
        <div class="form-grid">
          <el-form-item label="菜单类型" required>
            <el-select v-model="menuForm.type" style="width: 100%">
              <el-option label="目录" value="DIRECTORY" />
              <el-option label="菜单" value="MENU" />
              <el-option label="按钮" value="BUTTON" />
            </el-select>
          </el-form-item>
          <el-form-item label="排序"><el-input-number v-model="menuForm.sortNo" :min="0" :max="9999" controls-position="right" style="width: 100%" /></el-form-item>
        </div>
        <el-form-item label="菜单编码" required><el-input v-model="menuForm.code" placeholder="例如 system.menu.export" /></el-form-item>
        <div class="form-grid">
          <el-form-item label="中文名称" required><el-input v-model="menuForm.name" /></el-form-item>
          <el-form-item label="英文名称"><el-input v-model="menuForm.nameEn" /></el-form-item>
        </div>
        <el-form-item label="路由地址"><el-input v-model="menuForm.routePath" placeholder="例如 /system/menu" /></el-form-item>
        <el-form-item label="组件路径"><el-input v-model="menuForm.componentPath" placeholder="例如 @/views/system/menu.vue" /></el-form-item>
        <el-form-item label="权限编码"><el-input v-model="menuForm.permissionCodes" placeholder="多个权限用逗号分隔" /></el-form-item>
        <el-form-item label="API 绑定"><el-input v-model="menuForm.apiBindings" type="textarea" :rows="2" placeholder="例如 GET /api/system/menus" /></el-form-item>
        <div class="form-grid form-grid--switches">
          <el-form-item label="菜单可见"><el-switch v-model="menuForm.visible" /></el-form-item>
          <el-form-item label="启用"><el-switch v-model="menuForm.enabled" /></el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="menuDrawerVisible = false">取消</el-button>
        <el-button type="primary" @click="saveMenu">保存草稿</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { systemOptions } from "@/constants/system";

type Scope = "BASE" | "CUSTOM";
type Status = "DRAFT" | "PUBLISHED";
type MenuType = "DIRECTORY" | "MENU" | "BUTTON";
type Mine = { mapId: string; name: string };
type MenuItem = {
  id: string;
  systemCode: string;
  parentCode: string;
  code: string;
  name: string;
  nameEn: string;
  type: MenuType;
  routePath: string;
  componentPath: string;
  permissionCodes: string;
  apiBindings: string;
  sortNo: number;
  visible: boolean;
  enabled: boolean;
};
type MenuNode = MenuItem & { children: MenuNode[] };
type MenuVersion = {
  code: string;
  name: string;
  scope: Scope;
  status: Status;
  baseVersionCode: string;
  mapId: string;
  mineName: string;
  createdAt: string;
  publishedAt: string;
  menus: MenuItem[];
};
type DemoState = { activeBaseCode: string; versions: MenuVersion[] };
type DiffKind = "ADDED" | "CHANGED" | "REMOVED";
type DiffItem = { key: string; code: string; name: string; kind: DiffKind; fields: string[] };

const STORAGE_KEY = "imds-role-menu-demo-v1";
const mines: Mine[] = [
  { mapId: "MINE-001", name: "南露天剥离" },
  { mapId: "MINE-002", name: "将一矿" },
  { mapId: "MINE-003", name: "马朗矿" },
  { mapId: "MINE-004", name: "白石湖矿" },
  { mapId: "MINE-005", name: "准东矿" },
  ...Array.from({ length: 27 }, (_, index) => ({
    mapId: `MINE-${String(index + 6).padStart(3, "0")}`,
    name: `示例矿区 ${String(index + 6).padStart(2, "0")}`,
  })),
];
const scopeOptions = [
  { label: "基线版本", value: "BASE" },
  { label: "矿区定制", value: "CUSTOM" },
];
const inspectorOptions = [
  { label: "与基线比较", value: "DIFF" },
  { label: "发版匹配", value: "RESOLVE" },
];
const comparedFields: { key: keyof MenuItem; label: string }[] = [
  { key: "name", label: "中文名称" },
  { key: "nameEn", label: "英文名称" },
  { key: "type", label: "类型" },
  { key: "parentCode", label: "父级菜单" },
  { key: "routePath", label: "路由" },
  { key: "componentPath", label: "组件" },
  { key: "permissionCodes", label: "权限" },
  { key: "apiBindings", label: "API" },
  { key: "sortNo", label: "排序" },
  { key: "visible", label: "可见性" },
  { key: "enabled", label: "启用状态" },
];

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function seedMenus(): MenuItem[] {
  const defaults: Pick<MenuItem, "nameEn" | "routePath" | "componentPath" | "permissionCodes" | "apiBindings" | "visible" | "enabled"> = {
    nameEn: "", routePath: "", componentPath: "", permissionCodes: "", apiBindings: "", visible: true, enabled: true,
  };
  const row = (systemCode: string, parentCode: string, code: string, name: string, type: MenuType, sortNo: number, extra: Partial<MenuItem> = {}): MenuItem => ({
    ...defaults, id: makeId(), systemCode, parentCode, code, name, type, sortNo, ...extra,
  });
  return [
    row("integrated", "", "home", "首页", "MENU", 10, { nameEn: "Home", routePath: "/home", permissionCodes: "home.view" }),
    row("integrated", "", "production", "生产管理", "DIRECTORY", 100, { nameEn: "Production", permissionCodes: "production.view" }),
    row("integrated", "production", "production.blending", "配矿计划", "MENU", 110, { nameEn: "Blending Plan", routePath: "/production/blending-plan", permissionCodes: "production.blending.view" }),
    row("integrated", "production.blending", "production.blending.export", "导出计划", "BUTTON", 111, { permissionCodes: "production.blending.export", apiBindings: "GET /api/blending-plans/export" }),
    row("integrated", "", "device", "设备管理", "DIRECTORY", 200, { nameEn: "Devices", permissionCodes: "device.view" }),
    row("integrated", "device", "device.manage", "设备列表", "MENU", 210, { nameEn: "Device List", routePath: "/device/manage", permissionCodes: "device.manage.view" }),
    row("integrated", "device.manage", "device.manage.create", "新增设备", "BUTTON", 211, { permissionCodes: "device.manage.create", apiBindings: "POST /api/devices" }),
    row("integrated", "", "system", "系统管理", "DIRECTORY", 900, { nameEn: "System", permissionCodes: "system.view" }),
    row("integrated", "system", "system.menu", "角色菜单", "MENU", 910, { nameEn: "Role Menu", routePath: "/system/role-management", permissionCodes: "system.menu.view" }),
    row("dispatch", "", "dispatch", "智能调度", "DIRECTORY", 10, { nameEn: "Dispatch", permissionCodes: "dispatch.view" }),
    row("dispatch", "dispatch", "dispatch.map", "地图监控", "MENU", 20, { nameEn: "Map Monitor", routePath: "/dispatch/map-monitor", permissionCodes: "dispatch.map.view" }),
    row("admin", "", "admin", "后台管理", "DIRECTORY", 10, { nameEn: "Administration", permissionCodes: "admin.view" }),
    row("admin", "admin", "admin.audit", "操作审计", "MENU", 20, { nameEn: "Audit", routePath: "/admin/audit", permissionCodes: "admin.audit.view" }),
  ];
}

function initialState(): DemoState {
  const baseMenus = seedMenus();
  const customMenus = structuredClone(baseMenus).map((item) => ({ ...item, id: makeId() }));
  const device = customMenus.find((item) => item.code === "device.manage");
  if (device) device.name = "南露天设备台账";
  customMenus.push({
    id: makeId(), systemCode: "integrated", parentCode: "device.manage", code: "device.manage.local-report",
    name: "矿区设备报表", nameEn: "Mine Device Report", type: "BUTTON", routePath: "", componentPath: "",
    permissionCodes: "device.manage.local-report", apiBindings: "GET /api/devices/report", sortNo: 212, visible: true, enabled: true,
  });
  const now = new Date().toISOString();
  return {
    activeBaseCode: "5.20.0.0",
    versions: [
      { code: "5.20.0.0", name: "5.20.0.0 通用基线", scope: "BASE", status: "PUBLISHED", baseVersionCode: "", mapId: "", mineName: "", createdAt: now, publishedAt: now, menus: baseMenus },
      { code: "5.20.0.0-mine-001", name: "南露天菜单定制", scope: "CUSTOM", status: "PUBLISHED", baseVersionCode: "5.20.0.0", mapId: "MINE-001", mineName: "南露天剥离", createdAt: now, publishedAt: now, menus: customMenus },
    ],
  };
}

function readState(): DemoState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as DemoState;
    if (Array.isArray(parsed.versions) && parsed.versions.length && typeof parsed.activeBaseCode === "string") return parsed;
  } catch {
    // Corrupt demo data is replaced with a fresh local example.
  }
  return initialState();
}

const state = reactive<DemoState>(readState());
const selectedVersionCode = ref(state.activeBaseCode);
const baseCandidate = ref(state.activeBaseCode);
const versionScope = ref<Scope>("BASE");
const mineFilter = ref("");
const systemCode = ref("integrated");
const inspectorTab = ref<"DIFF" | "RESOLVE">("DIFF");
const previewMapId = ref("MINE-001");
const saveMessage = ref("已保存在此浏览器");
const versionDialogVisible = ref(false);
const menuDrawerVisible = ref(false);
const versionForm = reactive({ scope: "CUSTOM" as Scope, baseVersionCode: "", mapId: "", code: "", name: "" });
const emptyMenu = (): MenuItem => ({
  id: "", systemCode: "integrated", parentCode: "", code: "", name: "", nameEn: "", type: "MENU",
  routePath: "", componentPath: "", permissionCodes: "", apiBindings: "", sortNo: 100,
  visible: true, enabled: true,
});
const menuForm = reactive<MenuItem>(emptyMenu());

watch(state, () => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  saveMessage.value = `已保存于 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
}, { deep: true });

const selectedVersion = computed(() => state.versions.find((item) => item.code === selectedVersionCode.value));
const editable = computed(() => selectedVersion.value?.status === "DRAFT");
const publishedBaselines = computed(() => state.versions.filter((item) => item.scope === "BASE" && item.status === "PUBLISHED"));
const filteredVersions = computed(() => state.versions
  .filter((item) => item.scope === versionScope.value && (versionScope.value === "BASE" || !mineFilter.value || item.mapId === mineFilter.value))
  .slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
const versionFormSources = computed(() => state.versions.filter((item) => item.scope === "BASE" && (versionForm.scope === "BASE" || item.status === "PUBLISHED")));
const currentMenus = computed(() => selectedVersion.value?.menus.filter((item) => item.systemCode === systemCode.value) ?? []);

function buildTree(items: MenuItem[]): MenuNode[] {
  const nodes = new Map(items.map((item) => [item.code, { ...item, children: [] as MenuNode[] }]));
  const roots: MenuNode[] = [];
  [...items].sort((a, b) => a.sortNo - b.sortNo || a.code.localeCompare(b.code)).forEach((item) => {
    const node = nodes.get(item.code)!;
    const parent = nodes.get(item.parentCode);
    if (parent && parent.code !== node.code) parent.children.push(node);
    else roots.push(node);
  });
  return roots;
}

const menuTree = computed(() => buildTree(currentMenus.value));
const parentOptions = computed(() => currentMenus.value.filter((item) => {
  if (item.type === "BUTTON" || item.id === menuForm.id) return false;
  let parentCode = item.parentCode;
  while (parentCode) {
    if (parentCode === menuForm.code) return false;
    parentCode = currentMenus.value.find((candidate) => candidate.code === parentCode)?.parentCode ?? "";
  }
  return true;
}));

const diffItems = computed<DiffItem[]>(() => {
  const version = selectedVersion.value;
  if (!version?.baseVersionCode) return [];
  const base = state.versions.find((item) => item.code === version.baseVersionCode);
  if (!base) return [];
  const before = new Map(base.menus.filter((item) => item.systemCode === systemCode.value).map((item) => [item.code, item]));
  const after = new Map(currentMenus.value.map((item) => [item.code, item]));
  const result: DiffItem[] = [];
  after.forEach((item, code) => {
    const old = before.get(code);
    if (!old) result.push({ key: `add-${code}`, code, name: item.name, kind: "ADDED", fields: [] });
    else {
      const fields = comparedFields.filter((field) => item[field.key] !== old[field.key]).map((field) => field.label);
      if (fields.length) result.push({ key: `change-${code}`, code, name: item.name, kind: "CHANGED", fields });
    }
  });
  before.forEach((item, code) => {
    if (!after.has(code)) result.push({ key: `remove-${code}`, code, name: item.name, kind: "REMOVED", fields: [] });
  });
  return result.sort((a, b) => a.code.localeCompare(b.code));
});
const diffCounts = computed(() => ({
  added: diffItems.value.filter((item) => item.kind === "ADDED").length,
  changed: diffItems.value.filter((item) => item.kind === "CHANGED").length,
  removed: diffItems.value.filter((item) => item.kind === "REMOVED").length,
}));
const resolvedCustom = computed(() => state.versions.filter((item) =>
  item.scope === "CUSTOM" && item.status === "PUBLISHED" && item.baseVersionCode === state.activeBaseCode && item.mapId === previewMapId.value,
).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0]);
const resolvedVersion = computed(() => resolvedCustom.value ?? state.versions.find((item) => item.code === state.activeBaseCode && item.status === "PUBLISHED"));
const resolvedMenus = computed(() => resolvedVersion.value?.menus.filter((item) => item.systemCode === systemCode.value) ?? []);
const resolvedFingerprint = computed(() => fingerprint(resolvedMenus.value));

function mineLabel(mapId: string) { return mines.find((item) => item.mapId === mapId)?.name ?? mapId; }
function systemLabel(code: string) { return systemOptions.find((item) => item.value === code)?.label ?? code; }
function typeLabel(type: MenuType) { return ({ DIRECTORY: "目录", MENU: "菜单", BUTTON: "按钮" })[type]; }
function diffSymbol(kind: DiffKind) { return ({ ADDED: "+", CHANGED: "~", REMOVED: "−" })[kind]; }
function diffDescription(item: DiffItem) { return item.kind === "CHANGED" ? item.fields.join("、") : item.kind === "ADDED" ? "新增节点" : "删除节点"; }

function selectVersion(version: MenuVersion) {
  selectedVersionCode.value = version.code;
  versionScope.value = version.scope;
  if (version.scope === "CUSTOM") mineFilter.value = version.mapId;
}

function openVersionDialog() {
  Object.assign(versionForm, { scope: "CUSTOM", baseVersionCode: state.activeBaseCode, mapId: "", code: "", name: "" });
  versionDialogVisible.value = true;
}

function createVersion() {
  const code = versionForm.code.trim();
  const name = versionForm.name.trim();
  const source = state.versions.find((item) => item.code === versionForm.baseVersionCode);
  if (!/^[A-Za-z0-9._-]+$/.test(code)) return ElMessage.warning("版本号仅支持字母、数字、点、短横线和下划线");
  if (state.versions.some((item) => item.code === code)) return ElMessage.warning("版本号已存在");
  if (!name) return ElMessage.warning("请输入版本名称");
  if (versionForm.scope === "CUSTOM") {
    if (!source || source.scope !== "BASE" || source.status !== "PUBLISHED") return ElMessage.warning("请选择已发布的来源基线");
    if (!versionForm.mapId) return ElMessage.warning("请选择定制矿区");
  }
  if (versionForm.baseVersionCode && !source) return ElMessage.warning("来源版本不存在");
  state.versions.push({
    code, name, scope: versionForm.scope, status: "DRAFT", baseVersionCode: versionForm.baseVersionCode,
    mapId: versionForm.scope === "CUSTOM" ? versionForm.mapId : "",
    mineName: versionForm.scope === "CUSTOM" ? mineLabel(versionForm.mapId) : "",
    createdAt: new Date().toISOString(), publishedAt: "",
    menus: source ? source.menus.map((item) => ({ ...item, id: makeId() })) : [],
  });
  selectVersion(state.versions[state.versions.length - 1]);
  systemCode.value = "integrated";
  versionDialogVisible.value = false;
  ElMessage.success("版本已创建，可开始编辑菜单");
}

function openMenuEditor(item?: MenuItem, parent?: MenuItem) {
  if (!editable.value) return;
  Object.assign(menuForm, emptyMenu(), item ? { ...item } : {
    id: "", systemCode: systemCode.value, parentCode: parent?.code ?? "",
    type: parent?.type === "MENU" ? "BUTTON" : "MENU",
    sortNo: currentMenus.value.length ? Math.max(...currentMenus.value.map((row) => row.sortNo)) + 10 : 10,
  });
  menuDrawerVisible.value = true;
}

function saveMenu() {
  const version = selectedVersion.value;
  if (!version || !editable.value) return;
  const code = menuForm.code.trim();
  const name = menuForm.name.trim();
  if (!code || !name) return ElMessage.warning("请填写菜单编码和中文名称");
  if (!/^[A-Za-z0-9._-]+$/.test(code)) return ElMessage.warning("菜单编码格式不正确");
  if (version.menus.some((item) => item.systemCode === systemCode.value && item.code === code && item.id !== menuForm.id)) return ElMessage.warning("当前系统下菜单编码已存在");
  if (menuForm.parentCode && !currentMenus.value.some((item) => item.code === menuForm.parentCode && item.type !== "BUTTON")) return ElMessage.warning("请选择有效的父级菜单");
  const previous = version.menus.find((item) => item.id === menuForm.id);
  if (previous && menuForm.type === "BUTTON" && currentMenus.value.some((item) => item.parentCode === previous.code)) return ElMessage.warning("含有子节点的菜单不能改为按钮");
  const payload = { ...menuForm, id: menuForm.id || makeId(), systemCode: systemCode.value, code, name };
  if (previous) {
    const oldCode = previous.code;
    Object.assign(previous, payload);
    if (oldCode !== code) version.menus.forEach((item) => {
      if (item.systemCode === systemCode.value && item.parentCode === oldCode) item.parentCode = code;
    });
  } else version.menus.push(payload);
  menuDrawerVisible.value = false;
  ElMessage.success("菜单草稿已保存");
}

async function deleteMenu(item: MenuItem) {
  const version = selectedVersion.value;
  if (!version || !editable.value) return;
  const codes = new Set([item.code]);
  let size = 0;
  while (codes.size !== size) {
    size = codes.size;
    version.menus.filter((row) => row.systemCode === systemCode.value && codes.has(row.parentCode)).forEach((row) => codes.add(row.code));
  }
  try {
    await ElMessageBox.confirm(`将删除「${item.name}」及其 ${codes.size - 1} 个子节点。`, "删除菜单", { type: "warning" });
  } catch { return; }
  version.menus = version.menus.filter((row) => row.systemCode !== systemCode.value || !codes.has(row.code));
  ElMessage.success("菜单节点已删除");
}

async function publishVersion() {
  const version = selectedVersion.value;
  if (!version || version.status !== "DRAFT") return;
  if (!version.menus.length) return ElMessage.warning("空菜单版本不可发布");
  if (version.scope === "CUSTOM" && !state.versions.some((item) => item.code === version.baseVersionCode && item.status === "PUBLISHED")) return ElMessage.warning("来源基线需要先发布");
  const codes = new Set(version.menus.map((item) => `${item.systemCode}::${item.code}`));
  const broken = version.menus.find((item) => item.parentCode && !codes.has(`${item.systemCode}::${item.parentCode}`));
  if (broken) return ElMessage.warning(`菜单「${broken.name}」的父级不存在`);
  try {
    await ElMessageBox.confirm("发布后版本将锁定；后续调整需复制为新草稿。", "发布菜单版本", { type: "warning" });
  } catch { return; }
  version.status = "PUBLISHED";
  version.publishedAt = new Date().toISOString();
  ElMessage.success(version.scope === "CUSTOM" && version.baseVersionCode === state.activeBaseCode ? "已发布，mapId 匹配立即生效" : "版本已发布");
}

async function activateBase() {
  const candidate = state.versions.find((item) => item.code === baseCandidate.value && item.scope === "BASE" && item.status === "PUBLISHED");
  if (!candidate) return ElMessage.warning("请选择已发布的基线版本");
  try {
    await ElMessageBox.confirm("切换基线后，基于旧基线的矿区定制将不再命中，直到基于新基线创建并发布对应版本。", "切换发版基线", { type: "warning" });
  } catch { baseCandidate.value = state.activeBaseCode; return; }
  state.activeBaseCode = candidate.code;
  ElMessage.success("发版基线已切换");
}

function fingerprint(menus: MenuItem[]) {
  const canonical = JSON.stringify([...menus].sort((a, b) => a.code.localeCompare(b.code)).map(({ id, ...item }) => item));
  let value = 2166136261;
  for (let i = 0; i < canonical.length; i += 1) value = Math.imul(value ^ canonical.charCodeAt(i), 16777619);
  return `demo:${(value >>> 0).toString(16).padStart(8, "0")}`;
}

function downloadVersion(version: MenuVersion, mapId: string, matchedBy: "CUSTOM" | "BASE" | "DIRECT") {
  const menus = version.menus.filter((item) => item.systemCode === systemCode.value).map(({ id, ...item }) => item);
  const payload = {
    packageType: "role-menu-demo", packageVersion: "demo-1.0", exportedAt: new Date().toISOString(),
    sourceSystem: "imds-AI-local-demo", mapId, mineName: mapId ? mineLabel(mapId) : "",
    matchedBy, activeBaseVersion: state.activeBaseCode, menuVersion: version.code,
    baseVersion: version.baseVersionCode, systemCode: systemCode.value, snapshotHash: fingerprint(version.menus.filter((item) => item.systemCode === systemCode.value)), menus,
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `menu-demo-${version.code}-${mapId || systemCode.value}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  ElMessage.success("演示菜单包已导出");
}

function exportCurrent() {
  if (selectedVersion.value) downloadVersion(selectedVersion.value, selectedVersion.value.mapId, "DIRECT");
}
function exportResolved() {
  if (resolvedVersion.value) downloadVersion(resolvedVersion.value, previewMapId.value, resolvedCustom.value ? "CUSTOM" : "BASE");
}

async function resetDemo() {
  try { await ElMessageBox.confirm("这会清除本浏览器中的演示修改，恢复示例版本。", "重置演示数据", { type: "warning" }); }
  catch { return; }
  Object.assign(state, initialState());
  selectedVersionCode.value = state.activeBaseCode;
  baseCandidate.value = state.activeBaseCode;
  versionScope.value = "BASE";
  mineFilter.value = "";
  ElMessage.success("演示数据已重置");
}
</script>

<style scoped lang="scss">
.menu-demo { min-height: 100dvh; padding: 0 32px 32px; background: var(--ea-fill-color); color: var(--ea-text-light); }
.demo-header { min-height: 66px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--ea-border-color); gap: 16px; }
.demo-header__identity, .demo-header__actions { display: flex; align-items: center; gap: 18px; }
.back-link { color: var(--ea-text-light); text-decoration: none; font-weight: 650; }
.back-link:hover { color: var(--ea-primary); }
.demo-mark { padding: 5px 9px; border-radius: 6px; background: var(--ea-fill-color3); color: var(--ea-text-light2); font-size: 12px; }
.save-state { color: var(--ea-text-light2); font-size: 12px; }
.demo-title { display: flex; justify-content: space-between; align-items: flex-end; gap: 32px; padding: 34px 0 28px; }
.eyebrow, .panel-kicker { margin: 0 0 9px; color: var(--ea-primary); font-size: 11px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
h1 { margin: 0; color: var(--ea-text); font-size: clamp(25px, 3vw, 37px); line-height: 1.2; letter-spacing: -.03em; }
.demo-title p:last-child { margin: 10px 0 0; color: var(--ea-text-light2); font-size: 14px; }
.release-base { min-width: 285px; display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
.release-base label, .field-label { color: var(--ea-text-light2); font-size: 12px; font-weight: 700; }
.release-base__control { display: flex; gap: 8px; }
.release-base small { color: var(--ea-text-light2); font-size: 11px; }
.demo-workspace { display: grid; grid-template-columns: 262px minmax(430px, 1fr) 296px; min-height: 640px; border: 1px solid var(--ea-border-color); background: var(--ea-fill-color5); border-radius: 14px; overflow: hidden; }
.version-panel, .inspect-panel { padding: 23px 18px; min-width: 0; }
.version-panel { border-right: 1px solid var(--ea-border-color); }
.inspect-panel { border-left: 1px solid var(--ea-border-color); }
.menu-panel { min-width: 0; }
.menu-panel__inner { padding: 23px 25px 36px; }
.panel-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 22px; }
.panel-heading h2 { margin: 0; color: var(--ea-text); font-size: 18px; line-height: 1.3; letter-spacing: -.015em; }
.panel-heading--wide { align-items: center; min-height: 58px; }
.panel-kicker { display: block; margin-bottom: 5px; font-size: 10px; }
.scope-switch { width: 100%; margin-bottom: 16px; }
.mine-filter { width: 100%; margin-bottom: 13px; }
.version-list { display: flex; flex-direction: column; gap: 3px; max-height: 520px; overflow: auto; }
.version-row { display: flex; flex-direction: column; width: 100%; gap: 3px; padding: 12px 11px; text-align: left; border: 0; border-radius: 8px; background: transparent; color: inherit; cursor: pointer; transition: background .18s ease, transform .18s ease; }
.version-row:hover { background: var(--ea-fill-color3); transform: translateX(2px); }
.version-row--active { background: var(--ea-primary-disabled); }
.version-row--active:hover { background: var(--ea-primary-disabled); }
.version-row__top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.version-row strong { color: var(--ea-text); font-size: 13px; }
.version-row__code { color: var(--ea-text-light2); font-size: 12px; font-variant-numeric: tabular-nums; }
.version-row__meta { color: var(--ea-text-light2); font-size: 11px; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; flex: 0 0 auto; background: #b5bec7; }
.status-dot--published { background: #2ca77a; }
.panel-footnote, .quiet-note { margin: 20px 0 0; color: var(--ea-text-light2); font-size: 12px; line-height: 1.65; }
.empty-list { padding: 24px 8px; color: var(--ea-text-light2); font-size: 13px; text-align: center; }
.version-context { display: flex; flex-wrap: wrap; gap: 7px; margin: 6px 0 0; color: var(--ea-text-light2); font-size: 12px; }
.status-label { padding: 6px 10px; border-radius: 6px; white-space: nowrap; font-size: 11px; background: var(--ea-fill-color3); color: var(--ea-text-light2); }
.status-label--published { color: #20835d; background: rgba(44, 167, 122, .12); }
.menu-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 0; border-top: 1px solid var(--ea-border-color); border-bottom: 1px solid var(--ea-border-color); }
.menu-toolbar__actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
.menu-toolbar__actions :deep(.el-button + .el-button) { margin-left: 0; }
.tree-caption { display: flex; justify-content: space-between; margin: 23px 0 13px; color: var(--ea-text-light2); font-size: 12px; }
.tree-caption span:first-child { color: var(--ea-text); font-weight: 700; }
.menu-tree { background: transparent; --el-tree-node-hover-bg-color: var(--ea-fill-color3); }
.menu-tree :deep(.el-tree-node__content) { min-height: 49px; height: auto; border-bottom: 1px solid var(--ea-border-color); }
.menu-tree :deep(.el-tree-node__expand-icon) { font-size: 13px; }
.menu-node { display: flex; align-items: center; justify-content: space-between; width: 100%; min-width: 0; gap: 12px; padding: 6px 0; }
.menu-node__main, .menu-node__actions { display: flex; align-items: center; gap: 9px; min-width: 0; }
.menu-node__actions { flex: 0 0 auto; opacity: .22; transition: opacity .16s ease; }
.menu-node:hover .menu-node__actions { opacity: 1; }
.menu-node__actions :deep(.el-button + .el-button) { margin-left: 0; }
.menu-node__name { color: var(--ea-text); font-size: 13px; font-weight: 650; white-space: nowrap; }
.menu-node__code { overflow: hidden; color: var(--ea-text-light2); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.type-mark { min-width: 30px; padding: 3px 5px; border-radius: 4px; color: var(--ea-text-light2); background: var(--ea-fill-color3); text-align: center; font-size: 10px; }
.type-mark--menu { color: var(--ea-primary); background: var(--ea-primary-disabled); }
.muted-tag { color: var(--ea-text-light2); font-size: 10px; }
.tree-empty { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; padding: 50px 6px; color: var(--ea-text-light2); font-size: 13px; }
.tree-empty strong { color: var(--ea-text); font-size: 15px; }
.inspector-content { padding-top: 3px; }
.inspector-intro { margin: 0 0 17px; color: var(--ea-text-light2); font-size: 12px; line-height: 1.55; }
.diff-summary { display: flex; justify-content: space-between; gap: 6px; padding: 12px 0 17px; border-bottom: 1px solid var(--ea-border-color); }
.diff-summary span { color: var(--ea-text-light2); font-size: 11px; }
.diff-summary b { margin-right: 3px; color: var(--ea-text); font-size: 19px; }
.diff-list { max-height: 430px; overflow: auto; }
.diff-row { display: flex; gap: 10px; padding: 13px 0; border-bottom: 1px solid var(--ea-border-color); }
.diff-row > div { min-width: 0; }
.diff-row strong, .diff-row small { display: block; }
.diff-row strong { color: var(--ea-text); font-size: 12px; }
.diff-row small { margin-top: 4px; color: var(--ea-text-light2); font-size: 11px; line-height: 1.5; }
.diff-sign { display: grid; place-items: center; width: 18px; height: 18px; flex: 0 0 auto; border-radius: 4px; font-weight: 800; font-size: 12px; background: var(--ea-fill-color3); }
.diff-sign--added { color: #218862; background: rgba(44, 167, 122, .12); }
.diff-sign--removed { color: #c25151; background: rgba(210, 80, 80, .11); }
.diff-sign--changed { color: var(--ea-primary); background: var(--ea-primary-disabled); }
.field-label { display: block; margin: 0 0 8px; }
.resolve-result { display: flex; flex-direction: column; gap: 7px; margin: 18px 0; padding: 20px 0; border-top: 1px solid var(--ea-border-color); border-bottom: 1px solid var(--ea-border-color); color: var(--ea-text-light2); font-size: 12px; }
.resolve-result__eyebrow { color: var(--ea-primary); font-weight: 700; }
.resolve-result strong { color: var(--ea-text); font-size: 23px; line-height: 1.2; overflow-wrap: anywhere; }
.fingerprint { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; }
.full-button { width: 100%; }
.dialog-form { padding: 4px 2px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-grid--switches { max-width: 220px; }
.form-hint { color: var(--ea-text-light2); font-size: 11px; }
@media (max-width: 1180px) { .demo-workspace { grid-template-columns: 230px minmax(360px, 1fr); } .inspect-panel { grid-column: 1 / -1; border-left: 0; border-top: 1px solid var(--ea-border-color); } }
@media (max-width: 720px) { .menu-demo { padding: 0 16px 24px; } .demo-header, .demo-title, .menu-toolbar { align-items: flex-start; flex-direction: column; } .demo-title { padding-top: 26px; } .demo-workspace { display: flex; flex-direction: column; } .version-panel { border-right: 0; border-bottom: 1px solid var(--ea-border-color); } .menu-panel__inner { padding: 22px 18px; } .version-list { max-height: 260px; } .menu-node { align-items: flex-start; flex-direction: column; gap: 1px; } .menu-node__actions { opacity: 1; } .release-base { min-width: 0; } .save-state { display: none; } }
</style>
