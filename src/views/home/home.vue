<template>
  <div class="home-page">
    <section class="home-hero">
      <div class="home-hero__content">
        <p class="home-hero__eyebrow">SMART MINE INTELLIGENCE HUB</p>
        <h1>让矿山现场的每一次采装与运输，都被精准看见。</h1>
        <p class="home-hero__desc">
          以智慧矿山业务为核心，贯通采区、设备、运输与系统管理链路，
          用更高级的视觉秩序承载复杂数据，用更稳定的智慧矿山能力支撑生产决策。
        </p>

        <div class="home-hero__quote">
          <span class="home-hero__quote-line" />
          <p>统一矿山数据入口，服务采、运、管一体化协同。</p>
        </div>

        <div class="home-hero__meta">
          <div class="meta-item">
            <span>当前用户</span>
            <strong>{{ authStore.currentUser?.username || "-" }}</strong>
          </div>
          <div class="meta-item">
            <span>运行状态</span>
            <strong>ONLINE</strong>
          </div>
          <div class="meta-item">
            <span>场景定位</span>
            <strong>智慧矿山中枢</strong>
          </div>
        </div>
      </div>

      <div class="home-hero__visual" aria-hidden="true">
        <svg
          class="mine-scene"
          viewBox="0 0 760 560"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="skyGlow" x1="122" y1="74" x2="582" y2="458" gradientUnits="userSpaceOnUse">
              <stop stop-color="#5CEBF5" stop-opacity="0.42" />
              <stop offset="1" stop-color="#2A3550" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="ridgeOne" x1="70" y1="228" x2="666" y2="228" gradientUnits="userSpaceOnUse">
              <stop stop-color="#445069" />
              <stop offset="1" stop-color="#2C3649" />
            </linearGradient>
            <linearGradient id="ridgeTwo" x1="86" y1="304" x2="684" y2="304" gradientUnits="userSpaceOnUse">
              <stop stop-color="#566178" />
              <stop offset="1" stop-color="#323C50" />
            </linearGradient>
            <linearGradient id="pitFloor" x1="126" y1="356" x2="644" y2="474" gradientUnits="userSpaceOnUse">
              <stop stop-color="#242D3D" />
              <stop offset="1" stop-color="#161D2A" />
            </linearGradient>
            <linearGradient id="tealLine" x1="356" y1="209" x2="485" y2="402" gradientUnits="userSpaceOnUse">
              <stop stop-color="#6AF1F6" />
              <stop offset="1" stop-color="#36C9DD" />
            </linearGradient>
            <filter id="glow" x="0" y="0" width="760" height="560" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="18" />
            </filter>
          </defs>

          <circle cx="382" cy="162" r="186" fill="url(#skyGlow)" />
          <path d="M56 236L164 172L252 226L354 162L436 219L562 151L694 238V260H56V236Z" fill="url(#ridgeOne)" />
          <path d="M76 304L182 246L282 282L382 226L502 286L604 232L706 312V350H76V304Z" fill="url(#ridgeTwo)" />
          <path d="M128 366C202 312 280 298 382 302C494 307 576 332 644 380V498H128V366Z" fill="url(#pitFloor)" />

          <path d="M170 412L286 346L414 388L314 450L170 412Z" fill="#1A2230" />
          <path d="M308 448L414 388L596 434L492 486L308 448Z" fill="#202938" />
          <path d="M226 396L390 336" stroke="rgba(235,245,255,0.18)" stroke-width="8" stroke-linecap="round" />
          <path d="M348 430L526 386" stroke="rgba(235,245,255,0.12)" stroke-width="7" stroke-linecap="round" />

          <path d="M474 280L530 280L572 358H516L474 280Z" fill="#293447" />
          <path d="M454 358H586L614 388H480L454 358Z" fill="#1E2838" />
          <rect x="514" y="246" width="52" height="40" rx="8" fill="#344156" />
          <rect x="524" y="256" width="30" height="12" rx="4" fill="#77F2F9" fill-opacity="0.72" />
          <circle cx="500" cy="392" r="28" fill="#0F1520" stroke="#7CEFF8" stroke-opacity="0.5" stroke-width="4" />
          <circle cx="568" cy="392" r="28" fill="#0F1520" stroke="#7CEFF8" stroke-opacity="0.5" stroke-width="4" />
          <circle cx="500" cy="392" r="11" fill="#7CEFF8" fill-opacity="0.52" />
          <circle cx="568" cy="392" r="11" fill="#7CEFF8" fill-opacity="0.52" />

          <path d="M286 270L326 254L390 254L418 274L374 286L316 286L286 270Z" fill="#344055" />
          <path d="M362 250L400 210L430 210L410 252L362 250Z" fill="#49556E" />
          <path d="M420 210L462 166L484 180L444 222L420 210Z" fill="url(#tealLine)" />
          <path d="M480 178L504 154L522 166L498 192L480 178Z" fill="#81F4FA" />
          <path d="M494 190L516 174L530 186L506 202L494 190Z" fill="#D8F8FB" fill-opacity="0.82" />

          <path d="M282 286L336 286L330 362L274 362L282 286Z" fill="#1E2836" />
          <path d="M332 286H378L374 332H328L332 286Z" fill="#202B3B" />
          <path d="M270 362H388L408 384H252L270 362Z" fill="#141C28" />
          <circle cx="292" cy="386" r="22" fill="#101722" stroke="#6AEFF6" stroke-opacity="0.48" stroke-width="4" />
          <circle cx="372" cy="386" r="22" fill="#101722" stroke="#6AEFF6" stroke-opacity="0.48" stroke-width="4" />
          <circle cx="292" cy="386" r="8" fill="#6AEFF6" fill-opacity="0.52" />
          <circle cx="372" cy="386" r="8" fill="#6AEFF6" fill-opacity="0.52" />

          <path d="M146 470H642" stroke="rgba(123,239,248,0.22)" stroke-width="2" stroke-dasharray="8 10" />
          <circle cx="390" cy="182" r="8" fill="#7EF4F9" />
          <circle cx="390" cy="182" r="32" fill="#66F0F7" fill-opacity="0.16" filter="url(#glow)" />
        </svg>
      </div>
    </section>

    <section class="home-strip">
      <article v-for="item in summary" :key="item.label" class="strip-item">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </article>
    </section>

    <section class="home-grid">
      <article class="feature-panel feature-panel--wide">
        <p class="feature-panel__label">智慧矿山价值</p>
        <h2>将矿山现场的复杂链路，沉淀为清晰可用的数据能力。</h2>
        <p class="feature-panel__text">
          从露天采区、无人矿卡到设备管理与系统治理，首页不再只是一个功能入口，
          而是面向智慧矿山场景的统一视觉中枢与运营门面。
        </p>
      </article>

      <article class="feature-panel">
        <p class="feature-panel__label">业务覆盖</p>
        <ul class="feature-list">
          <li>采装运输场景统一呈现</li>
          <li>系统管理入口集中收口</li>
          <li>智慧矿山状态实时同步</li>
        </ul>
      </article>

      <article class="feature-panel">
        <p class="feature-panel__label">视觉表达</p>
        <ul class="feature-list">
          <li>矿坑层级与设备剪影结合</li>
          <li>冷青高光强化科技感</li>
          <li>深色留白塑造高级秩序</li>
        </ul>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { useAuthStore } from "@/stores/modules/auth";

