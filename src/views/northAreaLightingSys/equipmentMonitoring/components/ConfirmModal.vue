<template>
  <a-modal
    v-model:open="open"
    title="提示"
    :footer="null"
    width="5rem"
    :zIndex="92000"
    :destroyOnClose="true"
    :maskClosable="false"
    wrapClassName="scene-confirm-modal"
  >
    <!-- 顶部提示条 -->
    <div class="modal-content-scroll">
      <div class="modal-tip">
        <svg
          class="tip-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span v-html="tipHtml"></span>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="modal-footer">
      <a-button class="btn-cancel" @click="closeModal">取消</a-button>
      <a-button class="btn-confirm" type="primary" :loading="loading" @click="onSubmit">{{ okText }}</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)
const loading = ref(false)
const tipHtml = ref('')
const okText = ref('确定')
let onOkHandler: (() => void | Promise<void>) | null = null
let onCancelHandler: (() => void) | null = null

/** 打开确认弹框：content 支持 HTML（动作词用 <strong class="tip-action"> 高亮）；onCancel 在点击取消/关闭时触发（确认成功后不触发） */
function showModal(opts: {
  content: string
  okText?: string
  onOk: () => void | Promise<void>
  onCancel?: () => void
}) {
  tipHtml.value = opts.content
  okText.value = opts.okText || '确定'
  onOkHandler = opts.onOk
  onCancelHandler = opts.onCancel || null
  loading.value = false
  open.value = true
}

function closeModal() {
  open.value = false
  onCancelHandler?.()
  onCancelHandler = null
}

async function onSubmit() {
  if (loading.value) return
  loading.value = true
  try {
    await onOkHandler?.()
    open.value = false
    onCancelHandler = null
  } finally {
    loading.value = false
  }
}

defineExpose({
  showModal,
  closeModal,
})
</script>

<style scoped lang="less">
/* ==================== 内容滚动区 ==================== */
.modal-content-scroll {
  min-height: 1.6rem;
  max-height: 2.8rem;
  overflow-y: auto;
  position: relative;
  z-index: 1;

  &::-webkit-scrollbar {
    width: 0.05rem;
  }
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.06);
    border-radius: 0.03rem;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 194, 255, 0.5);
    border-radius: 0.03rem;
  }
}

/* ==================== 提示条（科技感） ==================== */
.modal-tip {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  padding: 0.1rem 0.14rem;
  margin-bottom: 0;
  background: rgba(0, 162, 232, 0.06);
  border-left: 0.03rem solid #00a2e8;
  border-radius: 0 0.04rem 0.04rem 0;
  font-size: 0.17rem;
  line-height: 1.6;
  color: #8a9ab0;

  .tip-icon {
    width: 0.22rem;
    height: 0.22rem;
    color: #00a2e8;
    flex-shrink: 0;
  }
}

/* ==================== 底部按钮 ==================== */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.1rem;
  padding: 0.16rem 0.24rem 0.12rem;
  margin: 0.24rem -0.24rem -0.24rem;
  border-top: 1px dashed rgba(0, 212, 255, 0.25);
  background: rgba(6, 18, 36, 0.55);
  border-radius: 0 0 0.06rem 0.06rem;

  :deep(.ant-btn) {
    height: 0.32rem;
    padding: 0 0.18rem;
    border-radius: 0.04rem;
    font-size: 0.13rem;
    transition: all 0.2s;
  }

  .btn-cancel {
    background: transparent !important;
    border: 1px solid rgba(0, 212, 255, 0.25) !important;
    color: #7fa6d4 !important;

    &:hover {
      border-color: #00d4ff !important;
      color: #00d4ff !important;
      background: rgba(0, 212, 255, 0.06) !important;
    }
  }

  .btn-confirm {
    background: linear-gradient(135deg, #00d4ff, #0088cc) !important;
    border: none !important;
    color: #061224 !important;
    font-weight: 600;

    &:hover {
      opacity: 0.9;
      box-shadow: 0 0 0.12rem rgba(0, 212, 255, 0.3);
    }
  }
}
</style>

