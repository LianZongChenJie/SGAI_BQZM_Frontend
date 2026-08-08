<template>
  <div class="add-modal-wrapper">
    <a-modal
      v-model:open="open"
      title="提示"
      :footer="null"
      width="500px"
      :destroyOnClose="true"
      :maskClosable="false"
      wrapClassName="dark-tech-modal"
    >
      <!-- 顶部提示条 -->
      <div class="modal-content-scroll">
        <div class="modal-tip">
          <svg class="tip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span v-html="contenMessage"></span>
        </div>
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
import { ref, computed, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import { dataCollectAddApi, dataCollectEditApi } from '@/api/dataCollect';

const emit = defineEmits<{
  success: [];
}>();

/* ==================== 弹框状态 ==================== */
const open = ref(false);
const type = ref<'open' | 'close'>('open');
const loading = ref(false);
const checkedRows = ref<any[]>([]);

const contenMessage = computed(() => {
  const names = checkedRows.value.map((r: any) => r.areaName).filter(Boolean).join('，');
  const prefix = names ? `所选区域【${names}】` : '所选区域';
  if (type.value === 'open') {
    return `确定要将${prefix}设置为<span class="keyword-open">开启</span>状态吗？`;
  }
  return `确定要将${prefix}设置为<span class="keyword-close">关闭</span>状态吗？`;
});



function showModal(mode: 'open' | 'close', rows: any[] = []) {
  type.value = mode;
  checkedRows.value = rows;
  open.value = true;
}

function closeModal() {
  open.value = false;
}


async function onSubmit() {
   emit('success', type.value);
  closeModal();
}

defineExpose({
  showModal,
  closeModal,
});
</script>

<style scoped lang="less">
/* ==================== 内容滚动区 ==================== */
.modal-content-scroll {
  max-height: 160px;
  overflow-y: auto;
  position: relative;
  z-index: 1;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.06);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 194, 255, 0.5);
    border-radius: 3px;
  }
}

/* ==================== 提示条（科技感） ==================== */
.modal-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  margin-bottom: 0;
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

  :deep(.keyword-open) {
    color: #22c55e;
    font-weight: 600;
  }

  :deep(.keyword-close) {
    color: #ef4444;
    font-weight: 600;
  }
}

/* ==================== 底部按钮 ==================== */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  margin: 0;
  border-top: none;
  margin-top: 20px;
  position: absolute;
  bottom: 8px;
  left: 16px;
  right: 16px;
  background: transparent;
  z-index: 10;

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
    height: 40px;
    padding: 0 28px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
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
    box-shadow: 0 2px 8px rgba(0, 162, 232, 0.25);

    &:hover {
      background: linear-gradient(135deg, #0090cf, #0070a8) !important;
      box-shadow: 0 4px 14px rgba(0, 162, 232, 0.4);
      transform: translateY(-1px);
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
    padding: 24px 24px 100px !important;
    background: #141d2b !important;
    min-height: 280px;
    position: relative;
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

    /* Input 外层包裹器（修复白色间隙） */
    .ant-input-affix-wrapper {
      background: #1b2533 !important;
      border: 1px solid #303d50 !important;
      color: #ffffff !important;
      border-radius: 4px !important;
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
