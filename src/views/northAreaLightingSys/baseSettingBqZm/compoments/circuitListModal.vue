<template>
  <div class="add-modal-wrapper">
    <a-modal
      v-model:open="open"
      title="回路控制"
      :footer="null"
      width="1200px"
      :destroyOnClose="true"
      :maskClosable="false"
      wrapClassName="dark-tech-modal"
    >
    <!-- 标题 -->
     <section class="modal-title">
      <div class="title-left">
        <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <div class="title-text">
          <span class="title-label">区域</span>
          <span class="title-value">{{ modalTitle }}</span>
        </div>
      </div>
      <div class="title-actions">
        <button class="btn btn-primary" @click="onSearch">刷新</button>
        <a-popconfirm
          :title="'确认全开'+ modalTitle +'？'"
          ok-text="确定"
          cancel-text="取消"
          @confirm="onOpenAll()"
        ><button class="btn btn-primary">全开</button></a-popconfirm>
        <a-popconfirm
          :title="'确认全关'+ modalTitle +'？'"
          ok-text="确定"
          cancel-text="取消"
          @confirm="onCloseAll()"
        >
        <button class="btn btn-danger">全关</button></a-popconfirm>
      </div>
     </section>

      <!-- 数据表格（可滚动区域） -->
      <section class="table-scroll" v-loading="tableLoading">
        <table class="device-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>回路名称</th>
              <th>状态</th>
              <th>开启时间</th>
              <th>关闭时间</th>
              <th>开启总时长</th>
              <th>操作人</th>
              <th>操作时间</th>
              
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in tableData" :key="row.id">
              <td>{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
              <td>{{ row.circuitName }}</td>
              <td class="status-cell">
                <span
                  class="status-badge-table"
                  :class="{
                    online: row.status === '开启',
                    offline: row.status === '关闭',
                  }"
                >{{ row.status }}</span>
              </td>
              <td>{{ row.startTime }}</td>
              <td>{{ row.closingTime }}</td>
              <td>{{ formatSeconds(row.allDuration, { showHoursAlways: true }) }}</td>
              <td>{{ row.operatorBy }}</td>
              <td>{{ row.operatorTime }}</td>
              <td class="actions">
                <a-popconfirm
                  :title="'确认开启'+ row.circuitName +'？'"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="onOpenRow(row)"
                ><button class="action-btn">开启</button></a-popconfirm>
                <a-popconfirm
                  :title="'确认关闭'+ row.circuitName +'？'"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="onCloseRow(row)"
                ><button class="action-btn">关闭</button></a-popconfirm>
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

      <!-- 底部操作按钮 -->
      <div class="modal-footer">
        <a-button class="btn-cancel" @click="closeModal">取消</a-button>
        <a-button class="btn-confirm" type="primary" :loading="loading" @click="onSubmit">确定</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, reactive } from 'vue';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import { getCircuitListApi, setAreaOpenApi, setAreaCloseApi, setCircuitOpenApi, setCircuitCloseApi } from '@/api/baseSettingBqZm';
// 参考src\views\bems\lightingControl\components\LoopListModal.vue
const emit = defineEmits<{
  success: [];
}>();

/* ==================== 弹框状态 ==================== */
const open = ref(false);
const formRef = ref<FormInstance>();
const loading = ref(false);

/* ==================== 弹框标题 ==================== */
const modalTitle = ref('')
const formObj = reactive<any>({});

function showModal(rowObj) {
  console.log('rowObj', rowObj);
  Object.assign(formObj, rowObj.row)
  modalTitle.value = formObj.areaName
  onSearch()
  // 查询回路
  
  open.value = true;
}

function closeModal() {
  open.value = false;
}

async function onSubmit() {
  closeModal();
  emit('success');
}

// 加载loading标识
const tableLoading = ref(false);
// table表格
const tableData = ref([]);

/* --------------------- 分页 --------------------- */
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

