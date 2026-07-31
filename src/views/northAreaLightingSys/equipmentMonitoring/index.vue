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
              <h2 class="panel-title">场景控制面板</h2>
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
              <!-- <p class="circuit-info">{{ c.info }}</p> -->
              <div class="circuit-actions">
                <template v-if="c.status === '开启'">
                  <button class="btn btn-success" @click="onToggle(c)">开启</button>
                  <button class="btn btn-danger" @click="onToggle(c)">关闭</button>
                </template>
                <template v-else-if="c.status === '关闭' && c.isFault">
                 <button class="btn btn-success" @click="onToggle(c)">开启</button>
                  <button class="btn btn-danger" @click="onToggle(c)">关闭</button>
                </template>
                <template v-else>
                  <button class="btn btn-success" @click="onToggle(c)">开启</button>
                  <button class="btn btn-danger" @click="onToggle(c)">关闭</button>
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
            >
              <div class="scene-header">
                <div class="scene-title-row">
                  <span class="scene-icon">{{ s.icon }}</span>
                  <span class="scene-name">{{ s.name }}</span>
                </div>
                <!-- <span v-if="s.isDefault" class="scene-default-tag">默认</span> -->
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

      <!-- ========== 定时控制 ========== -->
      <template v-if="activeTab === 'timer'">
        <section class="panel">
          <header class="panel-header">
            <div class="left">
              <svg class="panel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <h2 class="panel-title">定时控制</h2>
            </div>
            <button class="btn btn-primary" @click="onAddTimer">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              新建定时任务
            </button>
          </header>

          <div class="table-wrapper">
            <table class="timer-table">
              <thead>
                <tr>
                  <th>任务名称</th>
                  <th>执行对象</th>
                  <th>类型</th>
                  <th>执行时间</th>
                  <th>重复</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in timerList" :key="row.id">
                  <td>{{ row.name }}</td>
                  <td>{{ row.target }}</td>
                  <td>{{ row.type }}</td>
                  <td>{{ row.time }}</td>
                  <td>{{ row.repeat }}</td>
                  <td>
                    <span
                      class="timer-status-badge"
                      :class="row.status === '启用' ? 'status-enabled' : 'status-disabled'"
                    >{{ row.status }}</span>
                  </td>
                  <td class="timer-actions">
                    <button class="btn btn-secondary" @click="onEditTimer(row)">编辑</button>
                    <button
                      v-if="row.status === '启用'"
                      class="btn btn-danger"
                      @click="onToggleTimer(row)"
                    >停用</button>
                    <button
                      v-else
                      class="btn btn-success"
                      @click="onToggleTimer(row)"
                    >启用</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>

      <!-- ========== 控制日历 ========== -->
      <template v-if="activeTab === 'calendar'">
        <section class="panel">
          <header class="panel-header">
            <div class="left">
              <svg class="panel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <h2 class="panel-title">控制日历 - {{ calendarYear }}年{{ calendarMonth + 1 }}月</h2>
            </div>
            <div class="calendar-nav">
              <button class="btn btn-text" title="上一年" @click="prevYear">«</button>
              <button class="btn btn-text" title="上一月" @click="prevMonth">‹</button>
              <button class="btn btn-secondary" @click="goToToday">今天</button>
              <button class="btn btn-text" title="下一月" @click="nextMonth">›</button>
              <button class="btn btn-text" title="下一年" @click="nextYear">»</button>
            </div>
          </header>

          <div class="calendar-grid">
            <div v-for="day in weekDays" :key="day" class="calendar-weekday">{{ day }}</div>
            <div
              v-for="(cell, idx) in calendarDays"
              :key="idx"
              class="calendar-day"
              :class="{ 'other-month': !cell.isCurrentMonth }"
            >
              <span class="day-number">{{ cell.date }}</span>
              <div class="day-tasks">
                <span
                  v-for="(task, tidx) in cell.tasks"
                  :key="tidx"
                  class="task-tag"
                  :class="`tag-${task.type}`"
                >
                  {{ task.label }}
                </span>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </section>
  <createNewSceneModal ref="createNewSceneModalRef"></createNewSceneModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import createNewSceneModal from './components/createNewSceneModal.vue';

const createNewSceneModalRef = ref<InstanceType<typeof createNewSceneModal>>();

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
  createNewSceneModalRef.value?.showModal('add');
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

/* --------------------- 定时任务数据 --------------------- */
const timerList = ref([
  {
    id: 't1',
    name: '晚间自动开灯',
    target: '夜间模式',
    type: '场景',
    time: '19:00',
    repeat: '每天',
    status: '启用',
  },
  {
    id: 't2',
    name: '凌晨自动关灯',
    target: '全区照明',
    type: '全部',
    time: '02:00',
    repeat: '每天',
    status: '启用',
  },
  {
    id: 't3',
    name: '周末节日模式',
    target: '节日模式',
    type: '场景',
    time: '18:30',
    repeat: '周五、六',
    status: '启用',
  },
  {
    id: 't4',
    name: '工作日节能',
    target: '日间模式',
    type: '场景',
    time: '07:00',
    repeat: '工作日',
    status: '启用',
  },
  {
    id: 't5',
    name: '应急照明保持',
    target: 'B1-回路全',
    type: '回路',
    time: '全天',
    repeat: '每天',
    status: '停用',
  },
]);

