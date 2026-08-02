<template>
  <section class="page-wrapper">
    <!-- 顶部 Tab 导航 -->
    <nav class="tab-nav">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="handleTabChange(tab.key)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div class="page-content" v-loading="pageLoading">
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
        <section class="panel panel-scene">
          <header class="panel-header panel-header--fixed">
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
                  <!-- <span class="scene-icon">{{ s.icon }}</span> -->
                  <span class="scene-name">{{ s.name }}</span>
                </div>
                <!-- <span v-if="s.isDefault" class="scene-default-tag">默认</span> -->
              </div>
              <p class="scene-circuits">包含 {{ s.circuitCount }} 个{{ s.relType }}</p>
              <p class="scene-desc">{{ s.desc }}</p>
              <div class="scene-actions">
                <button class="btn btn-primary" @click="onExecute(s)">开启</button>
                <button class="btn btn-danger" @click="onDeleteScene(s)">关闭</button>
                <button class="btn btn-secondary" @click="onEditScene(s)">详情</button>
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

          <!-- 搜索栏 -->
          <section class="filter-bar">
            <div class="filter-left">
              <a-select
                v-model:value="timerFilters.relType"
                placeholder="控制类型"
                :options="relTypeFilterOptions"
                allowClear
                style="width: 140px"
              />
              <a-time-picker
                v-model:value="timerFilters.startTime"
                placeholder="开始时间"
                format="HH:mm:ss"
                style="width: 160px"
              />
              <span class="filter-separator">—</span>
              <a-time-picker
                v-model:value="timerFilters.endTime"
                placeholder="结束时间"
                format="HH:mm:ss"
                style="width: 160px"
              />
              <button class="btn btn-primary" @click="onTimerSearch">查询</button>
              <button class="btn btn-outline" @click="onTimerReset">重置</button>
            </div>
          </section>

          <!-- 表格 -->
          <div class="table-wrapper" v-loading="timerLoading">
            <table class="timer-table">
              <thead>
                <tr>
                  <th style="width: 5%">序号</th>
                  <th style="width: 5%">类型</th>
                  <th style="width: 22%">名称</th>
                  <th style="width: 9%">时间</th>
                  <th style="width: 20%">时间范围</th>
                  <th style="width: 7%">周期</th>
                  <th style="width: 10%">控制指令</th>
                  <th style="width: 7%">状态</th>
                  <th style="width: 15%">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in timerList" :key="row.id">
                  <td>{{ (timerCurrentPage - 1) * timerPageSize + idx + 1 }}</td>
                  <td>{{ row.relType }}</td>
                  <td>{{ row.planName }}</td>
                  <td>{{ row.executionLocalTime || row.executionTime }}</td>
                  <td>{{ row.date }}</td>
                  <td>{{ row.weeks }}</td>
                  <td>{{ row.operationType }}</td>
                  <td>
                    <span
                      class="timer-status-badge"
                      :class="row.status === '启用' ? 'status-enabled' : 'status-disabled'"
                    >{{ row.status }}</span>
                  </td>
                  <td class="timer-actions">
                    <button v-if="row.status === '禁用'" class="btn btn-secondary" @click="onEditTimer(row, 'edit')">编辑</button>
                    <button v-else class="btn btn-secondary" @click="onEditTimer(row, 'detail')">详情</button>
                   
                    <a-popconfirm
                      v-if="row.status !== '启用'"
                      title="确认删除该条数据？"
                      ok-text="确定"
                      cancel-text="取消"
                      @confirm="handleDelete(row)"
                    >
                      <button class="btn btn-danger">删除</button>
                    </a-popconfirm>

                    <button
                      v-if="row.status != '启用'"
                      class="btn btn-success"
                      @click="onToggleTimer(row)"
                    >启用</button>
                     <template v-else>
                      <a-popconfirm title="确认禁用该条计划？" ok-text="确定" cancel-text="取消" @confirm="handleDisable(row)">
                        <button
                          class="btn btn-danger"
                        >禁用</button>
                      </a-popconfirm>
                    </template>
                   
                    <a-popconfirm
                      v-if="row.status == '启用'"
                      title="确认立即执行该条计划？"
                      ok-text="确定"
                      cancel-text="取消"
                      @confirm="handleExecuteNow(row)"
                    >
                      <button
                      class="btn btn-success"
                    >立即执行</button>
                    </a-popconfirm>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页 -->
          <div class="pagination-bar">
            <span class="pagination-info">共 {{ timerTotal }} 条</span>
            <button
              class="pagination-btn"
              :disabled="timerCurrentPage <= 1"
              @click="onTimerPageChange(timerCurrentPage - 1)"
            >上一页</button>
            <span class="pagination-current">{{ timerCurrentPage }} / {{ Math.ceil(timerTotal / timerPageSize) || 1 }}</span>
            <button
              class="pagination-btn"
              :disabled="timerCurrentPage >= Math.ceil(timerTotal / timerPageSize)"
              @click="onTimerPageChange(timerCurrentPage + 1)"
            >下一页</button>
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
                  v-for="record in cell.records"
                  :key="record.id"
                  class="task-tag"
                  :class="getRecordTagClass(record.operationType)"
                  :title="`${record.timeStr} ${record.name} ${record.operationType} ${record.operationBy}`"
                >
                  {{ record.timeStr }} {{ record.operationType }}
                </span>
                <span v-if="cell.overflow > 0" class="task-tag tag-more">
                  +{{ cell.overflow }}
                </span>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </section>
  <createNewSceneModal ref="createNewSceneModalRef" @success="createNewSceneModalSuccess"></createNewSceneModal>
  <createNewTimerModal ref="createNewTimerModalRef" @success="createNewTimerModalSuccess"></createNewTimerModal>
  <TimerEnableModal ref="timerEnableModalRef" @success="onTimerEnableSuccess"></TimerEnableModal>
  <sceneConfirmModal ref="sceneConfirmModalRef" @success="onSceneConfirmSuccess"></sceneConfirmModal>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import type { Dayjs } from 'dayjs';
