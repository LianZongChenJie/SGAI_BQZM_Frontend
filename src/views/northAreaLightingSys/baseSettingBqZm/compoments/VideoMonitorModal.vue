<template>
  <a-modal
    v-model:open="open"
    :title="cameraName || '监控视频'"
    :footer="null"
    width="720px"
    :destroyOnClose="true"
    :maskClosable="false"
    wrapClassName="dark-tech-modal video-monitor-modal"
    @cancel="closeModal"
  >
    <div class="video-modal-body">
      <!-- 摄像头名称 -->
      <!-- <div class="camera-label">{{ cameraName }}</div> -->

      <!-- 视频播放 -->
      <div class="video-box">
        <VideoPlayer
          :key="currentUrl"
          :url="currentUrl"
        />
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="modal-footer">
      <a-button class="btn-close" @click="closeModal">关闭</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import VideoPlayer from '../../equipmentMonitoring/components/VideoPlayer.vue';

/* ==================== 弹框状态 ==================== */
const open = ref(false);
const cameraName = ref('');
const currentUrl = ref('');

function showModal(row: { monitorAdr?: string; monitorName?: string }) {
  cameraName.value = '监控名称：' + (row.monitorName || '摄像头');
  currentUrl.value = row.monitorAdr || '';
  open.value = true;
}

function closeModal() {
  open.value = false;
}

defineExpose({ showModal, closeModal });
</script>

<style lang="less" scoped>
.video-modal-body {
  padding: 0 0 8px;
}

.camera-label {
  margin-bottom: 12px;
  font-size: 14px;
  color: #c0c8d4;
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #52c41a;
    box-shadow: 0 0 6px rgba(82, 196, 26, 0.5);
  }
}

.video-box {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

/* ==================== 底部按钮 ==================== */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 12px;

  :deep(.ant-btn) {
    min-width: 80px;
    border-radius: 6px;
    height: 36px;
    font-size: 13px;
    font-weight: 400;
    transition: all 0.2s;
  }

  .btn-close {
    background: transparent !important;
    border: 1px solid #303d50 !important;
    color: #a0aabf !important;

    &:hover {
      border-color: #465568 !important;
      color: #ffffff !important;
      background: rgba(255, 255, 255, 0.04) !important;
    }
  }
}
</style>

<!-- ==================== 非 scoped：通过 video-monitor-modal 唯一类名隔离 ==================== -->
<!-- 原因：a-modal 渲染到 document.body，scoped CSS 的 [data-v-xxx] 属性选择器无法匹配传送的 DOM，-->
<!-- 所以标题/头部等元素必须在非 scoped 块中通过唯一类名精准定位，确保只影响本页面。-->
<style lang="less">
.video-monitor-modal {
  .ant-modal-content {
    background: linear-gradient(135deg, rgba(15, 24, 35, 0.98) 0%, rgba(10, 18, 28, 0.98) 100%) !important;
    border-radius: 8px !important;
    border: 1px solid rgba(0, 212, 255, 0.4) !important;
    box-shadow:
      0 0 20px rgba(0, 212, 255, 0.15),
      0 0 40px rgba(0, 212, 255, 0.08),
      0 8px 32px rgba(0, 0, 0, 0.6) !important;
    overflow: hidden !important;
    position: relative !important;

    /* 顶部高光线 */
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 10%;
      right: 10%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.8), transparent);
      z-index: 1;
    }
  }

  .ant-modal-header {
    background: linear-gradient(180deg, rgba(0, 212, 255, 0.06) 0%, transparent 100%) !important;
    border-bottom: 1px solid rgba(0, 212, 255, 0.2) !important;
    padding: 16px 24px 14px !important;
    border-radius: 8px 8px 0 0 !important;
    margin: 0 !important;
  }

  /* 标题 — 科技感渐变 + 青蓝光晕 */
  .ant-modal-title {
    background: linear-gradient(135deg, #00d4ff 0%, #7bb3ff 100%) !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    font-size: 16px !important;
    font-weight: 700 !important;
    letter-spacing: 1.5px !important;
    filter: drop-shadow(0 0 6px rgba(0, 212, 255, 0.4)) !important;
  }

  .ant-modal-body {
    padding: 20px 24px 24px !important;
    background: transparent !important;
  }

  .ant-modal-footer {
    display: none !important;
  }

  /* 关闭按钮 */
  .ant-modal-close {
    color: #5a6a80 !important;
    transition: color 0.2s, background 0.2s !important;

    &:hover {
      color: #00d4ff !important;
      background: rgba(0, 212, 255, 0.08) !important;
      text-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
    }
  }
}
</style>