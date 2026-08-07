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
          <select v-model="selectedStatus" class="select">
            <option value="">全部状态</option>
            <option value="开启">开启</option>
            <option value="关闭">关闭</option>
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
      <section ref="tableWrapperRef" class="table-wrapper" v-loading="tableLoading">
        <vxe-table
          ref="tableRef"
          :data="tableData"
          :row-config="{ keyField: 'id', height: 36 }"
          :checkbox-config="{ checkField: '_checked' }"
          height="100%"
          border="none"
          @checkbox-change="onCheckboxChange"
          @checkbox-all="onCheckboxAll"
        >
          <vxe-column type="checkbox" width="45" fixed="left"></vxe-column>
          <vxe-column type="seq" title="序号" width="60" fixed="left"></vxe-column>
          <vxe-column field="relName" title="类别" min-width="150"></vxe-column>
          <vxe-column field="spaceName" title="区域" min-width="150"></vxe-column>
          <vxe-column field="areaName" title="名称" min-width="280"></vxe-column>
          <vxe-column field="status" title="状态" width="130">
            <template #default="{ row }">
              <span
                class="status-indicator"
                :class="{
                  online: row.status === '开启',
                  offline: row.status === '关闭',
                }"
              >
                <img
                  v-if="row.status === '关闭'"
                  class="status-icon"
                  src="@/assets/images/lightClose.png"
                  alt=""
                />
                <img
                  v-else
                  class="status-icon"
                  src="@/assets/images/lightOpen.png"
                  alt=""
                />
                <span class="status-text">{{ row.status }}</span>
              </span>
            </template>
          </vxe-column>
          <vxe-column title="操作" width="310" fixed="right" header-align="left" align="left">
            <template #default="{ row }">
              <div class="actions">
                <button class="action-btn" @click="videoMonitorModalOpen(row)">监控视频</button>
                <button class="action-btn" @click="circuitListModalOpenChange(row)">回路列表</button>
                <button class="action-btn btn-primary" @click="onOpenRow(row)">全开</button>
                <button class="action-btn btn-danger" @click="onCloseRow(row)">全关</button>
              </div>
            </template>
          </vxe-column>
        </vxe-table>
      </section>
    </div>
  </section>

  <!-- 二次确认弹框，多选 -->
  <configOpenMessage ref="configOpenMessageRef" @success="onModalConfigOpenMessageSuccess($event)"></configOpenMessage>
  <!-- 二次确认弹框，单选 -->
  <configOpenMessageTwo ref="configOpenMessageRefTwo" @success="onModalConfigOpenMessageSuccessTwo($event)"></configOpenMessageTwo>
  <!-- 回路列表 -->
  <circuitListModal ref="circuitListModalRef" @success="circuitListModalSuccess($event)"></circuitListModal>
  <!-- 监控视频弹框 -->
  <VideoMonitorModal ref="videoMonitorModalRef"></VideoMonitorModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { getRelName, getAllSpace, getAreaListPageApi, setAreaOpenApi, setAreaCloseApi } from '@/api/baseSettingBqZm';   // ← replace with the real module
import configOpenMessage from './compoments/configOpenMessage.vue';
import configOpenMessageTwo from './compoments/configOpenMessageTwo.vue';
import circuitListModal from './compoments/circuitListModal.vue';
import VideoMonitorModal from './compoments/VideoMonitorModal.vue';

import { message } from 'ant-design-vue';
/* --------------------- 模拟数据 --------------------- */
const rawData = ref([]);
const tableRef = ref();
const tableWrapperRef = ref<HTMLElement>();
let resizeObserver: ResizeObserver | null = null;

/* --------------------- 筛选状态 --------------------- */
const searchKeyword = ref('');
const selectedPlace = ref('');
const selectedRelName = ref('');
const selectedStatus = ref('');
const appliedStatus = ref('');

/* 前端本地过滤（status 不走接口，点查询才生效） */
const tableData = computed(() => {
  if (!appliedStatus.value) return rawData.value;
  return rawData.value.filter((row: any) => row.status === appliedStatus.value);
});

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
      pageNo: 1,
      pageSize: 9999,
      relName: selectedRelName.value || undefined,
      space: selectedPlace.value || undefined,
      areaName: searchKeyword.value.trim() || undefined,
    };
    const data = await getAreaListPageApi(params);
    console.log('设备列表数据：', data);
    if (data) {
      rawData.value = Array.isArray(data.records) ? data.records : [];
      // 数据更新后重新计算表格尺寸，确保 auto-resize 生效
      await nextTick();
      tableRef.value?.recalculate?.();
    }
  } catch (err) {
    console.error('Failed to load equipment list:', err);
  } finally {tableLoading.value = false;}
}