const authStore = useAuthStore();

const summary = computed(() => [
  { label: "导航模块", value: "02" },
  { label: "管理子项", value: "03" },
  { label: "调度视角", value: "采 · 运 · 管" },
]);
</script>

<style scoped lang="scss">
.home-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-height: 100%;
}

.home-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(320px, 0.98fr);
  gap: 22px;
  align-items: center;
  min-height: 420px;
  padding: 34px 36px;
  border: 1px solid var(--app-panel-border);
  border-radius: 30px;
  background: var(--app-panel-bg-strong);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    var(--app-panel-shadow);
}

.home-hero__content {
  max-width: 700px;
}

.home-hero__eyebrow {
  margin: 0 0 18px;
  color: var(--app-accent);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.3em;
}

.home-hero h1 {
  margin: 0;
  color: var(--app-hero-title);
  font-size: clamp(34px, 4.6vw, 56px);
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1.08;
}

.home-hero__desc {
  max-width: 640px;
  margin: 18px 0 0;
  color: var(--app-hero-desc);
  font-size: 16px;
  line-height: 1.8;
}

.home-hero__quote {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 26px;
}

.home-hero__quote-line {
  width: 48px;
  height: 1px;
  background: linear-gradient(90deg, var(--app-accent) 0%, transparent 100%);
}

