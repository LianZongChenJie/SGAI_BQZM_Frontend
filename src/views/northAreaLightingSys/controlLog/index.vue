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
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            :teleported="false"
            class="filter-date-picker"
          />
        </div>
        <div class="filter-item">
          <label class="filter-label">操作类型</label>
          <select v-model="operationType" class="select">
            <option value="">全部</option>
            <option value="开">开</option>
            <option value="关">关</option>
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
              <td class="cell-wrap">{{ item.operationType }}</td>
              <td>{{ item.triggerType || (index % 2 === 0 ? '场景' : '定时') }}</td>
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
      wrapClassName="dark-tech-modal"
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
            <span class="title-value">{{ detailRecord?.name || '-' }}</span>
          </div>
        </div>
        <div class="title-meta">
          <span>操作类型：{{ detailRecord?.operationType || '-' }}</span>
          <span>操作人员：{{ detailRecord?.operationBy || '-' }}</span>
        </div>
      </section>

      <!-- 回路列表 -->
      <section class="table-container">
        <table class="device-table">
          <colgroup>
            <col style="width: 60px;" />
            <col />
            <col style="width: 100px;" />
          </colgroup>
          <thead>
            <tr>
              <th>序号</th>
              <th>回路名称</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in circuitMockData" :key="idx">
              <td>{{ idx + 1 }}</td>
              <td>{{ item.circuitName }}</td>
              <td>
                <div
                  class="status-badge"
                  :class="{ online: item.status === '开', offline: item.status === '关' }"
                >
                  <img
                    v-if="item.status === '关'"
                    class="status-icon"
                    src="@/assets/images/lightClose.png"
                    alt=""
                  />
                  <img v-else class="status-icon" src="@/assets/images/lightOpen.png" alt="" />
                  <span class="status-text">{{ item.status }}</span>
                </div>
              </td>
            </tr>
            <tr v-if="circuitMockData.length === 0">
              <td colspan="3" style="text-align: center; padding: 24px; color: #8fa3bf;">暂无数据</td>
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
import { ref, onMounted } from 'vue';
import { controlRecordListApi } from '@/api/equipmentMonitoring';

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
        triggerType: item.triggerType || (idx % 2 === 0 ? '场景' : '定时'),
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

// 回路 mock 数据
const circuitMockData = ref<{ circuitName: string; status: string }[]>([]);

function onDetail(item: any) {
  detailRecord.value = item;
  // mock 数据
  circuitMockData.value = [
    { circuitName: `${item.name || '回路'}-回路1`, status: '开' },
    { circuitName: `${item.name || '回路'}-回路2`, status: '关' },
    { circuitName: `${item.name || '回路'}-回路3`, status: '开' },
    { circuitName: `${item.name || '回路'}-回路4`, status: '关' },
    { circuitName: `${item.name || '回路'}-回路5`, status: '开' },
  ];
  detailVisible.value = true;
}

function closeDetail() {
  detailVisible.value = false;
  detailRecord.value = null;
  circuitMockData.value = [];
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="less">
.page-container {
  --bg: #0f172a;
  --panel: #1e293b;
  --accent: #0ea5e9;
  --accent2: #10b981;
  --accent3: #f59e0b;
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

  // daterange 根元素
  &.el-range-editor {
    height: 36px;
    background-color: transparent;
    box-shadow: none;
    border: 1px solid rgba(255, 255, 255, 0.55);
    border-radius: 4px;
    font-size: 13px;

    &:hover,
    &.is-active {
      border-color: rgba(255, 255, 255, 0.85);
      box-shadow: none;
    }
  }

  :deep(.el-range-input) {
    background-color: transparent;
    color: #ffffff;
    font-size: 13px;

    &::placeholder {
      color: rgba(255, 255, 255, 0.55);
    }
  }

  :deep(.el-range-separator) {
    color: rgba(255, 255, 255, 0.7);
  }

  :deep(.el-range__icon),
  :deep(.el-range__close-icon) {
    color: rgba(255, 255, 255, 0.7);
  }

  // ✅ 日期面板（teleported=false，渲染在组件内部）
  :deep(.el-picker-panel) {
    background-color: var(--panel);
    color: #ffffff;
    border: 1px solid var(--border);
  }

  :deep(.el-date-range-picker__content),
  :deep(.el-picker-panel__body),
  :deep(.el-picker-panel__footer),
  :deep(.el-picker-panel__sidebar) {
    background-color: var(--panel);
  }

  :deep(.el-date-table) {
    th {
      color: var(--text2);
      border-bottom-color: var(--border);
    }

    td {
      &.available .el-date-table-cell {
        color: var(--text);
      }

      &.prev-month .el-date-table-cell,
      &.next-month .el-date-table-cell {
        color: var(--text2);
      }

      &.available:hover .el-date-table-cell {
        background-color: rgba(255, 255, 255, 0.06);
      }

      &.today:not(.start-date):not(.end-date) .el-date-table-cell__text {
        box-shadow: none;
        border: 1px solid var(--primary);
        color: var(--primary);
      }

      // 选中起止日期：白底黑字
      &.start-date,
      &.end-date {
        .el-date-table-cell {
          background-color: transparent;
        }
        .el-date-table-cell__text {
          background-color: #ffffff !important;
          color: #000000 !important;
          font-weight: 600;
        }
      }

      // 区间内日期
      &.in-range .el-date-table-cell {
        background-color: rgba(255, 255, 255, 0.12) !important;
      }
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
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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
    gap: 16px;
    color: #8a9ab0;
    font-size: 12px;
  }
}

.table-container {
  position: relative;
}

.device-table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 12px 12px;
    text-align: left;
    font-size: 13px;
    white-space: nowrap;
  }

  thead th {
    color: #a0aabf;
    font-weight: 500;
    border-bottom: 1px solid #303d50;
    user-select: none;
  }

  tbody td {
    color: #ffffff;
    border-bottom: 1px solid #303d50;
    vertical-align: middle;
  }


  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr:hover {
    background: rgba(255, 255, 255, 0.03);
  }
}

// 状态徽章
.status-badge {
  height: 24px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 24px;
  margin-left: 0px;
}

.status-badge .status-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  display: block;
}

.status-badge .status-text {
  line-height: 24px;
}

.status-badge.online {
  color: #52c41a;
  background: rgba(82, 196, 26, 0.2);
}

.status-badge.offline {
  color: #ff4d4f;
  background: rgba(255, 77, 79, 0.2);

  .status-icon {
    filter: brightness(0.55) saturate(1.8);
  }
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
</style>

<style>
/* 原生 option 在浏览器 OS 层渲染，scoped 无法覆盖，需非 scoped */
.page-container .select option {
  background: var(--bg) !important;
  color: #ffffff !important;
}

/* ==================== 全局 Modal 覆盖（深色科技风） ==================== */
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

