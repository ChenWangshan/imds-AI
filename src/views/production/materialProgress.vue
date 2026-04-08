<template>
  <section class="progress-page">
    <header class="progress-header">
      <div>
        <p class="progress-header__eyebrow">MATERIAL FLOW OVERVIEW</p>
        <h1>物料进度监控</h1>
        <p>用随机演示数据模拟采装、运输、破碎与入仓四段链路的节拍与完成状态。</p>
      </div>

      <div class="progress-header__stats">
        <div v-for="item in stats" :key="item.label" class="stat-tile">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
    </header>

    <div class="progress-body">
      <article class="progress-panel">
        <div class="progress-panel__header">
          <h2>流程节点进度</h2>
          <span>实时刷新演示</span>
        </div>

        <div v-for="item in stageRows" :key="item.name" class="stage-row">
          <div class="stage-row__meta">
            <strong>{{ item.name }}</strong>
            <span>{{ item.detail }}</span>
          </div>
          <div class="stage-row__track">
            <i :style="{ width: `${item.percent}%` }" />
          </div>
          <b>{{ item.percent }}%</b>
        </div>
      </article>

      <article class="progress-panel">
        <div class="progress-panel__header">
          <h2>物料批次</h2>
          <span>最近 6 条</span>
        </div>

        <div class="batch-head">
          <span>批次号</span>
          <span>物料类型</span>
          <span>当前位置</span>
          <span>完成量</span>
        </div>

        <div v-for="item in batchRows" :key="item.batchCode" class="batch-row">
          <span>{{ item.batchCode }}</span>
          <span>{{ item.material }}</span>
          <span>{{ item.position }}</span>
          <span>{{ item.progress }}</span>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: T[]) {
  return items[randomInt(0, items.length - 1)];
}

const stats = [
  { label: "在途物料", value: `${randomInt(18, 42)} 批` },
  { label: "本班累计", value: `${randomInt(6800, 14600)} t` },
  { label: "节点健康度", value: `${randomInt(90, 98)}%` },
  { label: "异常预警", value: `${randomInt(1, 5)} 条` },
];

const stageRows = [
  {
    detail: "装载区作业面正在稳定供料",
    name: "采装上料",
    percent: randomInt(78, 96),
  },
  {
    detail: "运输链路根据班次计划动态调度",
    name: "矿卡运输",
    percent: randomInt(66, 93),
  },
  {
    detail: "破碎段处理节拍保持在安全区间",
    name: "破碎筛分",
    percent: randomInt(72, 97),
  },
  {
    detail: "成品仓入库与检斤记录同步更新",
    name: "入仓计量",
    percent: randomInt(69, 95),
  },
];

const materials = ["高品位矿", "原矿", "混合矿", "缓冲矿"];
const positions = ["运输途中", "破碎站前", "中转堆场", "入仓通道"];

const batchRows = Array.from({ length: 6 }, (_, index) => ({
  batchCode: `WL-${randomInt(260400, 260999)}-${index + 1}`,
  material: pick(materials),
  position: pick(positions),
  progress: `${randomInt(320, 1480)} t`,
}));
</script>

<style scoped lang="scss">
.progress-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
  height: 100%;
}

.progress-header,
.progress-panel {
  border: 1px solid var(--app-panel-border);
  border-radius: 24px;
  background: var(--app-panel-bg);
  box-shadow: var(--app-panel-shadow);
}

.progress-header {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(360px, 0.95fr);
  gap: 20px;
  padding: 28px 30px;
}

.progress-header__eyebrow {
  margin: 0 0 10px;
  color: var(--app-accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.22em;
}

.progress-header h1,
.progress-panel__header h2 {
  margin: 0;
  color: var(--app-hero-title);
}

.progress-header h1 {
  font-size: 34px;
}

.progress-header p:last-child,
.stage-row__meta span,
.batch-row {
  color: var(--app-hero-desc);
}

.progress-header p:last-child {
  margin: 12px 0 0;
  line-height: 1.8;
}

.progress-header__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.stat-tile {
  min-height: 112px;
  padding: 18px;
  border: 1px solid var(--ea-border-color);
  border-radius: 20px;
  background: var(--ea-fill-color5);
}

.stat-tile span,
.progress-panel__header span,
.batch-head {
  color: var(--app-hero-desc);
}

.stat-tile strong {
  display: block;
  margin-top: 12px;
  color: var(--app-hero-title);
  font-size: 28px;
}

.progress-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.95fr);
  gap: 20px;
}

.progress-panel {
  padding: 22px 24px;
}

.progress-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.stage-row {
  display: grid;
  grid-template-columns: minmax(0, 220px) minmax(0, 1fr) 52px;
  gap: 16px;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--ea-border-color);
}

.stage-row:last-child,
.batch-row:last-child {
  border-bottom: 0;
}

.stage-row__meta strong,
.stage-row b {
  color: var(--app-hero-title);
}

.stage-row__meta span {
  display: block;
  margin-top: 8px;
  line-height: 1.7;
}

.stage-row__track {
  height: 12px;
  border-radius: 999px;
  background: var(--ea-fill-color3);
  overflow: hidden;
}

.stage-row__track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #4f8dff 0%, #35d6cb 100%);
}

.batch-head,
.batch-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 0.8fr;
  gap: 14px;
  align-items: center;
}

.batch-head {
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--ea-fill-color3);
  font-weight: 700;
}

.batch-row {
  padding: 16px;
  border-bottom: 1px solid var(--ea-border-color);
}

@media (max-width: 1200px) {
  .progress-header,
  .progress-body {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .progress-header__stats {
    grid-template-columns: 1fr;
  }

  .stage-row,
  .batch-head,
  .batch-row {
    grid-template-columns: 1fr;
  }
}
</style>
