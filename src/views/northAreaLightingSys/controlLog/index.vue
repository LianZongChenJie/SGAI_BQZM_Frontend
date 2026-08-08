<template>
  <div class="page-container">
    <div class="log-card">
      <div class="card-header">
        <span class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="22" height="22">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </span>
        <h2 class="card-title">操作日志</h2>
      </div>
      <!-- 查询条件 -->
      <div class="filter-bar">
        <div class="filter-item">
          <label class="filter-label">操作时间</label>
          <a-range-picker
            v-model:value="dateRange"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']"
            class="filter-date-picker"
          />
        </div>
        <div class="filter-item">
          <label class="filter-label">操作类型</label>
          <select v-model="operationType" class="select">
            <option value="">全部</option>
            <option value="开">开启</option>
            <option value="关">关闭</option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">名称</label>
          <el-input
            v-model="nameInput"
            placeholder="请输入名称"
            clearable
            class="filter-input"
            @keyup.enter="onSearch"
          />
        </div>
        <div class="filter-item">
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </div>
      </div>
      <div class="table-wrapper">
        <table class="log-table">
          <colgroup>
            <col style="width: 150px;" />
            <col style="width: 70px;" />
            <col style="width: 180px;" />
            <col style="width: 80px;" />
            <col style="width: 80px;" />
            <col style="width: 100px;" />
            <col style="width: 80px;" />
          </colgroup>
          <thead>
            <tr>
              <th>操作时间</th>
              <th>类型</th>
              <th>名称</th>
              <th>操作状态</th>
              <th>触发类型</th>
              <th>操作人员</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in tableData" :key="item.id || index">
              <td>{{ item.operationTime }}</td>
              <td>{{ item.relType }}</td>
              <td class="cell-wrap">{{ item.name }}</td>
              <td class="cell-wrap">{{ item.operationType === '开' ? '开启' : item.operationType === '关' ? '关闭' : '-'}}</td>
              <td>{{ item.operatorType }}</td>
              <td>{{ item.operationBy }}</td>
              <td>
                <el-button type="primary" link size="small" @click="onDetail(item)">详情</el-button>
              </td>
            </tr>
            <tr v-if="!loading && tableData.length === 0">
              <td colspan="7" style="text-align: center; padding: 24px;">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- 分页 -->
      <div class="pagination-bar">
        <span class="pagination-info">共 {{ total }} 条</span>
        <button
          class="pagination-btn"
          :disabled="currentPage <= 1"
          @click="onPageChange(currentPage - 1)"
        >上一页</button>
        <span class="pagination-current">{{ currentPage }} / {{ Math.ceil(total / pageSize) || 1 }}</span>
        <button
          class="pagination-btn"
          :disabled="currentPage >= Math.ceil(total / pageSize)"
          @click="onPageChange(currentPage + 1)"
        >下一页</button>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <a-modal
      v-model:open="detailVisible"
      title="操作日志详情"
      width="680px"
      :footer="null"
      wrapClassName="control-log-detail-modal"
      :getContainer="false"
      @cancel="closeDetail"
    >
      <!-- 标题信息 -->
      <section class="modal-title">
        <div class="title-left">
          <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <div class="title-text">
            <span class="title-label">名称</span>
            <span class="title-value">{{ detailData?.name || detailRecord?.name || '-' }}</span>
          </div>
        </div>
        <div class="title-meta">
          <span>类型：{{ detailData?.relType || detailRecord?.relType || '-' }}</span>
          <span>操作类型：{{ detailData?.operationType === '开' ? '开启' : detailData?.operationType === '关' ? '关闭' : '-'}}</span>
          <span>操作人员：{{ detailData?.operationBy || detailRecord?.operationBy || '-' }}</span>
          <span>操作时间：{{ detailData?.operationTime || detailRecord?.operationTime || '-' }}</span>
        </div>
      </section>

      <!-- 详情列表 -->
      <section class="table-container" v-loading="detailLoading">
        <table class="device-table">
          <colgroup>
            <col style="width: 60px;" />
            <col />
            <col style="width: 90px;" />
            <col style="width: 90px;" />
            <col style="width: 90px;" />
          </colgroup>
          <thead>
            <tr>
              <th>序号</th>
              <th>回路名称</th>
              <th>类型</th>
              <th>操作类型</th>
              <th>操作人员</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in circuitDetailList" :key="idx">
              <td>{{ idx + 1 }}</td>
              <td class="ellipsis-cell" :title="item.name">{{ item.name || '-' }}</td>
              <td>{{ item.relType || '-' }}</td>
              <td>{{ item.operationType === '开' ? '开启' : item.operationType === '关' ? '关闭' : '-'}}</td>
              <td>{{ item.operationBy || '-' }}</td>
            </tr>
            <tr v-if="circuitDetailList.length === 0">
              <td colspan="6" style="text-align: center; padding: 24px; color: #8fa3bf;">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div class="modal-footer">
        <a-button class="btn-cancel" @click="closeDetail">关闭</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { controlRecordListApi, getLogDetailApi } from '@/api/equipmentMonitoring';

