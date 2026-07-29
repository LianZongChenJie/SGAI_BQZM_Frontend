<template>
  <section class="page-wrapper">
    <!-- 顶部 Tab 导航 -->
    <nav class="tab-nav">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div class="page-content">
      <!-- ========== 设备监控 ========== -->
      <template v-if="activeTab === 'monitor'">
        <!-- 实时设备监控 -->
        <section class="panel">
          <header class="panel-header">
            <div class="left">
              <svg class="panel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <h2 class="panel-title">实时设备监控</h2>
            </div>
            <button class="btn btn-primary" @click="onRefreshVideo">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
              刷新视频
            </button>
          </header>

          <div class="video-grid">
            <div v-for="v in videoList" :key="v.id" class="video-card">
              <div class="video-placeholder">
                <svg class="video-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 7l-7 5 7 5V7z"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                <p class="video-name">{{ v.name }}</p>
                <p class="video-desc">{{ v.desc }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 回路控制面板 -->
        <section class="panel">
          <header class="panel-header">
            <div class="left">
              <svg class="panel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
                <rect x="9" y="9" width="6" height="6"/>
                <line x1="9" y1="1" x2="9" y2="4"/>
                <line x1="15" y1="1" x2="15" y2="4"/>
                <line x1="9" y1="20" x2="9" y2="23"/>
                <line x1="15" y1="20" x2="15" y2="23"/>
                <line x1="20" y1="9" x2="23" y2="9"/>
                <line x1="20" y1="14" x2="23" y2="14"/>
                <line x1="1" y1="9" x2="4" y2="9"/>
                <line x1="1" y1="14" x2="4" y2="14"/>
              </svg>
              <h2 class="panel-title">回路控制面板</h2>
            </div>
          </header>

          <div class="circuit-grid">
            <div v-for="c in circuitList" :key="c.id" class="circuit-card">
              <div class="circuit-header">
                <span class="circuit-name">{{ c.name }}</span>
                <span
                  class="circuit-status"
                  :class="c.status === '开启' ? 'status-on' : 'status-off'"
                >
                  {{ c.status }}
                </span>
              </div>
              <p class="circuit-location">{{ c.location }}</p>
              <p class="circuit-info">{{ c.info }}</p>
              <div class="circuit-actions">
                <template v-if="c.status === '开启'">
                  <button class="btn btn-danger" @click="onToggle(c)">关闭</button>
                  <button class="btn btn-primary" @click="onTimer(c)">定时</button>
                </template>
                <template v-else-if="c.status === '关闭' && c.isFault">
                  <button class="btn btn-success" @click="onToggle(c)">开启</button>
                  <button class="btn btn-primary" @click="onDiagnose(c)">诊断</button>
                </template>
                <template v-else>
                  <button class="btn btn-success" @click="onToggle(c)">开启</button>
                  <button class="btn btn-primary" @click="onTimer(c)">定时</button>
                </template>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- ========== 场景配置 ========== -->
      <template v-if="activeTab === 'scene'">
        <section class="panel">
          <header class="panel-header">
            <div class="left">
              <svg class="panel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
              <h2 class="panel-title">场景配置</h2>
            </div>
            <button class="btn btn-primary" @click="onAddScene">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              新建场景
            </button>
          </header>

          <div class="scene-grid">
            <div
              v-for="s in sceneList"
              :key="s.id"
              class="scene-card"
              :class="{ 'scene-default': s.isDefault }"
            >
              <div class="scene-header">
                <div class="scene-title-row">
                  <span class="scene-icon">{{ s.icon }}</span>
                  <span class="scene-name">{{ s.name }}</span>
                </div>
                <span v-if="s.isDefault" class="scene-default-tag">默认</span>
              </div>
              <p class="scene-circuits">包含 {{ s.circuitCount }} 个回路</p>
              <p class="scene-desc">{{ s.desc }}</p>
              <div class="scene-actions">
                <button class="btn btn-primary" @click="onExecute(s)">执行</button>
                <button class="btn btn-secondary" @click="onEditScene(s)">编辑</button>
                <button class="btn btn-danger" @click="onDeleteScene(s)">删除</button>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- ========== 定时控制（占位） ========== -->
      <template v-if="activeTab === 'timer'">
        <section class="panel placeholder-panel">
          <p class="placeholder-text">定时控制功能开发中...</p>
        </section>
      </template>

      <!-- ========== 控制日历（占位） ========== -->
      <template v-if="activeTab === 'calendar'">
        <section class="panel placeholder-panel">
          <p class="placeholder-text">控制日历功能开发中...</p>
        </section>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

/* --------------------- Tab 导航 --------------------- */
const tabs = [
  { key: 'monitor', label: '设备监控' },
  { key: 'scene', label: '场景配置' },
  { key: 'timer', label: '定时控制' },
  { key: 'calendar', label: '控制日历' },
];
const activeTab = ref('monitor');

/* --------------------- 视频流数据 --------------------- */
const videoList = ref([
  {
    id: 'v1',
    name: '视频流1 - A1地块主入口',
    desc: '实时查看现场开关灯状态',
  },
  {
    id: 'v2',
    name: '视频流2 - B2滨水绿道',
    desc: '实时查看现场开关灯状态',
  },
]);

/* --------------------- 回路数据 --------------------- */
const circuitList = ref([
  {
    id: 'c1',
    name: 'A1-回路01',
    location: '冬奥广场 · 主照明',
    info: '功率: 3.2kW | 运行: 8h | 今日用电: 25.6kWh',
    status: '开启',
    isFault: false,
  },
  {
    id: 'c2',
    name: 'A2-回路03',
    location: '服贸会场馆 · 景观照明',
    info: '功率: 5.8kW | 运行: 8h | 今日用电: 46.4kWh',
    status: '开启',
    isFault: false,
  },
  {
    id: 'c3',
    name: 'B2-回路07',
    location: '滨水绿道 · 步道灯',
    info: '功率: 0kW | 离线故障 | 今日用电: 0kWh',
    status: '关闭',
    isFault: true,
  },
  {
    id: 'c4',
    name: 'C1-回路12',
    location: '科技大厦 · 外立面',
    info: '功率: 8.5kW | 运行: 8h | 今日用电: 68kWh',
    status: '开启',
    isFault: false,
  },
]);

/* --------------------- 场景数据 --------------------- */
const sceneList = ref([
  {
    id: 's1',
    name: '夜间模式',
    icon: '🌙',
    circuitCount: 12,
    desc: 'A1/A2/B1 全部开启，B2/C1 降低亮度',
    isDefault: true,
  },
  {
    id: 's2',
    name: '日间模式',
    icon: '☀️',
    circuitCount: 8,
    desc: '全部关闭，仅保留应急照明',
    isDefault: false,
  },
  {
    id: 's3',
    name: '节日模式',
    icon: '✨',
    circuitCount: 24,
    desc: '全部开启，景观灯切换动态效果',
    isDefault: false,
  },
  {
    id: 's4',
    name: '维护模式',
    icon: '🔧',
    circuitCount: 4,
    desc: '仅开启维修区域照明',
    isDefault: false,
  },
]);

/* --------------------- 事件 --------------------- */
function onRefreshVideo() {
  console.log('刷新视频');
}

function onToggle(c: typeof circuitList.value[0]) {
  c.status = c.status === '开启' ? '关闭' : '开启';
  console.log('切换状态', c.name, c.status);
}

function onTimer(c: typeof circuitList.value[0]) {
  console.log('定时设置', c.name);
}

function onDiagnose(c: typeof circuitList.value[0]) {
  console.log('故障诊断', c.name);
}

/* ---------- 场景配置事件 ---------- */
function onAddScene() {
  console.log('新建场景');
}

function onExecute(s: typeof sceneList.value[0]) {
  console.log('执行场景', s.name);
}

function onEditScene(s: typeof sceneList.value[0]) {
  console.log('编辑场景', s.name);
}

function onDeleteScene(s: typeof sceneList.value[0]) {
  console.log('删除场景', s.name);
}
</script>

<style scoped>
/* ------------------- 颜色变量 ------------------- */
.page-wrapper {
  --bg-page: #0b111e;
  --bg-panel: #1b2533;
  --bg-video: #141d2b;
  --bg-card: #141d2b;
  --color-text: #ffffff;
  --color-muted: #a0aabf;
  --color-primary: #00a2e8;
  --color-primary-hover: #0090cf;
  --color-success: #52c41a;
  --color-success-hover: #47a814;
  --color-danger: #ff4d4f;
  --color-danger-hover: #e64446;
  --color-border: #303d50;

  box-sizing: border-box;
  min-height: 100%;
  padding: 16px;
  background: var(--bg-page);
  color: var(--color-text);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.page-wrapper *,
.page-wrapper *::before,
.page-wrapper *::after {
  box-sizing: border-box;
}

/* ------------------- Tab 导航 ------------------- */
.tab-nav {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.tab-item {
  position: relative;
  padding: 10px 20px;
  background: transparent;
  border: none;
  color: var(--color-muted);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.tab-item:hover {
  color: var(--color-text);
}

.tab-item.active {
  color: var(--color-primary);
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -1px;
  width: 100%;
  height: 2px;
  background: var(--color-primary);
}

/* ------------------- 页面内容 ------------------- */
.page-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ------------------- Panel ------------------- */
.panel {
  background: var(--bg-panel);
  border-radius: 8px;
  padding: 16px 20px 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-header .left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-icon {
  width: 20px;
  height: 20px;
  color: var(--color-text);
  flex-shrink: 0;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--color-text);
}

/* ------------------- 按钮 ------------------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 28px;
  padding: 0 12px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
  border: none;
  white-space: nowrap;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-secondary {
  background: #ffffff;
  color: #1a1a1a;
}

.btn-secondary:hover {
  opacity: 0.88;
}

.btn-success {
  background: var(--color-success);
  color: #fff;
}

.btn-success:hover {
  background: var(--color-success-hover);
}

.btn-danger {
  background: var(--color-danger);
  color: #fff;
}

.btn-danger:hover {
  background: var(--color-danger-hover);
}

.btn-icon {
  width: 14px;
  height: 14px;
}

/* ------------------- 视频流区域 ------------------- */
.video-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.video-card {
  background: var(--bg-video);
  border-radius: 6px;
  overflow: hidden;
  min-height: 260px;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 260px;
  color: var(--color-muted);
  gap: 8px;
}

.video-icon {
  width: 40px;
  height: 40px;
  color: var(--color-muted);
  margin-bottom: 4px;
}

.video-name {
  margin: 0;
  font-size: 14px;
  color: var(--color-text);
  font-weight: 500;
}

.video-desc {
  margin: 0;
  font-size: 12px;
  color: var(--color-muted);
}

/* ------------------- 回路控制面板 ------------------- */
.circuit-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.circuit-card {
  background: var(--bg-video);
  border-radius: 6px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.circuit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.circuit-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.circuit-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 20px;
  padding: 0 8px;
  border-radius: 10px;
  font-size: 11px;
  line-height: 1;
}

.circuit-status.status-on {
  color: var(--color-success);
  background: rgba(82, 196, 26, 0.2);
}

.circuit-status.status-off {
  color: var(--color-danger);
  background: rgba(255, 77, 79, 0.2);
}

.circuit-location {
  margin: 0;
  font-size: 12px;
  color: var(--color-muted);
}

.circuit-info {
  margin: 0;
  font-size: 12px;
  color: var(--color-muted);
}

.circuit-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

/* ------------------- 场景配置 ------------------- */
.scene-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.scene-card {
  background: var(--bg-card);
  border-radius: 6px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid transparent;
  transition: border-color 0.2s;
}

.scene-card.scene-default {
  border-color: var(--color-primary);
}

.scene-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.scene-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.scene-icon {
  font-size: 16px;
  line-height: 1;
}

.scene-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.scene-default-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 18px;
  padding: 0 6px;
  border-radius: 9px;
  font-size: 11px;
  line-height: 1;
  color: var(--color-primary);
  background: rgba(0, 162, 232, 0.15);
}

.scene-circuits {
  margin: 0;
  font-size: 12px;
  color: var(--color-text);
}

.scene-desc {
  margin: 0;
  font-size: 12px;
  color: var(--color-muted);
  line-height: 1.4;
}

.scene-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

/* ------------------- 占位提示 ------------------- */
.placeholder-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.placeholder-text {
  margin: 0;
  font-size: 14px;
  color: var(--color-muted);
}

/* ------------------- 响应式 ------------------- */
@media (max-width: 1200px) {
  .circuit-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .scene-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: 1fr;
  }

  .circuit-grid {
    grid-template-columns: 1fr;
  }

  .scene-grid {
    grid-template-columns: 1fr;
  }

  .tab-nav {
    overflow-x: auto;
  }

  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
