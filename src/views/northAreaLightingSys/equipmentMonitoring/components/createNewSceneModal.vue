<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    width="1000px"
    wrapClassName="dark-tech-modal"
    :footer="null"
    :maskClosable="false"
    @cancel="onCancel"
  >
    <!-- ==================== 表单 + 表格 统一 Loading 容器 ==================== -->
    <div v-loading="tableLoading" class="modal-body-content">
      <!-- ==================== 表单区域 ==================== -->
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        class="dark-form"
        :label-col="{ style: { width: '80px' } }"
        :disabled="isDetail"
      >
        <div class="form-row">
          <a-form-item label="控制类型" name="relType">
            <a-select
              v-model:value="formData.relType"
              placeholder="请选择控制类型"
              :options="relTypeOptions"
              allowClear
              @change="handleChangeRelType"
            />
          </a-form-item>
          <a-form-item label="名称" name="planName">
            <a-input
              v-model:value="formData.planName"
              placeholder="请输入名称"
              allowClear
            />
          </a-form-item>
          <a-form-item label="操控类型" name="operationType">
            <a-select
              v-model:value="formData.operationType"
              placeholder="请选择操控类型"
              :options="operationTypeOptions"
              allowClear
            />
          </a-form-item>
        </div>
      </a-form>

      <!-- ==================== 表格区域 ==================== -->
      <section class="table-section">
      <div class="table-scroll">
        <table class="device-table">
          <thead>
            <tr>
              <th class="col-checkbox" v-show="!isDetail">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  :indeterminate.prop="isIndeterminate"
                  @change="onSelectAllChange"
                />
              </th>
              <th>序号</th>
              <th>区域</th>
              <th>名称</th>
              <th v-show="formData.relType === '回路'">回路名称</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in tableData" :key="row.id">
              <td class="col-checkbox" v-show="!isDetail">
                <input
                  type="checkbox"
                  :checked="selectedRowKeys.includes(row.id)"
                  @change="onRowSelect(row)"
                />
              </td>
              <td>{{ idx + 1 }}</td>
              <td>{{ row.spaceName }}</td>
              <td>{{ row.areaName }}</td>
              <td v-show="formData.relType === '回路'">{{ row.circuitName }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    </div>

    <!-- ==================== 底部按钮 ==================== -->
    <div class="modal-footer">
      <button class="btn btn-cancel" @click="onCancel">取消</button>
      <button v-if="mode == 'add'" class="btn btn-submit" :loading="submitLoading" @click="onSubmit">确认创建</button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue';
import type { FormInstance } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import { getAreaListAll, getCircuitListAll, editLightingPlanAPi, addLightingPlanAPiNew, planDetailApiNew } from '@/api/equipmentMonitoring'

// 对应src\views\bems\lightingControl\components\TimingControlModal.vue
// ==================== Emits ====================
const emit = defineEmits<{
  success: [];
}>();

// ==================== 状态 ====================
const visible = ref(false);
const submitLoading = ref(false);
const mode = ref<'add' | 'edit' | 'detail'>('add');
const editRecord = ref<any>(null);
const formRef = ref<FormInstance>();

const title = computed(() => (mode.value === 'add' ? '创建新场景' : '场景详情'));
const isDetail = computed(() => mode.value === 'detail');
// 表单数据
const formData = reactive({
  relType: '',
  operationType: '',
  planName: '',
});

// 表单校验规则
const formRules = {
  relType: [{ required: true, message: '请选择控制类型' }],
  operationType: [{ required: true, message: '请选择操控类型' }],
  planName: [{ required: true, message: '请输入名称' }],
};

// 控制类型下拉选项
const relTypeOptions = ref([
  { label: '回路', value: '回路' },
  { label: '区域', value: '区域' },
]);

// 操控类型下拉选项
const operationTypeOptions = ref([
  { label: '开启', value: '开启' },
  { label: '关闭', value: '关闭' },
]);

// 默认表单值
const defaultForm = {
  relType: '',
  operationType: '',
  planName: '',
};

// 表格数据（mock，后续替换为接口）
const tableData = ref<any[]>([]);

// 复选框勾选
const selectedRowKeys = ref<string[]>([]);

// 全选判断
const isAllSelected = computed(() => {
  if (!tableData.value.length) return false;
  return tableData.value.every((row: any) => selectedRowKeys.value.includes(row.id));
});

// 半选判断
const isIndeterminate = computed(() => {
  if (!tableData.value.length) return false;
  const count = tableData.value.filter((row: any) => selectedRowKeys.value.includes(row.id)).length;
  return count > 0 && count < tableData.value.length;
});

// ==================== 方法 ====================

/** 表头全选/反选 */
function onSelectAllChange(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  if (checked) {
    const set = new Set([...selectedRowKeys.value, ...tableData.value.map((r: any) => r.id)]);
    selectedRowKeys.value = Array.from(set);
  } else {
    const allIds = new Set(tableData.value.map((r: any) => r.id));
    selectedRowKeys.value = selectedRowKeys.value.filter((id) => !allIds.has(id));
  }
}

/** 单行勾选 */
function onRowSelect(row: any) {
  const idx = selectedRowKeys.value.indexOf(row.id);
  if (idx > -1) {
    selectedRowKeys.value.splice(idx, 1);
  } else {
    selectedRowKeys.value.push(row.id);
  }
}

/** 清空所有勾选 */
function clearSelection() {
  selectedRowKeys.value = [];
}

/** 取消 */
function onCancel() {
  closeModal();
}

/** 提交（含表单校验） */
async function onSubmit() {
  try {
    await formRef.value!.validate();
    if (!selectedRowKeys.value.length) {
      // 如果没有选中行，提交时仅传空数组
    }
    submitLoading.value = true;
     const submitData = { ...formData, relIds: Array.from(selectedRowKeys.value).join(',')};
     // 根据类型调用对应 API
    const api = mode.value === 'add' ? addLightingPlanAPiNew : editLightingPlanAPi;
    await api(submitData).then(res => {
      console.log('接口返回');
      console.log('res', res);
      if(!res) {
        message.success(mode.value === 'add' ? '新建场景成功！' : '编辑场景成功！');
        closeModal();
        emit('success');
      }
     
    });
   
  } catch (err: any) {
    // 表单校验失败由 antd 自带提示，不作额外处理
    if (err?.errorFields) return;
  } finally {
    submitLoading.value = false;
  }
}

/** 打开弹框 */
async function showModal(type: 'add' | 'edit' | 'detail', record?: any) {
  mode.value = type;
  formRef.value?.resetFields();
  if (type === 'add') {
    Object.assign(formData, { ...defaultForm });
    selectedRowKeys.value = [];
    editRecord.value = null;
    // 默认回路
    formData.relType = '回路';
    // 表单 + 表格一起进入 loading
    tableLoading.value = true;
    try {
      await loadCircuitData();
    } finally {
      await nextTick();
      setTimeout(() => {
        tableLoading.value = false;
      }, 200);
    }
  } else if (type === 'detail' && record) {
    console.log('record', record);
    editRecord.value = record;
    formData.relType = record.relType || '';
    formData.operationType = record.operationType || '';
    formData.planName = record.planName || '';
    selectedRowKeys.value = record.relIds ? [...record.relIds] : [];
    // 表单 + 表格一起进入 loading
    tableLoading.value = true;
    try {
      await getDetailInit();
    } finally {
      await nextTick();
      setTimeout(() => {
        tableLoading.value = false;
      }, 200);
    }
  }
  visible.value = true;
  
  // 清除校验残留
  nextTick(() => {
    formRef.value?.clearValidate();
  });
}

/** 关闭弹框 */
function closeModal() {
  visible.value = false;
  formRef.value?.resetFields();
}

/** 切换控制类型 */
const handleChangeRelType = async () => {
  // 表单 + 表格一起进入 loading
  tableLoading.value = true;
  // 切换类型时清空选择（因为数据结构不同）
  clearSelection();
  try {
    if (formData.relType === '回路') {
      await loadCircuitData();
    } else {
      await loadAreaData();
    }
  } finally {
    // 接口返回后延迟关闭 loading，确保表格 DOM 渲染完成
    await nextTick();
    setTimeout(() => {
      tableLoading.value = false;
    }, 200);
  }
};

// 加载loading标识
const tableLoading = ref(false);

/** 获取回路列表数据（纯数据获取，不管理 loading） */
async function loadCircuitData() {
  try {
    const params = {};
    const data = await getCircuitListAll(params);
    console.log('获取数据：', data);
    if (data) {
      tableData.value = Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.error('Failed to load equipment list:', err);
  }
}

/** 获取区域列表数据（纯数据获取，不管理 loading） */
async function loadAreaData() {
  try {
    const params = {};
    const data = await getAreaListAll(params);
    console.log('获取数据：', data);
    if (data) {
      tableData.value = Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.error('Failed to load equipment list:', err);
  }
}
// 获取详情
const getDetailInit = async () => {
  try {
    const params = {
      id: editRecord.value.id
    };
    const data = await planDetailApiNew(params);
    console.log('获取数据：', data);
    if (data) {
      if(editRecord.value.relType === '区域') {
        tableData.value = Array.isArray(data.areaList) ? data.areaList : [];
      } else if(editRecord.value.relType === '回路') {
        tableData.value = Array.isArray(data.circuitList) ? data.circuitList : [];
      }
    }
  } catch (err) {
    console.error('Failed to load equipment list:', err);
  }
}

defineExpose({ showModal, closeModal });
</script>

<style scoped lang="less">
/* ==================== 表单区域 ==================== */
.form-row {
  display: flex;
  gap: 24px;

  :deep(.ant-form-item) {
    flex: 1;
    margin-bottom: 0;
  }
}

/* ==================== 表格区域 ==================== */
.table-section {
  position: relative;
  margin-bottom: 20px;
}

.table-scroll {
  min-height: 200px;
  max-height: 520px;
  overflow-y: auto;
  overflow-x: auto;
}

.device-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.device-table th,
.device-table td {
  padding: 12px 12px;
  text-align: left;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-table thead th {
  background: #1b2533;
  color: #a0aabf;
  font-weight: 500;
  border-bottom: 1px solid #303d50;
  position: sticky;
  top: 0;
  z-index: 1;
}

.device-table tbody td {
  color: #ffffff;
  border-bottom: 1px solid #303d50;
}

.device-table tbody tr {
  transition: background 0.2s;
}

.device-table tbody tr:hover {
  background: rgba(0, 162, 232, 0.04);
}

/* 列宽 */
.col-checkbox {
  width: 5%;
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

.device-table th:nth-child(2),
.device-table td:nth-child(2) {
  width: 7%;
}

.device-table th:nth-child(3),
.device-table td:nth-child(3) {
  width: 22%;
}

.device-table th:nth-child(4),
.device-table td:nth-child(4) {
  width: 28%;
}

.device-table th:nth-child(5),
.device-table td:nth-child(5) {
  width: 38%;
}

/* ==================== 底部按钮 ==================== */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #303d50;
}

.btn {
  height: 36px;
  padding: 0 20px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
}

.btn-cancel {
  background: transparent;
  color: #a0aabf;
  border: 1px solid #303d50;

  &:hover {
    border-color: #00a2e8;
    color: #00a2e8;
  }
}

.btn-submit {
  background: linear-gradient(135deg, #00a2e8, #0078d4);
  color: #ffffff;

  &:hover {
    opacity: 0.9;
  }
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

  /* ==================== 表单覆盖 ==================== */
  .dark-form {
    margin-bottom: 16px;
    .ant-form-item-label > label {
      color: #a0aabf !important;
      font-size: 13px !important;
      font-weight: 400 !important;
    }

    .ant-form-item-label > label.ant-form-item-required::before {
      color: #ff4d4f !important;
    }

    /* Input 外层包裹器（修复白色间隙） */
    .ant-input-affix-wrapper {
      background: #1b2533 !important;
      border: 1px solid #303d50 !important;
      color: #ffffff !important;
      border-radius: 4px !important;
      min-height: 36px !important;
      padding: 0 11px !important;
      display: flex !important;
      align-items: center !important;
      transition: all 0.2s !important;

      &:hover {
        border-color: #00a2e8 !important;
      }

      &.ant-input-affix-wrapper-focused {
        border-color: #00a2e8 !important;
        box-shadow: 0 0 0 2px rgba(0, 162, 232, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.2) !important;
      }

      /* 内部 input 透明，让 wrapper 背景统一显示 */
      .ant-input {
        background: transparent !important;
        border: none !important;
        color: #ffffff !important;
        font-size: 13px !important;
        height: 34px !important;
        line-height: 34px !important;
        padding: 0 !important;
        box-shadow: none !important;

        &::placeholder {
          color: #5a6a80 !important;
        }
      }

      .ant-input-clear-icon {
        color: #5a6a80 !important;
        background: transparent !important;

        &:hover {
          color: #a0aabf !important;
        }
      }
    }

    /* 无 allowClear 时的普通 input */
    .ant-input:not(.ant-input-affix-wrapper .ant-input) {
      background: #1b2533 !important;
      border: 1px solid #303d50 !important;
      color: #ffffff !important;
      border-radius: 4px !important;
      font-size: 13px !important;
      height: 36px !important;
      transition: all 0.2s !important;

      &:hover {
        border-color: #00a2e8 !important;
      }

      &:focus,
      &.ant-input-focused {
        border-color: #00a2e8 !important;
        box-shadow: 0 0 0 2px rgba(0, 162, 232, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.2) !important;
      }

      &::placeholder {
        color: #5a6a80 !important;
      }
    }

    /* Select */
    .ant-select-selector {
      background: #1b2533 !important;
      border: 1px solid #303d50 !important;
      color: #ffffff !important;
      border-radius: 4px !important;
      min-height: 36px !important;
      font-size: 13px !important;
      transition: all 0.2s !important;

      &:hover {
        border-color: #00a2e8 !important;
      }
    }

    .ant-select-focused .ant-select-selector {
      border-color: #00a2e8 !important;
      box-shadow: 0 0 0 2px rgba(0, 162, 232, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.2) !important;
    }

    .ant-select-arrow {
      color: #5a6a80 !important;
    }

    .ant-select-clear {
      color: #5a6a80 !important;
      background: #1b2533 !important;

      &:hover {
        color: #a0aabf !important;
      }
    }

    .ant-select-selection-placeholder {
      color: #5a6a80 !important;
    }

    /* 单选 / 多选 选中文字统一高亮（仅文字色，无背景） */
    .ant-select-selection-item {
      color: #00c6ff !important;
      font-size: 13px !important;
    }

    /* 多选 Tag 专属样式（背景+边框，仅多选模式） */
    .ant-select-multiple .ant-select-selection-item {
      background: rgba(0, 162, 232, 0.12) !important;
      border: 1px solid rgba(0, 162, 232, 0.25) !important;
      color: #00c6ff !important;
      border-radius: 3px !important;
      font-size: 12px !important;

      .ant-select-selection-item-content {
        color: #00c6ff !important;
      }

      .ant-select-selection-item-remove {
        color: #00a2e8 !important;

        &:hover {
          color: #ffffff !important;
        }
      }
    }

    /* 校验 */
    .ant-form-item-explain-error {
      font-size: 12px !important;
      color: #ff4d4f !important;
    }

    .ant-form-item-has-error .ant-input,
    .ant-form-item-has-error .ant-select-selector {
      border-color: #ff4d4f !important;
    }
  }
}

/* ==================== Disabled 状态深色覆盖（扁平非嵌套，最高优先级） ==================== */
body .dark-tech-modal {
  .ant-input-affix-wrapper-disabled,
  .ant-input-affix-wrapper-disabled .ant-input,
  .ant-input-disabled,
  .ant-input[disabled] {
    background: #1b2533 !important;
    color: #ffffff !important;
    border-color: #303d50 !important;
    -webkit-text-fill-color: #ffffff !important;
    opacity: 1 !important;
    cursor: not-allowed !important;
  }

  .ant-select-disabled .ant-select-selector {
    background: #1b2533 !important;
    color: #ffffff !important;
    border-color: #303d50 !important;
    opacity: 1 !important;
    cursor: not-allowed !important;
  }

  .ant-select-disabled .ant-select-selection-item,
  .ant-select-disabled .ant-select-selection-placeholder {
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
    opacity: 1 !important;
  }
}

/* ==================== Select 下拉面板（全局深色） ==================== */
.ant-select-dropdown {
  background: #1b2533 !important;
  border: 1px solid #303d50 !important;
  border-radius: 4px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5) !important;

  .ant-select-item {
    color: #c0c8d4 !important;
    font-size: 13px !important;
    min-height: 32px !important;
    line-height: 32px !important;
    transition: background 0.15s !important;

    &:hover {
      background: rgba(0, 162, 232, 0.1) !important;
    }
  }

  .ant-select-item-option-selected {
    background: rgba(0, 162, 232, 0.15) !important;
    color: #00c6ff !important;
    font-weight: 500 !important;
  }

  .ant-select-item-option-active {
    background: rgba(255, 255, 255, 0.04) !important;
  }

  .ant-select-item-empty {
    color: #5a6a80 !important;
  }
}
</style>