const loading = ref(false);
const tableData = ref<any[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

/** 查询条件 */
const dateRange = ref<[string, string] | null>(null);
const operationType = ref('');
const nameInput = ref('');

/** 加载控制记录数据 */
async function fetchData() {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      pageNo: currentPage.value,
      pageSize: pageSize.value,
    };
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0] + ' 00:00:00';
      params.endTime = dateRange.value[1] + ' 23:59:59';
    }
    if (operationType.value) {
      params.operationType = operationType.value;
    }
    if (nameInput.value) {
      params.name = nameInput.value;
    }
    const res = await controlRecordListApi(params);
    console.log('控制记录数据：', res);
    if (res?.records) {
      tableData.value = res.records.map((item: any, idx: number) => ({
        ...item,
        operatorType: item.operatorType,
      }));
      total.value = res.total ?? res.records.length;
    } else {
      tableData.value = [];
      total.value = 0;
    }
  } catch (err) {
    console.error('获取控制记录失败：', err);
    tableData.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

/** 查询 */
function onSearch() {
  currentPage.value = 1;
  fetchData();
}

/** 重置 */
function onReset() {
  dateRange.value = null;
  operationType.value = '';
  nameInput.value = '';
  currentPage.value = 1;
  fetchData();
}

/** 分页切换 */
function onPageChange(page: number) {
  currentPage.value = page;
  fetchData();
}

/** 详情弹窗 */
const detailVisible = ref(false);
const detailRecord = ref<any>(null);
const detailData = ref<any>(null);
const detailLoading = ref(false);

/** 详情列表：优先使用 children，为空则用主记录包裹成数组 */
const circuitDetailList = computed(() => {
  if (!detailData.value) return [];
  const children = detailData.value.children;
  if (Array.isArray(children) && children.length > 0) {
    return children;
  }
  return [detailData.value];
});

function onDetail(item: any) {
  detailRecord.value = item;
  detailData.value = null;
  detailVisible.value = true;
  detailLoading.value = true;
  getLogDetailApi({ id: item.id }).then((res: any) => {
    console.log(res)
    detailData.value = res ?? null;
  }).catch((err) => {
    console.error('获取日志详情失败：', err);
  }).finally(() => {
    detailLoading.value = false;
  });
}

function closeDetail() {
  detailVisible.value = false;
  detailRecord.value = null;
  detailData.value = null;
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="less">
.page-container {
  --bg: #0f172a;
  --panel: #1e293b;
  // --accent: #0ea5e9;
  // --accent2: #10b981;
  // --accent3: #f59e0b;
  --danger: #ef4444;
  --text: #f1f5f9;
  --text2: #94a3b8;
  --border: #334155;
  --radius: 8px;
  --primary: #0ea5e9;

  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  padding: 20px;
  background: var(--bg);
}

.log-card {
  background: var(--panel);
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 100px);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.header-icon {
  display: flex;
  align-items: center;
  margin-right: 10px;
  color: #ffffff;
}

.card-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
}

.filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;

  // 重置按钮深色主题
  :deep(.el-button:not(.el-button--primary)) {
    background-color: var(--panel);
    border-color: rgba(255, 255, 255, 0.45);
    color: #ffffff;

    &:hover {
      border-color: rgba(255, 255, 255, 0.8);
      color: #ffffff;
    }
  }
}

.filter-label {
  font-size: 14px;
  color: var(--text2);
  white-space: nowrap;
}

.filter-input {
  width: 180px;

  :deep(.el-input__wrapper) {
    background-color: transparent;
    box-shadow: none;
    border: 1px solid rgba(255, 255, 255, 0.55);
    border-radius: 4px;
    height: 36px;

    &:hover {
      border-color: rgba(255, 255, 255, 0.85);
    }
  }

  :deep(.el-input__inner) {
    color: #ffffff;
    font-size: 13px;
    height: 34px;

    &::placeholder {
      color: rgba(255, 255, 255, 0.55);
    }
  }
}

// 原生 select 样式（参照 equipmentManagement）
.select {
  width: 140px;
  height: 36px;
  padding: 0 28px 0 12px;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 4px;
  color: #ffffff;
  font-size: 13px;
  cursor: pointer;
  outline: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px;

  option {
    background: var(--bg);
    color: #ffffff;
  }
}

