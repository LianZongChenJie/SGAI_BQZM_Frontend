<template>
  <a-modal
    v-model:open="open"
    title="视频列表"
    :footer="null"
    width="600px"
    :destroyOnClose="true"
    :maskClosable="false"
    wrapClassName="dark-tech-modal"
    @cancel="closeModal"
  >
    <!-- 提示 -->
    <div class="modal-tip">
      <svg class="tip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M23 7l-7 5 7 5V7z" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
      <span>请选择摄像头视频流（最多选择 <strong>2</strong> 个）</span>
    </div>

    <!-- 摄像头列表 -->
    <div class="camera-list">
      <div
        v-for="item in cameraList"
        :key="item.id"
        class="camera-item"
        :class="{ selected: selectedIds.includes(item.id), disabled: !selectedIds.includes(item.id) && selectedIds.length >= 2 }"
        @click="toggleSelect(item)"
      >
        <div class="camera-check">
          <span class="check-box" :class="{ checked: selectedIds.includes(item.id) }">
            <svg v-if="selectedIds.includes(item.id)" class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        </div>
        <div class="camera-info">
          <div class="camera-name">{{ item.name }}</div>
          <div class="camera-meta">
            <span v-if="item.areaName" class="camera-area">{{ item.areaName }}</span>
            <span class="camera-status" :class="{ online: item.status === '在线', offline: item.status !== '在线' }">
              {{ item.status || '未知' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="modal-footer">
      <a-button class="btn-cancel" @click="closeModal">取消</a-button>
      <a-button class="btn-confirm" type="primary" :disabled="selectedIds.length === 0" @click="handleConfirm">
        确定 ({{ selectedIds.length }})
      </a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from 'vue';

interface CameraItem {
  id: number;
  name: string;
  url: string;
  areaName?: string;
  status?: string;
}

const props = defineProps({
  cameraList: {
    type: Array as PropType<CameraItem[]>,
    default: () => [],
  },
});

const emit = defineEmits<{
  confirm: [cameras: CameraItem[]];
}>();

/* ==================== 弹框状态 ==================== */
const open = ref(false);
const selectedIds = ref<number[]>([]);

const cameraList = computed(() => props.cameraList);

function toggleSelect(item: CameraItem) {
  const idx = selectedIds.value.indexOf(item.id);
  if (idx > -1) {
    selectedIds.value.splice(idx, 1);
  } else if (selectedIds.value.length < 2) {
    selectedIds.value.push(item.id);
  }
}

function handleConfirm() {
  const selected = cameraList.value.filter((c) => selectedIds.value.includes(c.id));
  emit('confirm', selected);
  open.value = false;
}

function showModal() {
  selectedIds.value = [];
  open.value = true;
}

function closeModal() {
  open.value = false;
}

defineExpose({ showModal, closeModal });
</script>

<style lang="less" scoped>
.modal-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 10px 14px;
  background: rgba(0, 162, 232, 0.06);
  border: 1px solid rgba(0, 162, 232, 0.15);
  border-radius: 6px;
  font-size: 13px;
  color: #a0aabf;

  strong {
    color: #00a2e8;
  }

  .tip-icon {
    width: 16px;
    height: 16px;
    color: #00a2e8;
    flex-shrink: 0;
  }
}

/* ==================== 摄像头列表 ==================== */
.camera-list {
  max-height: 340px;
  overflow-y: auto;
  margin-bottom: 16px;
  border: 1px solid #1e2a3a;
  border-radius: 6px;
  background: #0b1420;
}

.camera-item {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid #1e2a3a;
  cursor: pointer;
  transition: background 0.15s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(0, 162, 232, 0.04);
  }

  &.selected {
    background: rgba(0, 162, 232, 0.08);
  }

  &.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.camera-check {
  margin-right: 12px;
  flex-shrink: 0;
}

.check-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 2px solid #3a4a5e;
  border-radius: 3px;
  transition: all 0.15s;

  &.checked {
    background: #00a2e8;
    border-color: #00a2e8;
  }

  .check-icon {
    width: 12px;
    height: 12px;
    color: #fff;
  }
}

.camera-info {
  flex: 1;
  min-width: 0;
}

.camera-name {
  font-size: 14px;
  color: #e0e6f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.camera-meta {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.camera-area {
  font-size: 11px;
  color: #7a8ba0;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.camera-status {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  line-height: 16px;
  flex-shrink: 0;

  &.online {
    background: rgba(82, 196, 26, 0.12);
    color: #52c41a;
  }

  &.offline {
    background: rgba(255, 77, 79, 0.12);
    color: #ff4d4f;
  }
}

/* ==================== 底部按钮 ==================== */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 4px;

  :deep(.ant-btn) {
    min-width: 80px;
    border-radius: 6px;
    height: 36px;
    font-size: 13px;
    font-weight: 400;
    transition: all 0.2s;
  }

  .btn-cancel {
    background: transparent !important;
    border: 1px solid #303d50 !important;
    color: #a0aabf !important;

    &:hover {
      border-color: #465568 !important;
      color: #ffffff !important;
      background: rgba(255, 255, 255, 0.04) !important;
    }
  }

  .btn-confirm {
    background: linear-gradient(135deg, #00a2e8, #0080c0) !important;
    border: none !important;
    color: #ffffff !important;

    &:hover {
      background: linear-gradient(135deg, #0cb0f0, #0090d0) !important;
    }

    &:disabled {
      opacity: 0.4 !important;
      cursor: not-allowed !important;
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
