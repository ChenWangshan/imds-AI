<template>
  <section class="map-monitor-page">
    <EaMaplibregl
      class="map-monitor-page__map"
      :center="[116.3912, 39.9073]"
      :lines="lines"
      :zoom="11"
      :vehicles="vehicles"
      :filter="false"
    />

    <div class="map-monitor-page__overlay">
      <div class="map-monitor-page__panel">
        <p class="map-monitor-page__eyebrow">SMART DISPATCH</p>
        <h1>地图监控</h1>
        <p>基于 MapLibre 构建的全幅地图工作面，当前底图已接入天地图影像图层。</p>
      </div>

      <div class="map-monitor-page__status">
        <span>底图状态</span>
        <strong>天地图影像</strong>
      </div>
    </div>

    <div class="map-monitor-page__legend">
      <div class="legend-item">
        <i class="legend-item__dot legend-item__dot--transport" />
        <span>运输设备</span>
      </div>
      <div class="legend-item">
        <i class="legend-item__dot legend-item__dot--loading" />
        <span>装载设备</span>
      </div>
      <div class="legend-item">
        <i class="legend-item__dot legend-item__dot--auxiliary" />
        <span>辅助设备</span>
      </div>
      <div class="legend-item">
        <i class="legend-item__line" />
        <span>调度路线 / 区域边界</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const vehicles = [
  {
    coordinates: [116.432, 39.923] as [number, number],
    icon: "transport",
    rotate: 38,
  },
  {
    coordinates: [116.468, 39.902] as [number, number],
    icon: "transport",
    rotate: -12,
  },
  {
    coordinates: [116.351, 39.896] as [number, number],
    icon: "excavator",
    rotate: 0,
  },
  {
    coordinates: [116.387, 39.872] as [number, number],
    icon: "auxiliary",
    rotate: 18,
  },
];

const lines = [
  {
    color: "#68BFFD",
    coordinates: [
      [116.324, 39.943],
      [116.362, 39.926],
      [116.401, 39.914],
      [116.438, 39.907],
      [116.476, 39.894],
    ] as [number, number][],
  },
  {
    color: "#70F1FD",
    coordinates: [
      [116.338, 39.871],
      [116.366, 39.858],
      [116.406, 39.852],
      [116.442, 39.862],
      [116.465, 39.884],
      [116.448, 39.912],
      [116.414, 39.926],
      [116.372, 39.921],
      [116.344, 39.897],
      [116.338, 39.871],
    ] as [number, number][],
  },
];
</script>

<style scoped lang="scss">
.map-monitor-page {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  border: 1px solid var(--app-panel-border);
  border-radius: 28px;
  overflow: hidden;
  background: var(--app-panel-bg);
  box-shadow: var(--app-panel-shadow);
}

.map-monitor-page__map {
  position: absolute;
  inset: 0;
}

.map-monitor-page__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 22px;
  pointer-events: none;
}

.map-monitor-page__legend {
  position: absolute;
  left: 22px;
  bottom: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  max-width: min(560px, calc(100% - 44px));
  padding: 14px 16px;
  border: 1px solid var(--app-panel-border);
  border-radius: 20px;
  background: var(--ea-panel-background);
  backdrop-filter: blur(14px);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.map-monitor-page__panel,
.map-monitor-page__status {
  pointer-events: auto;
  border: 1px solid var(--app-panel-border);
  background: var(--ea-panel-background);
  backdrop-filter: blur(14px);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.map-monitor-page__panel {
  max-width: 460px;
  padding: 18px 20px;
  border-radius: 22px;
}

.map-monitor-page__eyebrow {
  margin: 0 0 10px;
  color: var(--app-accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.24em;
}

.map-monitor-page__panel h1 {
  margin: 0;
  color: var(--app-hero-title);
  font-size: 30px;
}

.map-monitor-page__panel p:last-child {
  margin: 12px 0 0;
  color: var(--app-hero-desc);
  line-height: 1.75;
}

.map-monitor-page__status {
  min-width: 170px;
  padding: 16px 18px;
  border-radius: 20px;
}

.map-monitor-page__status span {
  display: block;
  color: var(--app-hero-muted);
  font-size: 12px;
  letter-spacing: 0.16em;
}

.map-monitor-page__status strong {
  display: block;
  margin-top: 10px;
  color: var(--app-hero-title);
  font-size: 20px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--app-hero-desc);
  font-size: 13px;
  white-space: nowrap;
}

.legend-item__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 12px currentColor;
}

.legend-item__dot--transport {
  color: #68bffd;
  background: currentColor;
}

.legend-item__dot--loading {
  color: #70f1fd;
  background: currentColor;
}

.legend-item__dot--auxiliary {
  color: #eedd46;
  background: currentColor;
}

.legend-item__line {
  display: inline-block;
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, #68bffd 0%, #70f1fd 100%);
}

@media (max-width: 900px) {
  .map-monitor-page__overlay {
    flex-direction: column;
  }

  .map-monitor-page__panel {
    max-width: 100%;
  }

  .map-monitor-page__legend {
    right: 22px;
  }
}
</style>
