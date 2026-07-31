<template>
  <section class="page-wrapper">
    <div class="page-panel">
      <!-- 标题栏 -->
      <header class="page-header">
        <div class="left">
          <svg
            class="icon-wrench"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          <h1 class="title">基础信息管理</h1>
        </div>

        <div class="right">
        </div>
      </header>

      <!-- 筛选栏 -->
      <section class="filter-bar">
        <div class="filter-left">
          <div class="search-box">
            <svg
              class="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              v-model="searchKeyword"
              type="text"
              class="search-input"
              placeholder="搜索名称"
            />
          </div>
          <select v-model="selectedRelName" class="select">
            <option value="">全部类别</option>
            <option v-for="p in relNameOptions" :key="p" :value="p">{{ p }}</option>
          </select>
          <select v-model="selectedPlace" class="select">
            <option value="">全部区域</option>
            <option v-for="p in placeOptions" :key="p.value" :value="p.value">{{ p.label }}</option>
          </select>
          <button class="btn btn-primary" @click="onSearch">查询</button>
          <button class="btn btn-outline" @click="onReset">重置</button>
        </div>
        <div class="filter-right">
          <button class="btn btn-primary" @click="onSearch">刷新</button>
          <button class="btn btn-primary" @click="onOpenAll">全开</button>
          <button class="btn btn-danger" @click="onCloseAll">全关</button>
        </div>
      </section>

      <!-- 数据表格 -->
      <section class="table-wrapper" v-loading="tableLoading">
        <table class="device-table">
          <thead>
            <tr>
              <th class="col-checkbox">
                <input
                  type="checkbox"
                  :checked="isCurrentPageAllSelected"
                  :indeterminate.prop="isIndeterminate"
                  @change="onSelectAllChange"
                />
              </th>
              <th>序号</th>
              <th>类别</th>
              <th>区域</th>
              <th>名称</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in tableData" :key="row.id">
              <td class="col-checkbox">
                <input
                  type="checkbox"
                  :checked="selectedRowKeys.includes(row.id)"
                  @change="onRowSelect(row)"
                />
              </td>
              <td>{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
              <td>{{ row.relName }}</td>
              <td>{{ row.spaceName }}</td>
              <td>{{ row.areaName }}</td>
              <td class="status-cell">
                <span
                  class="status-badge-table"
                  :class="{
                    online: row.status === '开启',
                    offline: row.status === '关闭',
                  }"
                >{{ row.status }}</span>
              </td>
              <td class="actions">
                <button class="action-btn">监控视频</button>
                <button class="action-btn" @click="circuitListModalOpenChange(row)">回路列表</button>
                <button class="action-btn" @click="onOpenRow(row)">全开</button>
                <button class="action-btn" @click="onCloseRow(row)">全关</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

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
  </section>

  <!-- 二次确认弹框，多选 -->
  <configOpenMessage ref="configOpenMessageRef" @success="onModalConfigOpenMessageSuccess($event)"></configOpenMessage>
  <!-- 二次确认弹框，单选 -->
  <configOpenMessageTwo ref="configOpenMessageRefTwo" @success="onModalConfigOpenMessageSuccessTwo($event)"></configOpenMessageTwo>
  <!-- 回路列表 -->
  <circuitListModal ref="circuitListModalRef" @success="circuitListModalSuccess($event)"></circuitListModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getRelName, getAllSpace, getAreaListPageApi, setAreaOpenApi, setAreaCloseApi } from '@/api/baseSettingBqZm';   // ← replace with the real module
import configOpenMessage from './compoments/configOpenMessage.vue';
import configOpenMessageTwo from './compoments/configOpenMessageTwo.vue';
import circuitListModal from './compoments/circuitListModal.vue';

import { message } from 'ant-design-vue';
/* --------------------- 模拟数据 --------------------- */
const tableData = ref([]);

/* --------------------- 分页 --------------------- */
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

/* --------------------- 筛选状态 --------------------- */
const searchKeyword = ref('');
const selectedPlace = ref('');
const selectedRelName = ref('');

/* 类别 */
const relNameOptions = ref<string[]>([]);
/* 区域 */
const placeOptions = ref<{ label: string; value: string }[]>([])

/** 获取类别下拉选项 */
async function fetchRelNameOptions() {
  try {
    const res = await getRelName();
    console.log('类别选项：', res);
    if (Array.isArray(res)) {
      relNameOptions.value = res;
    }
  } catch (err) {
    console.error('获取类别选项失败：', err);
  }
}

/** 获取区域下拉选项 */
async function fetchPlaceOptions() {
  try {
    const res = await getAllSpace();
    console.log('区域选项：', res);
    if (Array.isArray(res)) {
      placeOptions.value = res.map((item: { spaceId: string; spaceName: string }) => ({
        label: item.spaceName,
        value: item.spaceId,
      }));
    }
  } catch (err) {
    console.error('获取区域选项失败：', err);
  }
}

