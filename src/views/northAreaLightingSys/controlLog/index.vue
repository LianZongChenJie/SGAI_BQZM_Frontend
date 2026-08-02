<template>
  <div class="page-container">
    <div class="log-card">
      <div class="card-header">
        <span class="header-icon"></span>
        <h2 class="card-title">开关控制日志</h2>
      </div>
      <div class="table-wrapper" v-loading="loading">
        <table class="log-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>类型</th>
              <th>名称</th>
              <th>操作</th>
              <th>开启时间</th>
              <th>关闭时间</th>
              <th>操作人员</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in tableData" :key="item.id || index">
              <td>{{ item.operationTime }}</td>
              <td>{{ item.relType }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.operationType }}</td>
              <td>{{ item.startTime }}</td>
              <td>{{ item.endTime }}</td>
              <td>{{ item.operationBy }}</td>
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

/** 加载控制记录数据 */
async function fetchData() {
  loading.value = true;
  try {
    const params = {
      pageNo: currentPage.value,
      pageSize: pageSize.value,
    };
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

.table-wrapper {
  overflow-x: auto;
}

.log-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  thead {
    tr {
      th {
        padding: 14px 16px;
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
        padding: 14px 16px;
        color: var(--text);
        white-space: nowrap;
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
