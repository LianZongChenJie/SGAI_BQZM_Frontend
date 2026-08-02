<template>
  <div class="add-modal-wrapper">
    <a-modal
      v-model:open="open"
      title="启用定时任务"
      :footer="null"
      width="560px"
      :destroyOnClose="true"
      :maskClosable="false"
      wrapClassName="dark-tech-modal"
    >
      <!-- 顶部提示条 -->
      <div class="modal-tip">
        <svg class="tip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>请配置周期范围、执行日期和执行时间以启用该定时任务</span>
      </div>

      <a-form
        v-if="open"
        ref="formRef"
        :model="formState"
        :label-col="{ span: 5 }"
        :wrapper-col="{ span: 19 }"
        autocomplete="off"
        class="dark-form"
      >
        <!-- 周期范围 -->
        <a-form-item label="周期范围" name="date" :rules="[{ required: true, message: '请选择周期范围' }]">
          <a-range-picker v-model:value="formState.date" style="width: 100%" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
        </a-form-item>

        <!-- 执行日期 -->
        <a-form-item label="执行日期" name="weeks" :rules="[{ required: true, message: '请选择执行日期' }]">
          <a-checkbox-group v-model:value="formState.weeks" name="checkboxgroup" :options="weekOptions" />
        </a-form-item>

        <!-- 执行时间 -->
        <a-form-item label="执行时间" name="executionTime" :rules="[{ required: true, message: '请选择执行时间' }]">
          <a-time-picker v-model:value="formState.executionTime" value-format="HH:mm:ss" style="width: 100%" />
        </a-form-item>
      </a-form>

      <!-- 底部操作按钮 -->
      <div class="modal-footer">
        <a-button class="btn-cancel" @click="closeModal">取消</a-button>
        <a-button class="btn-reset" @click="onReset">重置</a-button>
        <a-button class="btn-confirm" type="primary" :loading="loading" @click="onSubmit">确定</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import { getPlanTimeApi, enablePlanApi } from '@/api/equipmentMonitoring';

const emit = defineEmits<{
  success: [];
}>();

/* ==================== 弹框状态 ==================== */
const open = ref(false);
const formRef = ref<FormInstance>();
const loading = ref(false);
const targetId = ref('');

/* ==================== 表单字段定义 ==================== */
interface FormState {
  date: Array<any>;
  weeks: Array<string>;
  executionTime: string;
  id: string;
  planId: string;
}

const formState = reactive<FormState>({
  date: [],
  weeks: [],
  executionTime: '',
  id: '',
  planId: '',
});

/* ==================== 周选项 ==================== */
const weekOptions = [
  { label: '周一', value: '1' },
  { label: '周二', value: '2' },
  { label: '周三', value: '3' },
  { label: '周四', value: '4' },
  { label: '周五', value: '5' },
  { label: '周六', value: '6' },
  { label: '周日', value: '7' },
];

/* ==================== 方法 ==================== */

/** 打开弹框 */
async function showModal(row: any) {
  formState.id = '';
  formState.weeks = [];
  formState.executionTime = '';
  formState.date = [];
  targetId.value = row.id;

  try {
    const res = await getPlanTimeApi({ planId: row.id });
    if (res) {
      formState.id = res.id;
      formState.date = [res.startDate, res.endDate];
      formState.executionTime = res.executionTime;
      formState.weeks = res.enabledWeek ? res.enabledWeek.split(',') : [];
    }
  } catch (err) {
    console.error('获取计划时间信息失败：', err);
  }

  open.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
}

/** 关闭弹框 */
function closeModal() {
  open.value = false;
  formRef.value?.resetFields();
}

/** 重置 */
function onReset() {
  formState.date = [];
  formState.weeks = [];
  formState.executionTime = '';
  formRef.value?.clearValidate();
}

/** 处理日期格式 YYYY-MM-DD */
function convertTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 提交 */
async function onSubmit() {
  try {
    await formRef.value!.validate();

    loading.value = true;
    const params = {
      planId: targetId.value,
      id: formState.id,
      startDate: convertTime(new Date(formState.date[0])),
      endDate: convertTime(new Date(formState.date[1])),
      enabledWeek: formState.weeks.join(','),
      executionTime: formState.executionTime,
    };

    await enablePlanApi(params);
    message.success('启用成功！');
    formRef.value?.resetFields();
    open.value = false;
    emit('success');
  } catch (err: any) {
    // 表单校验失败由 antd 自带提示，不作额外处理
    if (err?.errorFields) return;
    message.error(err?.message || err?.msg || '请求异常，请检查网络');
  } finally {
    loading.value = false;
  }
}

defineExpose({
  showModal,
  closeModal,
});
</script>