import createNewSceneModal from './components/createNewSceneModal.vue';
import createNewTimerModal from './components/createNewTimerModal.vue';
import TimerEnableModal from './components/TimerEnableModal.vue';
import sceneConfirmModal from './components/sceneConfirmModal.vue';
import { getLightingPlanAPi, deleteLightingPlanAPi, disableApi, executeNow, controlRecordListApi } from '@/api/equipmentMonitoring';
import { message } from 'ant-design-vue';

// 定时任务 src\views\bems\lightingControl\components\TimingControl.vue

const createNewSceneModalRef = ref<InstanceType<typeof createNewSceneModal>>();
const createNewTimerModalRef = ref<InstanceType<typeof createNewTimerModal>>();
const timerEnableModalRef = ref<InstanceType<typeof TimerEnableModal>>();
const sceneConfirmModalRef = ref<InstanceType<typeof sceneConfirmModal>>();

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
const sceneList = ref<any[]>([]);

/* --------------------- Loading --------------------- */
const pageLoading = ref(false);

/* --------------------- 事件 --------------------- */
/** Tab 切换事件 */
async function handleTabChange(key: string) {
  if (activeTab.value === key) return;
  activeTab.value = key;

  if (key === 'scene') {
    pageLoading.value = true;
    try {
      await fetchSceneList();
    } finally {
      await nextTick();
      setTimeout(() => {
        pageLoading.value = false;
      }, 200);
    }
  } else if (key === 'timer') {
    await fetchTimerList();
  } else if (key === 'calendar') {
    await fetchCalendarRecords();
  }
}

/* ---------- 场景配置事件 ---------- */
function onAddScene() {
  console.log('新建场景');
  createNewSceneModalRef.value?.showModal('add');
}
function onEditScene(s) {
  createNewSceneModalRef.value?.showModal('detail', s);
}
// 新建场景--回调
const createNewSceneModalSuccess = async () =>{
  // 刷新场景列表
  pageLoading.value = true;
  try {
    await fetchSceneList();
    // TODO: 其他 tab 的接口请求
  } finally {
    await nextTick();
    setTimeout(() => {
      pageLoading.value = false;
    }, 200);
  }
}