// 加载loading标识
const tableLoading = ref(false);
/** 获取列表数据 */
async function fetchList() {
  tableLoading.value = true;
  try {
    const params = {
      column: 'createTime',
      order: 'desc',
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      relName: selectedRelName.value || undefined,
      space: selectedPlace.value || undefined,
      areaName: searchKeyword.value.trim() || undefined,
    };
    const data = await getAreaListPageApi(params);
    console.log('设备列表数据：', data);
    // 解析分页信息
    if (data) {
      total.value = data.total ?? 0;
      tableData.value = Array.isArray(data.records) ? data.records : [];
    }
  } catch (err) {
    console.error('Failed to load equipment list:', err);
  } finally {tableLoading.value = false;}
}

/** 查询 */
function onSearch() {
  currentPage.value = 1;
  fetchList();
}

/** 重置 */
function onReset() {
  searchKeyword.value = '';
  selectedRelName.value = '';
  selectedPlace.value = '';
  currentPage.value = 1;
  fetchList();
}
/* --------------------- Modal 操作 --------------------- */
const configOpenMessageRef = ref<InstanceType<typeof configOpenMessage>>();
/** 全开 */
function onOpenAll() {
 configOpenMessageRef.value?.showModal('open');
}

/** 全关 */
function onCloseAll() {
 configOpenMessageRef.value?.showModal('close');
}

function onModalConfigOpenMessageSuccess(type) {
  console.log('开关---按钮回调----');
  console.log('type:', type);
  if(type === "open") {
    openAll()
  } else if(type === "close") {
    closeAll()
  }
}
// 表格勾选
const selectedRowKeys = ref<string[]>([]);

/** 当前页是否全选 */
const isCurrentPageAllSelected = computed(() => {
  if (!tableData.value.length) return false;
  return tableData.value.every((row: any) => selectedRowKeys.value.includes(row.id));
});

/** 当前页是否半选 */
const isIndeterminate = computed(() => {
  if (!tableData.value.length) return false;
  const selectedCount = tableData.value.filter((row: any) => selectedRowKeys.value.includes(row.id)).length;
  return selectedCount > 0 && selectedCount < tableData.value.length;
});

/** 表头全选/反选 */
function onSelectAllChange(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  const currentIds = tableData.value.map((row: any) => row.id);
  if (checked) {
    // 全选：将当前页 id 合并进 selectedRowKeys（去重）
    const set = new Set([...selectedRowKeys.value, ...currentIds]);
    selectedRowKeys.value = Array.from(set);
  } else {
    // 取消全选：从 selectedRowKeys 中移除当前页所有 id
    const removeSet = new Set(currentIds);
    selectedRowKeys.value = selectedRowKeys.value.filter((id) => !removeSet.has(id));
  }
}

/** 单行勾选/取消 */
function onRowSelect(row: any) {
  const idx = selectedRowKeys.value.indexOf(row.id);
  if (idx > -1) {
    selectedRowKeys.value.splice(idx, 1);
  } else {
    selectedRowKeys.value.push(row.id);
  }
}

// 多选--全开
const openAll = async () => {
  if (!selectedRowKeys.value.length) return message.error('请勾选区域！');
  selectedRowKeys.value.forEach(async (item) => {
    await setAreaOpenApi({
      id: item,
    });
  });
  onSearch()
};

// 多选--全关
const closeAll = async () => {
  if (!selectedRowKeys.value.length) return message.error('请勾选区域！');
  selectedRowKeys.value.forEach(async (item) => {
    await setAreaCloseApi({
      id: item,
    });
  });
  onSearch()
};
// 单行--row操作
const configOpenMessageRefTwo = ref<InstanceType<typeof configOpenMessageTwo>>();
/** 单行--全开 */
function onOpenRow(row) {
 configOpenMessageRefTwo.value?.showModal({
  type: 'open',
  row: row,
 });
}

/** 单行--全关 */
function onCloseRow(row) {
 configOpenMessageRefTwo.value?.showModal({
  type: 'open',
  row: row,
 });
}

function onModalConfigOpenMessageSuccessTwo(event) {
  console.log('单行--开关---按钮回调----');
  console.log('type:', event.type);
  if(event.type === "open") {
    handleOpen(event.row)
  } else if(event.type === "close") {
    handleClose(event.row)
  }
}
// 单行--全开
const handleOpen = async (record) => {
  await setAreaOpenApi({
    id: record.id,
  });
  onSearch()
};
// 单行--全关
const handleClose = async (record) => {
  await setAreaCloseApi({
    id: record.id,
  });
  onSearch()
};

// 回路列表
const circuitListModalRef = ref<InstanceType<typeof circuitListModal>>();
const circuitListModalOpenChange = (rowObj) => {
  circuitListModalRef.value?.showModal({
    row: rowObj,
  });
}
const circuitListModalSuccess = () =>{
  onSearch()
}

