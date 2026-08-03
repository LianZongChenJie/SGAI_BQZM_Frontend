<template>
  <div class="page-container">
    <div class="log-card">
      <div class="card-header">
        <span class="header-icon"></span>
        <h2 class="card-title">开关控制日志</h2>
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
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </div>
      </div>
      <div class="table-wrapper" v-loading="loading">
        <table class="log-table">
          <thead>
            <tr>
              <th>操作时间</th>
              <th>类型</th>
              <th>名称</th>
              <th>操作</th>
              <th>操作人员</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in tableData" :key="item.id || index">
              <td>{{ item.operationTime }}</td>
              <td>{{ item.relType }}</td>
              <td class="cell-wrap">{{ item.name }}</td>
              <td class="cell-wrap">{{ item.operationType }}</td>
              <td>{{ item.operationBy }}</td>
            </tr>
            <tr v-if="!loading && tableData.length === 0">
              <td colspan="5" style="text-align: center; padding: 24px;">暂无数据</td>
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
    const res = await controlRecordListApi(params);
    console.log('控制记录数据：', res);
    if (res?.records) {
      tableData.value = res.records;
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
  currentPage.value = 1;
  fetchData();
}

/** 分页切换 */
function onPageChange(page: number) {
  currentPage.value = page;
  fetchData();
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="less">
.page-container {
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
  padding: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.header-icon {
  font-size: 24px;
  margin-right: 10px;
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
}

.log-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 14px;

  thead {
    tr {
      th {
        padding: 10px 12px;
        text-align: left;
        color: var(--text2);
        font-weight: 500;
        border-bottom: 1px solid var(--border);
        white-space: nowrap;
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
        padding: 10px 12px;
        color: var(--text);
        font-size: 13px;
        vertical-align: top;
        white-space: nowrap;

        // 长文本列：自动换行
        &.cell-wrap {
          white-space: normal;
          word-break: break-all;
          line-height: 1.5;
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
  border-color: var(--primary);
  color: var(--primary);
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
</style>

<style>
/* 原生 option 在浏览器 OS 层渲染，scoped 无法覆盖，需非 scoped */
.page-container .select option {
  background: var(--bg) !important;
  color: #ffffff !important;
}
</style>