/** 查询 */
function onSearch() {
  appliedStatus.value = selectedStatus.value;
  fetchList();
}

/** 重置 */
function onReset() {
  searchKeyword.value = '';
  selectedRelName.value = '';
  selectedPlace.value = '';
  selectedStatus.value = '';
  appliedStatus.value = '';
  fetchList();
}
/* --------------------- Modal 操作 --------------------- */
const configOpenMessageRef = ref<InstanceType<typeof configOpenMessage>>();
/** 全开 */
function onOpenAll() {
  if (!selectedRowKeys.value.length) return message.error('请勾选区域！');
  const checkedRows = rawData.value.filter((row: any) => selectedRowKeys.value.includes(row.id));
  configOpenMessageRef.value?.showModal('open', checkedRows);
}

/** 全关 */
function onCloseAll() {
  if (!selectedRowKeys.value.length) return message.error('请勾选区域！');
  const checkedRows = rawData.value.filter((row: any) => selectedRowKeys.value.includes(row.id));
  configOpenMessageRef.value?.showModal('close', checkedRows);
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

/** vxe-table 单行勾选变更 */
function onCheckboxChange({ records }: { records: any[] }) {
  selectedRowKeys.value = records.map((row: any) => row.id);
}

/** vxe-table 全选/全不选 */
function onCheckboxAll({ records }: { records: any[] }) {
  selectedRowKeys.value = records.map((row: any) => row.id);
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
  type: 'close',
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
  }).then((res) => {
    console.log('禁用定时任务成功', res);
    message.success('全开成功！');
  });;
  onSearch()
};
// 单行--全关
const handleClose = async (record) => {
  await setAreaCloseApi({
    id: record.id,
  }).then((res) => {
    console.log('禁用定时任务成功', res);
    message.success('全关成功！');
  });
  onSearch()
};

// 回路列表
const circuitListModalRef = ref<InstanceType<typeof circuitListModal>>();
const videoMonitorModalRef = ref<InstanceType<typeof VideoMonitorModal> | null>(null);
const circuitListModalOpenChange = (rowObj) => {
  circuitListModalRef.value?.showModal({
    row: rowObj,
  });
}
const circuitListModalSuccess = () =>{
  onSearch()
}

// 监控视频弹框
const videoMonitorModalOpen = (row) => {
  videoMonitorModalRef.value?.showModal(row);
}