/** 查询 */
function onSearch() {
  currentPage.value = 1;
  fetchList();
}
/** 重置 */
function onReset() {
  currentPage.value = 1;
  fetchList();
}
/** 获取列表数据 */
async function fetchList() {
  tableLoading.value = true;
  try {
    const params = {
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      areaId: formObj.id || undefined,
    };
    const data = await getCircuitListApi(params);
    console.log('获取数据：', data);
    // 解析分页信息
    if (data) {
      total.value = data.total ?? 0;
      tableData.value = Array.isArray(data.records) ? data.records : [];
    }
  } catch (err) {
    console.error('Failed to load equipment list:', err);
  } finally {tableLoading.value = false;}
}

// 多选--全开
const onOpenAll = async () => {
    await setAreaOpenApi({
      id: formObj.id,
    }).then((res) => {
      console.log('res', res);
      message.success('全开成功！');
    })
    .catch((err) => {
      console.log('res', err);
      message.error('全开失败！');
    })
    .finally(() => {
      // fetchList();
    });
}
/** 多选--全关 */
const onCloseAll = async () => {
   await setAreaCloseApi({
      id: formObj.id,
    }).then((res) => {
      console.log('res', res);
      message.success('全关成功！');
    })
    .catch((err) => {
      console.log('res', err);
      message.error('全关失败！');
    })
    .finally(() => {
      // fetchList();
    });
}
/** 单行--全开 */
const onOpenRow = async (row) => {
  await setCircuitOpenApi({
      id: row.id,
    }).then((res) => {
      console.log('res', res);
      message.success('开启成功！');
    })
    .catch((err) => {
      console.log('res', err);
      message.error('全关失败！');
    })
    .finally(() => {
      // fetchList();
    });
}
/** 单行--全关 */
const onCloseRow = async (row) => {
  await setCircuitCloseApi({
      id: formObj.id,
    }).then((res) => {
      console.log('res', res);
      message.success('关闭成功！');
    })
    .catch((err) => {
      console.log('res', err);
      message.error('关闭成功！');
    })
    .finally(() => {
      // fetchList();
    });
}
/* --------------------- 翻页 --------------------- */
function onPageChange(page: number) {
  currentPage.value = page;
  fetchList();
}
function formatSeconds(totalSeconds, options:any = {}) {
  // 参数校验
  if (typeof totalSeconds !== 'number' || totalSeconds < 0) {
    console.warn('formatSeconds: 参数必须为非负数字');
    return '00:00';
  }
  
  // 默认配置
  const {
    showHoursAlways = false,
    padZero = true,
    separator = ':',
    showUnit = false
  } = options;
  
  // 计算时分秒
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  // 补零函数
  const pad:any = (num) => padZero ? num.toString().padStart(2, '0') : num.toString();
  
  // 根据配置返回不同格式
  if (showUnit) {
    // 显示单位格式：1时02分03秒
    const parts:any = [];
    if (hours > 0 || showHoursAlways) {
      parts.push(`${hours}时`);
    }
    parts.push(`${pad(minutes)}分`);
    parts.push(`${pad(seconds)}秒`);
    return parts.join('');
  } else {
    // 标准格式：HH:MM:SS 或 MM:SS
    if (hours > 0 || showHoursAlways) {
      return `${pad(hours)}${'小时'}${pad(minutes)}${'分钟'}${pad(seconds)}秒`;
    } else {
      return `${pad(minutes)}${separator}${pad(seconds)}`;
    }
  }
}
defineExpose({
  showModal,
  closeModal,
});

</script>

<style scoped lang="less">
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
  background: #00a2e8;
  color: #fff;
}

.btn-primary:hover {
  background: #0090cf;
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
  color: #ffffff;
  border: 1px solid #303d50;
}

.btn-outline:hover {
  border-color: #00a2e8;
  color: #00a2e8;
}

.btn-danger {
  background: #ef4444;
  color: #ffffff;
}

.btn-danger:hover {
  background: #dc2626;
}
/* ==================== 标题区域（科技感） ==================== */
.modal-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: -11px;
  gap: 12px;
  padding: 12px 16px;
  width: 102%;
  background: rgba(0, 162, 232, 0.05);
  border-left: 3px solid #00a2e8;
  border-radius: 0 6px 6px 0;

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

  .title-actions {
    display: flex;
    gap: 8px;
  }
}

