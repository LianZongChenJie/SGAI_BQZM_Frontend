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
        <div v-if="loadingVideo" class="video-placeholder">
          <a-spin size="large" />
          <div class="placeholder-text">正在获取视频流...</div>
        </div>
        <VideoPlayer
          v-show="!loadingVideo"
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
import { ref, nextTick } from 'vue';
import VideoPlayer from '../../equipmentMonitoring/components/VideoPlayer.vue';

/* ==================== 弹框状态 ==================== */
const open = ref(false);
const cameraName = ref('');
const currentUrl = ref('');
const loadingVideo = ref(true);

/* ==================== Mock 视频地址 ==================== */
const videoUrlMap: Record<number, string> = {
  1: '/video-stream/bipbop_adv_example_hevc/master.m3u8',
  2: '/video-stream/bipbop_adv_example_hevc/master.m3u8',
  3: '/video-stream/bipbop_adv_example_hevc/master.m3u8',
};

function showModal(row: { id: number; areaName?: string; name?: string }) {
  cameraName.value = row.areaName || row.name || '摄像头';
  currentUrl.value = videoUrlMap[row.id] || videoUrlMap[1];
  loadingVideo.value = true;
  open.value = true;
  // VideoPlayer 加载完成后关闭 loading（通过 onPlaying 事件自动处理，这里给个兜底超时）
  setTimeout(() => {
    loadingVideo.value = false;
  }, 8000);
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

.video-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.45);
}

.placeholder-text {
  font-size: 13px;
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
