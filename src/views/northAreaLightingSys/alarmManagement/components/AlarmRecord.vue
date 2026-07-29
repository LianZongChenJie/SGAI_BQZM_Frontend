<template>
  <div class="alarm-record">
    <div class="record-header">
      <div class="record-title">
        <span class="title-icon">🔔</span>
        <span>报警记录</span>
      </div>
      <div class="record-actions">
        <a-button class="btn-batch" @click="handleBatchDispose">批量处置</a-button>
      </div>
    </div>

    <div class="record-list">
      <div
        v-for="item in alarmList"
        :key="item.id"
        class="record-item"
        :class="`level-${item.level}`"
      >
        <div class="item-left">
          <span class="level-dot" :class="`dot-${item.level}`"></span>
          <div class="item-content">
            <div class="item-title">
              <span class="level-tag">【{{ item.levelText }}】</span>
              <span>{{ item.location }} {{ item.circuit }} {{ item.type }}</span>
            </div>
            <div class="item-desc">
              {{ item.time }} | {{ item.description }}
            </div>
          </div>
        </div>
        <div class="item-actions">
          <template v-if="item.level !== '一般'">
            <a-button size="small" class="btn-cyan" @click="handleTransfer(item)">转工单</a-button>
          </template>
          <template v-else>
            <a-button size="small" class="btn-cyan" @click="handleRetry(item)">重试</a-button>
          </template>
          <a-button size="small" class="btn-close" @click="handleClose(item)">关闭</a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { getAlarmListApi, batchDisposeApi, transferWorkOrderApi, closeAlarmApi } from '../alarmManagement.api';

interface AlarmItem {
  id: number;
  level: string;
  levelText: string;
  location: string;
  circuit: string;
  type: string;
  time: string;
  description: string;
}

const alarmList = ref<AlarmItem[]>([]);

const loadAlarmList = async () => {
  const res = await getAlarmListApi();
  const records = res?.result?.records || res?.records || [];
  alarmList.value = records.map((item: any) => ({
    id: item.id,
    level: item.alarmLevelName,
    levelText: item.alarmLevelName,
    location: item.spaceName || '',
    circuit: item.deviceName || '',
    type: item.alarmCategoryName || '',
    time: item.alarmTime,
    description: item.alarmContent,
  }));
};

onMounted(() => {
  loadAlarmList();
});

const handleMarkAllRead = () => {
  message.success('已全部标记为已读');
};

const handleBatchDispose = () => {
  Modal.confirm({
    title: '确认操作',
    content: '确认要全部关闭么？',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      const ids = alarmList.value.map((item) => item.id);
      await batchDisposeApi(ids);
      message.success('批量处置成功');
      loadAlarmList();
    },
  });
};

const handleTransfer = async (item: AlarmItem) => {
  await transferWorkOrderApi({ recordId: item.id });
  message.success(`已将【${item.type}】报警转为工单`);
  loadAlarmList();
};

const handleRetry = (item: AlarmItem) => {
  message.info(`正在重试【${item.location} ${item.circuit}】`);
};

const handleClose = async (item: AlarmItem) => {
  await closeAlarmApi(item.id);
  message.success('报警已关闭');
  loadAlarmList();
};
</script>

<style scoped lang="less">
.alarm-record {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 24px;

  .record-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .record-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: #fff;

      .title-icon {
        font-size: 20px;
      }
    }

    .record-actions {
      display: flex;
      gap: 12px;

      .btn-batch {
        background: #ff4d4f !important;
        border-color: #ff4d4f !important;
        color: #fff !important;

        &:hover {
          background: #ff7875 !important;
          border-color: #ff7875 !important;
          color: #fff !important;
        }
      }
    }
  }

  .record-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .record-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-radius: 8px;
      border-left: 4px solid transparent;
      background: rgba(255, 255, 255, 0.03);
      transition: background 0.3s;

      &:hover {
        background: rgba(255, 255, 255, 0.06);
      }

      &.level-紧急 {
        border-left-color: #ff4d4f;
        background: rgba(255, 77, 79, 0.06);
      }

      &.level-重要 {
        border-left-color: #fa8c16;
        background: rgba(250, 140, 22, 0.06);
      }

      &.level-一般 {
        border-left-color: #1890ff;
        background: rgba(24, 144, 255, 0.06);
      }

      .item-left {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        flex: 1;

        .level-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;

          &.dot-紧急 {
            background: #ff4d4f;
            box-shadow: 0 0 6px rgba(255, 77, 79, 0.5);
          }

          &.dot-重要 {
            background: #fa8c16;
            box-shadow: 0 0 6px rgba(250, 140, 22, 0.5);
          }

          &.dot-一般 {
            background: #1890ff;
            box-shadow: 0 0 6px rgba(24, 144, 255, 0.5);
          }
        }

        .item-content {
          .item-title {
            font-size: 16px;
            font-weight: 600;
            color: #fff;
            margin-bottom: 6px;

            .level-tag {
              margin-right: 4px;
            }
          }

          .item-desc {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.55);
          }
        }
      }

      .item-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;

        .btn-cyan {
          background: #1890ff !important;
          border-color: #1890ff !important;
          color: #fff !important;

          &:hover {
            background: #40a9ff !important;
            border-color: #40a9ff !important;
            color: #fff !important;
          }
        }

        .btn-close {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(255, 255, 255, 0.3);
          color: #333;

          &:hover {
            background: #fff;
            border-color: #fff;
            color: #333;
          }
        }
      }
    }
  }
}
</style>