/* ==================== 提示条（科技感） ==================== */
.modal-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  margin-bottom: 20px;
  background: rgba(0, 162, 232, 0.06);
  border-left: 3px solid #00a2e8;
  border-radius: 0 4px 4px 0;
  font-size: 13px;
  color: #8a9ab0;

  .tip-icon {
    width: 18px;
    height: 18px;
    color: #00a2e8;
    flex-shrink: 0;
  }
}

/* ==================== 底部按钮 ==================== */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  margin: 0 -24px -24px;
  border-top: 1px solid #303d50;
  margin-top: 20px;
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
    font-weight: 400;
    transition: all 0.2s;
  }

  .btn-cancel {
    background: transparent !important;
    border: 1px solid #303d50 !important;
    color: #a0aabf !important;

    &:hover {
      border-color: #5a6a80 !important;
      color: #ffffff !important;
      background: rgba(255, 255, 255, 0.04) !important;
    }
  }

  .btn-reset {
    background: rgba(255, 255, 255, 0.06) !important;
    border: 1px solid #303d50 !important;
    color: #a0aabf !important;

    &:hover {
      border-color: #5a6a80 !important;
      color: #ffffff !important;
      background: rgba(255, 255, 255, 0.1) !important;
    }
  }

  .btn-confirm {
    background: linear-gradient(135deg, #00a2e8, #0080c0) !important;
    border: none !important;
    color: #ffffff !important;

    &:hover {
      background: linear-gradient(135deg, #0090cf, #0070a8) !important;
      box-shadow: 0 0 12px rgba(0, 162, 232, 0.35);
    }
  }
}
/* ------------------- Title Actions ------------------- */
.title-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* ------------------- Table ------------------- */
.table-scroll {
  max-height: 420px;
  overflow-y: auto;
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
  color: #a0aabf;
  font-weight: 500;
  border-bottom: 1px solid #303d50;
}

/* 列宽比例分配 — 9列 */
.device-table th:nth-child(1),
.device-table td:nth-child(1) {
  width: 5%;
}

.device-table th:nth-child(2),
.device-table td:nth-child(2) {
  width: 14%;
}

.device-table th:nth-child(3),
.device-table td:nth-child(3) {
  width: 8%;
}

.device-table th:nth-child(4),
.device-table td:nth-child(4) {
  width: 12%;
}

.device-table th:nth-child(5),
.device-table td:nth-child(5) {
  width: 12%;
}

.device-table th:nth-child(6),
.device-table td:nth-child(6) {
  width: 12%;
}

.device-table th:nth-child(7),
.device-table td:nth-child(7) {
  width: 10%;
}

.device-table th:nth-child(8),
.device-table td:nth-child(8) {
  width: 14%;
}

.device-table th:nth-child(9),
.device-table td:nth-child(9) {
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
  accent-color: #00a2e8;
  vertical-align: middle;
  margin: 0;
  display: inline-block;
}

.device-table tbody td {
  color: #ffffff;
  border-bottom: 1px solid #303d50;
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
  color: #52c41a;
  background: rgba(82, 196, 26, 0.2);
}

.status-badge-table.offline {
  color: #ff4d4f;
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
  border-top: 1px solid #303d50;
}

.pagination-info {
  font-size: 13px;
  color: #a0aabf;
}

.pagination-current {
  font-size: 13px;
  color: #ffffff;
  min-width: 56px;
  text-align: center;
}

.pagination-btn {
  height: 30px;
  padding: 0 14px;
  border: 1px solid #303d50;
  border-radius: 4px;
  background: transparent;
  color: #ffffff;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #00a2e8;
  color: #00a2e8;
}

.pagination-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

</style>

/* ==================== 全局 Modal 覆盖（深色科技风） ==================== */
<style lang="less">
.dark-tech-modal {
  .ant-modal-content {
    background: #141d2b !important;
    border: 1px solid #303d50 !important;
    border-radius: 8px !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(0, 162, 232, 0.08) !important;
    overflow: hidden;

    /* 顶部蓝色渐变光条 */
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
