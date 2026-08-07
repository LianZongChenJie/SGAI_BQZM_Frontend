<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    width="1000px"
    wrapClassName="dark-tech-modal create-timer-modal"
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
        <div class="search-section" v-if="!isDetail">
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
              <a-form-item label="区域">
                <div style="width:100%">
                  <a-select
                    style="width:100%"
                    v-model:value="filterSpaceName"
                    :options="spaceFilterOptions"
                    placeholder="请选择区域"
                    allowClear
                    show-search
                    :filter-option="handleFilterOption"
                  />
                </div>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="名称">
                <div style="width:100%">
                  <a-input
                    style="width:100%"
                    v-model:value="filterAreaName"
                    placeholder="请输入名称"
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

        <!-- ==================== 第 3 行：表格（vxe-table） ==================== -->
        <div class="form-section">
          <div class="section-title">勾选数据</div>
          <a-row :gutter="10">
            <a-col :span="24">
              <div class="table-wrapper">
                <vxe-table
                  ref="tableRef"
                  :key="formData.relType"
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
                  <vxe-column field="spaceName" title="区域"></vxe-column>
                  <vxe-column field="areaName" title="名称"></vxe-column>
                  <vxe-column field="circuitName" title="回路名称" v-if="formData.relType === '回路'"></vxe-column>
                  <vxe-column field="electricCurrent" title="电流" width="100" v-if="formData.relType === '回路'">
                    <template #default="{ row }">
                      {{ row.electricCurrent != null ? row.electricCurrent : '-' }}
                    </template>
                  </vxe-column>
                </vxe-table>
              </div>
            </a-col>
          </a-row>
        </div>

        <!-- ==================== 第 4 行：操控类型 / 名称（放在表格下方） ==================== -->
        <div class="form-section task-info">
          <div class="section-title">定时任务信息</div>
          <a-row :gutter="10">
            <a-col :span="12">
              <a-form-item label="操控类型" name="operationType">
                <div style="width:100%">
                  <a-select
                    style="width:100%"
                    v-model:value="formData.operationType"
                    placeholder="请选择操控类型"
                    :options="operationTypeOptions"
                    allowClear
                  />
                </div>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="名称" name="planName">
                <div style="width:100%">
                  <a-input
                    style="width:100%"
                    v-model:value="formData.planName"
                    placeholder="请输入名称"
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

    <!-- ==================== 详情额外信息（仅 detail 模式显示） ==================== -->
    <div v-if="isDetail" class="detail-info-section">
      <div class="detail-item detail-item-sm">
        <span class="detail-label">开始时间</span>
        <span class="detail-value">{{ detailInfo.executionTime || '-' }}</span>
      </div>
      <div class="detail-item detail-item-smm">
        <span class="detail-label">操控类型</span>
        <span class="detail-value">{{ detailInfo.operationType || '-' }}</span>
      </div>
      <div class="detail-item detail-item-lg">
        <span class="detail-label">周期范围</span>
        <span class="detail-value">{{ detailInfo.dateRange || '-' }}</span>
      </div>
      <div class="detail-item detail-item-lgg">
        <span class="detail-label">执行日期</span>
        <span class="detail-value">{{ detailInfo.enabledWeek || '-' }}</span>
      </div>
    </div>

    <!-- ==================== 底部按钮 ==================== -->
    <div class="modal-footer">
      <button class="btn btn-cancel" @click="onCancel">取消</button>
      <button v-if="!isDetail" class="btn btn-submit" :loading="submitLoading" @click="onSubmit">确认创建</button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue';
import type { FormInstance } from 'ant-design-vue';
import { message } from 'ant-design-vue';
import { getAreaListAll, getCircuitListAll, editLightingPlanAPi, addLightingPlanAPi, planDetailApi } from '@/api/equipmentMonitoring'

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

const title = computed(() => {
  if (mode.value === 'add') return '新建定时任务';
  if (mode.value === 'edit') return '编辑定时任务';
  return '定时任务详情';
});
const isDetail = computed(() => mode.value === 'detail');

