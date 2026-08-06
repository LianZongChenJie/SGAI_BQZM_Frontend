<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    width="1100px"
    wrapClassName="dark-tech-modal create-scene-modal"
    :footer="null"
    top="20px"
    :maskClosable="false"
    @cancel="onCancel"
  >
    <!-- ==================== 表单 + 表格 统一 Loading 容器 ==================== -->
    <div v-loading="tableLoading || submitLoading" class="modal-body-content">
      <!-- ==================== 单一 <a-form> 包裹，使用 <a-row>/<a-col> 栅格布局 ==================== -->
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        class="dark-form"
        :label-col="{ style: { width: '72px' } }"
        :disabled="isDetail"
        autocomplete="off"
      >
        <!-- ==================== 搜索项分组 ==================== -->
        <div class="search-section">
          <div class="section-title">搜索项</div>
          <!-- 第 1 行：控制类型 / 区域 / 名称 -->
          <a-row :gutter="10">
            <a-col :span="8">
              <a-form-item label="控制类型" name="relType">
                <div style="width:100%">
                  <a-select
                    style="width:100%"
                    v-model:value="formData.relType"
                    placeholder="请选择控制类型"
                    :options="relTypeOptions"
                    allowClear
                    @change="handleChangeRelType"
                  />
                </div>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="地块名称">
                <div style="width:100%">
                  <a-select
                    style="width:100%"
                    v-model:value="filterSpaceName"
                    :options="tagOptions"
                    placeholder="请选择地块名称"
                    allowClear
                    show-search
                    :filter-option="handleFilterTagOption"
                    :loading="tagLoading"
                  />
                </div>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="区域名称">
                <div style="width:100%">
                  <a-input
                    style="width:100%"
                    v-model:value="filterAreaName"
                    placeholder="请输入区域名称"
                    allowClear
                    autocomplete="off"
                  />
                </div>
              </a-form-item>
            </a-col>
          </a-row>
          <!-- 第 2 行：回路名称 -->
          <a-row :gutter="10">
            <a-col :span="8" v-if="formData.relType === '回路'">
              <a-form-item label="回路名称">
                <div style="width:100%">
                  <a-input
                    style="width:100%"
                    v-model:value="filterCircuitName"
                    placeholder="请输入回路名称"
                    allowClear
                    autocomplete="off"
                  />
                </div>
              </a-form-item>
            </a-col>
            <a-col :span="formData.relType === '回路' ? 16 : 24"></a-col>
          </a-row>
        </div>

        <!-- ==================== 第 3 行：表格 ==================== -->
        <div class="form-section">
          <div class="section-title">需要勾选的列表</div>
          <a-row :gutter="10">
            <a-col :span="24">
              <div class="table-wrapper">
                <vxe-table
                  ref="tableRef"
                  :data="filteredTableData"
                  :loading="tableLoading || tableFilterLoading"
                  :row-config="{ keyField: 'id', height: 32 }"
                  :checkbox-config="{ checkField: '_checked' }"
                  max-height="420"
                  border="none"
                  @checkbox-change="onCheckboxChange"
                  @checkbox-all="onCheckboxAll"
                >
                  <vxe-column type="checkbox" width="45" fixed="left" v-if="!isDetail"></vxe-column>
                  <vxe-column type="seq" title="序号" width="60" fixed="left"></vxe-column>
                  <vxe-column field="spaceName" title="地块名称" min-width="120"></vxe-column>
                  <vxe-column field="areaName" title="区域名称"></vxe-column>
                  <vxe-column field="circuitName" title="回路名称" v-if="formData.relType === '回路'"></vxe-column>
                </vxe-table>
              </div>
            </a-col>
          </a-row>
        </div>

        <!-- ==================== 第 4 行：标签 / 场景名称 ==================== -->
        <div class="form-section">
          <div class="section-title">场景信息</div>
          <a-row :gutter="10">
            <a-col :span="12">
              <a-form-item label="标签" name="spaceId">
                <div style="width:100%">
                  <a-select
                    style="width:100%"
                    v-model:value="formData.spaceId"
                    placeholder="请选择标签"
                    :options="tagOptions"
                    allowClear
                    :filter-option="handleFilterTagOption"
                    :loading="tagLoading"
                  />
                </div>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="场景名称" name="planName">
                <div style="width:100%">
                  <a-input
                    style="width:100%"
                    v-model:value="formData.planName"
                    placeholder="请输入场景名称"
                    allowClear
                    autocomplete="off"
                  />
                </div>
              </a-form-item>
            </a-col>
          </a-row>
        </div>
      </a-form>
    </div>

    <!-- ==================== Modal 底部操作按钮 ==================== -->
    <div class="modal-footer" v-if="!isDetail">
      <button class="btn btn-cancel" @click="onCancel">取消</button>
      <button class="btn btn-submit" :loading="submitLoading" @click="onSubmit">确认创建</button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch } from 'vue';