/* ==================== scene-confirm-modal 弹框样式（通过唯一类名隔离，不污染全局） ==================== */
<style lang="less">
.scene-confirm-modal {
  background: rgba(2, 8, 23, 0.78) !important;
  backdrop-filter: blur(0.02rem);

  .ant-modal {
    overflow: visible !important;
  }

  .ant-modal-content {
    position: relative;
    background: linear-gradient(180deg, #143358 0%, #0f2845 100%) !important;
    border-radius: 0.06rem !important;
    border: none !important;
    box-shadow:
      0 0 0 0.01rem rgba(0, 212, 255, 0.45),
      0 0 0.24rem rgba(0, 212, 255, 0.25),
      0 0 0.6rem rgba(0, 212, 255, 0.1),
      0 0.12rem 0.4rem rgba(0, 0, 0, 0.7) !important;
    overflow: visible !important;
  }

  .ant-modal-content::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 0.06rem;
    padding: 0.015rem;
    background: linear-gradient(
      135deg,
      rgba(0, 212, 255, 0.7),
      rgba(0, 180, 240, 0.4) 25%,
      rgba(0, 140, 220, 0.6) 50%,
      rgba(0, 224, 160, 0.3) 75%,
      rgba(0, 212, 255, 0.7)
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 1;
  }

  .ant-modal-content::after {
    content: '';
    position: absolute;
    inset: -0.02rem;
    border-radius: 0.06rem;
    background:
      linear-gradient(to right, rgba(0, 212, 255, 0.85), rgba(0, 212, 255, 0)) 0.02rem 0 / 0.18rem 0.02rem no-repeat,
      linear-gradient(to bottom, rgba(0, 212, 255, 0.85), rgba(0, 212, 255, 0)) 0 0.02rem / 0.02rem 0.18rem no-repeat,
      linear-gradient(to left, rgba(0, 212, 255, 0.85), rgba(0, 212, 255, 0)) calc(100% - 0.02rem) 0 / 0.18rem 0.02rem no-repeat,
      linear-gradient(to bottom, rgba(0, 212, 255, 0.85), rgba(0, 212, 255, 0)) 100% 0.02rem / 0.02rem 0.18rem no-repeat,
      linear-gradient(to right, rgba(0, 212, 255, 0.85), rgba(0, 212, 255, 0)) 0.02rem 100% / 0.18rem 0.02rem no-repeat,
      linear-gradient(to top, rgba(0, 212, 255, 0.85), rgba(0, 212, 255, 0)) 0 calc(100% - 0.02rem) / 0.02rem 0.18rem no-repeat,
      linear-gradient(to left, rgba(0, 212, 255, 0.85), rgba(0, 212, 255, 0)) calc(100% - 0.02rem) 100% / 0.18rem 0.02rem no-repeat,
      linear-gradient(to top, rgba(0, 212, 255, 0.85), rgba(0, 212, 255, 0)) 100% calc(100% - 0.02rem) / 0.02rem 0.18rem no-repeat;
    filter: drop-shadow(0 0 0.04rem rgba(0, 212, 255, 0.4));
    pointer-events: none;
    z-index: 0;
  }

  .ant-modal-header {
    position: relative;
    background: linear-gradient(180deg, rgba(0, 30, 55, 0.02) 0%, rgba(0, 30, 55, 0.35) 100%) !important;
    border-bottom: 1px solid rgba(0, 212, 255, 0.18) !important;
    padding: 0.16rem 0.24rem !important;
    border-radius: 0.06rem 0.06rem 0 0 !important;
    margin-bottom: 0 !important;
  }

  .ant-modal-title {
    position: relative;
    color: #e8f4ff;
    font-size: 0.16rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    padding-left: 0.12rem;
    text-shadow: 0 0 0.12rem rgba(0, 212, 255, 0.4);
  }

  .ant-modal-title::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 0.03rem;
    height: 0.18rem;
    background: linear-gradient(180deg, #00d4ff, #0088cc);
    border-radius: 0.02rem;
    box-shadow: 0 0 0.08rem rgba(0, 212, 255, 0.5);
  }

  .ant-modal-close {
    top: 0.16rem !important;
    right: 0.2rem !important;

    .ant-modal-close-x {
      color: #7fa6d4 !important;
      font-size: 0.18rem !important;
      line-height: 1 !important;
      transition: transform 0.3s ease, color 0.2s;

      &:hover {
        color: #00d4ff !important;
        transform: rotate(90deg);
      }
    }
  }

  .ant-modal-body {
    min-height: 1.8rem;
    padding: 0.24rem !important;
    background: linear-gradient(180deg, rgba(15, 40, 69, 0.3) 0%, rgba(15, 40, 69, 0.05) 100%) !important;
  }

  .ant-modal-footer {
    display: none;
  }
}

/* v-html 注入的动作词高亮（不受 scoped 影响，全局兜底） */
.modal-tip .tip-action {
  font-weight: 700;
  color: #00a2e8;
}
</style>