/** 获取场景配置列表 */
async function fetchSceneList() {
  try {
    const params = {
      pageNo: 1,
      pageSize: 999
    };
    const data = await getLightingPlanAPi(params);
    console.log('场景配置列表：', data);
    if (data?.records) {
      sceneList.value = (data.records as any[]).map((item) => {
        const relCount = item.relIds ? item.relIds.split(',').length : 0;
        const iconMap: Record<string, string> = {
          开启: '💡',
          关闭: '🔌',
        };
        return {
          ...item,
          id: item.id,
          name: item.planName || '',
          icon: iconMap[item.operationType] || '⚙️',
          circuitCount: relCount,
          desc: `控制类型 · ${item.relType || '-'}`,
          isDefault: item.sort === 1,
          relType: item.relType,
        };
      });
    }
  } catch (err) {
    console.error('获取场景配置列表失败：', err);
  }
}

function onRefreshVideo() {
  console.log('刷新视频');
}

function onToggle(c: typeof circuitList.value[0]) {
  c.status = c.status === '开启' ? '关闭' : '开启';
  console.log('切换状态', c.name, c.status);
}


function onExecute(s) {
  sceneConfirmModalRef.value?.showModal('execute', s);
}

function onDeleteScene(s) {
  sceneConfirmModalRef.value?.showModal('delete', s);
}


/** 二次确认回调 */
function onSceneConfirmSuccess(payload: { type: string; scene: any }) {
  console.log('场景确认回调：', payload.type, payload.scene);
  if (payload.type === 'execute') {
    // TODO: 调用执行场景接口
  } else if (payload.type === 'delete') {
    // TODO: 调用关闭场景接口
  }
}

/* --------------------- 定时任务数据 --------------------- */
const timerList = ref<any[]>([]);
const timerLoading = ref(false);
const timerCurrentPage = ref(1);
const timerPageSize = ref(10);
const timerTotal = ref(0);

const timerFilters = ref({
  relType: undefined as string | undefined,
  startTime: null as Dayjs | null,
  endTime: null as Dayjs | null,
});

const relTypeFilterOptions = [
  { label: '回路', value: '回路' },
  { label: '区域', value: '区域' },
];

const weekDayMap: Record<string, string> = {
  '1': '周一', '2': '周二', '3': '周三', '4': '周四',
  '5': '周五', '6': '周六', '7': '周日',
};

/** 获取定时控制列表 */
async function fetchTimerList() {
  timerLoading.value = true;
  try {
    const params: Record<string, any> = {
      pageNo: timerCurrentPage.value,
      pageSize: timerPageSize.value,
    };
    if (timerFilters.value.relType) params.relType = timerFilters.value.relType;
    if (timerFilters.value.startTime) params.startTime = timerFilters.value.startTime.format('HH:mm:ss');
    if (timerFilters.value.endTime) params.endTime = timerFilters.value.endTime.format('HH:mm:ss');

    const data = await getLightingPlanAPi(params);
    console.log('定时控制列表：', data);
    if (data?.records) {
      timerList.value = (data.records as any[]).map((item) => ({
        ...item,
        id: item.id,
        planName: item.planName || '',
        relType: item.relType || '',
        executionTime: item.executionTime || '',
        executionLocalTime: item.executionLocalTime || '',
        operationType: item.operationType || '',
        status: item.status || '',
        date: item.executionInfo
          ? `${item.executionInfo.startDate || ''} ~ ${item.executionInfo.endDate || ''}`
          : '',
        weeks: item.executionInfo?.enabledWeek
          ? item.executionInfo.enabledWeek
              .split(',')
              .map((d: string) => weekDayMap[d.trim()] || d.trim())
              .join('、')
          : '',
      }));
      timerTotal.value = data.total ?? data.records.length;
    } else {
      timerList.value = [];
      timerTotal.value = 0;
    }
  } catch (err) {
    console.error('获取定时控制列表失败：', err);
    timerList.value = [];
    timerTotal.value = 0;
  } finally {
    await nextTick();
    setTimeout(() => {
      timerLoading.value = false;
    }, 200);
  }
}

