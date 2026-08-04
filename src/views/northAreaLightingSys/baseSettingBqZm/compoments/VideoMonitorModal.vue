<template>
  <a-modal
    v-model:open="open"
    title="监控视频"
    :footer="null"
    width="720px"
    :destroyOnClose="true"
    :maskClosable="false"
    wrapClassName="dark-tech-modal"
    @cancel="closeModal"
  >
    <div class="video-modal-body">
      <!-- 摄像头名称 -->
      <div class="camera-label">{{ cameraName }}</div>

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

/* ==================== Mock 视频地址 ==================== */
const videoUrlMap: Record<number, string> = {
  1: 'http://10.168.47.23:4000/index.html?id=0096142642007010010193b98d3214a64af5b516d49cfbb97160',
  2: 'http://10.168.47.23:4000/index.html?id=0096142642007010010193b98d3214a64af5b516d49cfbb97160',
  3: 'http://10.168.47.23:4000/index.html?id=0096142642007010010193b98d3214a64af5b516d49cfbb97160',
};

function showModal(row: { id: number; areaName?: string; name?: string }) {
  cameraName.value = row.areaName || row.name || '摄像头';
  currentUrl.value = videoUrlMap[row.id] || videoUrlMap[1];
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

/* ==================== 覆盖 antd 深色皮肤 ==================== */
:deep(.ant-modal-body) {
  padding: 20px 24px 24px !important;
  background: #141d2b !important;
}

:deep(.ant-modal-footer) {
  display: none !important;
}
</style>