/* ---------- 定时任务事件 ---------- */
function onAddTimer() {
  console.log('新建定时任务');
}

function onEditTimer(row: typeof timerList.value[0]) {
  console.log('编辑定时任务', row.name);
}

function onToggleTimer(row: typeof timerList.value[0]) {
  row.status = row.status === '启用' ? '停用' : '启用';
  console.log('切换定时任务状态', row.name, row.status);
}

/* --------------------- 控制日历 --------------------- */
const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const currentDate = ref(new Date(2026, 5, 1)); // 默认显示 2026年6月

const calendarYear = computed(() => currentDate.value.getFullYear());
const calendarMonth = computed(() => currentDate.value.getMonth());

interface CalendarTask {
  label: string;
  type: 'blue' | 'green' | 'red';
}

interface CalendarCell {
  date: number;
  isCurrentMonth: boolean;
  tasks: CalendarTask[];
}

function getTasksForDate(year: number, month: number, day: number): CalendarTask[] {
  if (year === 2026 && month === 5) {
    if ([1, 2, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 19, 20, 21, 23, 25, 26, 27, 28, 29, 30].includes(day)) {
      return [{ label: '19:00 开灯', type: 'blue' }];
    }
    if ([3, 10, 17, 24].includes(day)) {
      return [
        { label: '19:00 开灯', type: 'blue' },
        { label: '18:30 节日', type: 'green' },
      ];
    }
    if (day === 22) {
      return [
        { label: '19:00 开灯', type: 'blue' },
        { label: '待执行', type: 'red' },
      ];
    }
  }
  return [];
}

const calendarDays = computed<CalendarCell[]>(() => {
  const year = calendarYear.value;
  const month = calendarMonth.value;

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0=周日

  const days: CalendarCell[] = [];

  // 上月末尾日期
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({ date: prevMonthLastDay - i, isCurrentMonth: false, tasks: [] });
  }

  // 当月日期
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: i, isCurrentMonth: true, tasks: getTasksForDate(year, month, i) });
  }

  // 下月开头日期，补足 42 格（6 行 × 7 列）
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: i, isCurrentMonth: false, tasks: [] });
  }

  return days;
});

function prevMonth() {
  currentDate.value = new Date(calendarYear.value, calendarMonth.value - 1, 1);
}

function nextMonth() {
  currentDate.value = new Date(calendarYear.value, calendarMonth.value + 1, 1);
}

function prevYear() {
  currentDate.value = new Date(calendarYear.value - 1, calendarMonth.value, 1);
}

function nextYear() {
  currentDate.value = new Date(calendarYear.value + 1, calendarMonth.value, 1);
}

function goToToday() {
  currentDate.value = new Date();
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

/* ------------------- 定时任务表格 ------------------- */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.timer-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.timer-table thead tr {
  border-bottom: 1px solid var(--color-border);
}

.timer-table th {
  padding: 10px 12px;
  text-align: left;
  font-weight: 500;
  color: var(--color-muted);
  white-space: nowrap;
}

.timer-table tbody tr {
  border-bottom: 1px solid var(--color-border);
}

.timer-table tbody tr:last-child {
  border-bottom: none;
}

.timer-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.timer-table td {
  padding: 12px;
  color: var(--color-text);
  vertical-align: middle;
  white-space: nowrap;
}

.timer-status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 22px;
  padding: 0 10px;
  border-radius: 11px;
  font-size: 12px;
  line-height: 1;
}

.timer-status-badge.status-enabled {
  color: var(--color-success);
  background: rgba(82, 196, 26, 0.2);
}

.timer-status-badge.status-disabled {
  color: var(--color-danger);
  background: rgba(255, 77, 79, 0.2);
}

.timer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ------------------- 控制日历 ------------------- */
.calendar-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-text {
  background: transparent;
  color: var(--color-text);
  width: 28px;
  padding: 0;
  font-size: 14px;
}

.btn-text:hover {
  background: rgba(255, 255, 255, 0.1);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--color-border);
  border-radius: 6px;
  overflow: hidden;
}

.calendar-weekday {
  background: var(--bg-panel);
  padding: 10px;
  text-align: center;
  font-size: 13px;
  color: var(--color-muted);
  font-weight: 500;
}

.calendar-day {
  background: var(--bg-card);
  min-height: 90px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: background 0.15s;
}

.calendar-day:hover {
  background: rgba(255, 255, 255, 0.04);
}

.calendar-day.other-month {
  opacity: 0.35;
}

.day-number {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 2px;
}

.day-tasks {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.task-tag {
  font-size: 11px;
  padding: 3px 6px;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.tag-blue {
  background: var(--color-primary);
  color: #fff;
}

.tag-green {
  background: var(--color-success);
  color: #fff;
}

.tag-red {
  background: var(--color-danger);
  color: #fff;
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