import type { FormInstance } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import { getAreaListAll, getCircuitListAll, editLightingPlanAPi, addLightingPlanAPiNew, planDetailApiNew } from '@/api/equipmentMonitoring'
import { getAllSpace } from '@/api/baseSettingBqZm';

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

const title = computed(() => (mode.value === 'add' ? '创建新场景' : mode.value === 'edit' ? '编辑场景': '场景详情'));
const isDetail = computed(() => mode.value === 'detail');
// 表单数据
const formData = reactive({
  relType: '',
  operationType: '',
  spaceId: undefined as string | undefined,
  planName: '',
});

// 表单校验规则
const formRules = {
  relType: [{ required: true, message: '请选择控制类型' }],
  operationType: [{ required: true, message: '请选择操控类型' }],
  spaceId: [{ required: true, message: '请选择标签' }],
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

// 标签下拉选项（调用getAllSpace接口获取）
const tagOptions = ref<{ label: string; value: string }[]>([]);
const tagLoading = ref(false);

// 表格过滤 loading
const tableFilterLoading = ref(false);

// 默认表单值
const defaultForm = {
  relType: '',
  operationType: '',
  spaceId: undefined as string | undefined,
  planName: '',
};

// 表格数据
const tableData = ref<any[]>([]);

// vxe-table 实例引用
const tableRef = ref();

// 复选框勾选
const selectedRowKeys = ref<string[]>([]);

// ==================== 本地筛选 ====================
const filterSpaceName = ref<string | undefined>(undefined);
const filterAreaName = ref('');
const filterCircuitName = ref('');
const debouncedAreaName = ref('');
const debouncedCircuitName = ref('');

let areaDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let circuitDebounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(filterAreaName, (val) => {
  tableFilterLoading.value = true;
  if (areaDebounceTimer) clearTimeout(areaDebounceTimer);
  areaDebounceTimer = setTimeout(() => {
    debouncedAreaName.value = val;
    nextTick(() => { tableFilterLoading.value = false; });
  }, 300);
});
watch(filterCircuitName, (val) => {
  tableFilterLoading.value = true;
  if (circuitDebounceTimer) clearTimeout(circuitDebounceTimer);
  circuitDebounceTimer = setTimeout(() => {
    debouncedCircuitName.value = val;
    nextTick(() => { tableFilterLoading.value = false; });
  }, 300);
});

const filteredTableData = computed(() => {
  let data = tableData.value;
  if (filterSpaceName.value) {
    data = data.filter((item) => item.spaceName === filterSpaceName.value);
  }
  if (debouncedAreaName.value) {
    const kw = debouncedAreaName.value.toLowerCase();
    data = data.filter((item) => (item.areaName || '').toLowerCase().includes(kw));
  }
  if (debouncedCircuitName.value) {
    const kw = debouncedCircuitName.value.toLowerCase();
    data = data.filter((item) => (item.circuitName || '').toLowerCase().includes(kw));
  }
  return data;
});

/** 下拉框本地搜索过滤 */
function handleFilterTagOption(input: string, option: any) {
  return (option.label || '').toLowerCase().includes(input.toLowerCase());
}

/** 清空筛选条件 */
function clearFilters() {
  filterSpaceName.value = undefined;
  filterAreaName.value = '';
  filterCircuitName.value = '';
  debouncedAreaName.value = '';
  debouncedCircuitName.value = '';
}

// ==================== 方法 ====================

/** vxe-table 复选框变化（含表头全选/反选） */
function onCheckboxChange({ records }: { records: any[] }) {
  selectedRowKeys.value = records.map((item: any) => item.id);
}

function onCheckboxAll({ records }: { records: any[] }) {
  selectedRowKeys.value = records.map((item: any) => item.id);
}

/** 清空所有勾选 */
function clearSelection() {
  selectedRowKeys.value = [];
  tableRef.value?.clearCheckboxRow();
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
    if(submitLoading.value) {
      return;
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

/** 加载标签下拉选项 */
async function loadTagOptions() {
  try {
    tagLoading.value = true;
    const res = await getAllSpace();
    const data = res?.data || res || [];
    tagOptions.value = (Array.isArray(data) ? data : []).map((item: any) => ({
      label: item.spaceName,
      value: item.spaceName,
    }));
  } catch {
    tagOptions.value = [];
  } finally {
    tagLoading.value = false;
  }
}

/** 根据 relIds 勾选表格行 */
function checkRowsByRelIds(ids: string[]) {
  if (!ids.length) return;
  const idSet = new Set(ids.map(String));
  // 在源数据上标记 _checked（vxe-table checkField 依此渲染勾选态）
  tableData.value.forEach((item) => (item._checked = idSet.has(String(item.id))));
  // 同步 vxe-table 内部状态
  const checkedRows = tableData.value.filter((item) => idSet.has(String(item.id)));
  if (checkedRows.length) {
    tableRef.value?.setCheckboxRow(checkedRows, true);
  }
}

/** 打开弹框 */
async function showModal(type: 'add' | 'edit' | 'detail', record?: any) {
  mode.value = type;
  formRef.value?.resetFields();
  clearFilters();
  visible.value = true;
  // 预加载标签下拉选项
  loadTagOptions();
  if (type === 'add') {
    Object.assign(formData, { ...defaultForm });
    selectedRowKeys.value = [];
    editRecord.value = null;
    // 默认区域
    formData.relType = '区域';
    // 表单 + 表格一起进入 loading
    tableLoading.value = true;
    try {
      await loadAreaData(); // 区域
    } finally {
      await nextTick();
      setTimeout(() => {
        tableLoading.value = false;
      }, 200);
    }
  } else if (type === 'edit' && record) {
    editRecord.value = record;
    // 回填表单数据
    formData.relType = record.relType || '';
    formData.planName = record.planName || '';
    formData.spaceId = record.spaceId || '';
    // relIds 是逗号分隔的字符串，转数组
    const relIdArr = record.relIds ? String(record.relIds).split(',').filter(Boolean) : [];
    selectedRowKeys.value = [...relIdArr];
    // 根据 relType 加载全量数据，再勾选
    tableLoading.value = true;
    try {
      if (record.relType === '回路') {
        await loadCircuitData();
      } else {
        await loadAreaData();
      }
      await nextTick();
      checkRowsByRelIds(relIdArr);
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

  
  // 清除校验残留
  nextTick(() => {
    formRef.value?.clearValidate();
  });
}

/** 关闭弹框 */
function closeModal() {
  visible.value = false;
  formRef.value?.resetFields();
  clearFilters();
}

/** 切换控制类型 */
const handleChangeRelType = async () => {
  // 切换类型时清空筛选和选择（因为数据结构不同）
  clearFilters();
  clearSelection();
  // 表单 + 表格一起进入 loading
  tableLoading.value = true;
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
/* ==================== Grid 统一布局：每行3列 ==================== */
.layout-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px 24px;
  margin-bottom: 20px;

  /* form-item 在 grid 内不产生额外 margin */
  :deep(.ant-form-item) {
    margin-bottom: 0;
  }

  /* form-item 内的控件铺满 */
  :deep(.ant-form-item .ant-select),
  :deep(.ant-form-item .ant-input-affix-wrapper) {
    width: 100%;
  }
}

/* 筛选单元格 */
.filter-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.filter-label {
  white-space: nowrap;
  flex-shrink: 0;
  color: #b0c0d6;
  font-size: 13px;
}

.filter-cell :deep(.ant-select),
.filter-cell :deep(.ant-input-affix-wrapper) {
  flex: 1 1 0;
  min-width: 0;
  width: 100%;
}

/* 操作按钮单元格：固定在最后一列、右对齐 */
.action-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  grid-column: 3;
}

/* ==================== 搜索项分组 ==================== */
.search-section {
  margin-bottom: 4px;
  padding: 4px 10px 6px;
  background: rgba(20, 29, 43, 0.6);
  border: 1px solid #1f2b3d;
  border-radius: 6px;

  :deep(.section-title) {
    margin-bottom: 3px;
    color: #6ecfef !important;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1px;
    position: relative;
    padding-left: 10px;
    text-transform: uppercase;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 10px;
      background: linear-gradient(180deg, #00a2e8, #0078c8);
      border-radius: 2px;
    }
  }

  :deep(.ant-form-item) {
    margin-bottom: 2px;
  }

  /* 深色主题 - select */
  :deep(.ant-select-selector) {
    background: #1b2533 !important;
    border: 1px solid #303d50 !important;
    color: #ffffff !important;
    border-radius: 4px !important;
    height: 28px !important;
    box-sizing: border-box !important;
    padding: 0 26px 0 10px !important;
    display: flex !important;
    align-items: center !important;
  }
  :deep(.ant-select-selector:hover) {
    border-color: #00a2e8 !important;
  }
  :deep(.ant-select-selection-item),
  :deep(.ant-select-selection-placeholder) {
    line-height: 26px !important;
    font-size: 12px !important;
  }
  :deep(.ant-select-selection-item) { color: #ffffff !important; }
  :deep(.ant-select-selection-placeholder) { color: #5a6a80 !important; font-size: 12px !important; }
  :deep(.ant-select-arrow) {
    color: #5a6a80 !important;
    position: absolute !important;
    right: 8px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    margin-top: 0 !important;
    line-height: 1 !important;
    height: auto !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  :deep(.ant-select-arrow svg),
  :deep(.ant-select-arrow i) {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  :deep(.ant-select-clear) {
    background: #1b2533 !important;
    color: #5a6a80 !important;
  }

  /* 深色主题 - input */
  :deep(.ant-input-affix-wrapper) {
    background: #1b2533 !important;
    border: 1px solid #303d50 !important;
    border-radius: 4px !important;
    height: 28px !important;
    min-height: 28px !important;
    max-height: 28px !important;
    box-sizing: border-box !important;
    padding: 0 10px !important;
    box-shadow: none !important;
    display: flex !important;
    align-items: center !important;
    overflow: hidden !important;
  }
  :deep(.ant-input-affix-wrapper:hover) {
    border-color: #00a2e8 !important;
  }
  :deep(.ant-input-affix-wrapper.ant-input-affix-wrapper-focused) {
    border-color: #00a2e8 !important;
    box-shadow: 0 0 0 2px rgba(0, 162, 232, 0.15) !important;
  }
  :deep(.ant-input-affix-wrapper > input.ant-input) {
    background: transparent !important;
    border: none !important;
    color: #ffffff !important;
    font-size: 12px !important;
    height: 26px !important;
    line-height: 26px !important;
    padding: 0 !important;
    box-shadow: none !important;
  }
  :deep(.ant-input-affix-wrapper > input.ant-input::placeholder) {
    color: #5a6a80 !important;
  }
  :deep(.ant-input-affix-wrapper .ant-input-clear-icon) {
    height: auto !important;
    line-height: 1 !important;
    font-size: 12px !important;
    color: #5a6a80 !important;
  }

  /* 表单label */
  :deep(.ant-form-item-label > label) {
    color: #8fa3bf !important;
    font-size: 12px !important;
    height: 28px !important;
  }
  :deep(.ant-form-item-required::before) {
    color: #ff4d4f !important;
  }
}

/* ==================== 表单分组（表格区/场景信息区） ==================== */
.form-section {
  margin-bottom: 4px;
  padding: 4px 10px 8px;
  background: rgba(20, 29, 43, 0.6);
  border: 1px solid #1f2b3d;
  border-radius: 6px;

  :deep(.section-title) {
    margin-bottom: 4px;
    color: #6ecfef;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1px;
    position: relative;
    padding-left: 10px;
    text-transform: uppercase;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 10px;
      background: linear-gradient(180deg, #00a2e8, #0078c8);
      border-radius: 2px;
    }
  }

  :deep(.ant-form-item) {
    margin-bottom: 2px;
  }

  /* 深色主题 - select */
  :deep(.ant-select-selector) {
    background: #1b2533 !important;
    border: 1px solid #303d50 !important;
    color: #ffffff !important;
    border-radius: 4px !important;
    height: 28px !important;
    box-sizing: border-box !important;
    padding: 0 26px 0 10px !important;
    display: flex !important;
    align-items: center !important;
  }
  :deep(.ant-select-selector:hover) {
    border-color: #00a2e8 !important;
  }
  :deep(.ant-select-selection-item),
  :deep(.ant-select-selection-placeholder) {
    line-height: 26px !important;
    font-size: 12px !important;
  }
  :deep(.ant-select-selection-item) { color: #ffffff !important; }
  :deep(.ant-select-selection-placeholder) { color: #5a6a80 !important; font-size: 12px !important; }
  :deep(.ant-select-arrow) {
    color: #5a6a80 !important;
    position: absolute !important;
    right: 8px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    margin-top: 0 !important;
    line-height: 1 !important;
    height: auto !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  :deep(.ant-select-arrow svg),
  :deep(.ant-select-arrow i) {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  :deep(.ant-select-clear) {
    background: #1b2533 !important;
    color: #5a6a80 !important;
  }

  /* 深色主题 - input */
  :deep(.ant-input-affix-wrapper) {
    background: #1b2533 !important;
    border: 1px solid #303d50 !important;
    border-radius: 4px !important;
    height: 28px !important;
    min-height: 28px !important;
    max-height: 28px !important;
    box-sizing: border-box !important;
    padding: 0 10px !important;
    box-shadow: none !important;
    display: flex !important;
    align-items: center !important;
    overflow: hidden !important;
  }
  :deep(.ant-input-affix-wrapper:hover) {
    border-color: #00a2e8 !important;
  }
  :deep(.ant-input-affix-wrapper.ant-input-affix-wrapper-focused) {
    border-color: #00a2e8 !important;
    box-shadow: 0 0 0 2px rgba(0, 162, 232, 0.15) !important;
  }
  :deep(.ant-input-affix-wrapper > input.ant-input) {
    background: transparent !important;
    border: none !important;
    color: #ffffff !important;
    font-size: 12px !important;
    height: 26px !important;
    line-height: 26px !important;
    padding: 0 !important;
    box-shadow: none !important;
  }
  :deep(.ant-input-affix-wrapper > input.ant-input::placeholder) {
    color: #5a6a80 !important;
  }
  :deep(.ant-input-affix-wrapper .ant-input-clear-icon) {
    height: auto !important;
    line-height: 1 !important;
    font-size: 12px !important;
    color: #5a6a80 !important;
  }

  /* 表单label */
  :deep(.ant-form-item-label > label) {
    color: #8fa3bf !important;
    font-size: 12px !important;
    height: 28px !important;
  }
  :deep(.ant-form-item-required::before) {
    color: #ff4d4f !important;
  }
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 8px 0 0;
  border-top: 1px solid #303d50;
  margin-top: 8px;
}

.btn {
  height: 32px;
  padding: 0 18px;
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

/* ==================== 表格区域 —— vxe-table 深色主题 ==================== */
.table-wrapper {
  overflow: hidden;
  margin-bottom: 20px;
}

.table-wrapper :deep(.vxe-table) {
  background: #141d2b;
  color: #ffffff;
  border: 0;
  outline: 0;
  box-shadow: none;

  --vxe-ui-table-border-color: #141d2b;
  --vxe-ui-table-border-width: 0;
  --vxe-ui-table-checkbox-range-border-color: #141d2b;
  --vxe-ui-table-cell-area-border-color: #141d2b;
  --vxe-ui-table-cell-main-area-extension-border-color: #141d2b;
  --vxe-ui-table-cell-extend-area-border-color: #141d2b;
  --vxe-ui-table-cell-copy-area-border-color: #141d2b;
  --vxe-ui-table-fixed-right-scrolling-box-shadow: none;
  --vxe-ui-table-fixed-left-scrolling-box-shadow: none;
  --vxe-ui-layout-background-color: #141d2b;
  --vxe-ui-table-header-background-color: #1b2533;
  --vxe-ui-table-footer-background-color: #141d2b;
  --vxe-ui-table-row-hover-background-color: rgba(255, 255, 255, 0.04);
  --vxe-ui-table-row-striped-background-color: #141d2b;
  --vxe-ui-table-row-current-background-color: rgba(0, 162, 232, 0.15);

  scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
}

/* 自定义滚动条 */
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

/* 表头行：去掉右边线 */
.table-wrapper :deep(.vxe-header--row),
.table-wrapper :deep(.vxe-header--row .vxe-header--column),
.table-wrapper :deep(.vxe-header--row .vxe-header--column:last-child),
.table-wrapper :deep(.vxe-header--row .col--fixed-right) {
  border-right: 0 !important;
  background-image: none !important;
}

/* Gutter 列：去掉所有边界线、背景色 */
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
</style>

/* ==================== 全局 Modal 覆盖（深色科技风） ==================== */
<style lang="less">
.create-scene-modal {
  .ant-modal {
    top: 20px !important;
  }
}

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
    padding: 10px 20px 8px !important;
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
    top: 8px !important;
    right: 14px !important;
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
    padding: 8px 16px 10px !important;
    background: #141d2b !important;
  }

  .ant-modal-footer {
    display: none !important;
  }

  /* ==================== 表单覆盖 ==================== */
  .dark-form {
    margin-bottom: 10px;

    /* Row 撑满表单宽度 */
    .ant-row {
      width: 100%;
    }

    /* Form item 撑满列宽 */
    .ant-form-item {
      width: 100% !important;
      margin-right: 0;
      margin-bottom: 10px !important;
    }

    .ant-form-item-row {
      width: 100% !important;
    }

    /* 控件区域 flex 撑满 */
    .ant-form-item-control {
      flex: 1 1 0 !important;
      min-width: 0 !important;
      max-width: 100% !important;
    }

    .ant-form-item-control-input {
      width: 100% !important;
    }

    .ant-form-item-control-input-content {
      width: 100% !important;
    }

    /* 控件自身铺满（强制 block-level） */
    .ant-input-affix-wrapper,
    .ant-select {
      display: flex !important;
      width: 100% !important;
      max-width: 100% !important;
      flex: 1 1 auto !important;
    }

    /* input 是原生元素，用 block 不用 flex */
    .ant-input {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    .ant-form-item-label > label {
      color: #8fa3bf !important;
      font-size: 12px !important;
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
      height: 28px !important;
      min-height: 28px !important;
      max-height: 28px !important;
      box-sizing: border-box !important;
      padding: 0 10px !important;
      display: flex !important;
      align-items: center !important;
      overflow: hidden !important;
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
        font-size: 12px !important;
        height: 26px !important;
        line-height: 26px !important;
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
      font-size: 12px !important;
      height: 28px !important;
      box-sizing: border-box !important;
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
    .ant-select {
      height: 28px !important;
      box-sizing: border-box !important;
    }

    .ant-select-selector {
      background: #1b2533 !important;
      border: 1px solid #303d50 !important;
      color: #ffffff !important;
      border-radius: 4px !important;
      height: 28px !important;
      box-sizing: border-box !important;
      font-size: 12px !important;
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
      position: absolute !important;
      right: 8px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      margin-top: 0 !important;
      line-height: 1 !important;
      height: auto !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    .ant-select-arrow svg,
    .ant-select-arrow i {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
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
      font-size: 12px !important;
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

/* ==================== 筛选单元格（Grid 内非表单控件）深色主题 ==================== */
.dark-tech-modal .layout-grid .filter-cell {
  .ant-input-affix-wrapper {
    background: #1b2533 !important;
    border: 1px solid #303d50 !important;
    color: #ffffff !important;
    border-radius: 4px !important;
    height: 28px !important;
    box-sizing: border-box !important;
    padding: 0 10px !important;
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

    .ant-input {
      background: transparent !important;
      border: none !important;
      color: #ffffff !important;
      font-size: 12px !important;
      height: 26px !important;
      line-height: 26px !important;
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

  /* 无 allowClear 时的普通 input（直接渲染的 input.ant-input） */
  .ant-input:not(.ant-input-affix-wrapper .ant-input) {
    background: #1b2533 !important;
    border: 1px solid #303d50 !important;
    color: #ffffff !important;
    border-radius: 4px !important;
    height: 28px !important;
    box-sizing: border-box !important;
    font-size: 12px !important;
    padding: 0 10px !important;
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

  .ant-select-selector {
    background: #1b2533 !important;
    border: 1px solid #303d50 !important;
    color: #ffffff !important;
    border-radius: 4px !important;
    height: 28px !important;
    box-sizing: border-box !important;
    font-size: 12px !important;
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
    font-size: 12px !important;
    min-height: 28px !important;
    line-height: 28px !important;
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