/* ---------- 定时任务事件 ---------- */
function onAddTimer() {
  createNewTimerModalRef.value?.showModal('add');
}

function onEditTimer(row ,type) {
  console.log('编辑--详情定时任务', row.planName);
  createNewTimerModalRef.value?.showModal(type, row);
}

function onToggleTimer(row) {
  timerEnableModalRef.value?.showModal(row);
}
const handleDisable = async (row) => {
   console.log('切换定时任务状态--禁用', row.planName, row.status);
    await disableApi({
      id: row.id,
    }).then((res) => {
      console.log('禁用定时任务成功', res);
      message.success('禁用成功！');
    });
    await onTimerSearch();
}
// 立即执行
const handleExecuteNow = async (row) => {
   await executeNow({
      id: row.id,
    }).then((res) => {
      console.log('立即执行成功！', res);
    });
    // 刷新
    await onTimerSearch();
}
// 删除
const handleDelete = async (record) => {
    await deleteLightingPlanAPi({
      id: record.id,
    }).then((res) => {
      console.log('删除定时任务成功', res);
    });
    // 刷新
    await onTimerSearch();
  };
/** 新建定时任务成功回调 */
async function createNewTimerModalSuccess() {
  await onTimerSearch();
}

/** 启用定时任务成功回调 */
async function onTimerEnableSuccess() {
  await onTimerSearch();
}

function onTimerSearch() {
  timerCurrentPage.value = 1;
  fetchTimerList();
}

function onTimerReset() {
  timerFilters.value = {
    relType: undefined,
    startTime: null,
    endTime: null,
  };
  timerCurrentPage.value = 1;
  fetchTimerList();
}

function onTimerPageChange(page: number) {
  timerCurrentPage.value = page;
  fetchTimerList();
}

/* --------------------- 控制日历 --------------------- */
const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const currentDate = ref(new Date(2026, 5, 1)); // 默认显示 2026年6月

const calendarYear = computed(() => currentDate.value.getFullYear());
const calendarMonth = computed(() => currentDate.value.getMonth());

interface CalendarRecordItem {
  id: number;
  name: string;
  relType: string;
  operationType: string;
  operationTime: string;
  operationBy: string;
  timeStr: string;
}

interface CalendarCell {
  date: number;
  isCurrentMonth: boolean;
  records: CalendarRecordItem[];
  overflow: number;
}

const calendarRecords = ref<CalendarRecordItem[]>([]);

/** 根据操作类型返回 tag 颜色类 */
function getRecordTagClass(operationType: string) {
  if (operationType.includes('关') || operationType.includes('停')) return 'tag-red';
  if (operationType.includes('开') || operationType.includes('启')) return 'tag-blue';
  return 'tag-green';
}

/** 获取控制日历操作记录 */
async function fetchCalendarRecords() {
  if (activeTab.value !== 'calendar') return;
  const year = calendarYear.value;
  const month = calendarMonth.value;
  const pad = (n: number) => String(n).padStart(2, '0');
  const startTime = `${year}-${pad(month + 1)}-01 00:00:00`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endTime = `${year}-${pad(month + 1)}-${pad(lastDay)} 23:59:59`;

  try {
    const res = await controlRecordListApi({
      pageNo: 1,
      pageSize: 1000,
      startTime,
      endTime,
    });
    calendarRecords.value = (res.records || []).map((r: any) => ({
      ...r,
      timeStr: r.operationTime ? r.operationTime.split(' ')[1].substring(0, 5) : '',
    }));
  } catch (err) {
    console.error('获取控制日历记录失败：', err);
  }
}