.home-hero__quote p {
  margin: 0;
  color: var(--app-hero-muted);
  font-size: 14px;
  letter-spacing: 0.08em;
}

.home-hero__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 24px;
}

.meta-item {
  padding: 18px 18px 16px;
  border: 1px solid var(--app-panel-border);
  border-radius: 18px;
  background: var(--app-panel-bg-soft);
  backdrop-filter: blur(10px);
}

.meta-item span {
  display: block;
  color: var(--app-hero-muted);
  font-size: 12px;
  letter-spacing: 0.16em;
}

.meta-item strong {
  display: block;
  margin-top: 10px;
  color: var(--app-hero-title);
  font-size: 20px;
  font-weight: 800;
}

.home-hero__visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  overflow: hidden;
}

.mine-scene {
  width: 100%;
  max-width: 560px;
  height: auto;
  filter: drop-shadow(0 16px 34px rgba(9, 13, 20, 0.34));
}

.home-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.strip-item {
  padding: 22px 26px;
  border: 1px solid var(--app-panel-border);
  border-radius: 20px;
  background: var(--app-panel-bg);
}

.strip-item span {
  display: block;
  color: var(--app-hero-muted);
  font-size: 13px;
}

.strip-item strong {
  display: block;
  margin-top: 10px;
  color: var(--app-hero-title);
  font-size: 34px;
  font-weight: 800;
}

.home-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 18px;
}

.feature-panel {
  padding: 28px;
  border: 1px solid var(--app-panel-border);
  border-radius: 24px;
  background: var(--app-panel-bg);
}

.feature-panel--wide {
  background:
    radial-gradient(circle at right top, var(--app-accent-soft), transparent 30%),
    var(--app-panel-bg);
}

.feature-panel__label {
  margin: 0 0 16px;
  color: var(--app-accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.22em;
}

.feature-panel h2 {
  margin: 0;
  color: var(--app-hero-title);
  font-size: 26px;
  line-height: 1.34;
}

.feature-panel__text {
  margin: 18px 0 0;
  color: var(--app-hero-desc);
  line-height: 1.9;
}

.feature-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.feature-list li {
  position: relative;
  padding-left: 18px;
  color: var(--app-hero-desc);
  line-height: 2;
}

.feature-list li::before {
  content: "";
  position: absolute;
  top: 13px;
  left: 0;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--app-accent);
  box-shadow: 0 0 12px var(--app-accent-soft);
}

@media (max-width: 1200px) {
  .home-hero,
  .home-grid {
    grid-template-columns: 1fr;
  }

  .home-hero__visual {
    min-height: 240px;
  }
}

@media (max-width: 860px) {
  .home-hero {
    padding: 28px 24px;
  }

  .home-hero__meta,
  .home-strip {
    grid-template-columns: 1fr;
  }

  .strip-item strong {
    font-size: 28px;
  }
}
</style>