.filter-date-picker {
  width: 260px;

  // Ant Design RangePicker 根元素
  :deep(.ant-picker) {
    height: 36px;
    background-color: transparent;
    box-shadow: none;
    border: 1px solid rgba(255, 255, 255, 0.55);
    border-radius: 4px;
    font-size: 13px;
    padding: 0 11px;

    &:hover {
      border-color: rgba(255, 255, 255, 0.85);
      box-shadow: none;
    }

    &.ant-picker-focused {
      border-color: rgba(255, 255, 255, 0.85);
      box-shadow: none;
    }

    .ant-picker-input {
      input {
        background-color: transparent;
        color: #ffffff;
        font-size: 13px;

        &::placeholder {
          color: rgba(255, 255, 255, 0.55);
        }
      }
    }

    .ant-picker-range-separator {
      color: rgba(255, 255, 255, 0.7);

      .ant-picker-separator {
        color: rgba(255, 255, 255, 0.7);
      }
    }

    .ant-picker-suffix,
    .ant-picker-clear {
      color: rgba(255, 255, 255, 0.7);
      background: transparent;
    }
  }
}


.table-wrapper {
  overflow-x: auto;
  flex: 1;
}

.log-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 14px;

  thead {
    tr {
      th {
        padding: 12px 14px;
        text-align: left;
        color: var(--text2);
        font-weight: 500;
        border-bottom: 1px solid var(--border);
        white-space: nowrap;
        font-size: 13px;
      }
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid var(--border);
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      &:nth-child(even) {
        background: rgba(255, 255, 255, 0.02);
      }

      td {
        padding: 14px;
        color: var(--text);
        font-size: 14px;
        vertical-align: middle;
        white-space: nowrap;

        // 长文本列：自动换行
        &.cell-wrap {
          white-space: normal;
          word-break: break-all;
          line-height: 1.6;
        }
      }
    }
  }
}

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
  color: var(--text2);
  margin-right: 8px;
}

.pagination-btn {
  padding: 4px 12px;
  font-size: 13px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #38bdf8;
  color: #38bdf8 !important;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-current {
  font-size: 13px;
  color: var(--text);
  font-weight: 600;
}

// 详情弹窗 - 科技风
.modal-title {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(0, 162, 232, 0.05);
  border-left: 3px solid #00a2e8;
  border-radius: 0 6px 6px 0;
  margin-bottom: 16px;

  .title-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .title-icon {
    width: 22px;
    height: 22px;
    color: #00a2e8;
    flex-shrink: 0;
  }

  .title-text {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  .title-label {
    color: #8a9ab0;
    font-weight: 400;
  }

  .title-value {
    color: #00c6ff;
    font-weight: 600;
    font-size: 15px;
  }

  .title-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    color: #8a9ab0;
    font-size: 12px;
    padding-left: 34px;
  }
}

.table-container {
  position: relative;
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.06);
    border-radius: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 212, 255, 0.5);
    border-radius: 6px;

    &:hover {
      background: rgba(0, 212, 255, 0.8);
    }
  }
}

.device-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  thead {
    position: sticky;
    top: 0;
    z-index: 1;
  }

  th,
  td {
    padding: 10px 12px;
    text-align: left;
    font-size: 13px;
    white-space: nowrap;
  }

  thead th {
    color: #a0aabf;
    font-weight: 500;
    border-bottom: 1px solid #303d50;
    user-select: none;
    background: #0f1823;
  }

  tbody td {
    color: #ffffff;
    border-bottom: 1px solid #303d50;
    vertical-align: middle;
  }

  .ellipsis-cell {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }


  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr:hover {
    background: rgba(255, 255, 255, 0.03);
  }
}

// 状态指示器 —— 图标与文字分离，灰色系
.status-badge-fu-cu {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  line-height: 1;
}

.status-badge-fu-cu .status-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
}

.status-badge-fu-cu .status-text {
  line-height: 1;
}

.status-badge-fu-cu.online {
  color: rgb(244, 234, 42);
}

.status-badge-fu-cu.online .status-icon {
  filter: none;
}

.status-badge-fu-cu.offline {
  color: #8a99ab;
}

.status-badge-fu-cu.offline .status-icon {
  filter: grayscale(1) brightness(1.4) contrast(0.8);
}

// 底部按钮
.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid #303d50;
}

.btn-cancel {
  background: transparent !important;
  border: 1px solid #303d50 !important;
  color: #a0aabf !important;
  height: 34px;
  padding: 0 20px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    border-color: #5a6a80 !important;
    color: #ffffff !important;
    background: rgba(255, 255, 255, 0.04) !important;
  }
}

/* ==================== 详情 Modal 覆盖（深色科技风） ==================== */
:deep(.control-log-detail-modal) {
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
  }

  .ant-modal-close {
    color: #a0aabf !important;
    top: 18px !important;
    right: 20px !important;

    &:hover {
      color: #ffffff !important;
      background: rgba(255, 255, 255, 0.08) !important;
    }
  }

  .ant-modal-body {
    padding: 20px 24px 24px !important;
    background: #141d2b !important;
  }
}
</style>

<style>
/* 原生 option 在浏览器 OS 层渲染，scoped 无法覆盖，需非 scoped */
.page-container .select option {
  background: var(--bg) !important;
  color: #ffffff !important;
}
</style>