/** detail 模式额外信息（处理 executionInfo 嵌套字段） */
const detailInfo = computed(() => {
  const r = editRecord.value;
  if (!r) return {};
  const info = r.executionInfo || {};
  const start = info.startDate || r.startDate || '';
  const end = info.endDate || r.endDate || '';
  let weekStr = info.enabledWeek || r.enabledWeek || '';
  // 将数字映射为中文星期
  const weekMap: Record<string, string> = {
    '1': '周一', '2': '周二', '3': '周三', '4': '周四',
    '5': '周五', '6': '周六', '7': '周日',
    '周一': '周一', '周二': '周二', '周三': '周三', '周四': '周四',
    '周五': '周五', '周六': '周六', '周日': '周日',
  };
  if (weekStr && typeof weekStr === 'string') {
    weekStr = weekStr
      .split(/[,，]/)
      .map((d: string) => weekMap[d.trim()] || d.trim())
      .filter(Boolean)
      .join('、');
  }
  return {
    executionTime: r.executionTime || r.executionLocalTime || '',
    operationType: r.operationType || '',
    dateRange: start && end ? `${start} 至 ${end}` : (start || end || ''),
    enabledWeek: weekStr,
  };
});
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
const tableFilterLoading = ref(false);

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

// 区域筛选下拉选项（从表格数据中提取唯一值）
const spaceFilterOptions = computed(() => {
  const set = new Set<string>();
  tableData.value.forEach((item) => {
    if (item.spaceName) set.add(item.spaceName);
  });
  return Array.from(set).map((name) => ({ label: name, value: name }));
});

// 表格筛选后数据
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

// ==================== 方法 ====================

