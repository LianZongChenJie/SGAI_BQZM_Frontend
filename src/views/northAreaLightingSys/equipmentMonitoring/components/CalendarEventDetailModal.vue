<template>
  <a-modal
    v-model:open="open"
    title="事件详情"
    :footer="null"
    width="720px"
    :destroyOnClose="true"
    :maskClosable="true"
    wrapClassName="dark-tech-modal"
    @cancel="closeModal"
  >
    <!-- 顶部状态条 -->
    <!-- <div class="event-status-bar" :class="(detailData?.status || eventData?.status) === '待执行' ? 'status-pending' : 'status-done'">
      <span class="status-dot"></span>
      <span class="status-label">{{ detailData?.status || eventData?.status || '-' }}</span>
      <span class="status-divider">|</span>
      <span class="status-source">{{ sourceLabel }}</span>
    </div> -->

    <!-- Loading 遮罩 -->
    <a-spin :spinning="detailLoading" tip="加载中...">
      <!-- 详情信息 -->
      <div class="event-detail-list">
        <div class="detail-row">
          <span class="detail-label">计划名称</span>
          <span class="detail-value">{{ detailData?.planName || eventData?.planName || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">计划类型</span>
          <span class="detail-value">{{ detailData?.relType || eventData?.planType || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">操作类型</span>
          <span class="detail-value">
            <span class="operation-badge" :class="(detailData?.status || eventData?.status) === '待执行' ? 'badge-pending' : 'badge-done'">
              {{ detailData?.operationType || eventData?.operationType || '-' }}
            </span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">操作描述</span>
          <span class="detail-value">{{ eventData?.label || '-' }}</span>
        </div>
      </div>

      <!-- 执行日志 / 执行目标 表格 -->
      <div v-if="tableData.length > 0" class="detail-table-section">
        <div class="table-title">{{ tableTitle }}</div>
        <div class="table-body-wrapper">
          <table class="detail-table">
            <thead>
              <tr>
                <th v-for="col in currentColumns" :key="col.key" :style="{ width: col.width }">{{ col.title }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in tableData" :key="(row as any).id || (row as any).relId">
                <td v-for="col in currentColumns" :key="col.key">
                  <span class="cell-text" :title="(row as any)[col.key] || '-'">{{ (row as any)[col.key] || '-' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </a-spin>

    <!-- 底部关闭按钮 -->
    <div class="modal-footer">
      <a-button class="btn-close" @click="closeModal">关闭</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { getCalendarControlDetailApi } from '@/api/equipmentMonitoring';

interface CalendarEventItem {
  source: string;
  planId: number;
  planName: string;
  label: string;
  color: string;
  planType: string;
  operationType: string;
  status: string;
  dateStr: string;
}

interface LogItem {
  closeTime: string;
  id: number;
  ipAddress: string;
  name: string;
  openTime: string;
  operationBy: string;
  operationTime: string;
  operationType: string;
  operatorType: string;
  relId: number;
  relType: string;
}

interface TargetItem {
  relId: number;
  relName: string;
  relType: string;
}

interface DetailResult {
  date: string;
  executionTime: string;
  logs: LogItem[];
  operationType: string;
  planId: number;
  planName: string;
  relType: string;
  source: string;
  status: string;
  targets: TargetItem[];
}

const open = ref(false);
const eventData = ref<CalendarEventItem | null>(null);
const detailData = ref<DetailResult | null>(null);
const detailLoading = ref(false);

const sourceLabelMap: Record<string, string> = {
  PLAN: '照明计划',
  SCHEDULE: '动态任务',
  LOG: '历史记录',
};

const sourceLabel = computed(() => {
  const data = detailData.value || eventData.value;
  if (!data) return '-';
  return sourceLabelMap[(data as any).source] || (data as any).source || '-';
});

/** 优先 logs，否则 targets */
const tableData = computed(() => {
  if (!detailData.value) return [];
  const logs = detailData.value.logs;
  if (logs && logs.length > 0) return logs;
  return detailData.value.targets || [];
});

/** 当前表格类型 */
const tableType = computed<'logs' | 'targets'>(
  () => (detailData.value?.logs?.length ? 'logs' : 'targets'),
);

/** logs 列定义 */
const logColumns = [
  { key: 'name', title: '名称', width: '14%' },
  { key: 'relType', title: '类型', width: '8%' },
  { key: 'operationType', title: '操控', width: '8%' },
  { key: 'openTime', title: '开启时间', width: '16%' },
  { key: 'closeTime', title: '关闭时间', width: '16%' },
  { key: 'operationTime', title: '操作时间', width: '16%' },
  { key: 'operationBy', title: '操作人', width: '10%' },
  { key: 'ipAddress', title: 'IP', width: '12%' },
];

/** targets 列定义 */
const targetColumns = [
  { key: 'relName', title: '关联名称', width: '50%' },
  { key: 'relType', title: '关联类型', width: '50%' },
];

const currentColumns = computed(() =>
  tableType.value === 'logs' ? logColumns : targetColumns,
);

/** 表格总标题 */
const tableTitle = computed(() =>
  tableType.value === 'logs' ? '执行日志列表' : '执行目标列表',
);

async function showModal(event: CalendarEventItem) {
  eventData.value = event;
  console.log(eventData.value)
  open.value = true;
  detailData.value = null;
  detailLoading.value = true;
  try {
    const res = await getCalendarControlDetailApi({ planId: event.planId, date: event.dateStr, source: event.source});
    console.log(res)
    if (res) {
      detailData.value = res as DetailResult;
    }
  } catch (err) {
    console.error('获取日历详情失败：', err);
  } finally {
    detailLoading.value = false;
  }
}

function closeModal() {
  open.value = false;
}

defineExpose({ showModal, closeModal });
</script>

<style scoped lang="less">
/* ==================== 状态条 ==================== */
.event-status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  margin-bottom: 20px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;

  &.status-done {
    background: rgba(0, 162, 232, 0.08);
    border-left: 3px solid #00a2e8;
    color: #00a2e8;
  }

  &.status-pending {
    background: rgba(255, 77, 79, 0.08);
    border-left: 3px solid #ff4d4f;
    color: #ff4d4f;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }

  .status-divider {
    color: #303d50;
    margin: 0 2px;
  }

  .status-source {
    color: #8a9ab0;
    font-weight: 400;
  }
}

/* ==================== 详情列表 ==================== */
.event-detail-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid #1e2a3a;
  border-radius: 6px;
  overflow: hidden;
  background: #0f1a26;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid #1e2a3a;

  &:last-child {
    border-bottom: none;
  }
}

.detail-label {
  width: 80px;
  flex-shrink: 0;
  font-size: 13px;
  color: #5a6a80;
  line-height: 1.6;
}

.detail-value {
  flex: 1;
  font-size: 13px;
  color: #c0c8d4;
  line-height: 1.6;
  word-break: break-all;
}

.operation-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 3px;
  font-size: 12px;

  &.badge-done {
    background: rgba(0, 162, 232, 0.15);
    color: #00a2e8;
  }

  &.badge-pending {
    background: rgba(255, 77, 79, 0.15);
    color: #ff4d4f;
  }
}

/* ==================== 表格区域 ==================== */
.detail-table-section {
  margin-top: 16px;
  border: 1px solid #1e2a3a;
  border-radius: 6px;
  overflow: hidden;
  background: #0f1a26;
}

.table-title {
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #c0c8d4;
  border-bottom: 1px solid #1e2a3a;
  background: rgba(0, 162, 232, 0.06);
}

.table-body-wrapper {
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
}

.detail-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 12px;
}

.detail-table thead tr {
  border-bottom: 1px solid #1e2a3a;
}

.detail-table th {
  padding: 8px 12px;
  text-align: left;
  font-weight: 500;
  color: #5a6a80;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.02);
}

.detail-table tbody tr {
  border-bottom: 1px solid #1e2a3a;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
}

.detail-table td {
  padding: 8px 12px;
  color: #c0c8d4;
  vertical-align: middle;
}

.detail-table .cell-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==================== 底部按钮 ==================== */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  margin: 20px -24px -24px;
  border-top: 1px solid #303d50;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -1px;
    left: 24px;
    right: 24px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 162, 232, 0.4), transparent);
  }

  :deep(.ant-btn) {
    height: 34px;
    padding: 0 20px;
    border-radius: 4px;
    font-size: 13px;
    transition: all 0.2s;
  }

  .btn-close {
    background: linear-gradient(135deg, #00a2e8, #0080c0) !important;
    border: none !important;
    color: #ffffff !important;

    &:hover {
      background: linear-gradient(135deg, #0090cf, #0070a8) !important;
      box-shadow: 0 0 12px rgba(0, 162, 232, 0.35);
    }
  }
}
</style>

<style lang="less">
/* 复用全局 Modal 深色主题（与 addModal 保持一致） */
.dark-tech-modal {
  .ant-modal-content {
    background: #141d2b !important;
    border: 1px solid #303d50 !important;
    border-radius: 8px !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(0, 162, 232, 0.08) !important;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, #00a2e8, transparent);
      opacity: 0.6;
    }
  }

  .ant-modal-header {
    background: #1b2533 !important;
    border-bottom: 1px solid #303d50 !important;
    padding: 18px 24px 14px !important;
    border-radius: 8px 8px 0 0 !important;
  }

  .ant-modal-title {
    color: #ffffff !important;
    font-size: 16px !important;
    font-weight: 600 !important;
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif !important;
    letter-spacing: 0.5px !important;
  }

  .ant-modal-close {
    color: #a0aabf !important;
    top: 18px !important;
    right: 20px !important;
    width: 28px !important;
    height: 28px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 4px !important;
    transition: all 0.2s !important;

    &:hover {
      color: #ffffff !important;
      background: rgba(255, 255, 255, 0.08) !important;
    }
  }

  .ant-modal-body {
    padding: 20px 24px 24px !important;
    background: #141d2b !important;
  }

  .ant-modal-footer {
    display: none !important;
  }
}
</style>