/* --------------------- 翻页 --------------------- */
function onPageChange(page: number) {
  currentPage.value = page;
  fetchList();
}


onMounted(() => {
  fetchList();
  fetchRelNameOptions();
  fetchPlaceOptions();
})


</script>

<style scoped>
/* ------------------- 颜色变量（挂在根节点，scoped 下 :root 无效） ------------------- */
.page-wrapper {
  --bg-page: #0b111e;
  --bg-panel: #1b2533;
  --color-text: #ffffff;
  --color-muted: #a0aabf;
  --color-primary: #00a2e8;
  --color-primary-hover: #0090cf;
  --color-border: #303d50;
  --color-online: #52c41a;
  --color-offline: #ff4d4f;

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

/* 内容卡片 */
.page-panel {
  background: var(--bg-panel);
  border-radius: 8px;
  padding: 15px 24px 16px;
}

/* ------------------- Header ------------------- */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header .left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-wrench {
  width: 22px;
  height: 22px;
  color: var(--color-text);
  flex-shrink: 0;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--color-text);
}

.page-header .right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 按钮 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  border-radius: 4px;
  font-size: 13px;
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

.btn-outline {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-outline:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-danger {
  background: #ef4444;
  color: #ffffff;
}

.btn-danger:hover {
  background: #dc2626;
}

/* ------------------- Filter Bar ------------------- */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #9ca3af;
  pointer-events: none;
}

.search-input {
  width: 300px;
  height: 36px;
  padding: 0 12px 0 36px;
  background: #ffffff;
  border: none;
  border-radius: 4px;
  color: #1a1a1a;
  font-size: 13px;
  outline: none;
}

.search-input::placeholder {
  color: #9ca3af;
}

.select {
  width: 140px;
  height: 36px;
  padding: 0 28px 0 12px;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 4px;
  color: var(--color-text);
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
}

.select option {
  background: var(--bg-panel);
  color: var(--color-text);
}

/* ------------------- Table ------------------- */
.table-wrapper {
  overflow-x: auto;
}

.device-table {
  width: 100%;
  border-collapse: collapse;
}

.device-table th,
.device-table td {
  padding: 14px 12px;
  text-align: left;
  font-size: 13px;
  white-space: nowrap;
}

.device-table thead th {
  color: var(--color-muted);
  font-weight: 500;
  border-bottom: 1px solid var(--color-border);
}

/* 列宽比例分配 */
.device-table th:nth-child(1),
.device-table td:nth-child(1) {
  width: 4%;
}

.device-table th:nth-child(2),
.device-table td:nth-child(2) {
  width: 6%;
}

.device-table th:nth-child(3),
.device-table td:nth-child(3) {
  width: 20%;
}

.device-table th:nth-child(4),
.device-table td:nth-child(4) {
  width: 20%;
}

.device-table th:nth-child(5),
.device-table td:nth-child(5) {
  width: 17%;
}

.device-table th:nth-child(6),
.device-table td:nth-child(6) {
  width: 10%;
}

.device-table th:nth-child(7),
.device-table td:nth-child(7) {
  width: 13%;
}

/* 复选框列居中对齐 */
.col-checkbox {
  text-align: center !important;
  vertical-align: middle;
}

.col-checkbox input[type='checkbox'] {
  width: 15px;
  height: 15px;
  cursor: pointer;
  accent-color: var(--color-primary);
  vertical-align: middle;
  margin: 0;
  display: inline-block;
}

.device-table tbody td {
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
}

.device-table tbody tr:last-child td {
  border-bottom: none;
}

.device-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

/* 状态列强制左对齐 */
.status-cell {
  text-align: left !important;
}

/* 状态 Badge */
.status-badge-table {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 48px;
  height: 24px;
  padding: 0 10px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1;
}

.status-badge-table.online {
  color: var(--color-online);
  background: rgba(82, 196, 26, 0.2);
}

.status-badge-table.offline {
  color: var(--color-offline);
  background: rgba(255, 77, 79, 0.2);
}

/* 操作按钮 */
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.actions .action-btn {
  height: 28px;
  padding: 0 12px;
  background: #ffffff;
  border: none;
  border-radius: 4px;
  color: #1a1a1a;
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.actions .action-btn:hover {
  opacity: 0.85;
}

/* ------------------- Pagination ------------------- */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.pagination-info {
  font-size: 13px;
  color: var(--color-muted);
}

.pagination-current {
  font-size: 13px;
  color: var(--color-text);
  min-width: 56px;
  text-align: center;
}

.pagination-btn {
  height: 30px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: transparent;
  color: var(--color-text);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.pagination-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ------------------- 响应式 ------------------- */
@media (max-width: 768px) {
  .page-panel {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .page-header .right {
    width: 100%;
    flex-wrap: wrap;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-left,
  .filter-right {
    flex-wrap: wrap;
    width: 100%;
  }

  .select {
    width: 100%;
  }
}
</style>