onMounted(() => {
  fetchList();
  fetchRelNameOptions();
  fetchPlaceOptions();

  // ResizeObserver：wrapper 尺寸确定后让 vxe-table 重算高度
  resizeObserver = new ResizeObserver(() => {
    tableRef.value?.recalculate?.();
  });
  if (tableWrapperRef.value) {
    resizeObserver.observe(tableWrapperRef.value);
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect();
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
  height: 100%;
  max-height: calc(100vh - 60px); /* 减去 layout header 高度，超出后内部消化 */
  padding: 16px;
  background: var(--bg-page);
  color: var(--color-text);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;

  display: flex;
  flex-direction: column;
  overflow: hidden;
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

  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
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
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ====== vxe-table 深色主题覆盖 ====== */
/* 把 --color-border 在表格作用域内重定向为背景色，让表头/表体的分隔线也"消失"
   （.btn-outline 在 .table-wrapper 之外，不受影响） */
.table-wrapper {
  --color-border: var(--bg-panel);
  overflow: hidden; /* 外层截断，table 自己负责滚动 */
}
.table-wrapper :deep(.vxe-table) {
  /* 表格整体背景：去外边框 + 继承父容器 flex 高度 */
  background: var(--bg-panel);
  color: var(--color-text);
  border: 0;
  outline: 0;
  box-shadow: none;
  height: 100%;

  /* 终极方案：把 vxe-table 内置所有"边框线"相关 CSS 变量全部指向背景色
     包括 border--default/full/outer/inner 下用 linear-gradient 画的分隔线 */
  --vxe-ui-table-border-color: var(--bg-panel);
  --vxe-ui-table-border-width: 0;
  --vxe-ui-table-checkbox-range-border-color: var(--bg-panel);
  --vxe-ui-table-cell-area-border-color: var(--bg-panel);
  --vxe-ui-table-cell-main-area-extension-border-color: var(--bg-panel);
  --vxe-ui-table-cell-extend-area-border-color: var(--bg-panel);
  --vxe-ui-table-cell-copy-area-border-color: var(--bg-panel);
  /* 滚动状态下 fixed 列的"分隔阴影"也清零 */
  --vxe-ui-table-fixed-right-scrolling-box-shadow: none;
  --vxe-ui-table-fixed-left-scrolling-box-shadow: none;
  /* 渲染层/表头/底部行/选中行的背景都向面板色对齐，避免产生任何对比差异 */
  --vxe-ui-layout-background-color: var(--bg-panel);
  --vxe-ui-table-header-background-color: var(--bg-panel);
  --vxe-ui-table-footer-background-color: var(--bg-panel);
  --vxe-ui-table-row-hover-background-color: rgba(255, 255, 255, 0.04);
  --vxe-ui-table-row-striped-background-color: var(--bg-panel);
  --vxe-ui-table-row-current-background-color: rgba(0, 162, 232, 0.15);

  /* 自定义滚动条：可见、可拖 */
  scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
}
/* 自定义滚动条样式 —— 应用到 vxe-table 内任何可滚动节点 */
.table-wrapper :deep(.vxe-table)::-webkit-scrollbar,
.table-wrapper :deep(.vxe-table--body-wrapper)::-webkit-scrollbar,
.table-wrapper :deep(.vxe-table--header-wrapper)::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.table-wrapper :deep(.vxe-table)::-webkit-scrollbar-track,
.table-wrapper :deep(.vxe-table--body-wrapper)::-webkit-scrollbar-track,
.table-wrapper :deep(.vxe-table--header-wrapper)::-webkit-scrollbar-track {
  background: transparent;
}
.table-wrapper :deep(.vxe-table)::-webkit-scrollbar-thumb,
.table-wrapper :deep(.vxe-table--body-wrapper)::-webkit-scrollbar-thumb,
.table-wrapper :deep(.vxe-table--header-wrapper)::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 4px;
}
.table-wrapper :deep(.vxe-table)::-webkit-scrollbar-thumb:hover,
.table-wrapper :deep(.vxe-table--body-wrapper)::-webkit-scrollbar-thumb:hover,
.table-wrapper :deep(.vxe-table--header-wrapper)::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

/* vxe-table 内置的所有装饰性边框容器，统统隐藏/透明化 */
.table-wrapper :deep(.vxe-table--border-line),
.table-wrapper :deep(.vxe-table--column-line),
.table-wrapper :deep(.vxe-table--row-line) {
  border-color: transparent;
}
.table-wrapper :deep(.vxe-table--border-line) { display: none !important; }

/* 清除 fixed 左右列的 box-shadow（包括 scrolling-middle 状态下的"分隔阴影"） */
.table-wrapper :deep(.vxe-table--fixed-left-wrapper),
.table-wrapper :deep(.vxe-table--fixed-right-wrapper) {
  box-shadow: none !important;
  background-color: transparent; /* 避免继承 panel 背景形成颜色对比 */
}

/* 兜底：清掉所有 header/body wrapper 的右边线/边阴影/轮廓 */
.table-wrapper :deep(.vxe-table--header-wrapper),
.table-wrapper :deep(.vxe-table--body-wrapper),
.table-wrapper :deep(.vxe-table--footer-wrapper),
.table-wrapper :deep(.vxe-table--header),
.table-wrapper :deep(.vxe-table--body),
.table-wrapper :deep(.vxe-table--footer) {
  border-right: 0 !important;
  border-top: 0 !important;
  border-left: 0 !important;
  box-shadow: none !important;
  outline: 0 !important;
}

/* 最后兜底：vxe-table 内任何可能的右 1px 线条伪元素，一并去掉 */
.table-wrapper :deep(.vxe-table)::after,
.table-wrapper :deep(.vxe-table)::before,
.table-wrapper :deep(.vxe-table--header-wrapper)::after,
.table-wrapper :deep(.vxe-table--header-wrapper)::before {
  display: none !important;
  border: 0 !important;
}
.table-wrapper :deep(.vxe-body--column) {
  border-right: none !important;
}

/* 表头行：清掉 vxe-header--row / vxe-header--column 的右边线 */
.table-wrapper :deep(.vxe-header--row),
.table-wrapper :deep(.vxe-header--row .vxe-header--column),
.table-wrapper :deep(.vxe-header--row .vxe-header--column:last-child),
.table-wrapper :deep(.vxe-header--row .col--fixed-right) {
  border-right: 0 !important;
  background-image: none !important;
}

/* Gutter 列（表头/表体滚动条占位列）—— 多行表头每行都有一个，vxe-table
   border--default/full 下通过 background-image 画底部边界线；
   这里把所有边界线、背景色、阴影全部干掉，杜绝右侧白线 */
.table-wrapper :deep(.vxe-table--header-wrapper .vxe-header--row .vxe-header--gutter),
.table-wrapper :deep(.vxe-table--body-wrapper .vxe-body--row .vxe-body--gutter),
.table-wrapper :deep(.vxe-header--gutter),
.table-wrapper :deep(.vxe-body--gutter),
.table-wrapper :deep(.col--gutter) {
  border: 0 !important;
  background-image: none !important;
  background-color: transparent !important;
  box-shadow: none !important;
  outline: none !important;
}

/* 表头 */
.table-wrapper :deep(.vxe-table--header) {
  background: #1a2332;
}
.table-wrapper :deep(.vxe-header--column) {
  background: #1a2332;
  color: var(--color-muted);
  font-weight: 500;
  border-bottom: 1px solid var(--color-border);
  height: 40px;
}

/* 表体行 */
.table-wrapper :deep(.vxe-body--row) {
  border-bottom: 1px solid var(--color-border);
  background: var(--bg-panel);
}
.table-wrapper :deep(.vxe-body--row.row--hover),
.table-wrapper :deep(.vxe-body--row:hover) {
  background: #233044 !important;
}
.table-wrapper :deep(.vxe-table--body) {
  background: var(--bg-panel);
}
.table-wrapper :deep(.vxe-table--body-wrapper) {
  background: var(--bg-panel);
}
.table-wrapper :deep(.vxe-body--column) {
  color: var(--color-text);
  font-size: 13px;
}

/* 复选框列 */
.table-wrapper :deep(.vxe-checkbox--icon) {
  color: var(--color-muted);
}
.table-wrapper :deep(.vxe-checkbox.is--checked .vxe-checkbox--icon) {
  color: var(--color-primary);
}

/* 序号列 */
.table-wrapper :deep(.vxe-seq--column .vxe-cell) {
  color: var(--color-muted);
}

/* 固定列阴影 */
.table-wrapper :deep(.vxe-table--fix-left) {
  background: var(--bg-panel);
}
.table-wrapper :deep(.vxe-table--fix-right) {
  background: var(--bg-panel);
}

/* 滚动条 */
.table-wrapper :deep(.vxe-table--body-wrapper::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}
.table-wrapper :deep(.vxe-table--body-wrapper::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

/* 状态指示器 —— 图标与文字分离，灰色系 */
.status-indicator {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  line-height: 1;
}

.status-indicator .status-icon {
  width: 18px;
  height: 18px;
  margin-right: 6px;
}

.status-indicator .status-text {
  line-height: 1;
}

.status-indicator.online {
  color: rgb(244, 234, 42);
}

.status-indicator.online .status-icon {
  filter: none;
}

.status-indicator.offline {
  color: #8a99ab;
}

.status-indicator.offline .status-icon {
  filter: grayscale(1) brightness(1.4) contrast(0.8);
}

/* 操作按钮 */
.actions {
  display: flex;
  align-items: center;
  /* 统一左对齐：按钮组从操作列左边缘起依次向右排开
     与表头"操作"两个字共用同一条左基线 */
  justify-content: flex-start;
  gap: 8px;
  width: 100%;
  padding-right: 12px; /* 与表头一起让操作列整体距离右边留一点空隙 */
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

.actions .action-btn.btn-primary {
  background: #22c55e;
  color: #fff;
}

.actions .action-btn.btn-primary:hover {
  background: #16a34a;
}

.actions .action-btn.btn-danger {
  background: #ef4444;
  color: #fff;
}

.actions .action-btn.btn-danger:hover {
  background: #dc2626;
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