const calendarDays = computed<CalendarCell[]>(() => {
  const year = calendarYear.value;
  const month = calendarMonth.value;

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0=周日

  const days: CalendarCell[] = [];
  const pad = (n: number) => String(n).padStart(2, '0');

  // 上月末尾日期
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({ date: prevMonthLastDay - i, isCurrentMonth: false, records: [], overflow: 0 });
  }

  // 当月日期
  for (let i = 1; i <= daysInMonth; i++) {
    const dateKey = `${year}-${pad(month + 1)}-${pad(i)}`;
    const dayRecords = calendarRecords.value.filter(
      (r) => r.operationTime && r.operationTime.startsWith(dateKey),
    );
    days.push({
      date: i,
      isCurrentMonth: true,
      records: dayRecords.slice(0, 4),
      overflow: dayRecords.length > 4 ? dayRecords.length - 4 : 0,
    });
  }

  // 下月开头日期，补足 42 格（6 行 × 7 列）
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: i, isCurrentMonth: false, records: [], overflow: 0 });
  }

  return days;
});

function prevMonth() {
  currentDate.value = new Date(calendarYear.value, calendarMonth.value - 1, 1);
  fetchCalendarRecords();
}

function nextMonth() {
  currentDate.value = new Date(calendarYear.value, calendarMonth.value + 1, 1);
  fetchCalendarRecords();
}

function prevYear() {
  currentDate.value = new Date(calendarYear.value - 1, calendarMonth.value, 1);
  fetchCalendarRecords();
}

function nextYear() {
  currentDate.value = new Date(calendarYear.value + 1, calendarMonth.value, 1);
  fetchCalendarRecords();
}

function goToToday() {
  currentDate.value = new Date();
  fetchCalendarRecords();
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

  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: calc(100vh - 60px);
  padding: 16px;
  overflow: hidden;
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
  flex-shrink: 0;
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
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
.btn-outline {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-outline:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
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
/* 场景面板：撑满 page-content，内部 flex 列布局 */
.panel-scene {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 固定 panel-header 不跟随滚动 */
.panel-header--fixed {
  flex-shrink: 0;
  margin-bottom: 12px;
}

.scene-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  align-content: start;
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

/* ------------------- 定时任务搜索栏 ------------------- */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-separator {
  color: var(--color-muted);
  flex-shrink: 0;
}

/* 搜索栏时间选择器深色适配 */
.filter-bar :deep(.ant-picker) {
  background: var(--bg-card) !important;
  border-color: var(--color-border) !important;
}

.filter-bar :deep(.ant-picker-input > input) {
  color: var(--color-text) !important;
}

.filter-bar :deep(.ant-picker-input > input::placeholder) {
  color: var(--color-muted) !important;
}

.filter-bar :deep(.ant-picker-suffix) {
  color: var(--color-muted) !important;
}

.filter-bar :deep(.ant-picker-clear) {
  background: var(--bg-card) !important;
  color: var(--color-muted) !important;
}

/* 搜索栏 a-select 深色适配 */
.filter-bar :deep(.ant-select-selector) {
  background: var(--bg-card) !important;
  border-color: var(--color-border) !important;
  color: var(--color-text) !important;
}

.filter-bar :deep(.ant-select-selection-item) {
  color: var(--color-text) !important;
}

.filter-bar :deep(.ant-select-selection-placeholder) {
  color: var(--color-muted) !important;
}

.filter-bar :deep(.ant-select-arrow) {
  color: var(--color-muted) !important;
}

/* ------------------- 分页 ------------------- */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 0 4px;
  user-select: none;
}

.pagination-info {
  font-size: 13px;
  color: var(--color-muted);
  margin-right: 8px;
}

.pagination-btn {
  padding: 4px 12px;
  font-size: 13px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--bg-card);
  color: var(--color-text);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-current {
  font-size: 13px;
  color: var(--color-text);
  font-weight: 600;
}

/* ------------------- 定时任务表格 ------------------- */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.timer-table {
  width: 100%;
  table-layout: fixed;
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

.tag-more {
  background: var(--color-muted);
  color: #fff;
  cursor: pointer;
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