/** 下拉框本地搜索过滤 */
function handleFilterOption(input: string, option: any) {
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

/** vxe-table 复选框变化 */
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

/** 根据 relIds 勾选表格行 */
function checkRowsByRelIds(ids: string[]) {
  if (!ids.length) return;
  const idSet = new Set(ids.map(String));
  tableData.value.forEach((item) => (item._checked = idSet.has(String(item.id))));
  const checkedRows = tableData.value.filter((item) => idSet.has(String(item.id)));
  if (checkedRows.length) {
    tableRef.value?.setCheckboxRow(checkedRows, true);
  }
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
    if(mode.value === 'edit') {
      submitData['id'] = editRecord.value.id;
    }
     // 根据类型调用对应 API
    const api = mode.value === 'add' ? addLightingPlanAPi : editLightingPlanAPi;
 
    await api(submitData).then(res => {
      console.log('接口返回');
      console.log('res', res);
      if(!res) {
        message.success(mode.value === 'add' ? '新建定时任务成功！' : '编辑定时任务成功！');
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
  clearFilters();
  visible.value = true;
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
    const relIdArr = record.relIds ? String(record.relIds).split(',').filter(Boolean) : [];
    selectedRowKeys.value = [...relIdArr];
    tableLoading.value = true;
    try {
      await getDetailInit();
      await nextTick();
      checkRowsByRelIds(relIdArr);
    } finally {
      await nextTick();
      setTimeout(() => {
        tableLoading.value = false;
      }, 200);
    }
  } else if (type === 'edit' && record) {
    console.log('record', record);
    editRecord.value = record;
    formData.relType = record.relType || '';
    formData.operationType = record.operationType || '';
    formData.planName = record.planName || '';
    const relIdArr = record.relIds ? String(record.relIds).split(',').filter(Boolean) : [];
    selectedRowKeys.value = [...relIdArr];
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
  if (isDetail.value) return;
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
    const data = await planDetailApi(params);
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
/* ==================== 搜索项分组（高亮蓝 / 高饱和蓝） ==================== */
.search-section {
  margin-bottom: 8px;
  padding: 10px 14px 12px;
  /* 原型图：搜索项区域为更高亮、更高饱和度的蓝，与下方深蓝形成对比 */
  background: linear-gradient(180deg, #1f4373 0%, #1a385f 100%);
  border: 1px solid #3a6398;
  border-radius: 6px;
  box-shadow:
    inset 0 0 28px rgba(0, 212, 255, 0.08),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
    0 0 0 1px rgba(0, 212, 255, 0.06),
    0 4px 14px rgba(0, 30, 60, 0.4);

  :deep(.section-title) {
    margin-bottom: 6px;
    color: #b3e5ff !important;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1.2px;
    position: relative;
    padding-left: 12px;
    text-transform: uppercase;
    display: flex;
    align-items: center;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 13px;
      background: linear-gradient(180deg, #ffffff 0%, #00d4ff 100%);
      border-radius: 2px;
      box-shadow: 0 0 8px rgba(0, 212, 255, 0.8);
    }

    /* 标题后增加装饰横线（科技感） */
    &::after {
      content: '';
      flex: 1;
      margin-left: 10px;
      height: 1px;
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0%, rgba(0, 212, 255, 0.15) 50%, transparent 100%);
    }
  }

  :deep(.ant-form-item) {
    margin-bottom: 12px;
    width: 100% !important;
  }
  :deep(.ant-form-item-row) {
    width: 100% !important;
  }
  :deep(.ant-form-item-control) {
    flex: 1 1 0 !important;
    min-width: 0 !important;
    max-width: 100% !important;
  }
  :deep(.ant-form-item-control-input) {
    width: 100% !important;
  }
  :deep(.ant-form-item-control-input-content) {
    width: 100% !important;
  }

  /* 深色主题 - select（高亮蓝区域内：稍深的输入框背景以区分容器） */
  :deep(.ant-select-selector) {
    background: #15304f !important;
    border: 1px solid #4a6f96 !important;
    color: #ffffff !important;
    border-radius: 4px !important;
    display: flex !important;
    align-items: center !important;
    height: 32px !important;
    min-height: 32px !important;
    max-height: 32px !important;
    padding: 0 11px !important;
    box-sizing: border-box !important;
    transition: all 0.2s !important;
  }
  :deep(.ant-select-selector:hover) {
    border-color: #00d4ff !important;
    box-shadow: 0 0 0 1px rgba(0, 212, 255, 0.25);
  }
  :deep(.ant-select-focused .ant-select-selector) {
    border-color: #00d4ff !important;
    box-shadow:
      0 0 0 2px rgba(0, 212, 255, 0.3),
      0 0 10px rgba(0, 212, 255, 0.25) !important;
  }
  :deep(.ant-select-selection-item),
  :deep(.ant-select-selection-placeholder) {
    font-size: 12px !important;
  }
  :deep(.ant-select-selection-item) { color: #ffffff !important; }
  :deep(.ant-select-selection-placeholder) { color: #7a96b5 !important; font-size: 12px !important; }
  :deep(.ant-select-arrow) {
    color: #7a96b5 !important;
    position: absolute !important;
    right: 8px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    margin-top: 0 !important;
    line-height: 1 !important;
    height: auto !important;
  }
  :deep(.ant-select-arrow svg),
  :deep(.ant-select-arrow i) {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  :deep(.ant-select-clear) {
    background: #15304f !important;
    color: #7a96b5 !important;
  }

  /* 深色主题 - input */
  :deep(.ant-input-affix-wrapper) {
    background: #15304f !important;
    border: 1px solid #4a6f96 !important;
    border-radius: 4px !important;
    display: flex !important;
    align-items: center !important;
    height: 32px !important;
    min-height: 32px !important;
    max-height: 32px !important;
    padding: 0 11px !important;
    box-sizing: border-box !important;
    transition: all 0.2s !important;
  }
  :deep(.ant-input-affix-wrapper:hover) {
    border-color: #00d4ff !important;
    box-shadow: 0 0 0 1px rgba(0, 212, 255, 0.25);
  }
  :deep(.ant-input-affix-wrapper.ant-input-affix-wrapper-focused) {
    border-color: #00d4ff !important;
    box-shadow:
      0 0 0 2px rgba(0, 212, 255, 0.3),
      0 0 10px rgba(0, 212, 255, 0.25) !important;
  }
  :deep(.ant-input-affix-wrapper > input.ant-input) {
    background: transparent !important;
    border: none !important;
    color: #ffffff !important;
    font-size: 12px !important;
    height: 30px !important;
    line-height: 30px !important;
    padding: 0 !important;
  }
  :deep(.ant-input-affix-wrapper > input.ant-input::placeholder) {
    color: #7a96b5 !important;
  }
  :deep(.ant-input-affix-wrapper .ant-input-clear-icon) {
    height: auto !important;
    line-height: 1 !important;
    font-size: 12px !important;
    color: #7a96b5 !important;
  }

  /* 表单label */
  :deep(.ant-form-item-label > label) {
    color: #c9e0f5 !important;
    font-size: 12px !important;
    height: 28px !important;
  }
  :deep(.ant-form-item-required::before) {
    color: #ff7875 !important;
    display: inline-block !important;
    margin-right: 4px !important;
  }
}

/* ==================== 表单分组 / 表格区 / 信息区（深蓝 / 接近黑蓝） ==================== */
.form-section {
  margin-bottom: 8px;
  padding: 10px 14px 12px;
  /* 原型图：勾选数据 / 场景信息区域均为更深的蓝（接近黑），与上方高亮蓝形成对比 */
  background: linear-gradient(180deg, #0d1c2e 0%, #091523 100%);
  border: 1px solid #1a2e48;
  border-radius: 6px;
  box-shadow:
    inset 0 0 20px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(0, 162, 232, 0.03),
    0 2px 8px rgba(0, 0, 0, 0.3);

  :deep(.section-title) {
    margin-bottom: 8px;
    color: #6ecfef;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 1.2px;
    position: relative;
    padding-left: 12px;
    text-transform: uppercase;
    display: flex;
    align-items: center;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 13px;
      background: linear-gradient(180deg, #00d4ff 0%, #00a2e8 100%);
      border-radius: 2px;
      box-shadow: 0 0 6px rgba(0, 212, 255, 0.6);
    }

    /* 标题后装饰线 */
    &::after {
      content: '';
      flex: 1;
      margin-left: 10px;
      height: 1px;
      background: linear-gradient(90deg, rgba(0, 212, 255, 0.2) 0%, transparent 100%);
    }
  }

  :deep(.ant-form-item) {
    margin-bottom: 12px;
    width: 100% !important;
  }
  :deep(.ant-form-item-row) {
    width: 100% !important;
  }
  :deep(.ant-form-item-control) {
    flex: 1 1 0 !important;
    min-width: 0 !important;
    max-width: 100% !important;
  }
  :deep(.ant-form-item-control-input) {
    width: 100% !important;
  }
  :deep(.ant-form-item-control-input-content) {
    width: 100% !important;
  }

  /* 深色主题 - select */
  :deep(.ant-select-selector) {
    background: #1b2533 !important;
    border: 1px solid #303d50 !important;
    color: #ffffff !important;
    border-radius: 4px !important;
    display: flex !important;
    align-items: center !important;
    height: 32px !important;
    min-height: 32px !important;
    max-height: 32px !important;
    padding: 0 11px !important;
    box-sizing: border-box !important;
    transition: all 0.2s !important;
  }
  :deep(.ant-select-selector:hover) {
    border-color: #00a2e8 !important;
    box-shadow: 0 0 0 1px rgba(0, 162, 232, 0.15);
  }
  :deep(.ant-select-focused .ant-select-selector) {
    border-color: #00d4ff !important;
    box-shadow:
      0 0 0 2px rgba(0, 162, 232, 0.25),
      0 0 8px rgba(0, 162, 232, 0.2) !important;
  }
  :deep(.ant-select-selection-item),
  :deep(.ant-select-selection-placeholder) {
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
    display: flex !important;
    align-items: center !important;
    height: 32px !important;
    min-height: 32px !important;
    max-height: 32px !important;
    padding: 0 11px !important;
    box-sizing: border-box !important;
    transition: all 0.2s !important;
  }
  :deep(.ant-input-affix-wrapper:hover) {
    border-color: #00a2e8 !important;
    box-shadow: 0 0 0 1px rgba(0, 162, 232, 0.15);
  }
  :deep(.ant-input-affix-wrapper.ant-input-affix-wrapper-focused) {
    border-color: #00d4ff !important;
    box-shadow:
      0 0 0 2px rgba(0, 162, 232, 0.25),
      0 0 8px rgba(0, 162, 232, 0.2) !important;
  }
  :deep(.ant-input-affix-wrapper > input.ant-input) {
    background: transparent !important;
    border: none !important;
    color: #ffffff !important;
    font-size: 12px !important;
    height: 30px !important;
    line-height: 30px !important;
    padding: 0 !important;
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
    color: #b0c0d6 !important;
    font-size: 12px !important;
    height: 28px !important;
  }
  :deep(.ant-form-item-required::before) {
    color: #ff4d4f !important;
    display: inline-block !important;
    margin-right: 4px !important;
  }
}

/* ==================== 定时任务信息 section —— 紫色变体（与场景信息保持一致） ==================== */
.form-section.task-info {
  border-color: rgba(192, 132, 252, 0.32);
  box-shadow:
    inset 0 0 24px rgba(192, 132, 252, 0.06),
    0 0 0 1px rgba(192, 132, 252, 0.06);

  :deep(.section-title) {
    color: #d8b4fe !important;
  }

  :deep(.section-title::before) {
    background: linear-gradient(180deg, #c084fc 0%, #a855f7 100%) !important;
    box-shadow: 0 0 6px rgba(192, 132, 252, 0.6) !important;
  }

  :deep(.section-title::after) {
    background: linear-gradient(90deg, rgba(192, 132, 252, 0.3) 0%, transparent 100%) !important;
  }

  /* 内部控件 focus 时变紫色光晕 */
  :deep(.ant-select-focused .ant-select-selector),
  :deep(.ant-input-affix-wrapper.ant-input-affix-wrapper-focused) {
    border-color: #c084fc !important;
    box-shadow:
      0 0 0 2px rgba(192, 132, 252, 0.25),
      0 0 8px rgba(192, 132, 252, 0.2) !important;
  }

  :deep(.ant-select-selector:hover),
  :deep(.ant-input-affix-wrapper:hover) {
    border-color: #c084fc !important;
    box-shadow: 0 0 0 1px rgba(192, 132, 252, 0.2) !important;
  }
}

/* ==================== 详情额外信息区域 ==================== */
.detail-info-section {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 4px 10px;
  background: rgba(27, 37, 51, 0.4);
  border: 1px solid #303d50;
  border-radius: 4px;
}

.detail-item {
  display: flex;
  align-items: center;
  font-size: 13px;
  line-height: 28px;
  overflow: hidden;
}

.detail-item-sm {
  flex: 1;
}
.detail-item-smm {
  flex: 0.8;
}

.detail-item-lg {
  flex: 1.5;
}
.detail-item-lgg {
  flex: 2;
}

.detail-label {
  color: #a0aabf;
  flex-shrink: 0;
  margin-right: 6px;
}

.detail-label::after {
  content: '：';
}

.detail-value {
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==================== 表格区域 —— vxe-table 深色主题 ==================== */
.table-wrapper {
  overflow: hidden;
  margin-bottom: 4px;
  /* 与 form-section 同色系：深蓝（原型勾选数据区） */
  background: linear-gradient(180deg, #0a1828 0%, #081320 100%);
  border: 1px solid #15293f;
  border-radius: 4px;
  box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.35);
}

.table-wrapper :deep(.vxe-table) {
  background: transparent;
  color: #ffffff;
  border: 0;
  outline: 0;
  box-shadow: none;

  --vxe-ui-table-border-color: #1f2b3d;
  --vxe-ui-table-border-width: 0;
  --vxe-ui-table-checkbox-range-border-color: #00d4ff;
  --vxe-ui-table-cell-area-border-color: #00d4ff;
  --vxe-ui-table-cell-main-area-extension-border-color: #00d4ff;
  --vxe-ui-table-cell-extend-area-border-color: #00d4ff;
  --vxe-ui-table-cell-copy-area-border-color: #00d4ff;
  --vxe-ui-table-fixed-right-scrolling-box-shadow: none;
  --vxe-ui-table-fixed-left-scrolling-box-shadow: none;
  --vxe-ui-layout-background-color: transparent;
  --vxe-ui-table-header-background-color: #1b2533;
  --vxe-ui-table-footer-background-color: #141d2b;
  --vxe-ui-table-row-hover-background-color: rgba(0, 212, 255, 0.06);
  --vxe-ui-table-row-striped-background-color: transparent;
  --vxe-ui-table-row-current-background-color: rgba(0, 162, 232, 0.18);
  --vxe-ui-table-row-hover-current-background-color: rgba(0, 162, 232, 0.22);

  scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
}

/* 表头：加底部青光描边 */
.table-wrapper :deep(.vxe-table .vxe-header--wrapper),
.table-wrapper :deep(.vxe-header--row) {
  background: linear-gradient(180deg, #1f2b3d 0%, #1b2533 100%) !important;
}

.table-wrapper :deep(.vxe-table .vxe-header--wrapper) {
  position: relative;
  border-bottom: 1px solid #2a3a52;
  box-shadow: 0 1px 0 0 rgba(0, 212, 255, 0.1);
}

.table-wrapper :deep(.vxe-table .vxe-header--column) {
  font-weight: 500 !important;
  font-size: 12px !important;
  color: #8fa3bf !important;
  letter-spacing: 0.3px;
}

/* 表体行：hover 青色高亮 + 左侧条 */
.table-wrapper :deep(.vxe-table .vxe-body--row) {
  transition: background 0.2s;
  position: relative;
}

.table-wrapper :deep(.vxe-table .vxe-body--row:hover) {
  background: rgba(0, 212, 255, 0.06) !important;
  box-shadow: inset 2px 0 0 0 rgba(0, 212, 255, 0.6);
}

.table-wrapper :deep(.vxe-table .vxe-body--row.row--checked) {
  background: rgba(0, 162, 232, 0.18) !important;
  box-shadow: inset 2px 0 0 0 #00d4ff;
}

/* 行内单元格字号、行高紧凑 */
.table-wrapper :deep(.vxe-table .vxe-body--column) {
  font-size: 12px !important;
  color: #d6e0ee !important;
}

/* 复选框主题 */
.table-wrapper :deep(.vxe-table .vxe-checkbox--icon) {
  border-color: #4a5a70 !important;
  background: #1b2533 !important;
}
.table-wrapper :deep(.vxe-table .vxe-checkbox--checked .vxe-checkbox--icon) {
  background: #00a2e8 !important;
  border-color: #00d4ff !important;
  box-shadow: 0 0 6px rgba(0, 162, 232, 0.5);
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

/* ==================== 底部按钮 ==================== */
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
</style>

/* ==================== 全局 Modal 覆盖（深色科技风） ==================== */
<style lang="less">
.create-timer-modal {
  .ant-modal {
    top: 20px !important;
  }
}

/* ==================== dark-tech-modal 弹框样式 ==================== */
/* 使用 body 前缀提升特异性，覆盖全局 ant-modal 默认样式 */
body .dark-tech-modal {
  /* 覆写 Ant Design 5 默认紫色系 CSS 变量 */
  --ant-primary-color: #00a2e8 !important;
  --ant-primary-color-hover: #00d4ff !important;
  --ant-primary-color-active: #0088cc !important;
  --ant-primary-color-outline: rgba(0, 162, 232, 0.2) !important;

  .ant-modal {
    overflow: visible !important;
  }

  .ant-modal-content {
    /* 更深的底色，让边框/光晕对比更明显 */
    background: #0c1828 !important;
    /* 实色高亮边框 */
    border: 2px solid #00d4ff !important;
    border-radius: 8px !important;
    box-shadow:
      /* 内层紧贴边框的青色发光（四边均匀） */
      inset 0 0 0 1px rgba(0, 212, 255, 0.7),
      inset 0 0 14px 2px rgba(0, 212, 255, 0.25),
      /* 外层四边均匀散射的青蓝光晕 */
      0 0 8px 1px rgba(0, 212, 255, 0.65),
      0 0 20px 3px rgba(0, 162, 232, 0.5),
      0 0 44px 6px rgba(0, 162, 232, 0.32),
      0 0 80px 12px rgba(0, 162, 232, 0.18),
      /* 黑色投影 */
      0 12px 40px rgba(0, 0, 0, 0.7) !important;
    overflow: visible !important;
    position: relative;

    /* 顶部蓝色渐变光条 */
    &::before {
      content: '';
      position: absolute;
      top: -2px;
      left: 30px;
      right: 30px;
      height: 3px;
      background: linear-gradient(90deg, transparent 0%, rgba(0, 162, 232, 0.5) 10%, #00d4ff 40%, #ffffff 50%, #00d4ff 60%, rgba(0, 162, 232, 0.5) 90%, transparent 100%);
      box-shadow: 0 0 16px rgba(0, 212, 255, 1), 0 0 28px rgba(0, 162, 232, 0.6);
      border-radius: 2px;
      z-index: 5;
      pointer-events: none;
    }
  }

  .ant-modal-header {
    background: linear-gradient(180deg, #1b2533 0%, #162033 100%) !important;
    border-bottom: 1px solid #00a2e8 !important;
    padding: 12px 20px 10px !important;
    border-radius: 6px 6px 0 0 !important;
    position: relative;
  }

  .ant-modal-title {
    color: #ffffff !important;
    font-size: 16px !important;
    font-weight: 600 !important;
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif !important;
    letter-spacing: 0.8px !important;
    position: relative;
    padding-left: 18px !important;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 10px;
      height: 10px;
      background: #00d4ff;
      border-radius: 50%;
      box-shadow:
        0 0 10px rgba(0, 212, 255, 0.9),
        0 0 18px rgba(0, 162, 232, 0.5);
    }

    &::after {
      content: '';
      position: absolute;
      left: 20px;
      top: 50%;
      transform: translateY(-50%);
      width: 1px;
      height: 14px;
      background: linear-gradient(180deg, transparent, rgba(0, 212, 255, 0.6), transparent);
    }
  }

  .ant-modal-close {
    color: #a0aabf !important;
    top: 10px !important;
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
      background: rgba(0, 162, 232, 0.15) !important;
    }
  }

  .ant-modal-body {
    padding: 10px 16px 12px !important;
    background: #0c1828 !important;
  }

  .ant-modal-footer {
    display: none !important;
  }

  /* ==================== 表单覆盖 ==================== */
  .dark-form {
    margin-bottom: 8px;

    /* Row 撑满整列 */
    .ant-row {
      width: 100%;
    }

    /* Form item 撑满列宽 */
    .ant-form-item {
      width: 100% !important;
      margin-right: 0;
      margin-bottom: 12px !important;
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
      width: 100% !important;
      max-width: 100% !important;
      flex: 1 1 auto !important;
    }

    /* input 是原生元素，用 block 不用 flex */
    .ant-input {
      width: 100% !important;
      max-width: 100% !important;
    }

    .ant-form-item-label > label {
      color: #8fa3bf !important;
      font-size: 12px !important;
      font-weight: 400 !important;
    }

    .ant-form-item-label > label.ant-form-item-required::before {
      color: #ff4d4f !important;
    }

    /* Input 外层包裹器（统一高度 32px，强制锁定，不受 size="small" 与全局样式污染影响） */
    .ant-input-affix-wrapper {
      background: #1b2533 !important;
      border: 1px solid #303d50 !important;
      color: #ffffff !important;
      border-radius: 4px !important;
      transition: all 0.2s !important;
      display: flex !important;
      align-items: center !important;
      height: 32px !important;
      min-height: 32px !important;
      max-height: 32px !important;
      padding: 0 11px !important;
      box-sizing: border-box !important;

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
        height: 30px !important;
        line-height: 30px !important;
        padding: 0 !important;

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
      transition: all 0.2s !important;
      height: 32px !important;
      min-height: 32px !important;
      max-height: 32px !important;
      padding: 0 11px !important;
      line-height: 30px !important;
      box-sizing: border-box !important;

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
      font-size: 12px !important;
      transition: all 0.2s !important;
      display: flex !important;
      align-items: center !important;
      height: 32px !important;
      min-height: 32px !important;
      max-height: 32px !important;
      padding: 0 11px !important;
      box-sizing: border-box !important;

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

/* ==================== 终极保险：表单控件高度锁定 ==================== */
/* 问题：组件卸载/重挂时 scoped data-v-xxx 选择器与 .dark-form 类可能存在瞬时不匹配，*/
/* 导致切几次页面后下拉框与输入框高度不一致。*/
/* 解法：用 body 前缀提升特异性到 (0,4,0)，并绕过 .dark-form 直接定位到所有控件。*/
/* 由于本块位于全局样式末尾，源序优先，叠加 !important + body 前缀确保永远生效。*/
body .dark-tech-modal .ant-input-affix-wrapper,
body .dark-tech-modal .ant-input-affix-wrapper-sm,
body .dark-tech-modal .ant-input-affix-wrapper-lg {
  height: 32px !important;
  min-height: 32px !important;
  max-height: 32px !important;
  line-height: 32px !important;
  padding: 0 11px !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
  display: flex !important;
  align-items: center !important;
}

body .dark-tech-modal .ant-input-affix-wrapper > input.ant-input,
body .dark-tech-modal .ant-input-affix-wrapper > input.ant-input-sm,
body .dark-tech-modal .ant-input-affix-wrapper > input.ant-input-lg {
  height: 30px !important;
  min-height: 30px !important;
  max-height: 30px !important;
  line-height: 30px !important;
  padding: 0 !important;
  box-sizing: border-box !important;
  background: transparent !important;
  font-size: 12px !important;
}

body .dark-tech-modal .ant-input:not(.ant-input-affix-wrapper .ant-input):not(.ant-input-group .ant-input),
body .dark-tech-modal input.ant-input.ant-input-sm,
body .dark-tech-modal input.ant-input.ant-input-lg {
  height: 32px !important;
  min-height: 32px !important;
  max-height: 32px !important;
  line-height: 32px !important;
  padding: 0 11px !important;
  box-sizing: border-box !important;
  font-size: 12px !important;
}

body .dark-tech-modal .ant-select .ant-select-selector,
body .dark-tech-modal .ant-select .ant-select-selector.ant-select-selector-sm,
body .dark-tech-modal .ant-select .ant-select-selector.ant-select-selector-lg {
  height: 32px !important;
  min-height: 32px !important;
  max-height: 32px !important;
  line-height: 32px !important;
  padding: 0 11px !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
  display: flex !important;
  align-items: center !important;
}

body .dark-tech-modal .ant-select {
  height: 32px !important;
  line-height: 32px !important;
}

body .dark-tech-modal .ant-select .ant-select-selection-item,
body .dark-tech-modal .ant-select .ant-select-selection-placeholder {
  line-height: 30px !important;
  font-size: 12px !important;
}

body .dark-tech-modal .ant-input-number,
body .dark-tech-modal .ant-input-number-input {
  height: 32px !important;
  line-height: 32px !important;
}

/* 防止第一列 a-col 因为 align-items 默认 stretch 导致高度不一致 */
body .dark-tech-modal .ant-row {
  align-items: flex-start !important;
}

/* ==================== 全面覆盖 Ant Design 5 默认紫色 outline/focus ==================== */
body .dark-tech-modal {
  /* 禁用 Ant Design 5 默认 outline（紫/蓝），改用 border-box-shadow 方案 */
  .ant-select-outlined,
  .ant-input-outlined,
  .ant-picker-outlined {
    &:focus,
    &:focus-visible,
    &:focus-within {
      outline: none !important;
    }
  }

  /* 所有 input/select/picker 聚焦状态统一为青色 */
  .ant-input-affix-wrapper:focus,
  .ant-input-affix-wrapper:focus-visible,
  .ant-input-affix-wrapper.ant-input-affix-wrapper-focused,
  .ant-input:focus,
  .ant-input:focus-visible,
  .ant-input.ant-input-focused,
  .ant-input-focused,
  .ant-select:focus,
  .ant-select:focus-visible,
  .ant-select-focused,
  .ant-select.ant-select-focused,
  .ant-picker:focus,
  .ant-picker:focus-visible,
  .ant-picker-focused,
  .ant-picker.ant-picker-focused {
    outline: none !important;
  }

  /* 输入框聚焦：用 box-shadow 替代 outline */
  .ant-input-affix-wrapper-focused,
  .ant-input-focused {
    outline: none !important;
    border-color: #00d4ff !important;
    box-shadow:
      0 0 0 2px rgba(0, 162, 232, 0.25),
      0 0 8px rgba(0, 162, 232, 0.2) !important;
  }

  /* 选择框聚焦 */
  .ant-select-focused .ant-select-selector {
    outline: none !important;
    border-color: #00d4ff !important;
    box-shadow:
      0 0 0 2px rgba(0, 162, 232, 0.25),
      0 0 8px rgba(0, 162, 232, 0.2) !important;
  }

  /* 普通 input（非 wrapper）聚焦 */
  .ant-input:focus,
  .ant-input-focused {
    outline: none !important;
    border-color: #00d4ff !important;
    box-shadow:
      0 0 0 2px rgba(0, 162, 232, 0.25),
      0 0 8px rgba(0, 162, 232, 0.2) !important;
  }
}
</style>