<style scoped lang="less">
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
    .ant-form-item-label > label {
      color: #a0aabf !important;
      font-size: 13px !important;
      font-weight: 400 !important;
    }

    .ant-form-item-label > label.ant-form-item-required::before {
      color: #ff4d4f !important;
    }

    /* RangePicker */
    .ant-picker {
      background: #1b2533 !important;
      border: 1px solid #303d50 !important;
      border-radius: 4px !important;
      width: 100%;
      min-height: 36px !important;

      &:hover {
        border-color: #00a2e8 !important;
      }

      &.ant-picker-focused {
        border-color: #00a2e8 !important;
        box-shadow: 0 0 0 2px rgba(0, 162, 232, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.2) !important;
      }

      .ant-picker-input > input {
        color: #ffffff !important;

        &::placeholder {
          color: #5a6a80 !important;
        }
      }

      .ant-picker-suffix {
        color: #5a6a80 !important;
      }

      .ant-picker-clear {
        background: #1b2533 !important;
        color: #5a6a80 !important;
      }

      .ant-picker-separator {
        color: #5a6a80 !important;
      }
    }

    /* Checkbox 深色适配 */
    .ant-checkbox-wrapper {
      color: #c0c8d4 !important;
      font-size: 13px !important;
      margin-right: 16px !important;
      margin-bottom: 4px !important;
    }

    .ant-checkbox-inner {
      background: #1b2533 !important;
      border-color: #303d50 !important;
    }

    .ant-checkbox-checked .ant-checkbox-inner {
      background: #00a2e8 !important;
      border-color: #00a2e8 !important;
    }

    .ant-checkbox-wrapper:hover .ant-checkbox-inner {
      border-color: #00a2e8 !important;
    }

    .ant-checkbox-input:focus + .ant-checkbox-inner {
      border-color: #00a2e8 !important;
    }

    /* TimePicker 内嵌在 a-form-item 时复用 picker 样式 */
    .ant-picker.ant-picker-time-picker .ant-picker-input > input {
      color: #ffffff !important;

      &::placeholder {
        color: #5a6a80 !important;
      }
    }

    /* 校验 */
    .ant-form-item-explain-error {
      font-size: 12px !important;
      color: #ff4d4f !important;
    }

    .ant-form-item-has-error .ant-picker {
      border-color: #ff4d4f !important;
    }
  }
}

/* ==================== DatePicker/TimePicker 下拉面板（全局深色） ==================== */
.ant-picker-dropdown {
  .ant-picker-panel-container {
    background: #1b2533 !important;
    border: 1px solid #303d50 !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5) !important;

    .ant-picker-header {
      border-bottom-color: #303d50 !important;
    }

    .ant-picker-header button {
      color: #a0aabf !important;

      &:hover {
        color: #00a2e8 !important;
      }
    }

    .ant-picker-body th,
    .ant-picker-content th {
      color: #5a6a80 !important;
    }

    .ant-picker-cell {
      color: #c0c8d4 !important;
    }

    .ant-picker-cell-in-view {
      color: #ffffff !important;
    }

    .ant-picker-cell-selected .ant-picker-cell-inner {
      background: #00a2e8 !important;
    }

    .ant-picker-cell-today .ant-picker-cell-inner::before {
      border-color: #00a2e8 !important;
    }

    .ant-picker-cell:hover:not(.ant-picker-cell-selected):not(.ant-picker-cell-range-start):not(.ant-picker-cell-range-end):not(.ant-picker-cell-range-hover-start):not(.ant-picker-cell-range-hover-end) .ant-picker-cell-inner {
      background: rgba(0, 162, 232, 0.1) !important;
    }

    .ant-picker-cell-disabled {
      color: rgba(255, 255, 255, 0.2) !important;

      &::before {
        background: rgba(255, 255, 255, 0.04) !important;
      }
    }

    .ant-picker-footer {
      border-top-color: #303d50 !important;
    }

    /* ===== TimePicker 时间列面板 ===== */
    .ant-picker-time-panel-column {
      border-right-color: #303d50 !important;

      /* 非选中时间数字 */
      .ant-picker-time-panel-cell-inner {
        color: #c0c8d4 !important;

        &:hover {
          background: rgba(0, 162, 232, 0.12) !important;
        }
      }

      /* 选中时间数字 */
      .ant-picker-time-panel-cell-selected .ant-picker-time-panel-cell-inner {
        color: #ffffff !important;
        background: #00a2e8 !important;
        font-weight: 500 !important;
      }
    }
  }

  /* TimePicker 底部确定按钮 */
  .ant-picker-ok {
    .ant-btn-primary {
      color: #ffffff !important;
      background: linear-gradient(135deg, #00a2e8, #0080c0) !important;
      border: none !important;

      &:hover {
        background: linear-gradient(135deg, #0090cf, #0070a8) !important;
        box-shadow: 0 0 10px rgba(0, 162, 232, 0.35);
      }
    }
  }
}
</style>
