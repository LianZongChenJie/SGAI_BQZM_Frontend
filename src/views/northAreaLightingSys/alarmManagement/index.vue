<template>
  <div class="alarm-management">
    <a-tabs v-model:activeKey="activeKey" class="alarm-tabs">
      <a-tab-pane key="record" tab="报警记录">
        <AlarmRecord />
      </a-tab-pane>
      <a-tab-pane key="config" tab="报警配置">
        <AlarmConfig />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AlarmRecord from './components/AlarmRecord.vue';
import AlarmConfig from './components/AlarmConfig.vue';

const activeKey = ref('record');
</script>

<style scoped lang="less">
.alarm-management {
  padding: 16px;
  min-height: 100%;

  :deep(.alarm-tabs) {
    .ant-tabs-nav {
      margin-bottom: 16px;

      .ant-tabs-tab {
        color: rgba(255, 255, 255, 0.65);
        font-size: 15px;

        &.ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #1890ff;
        }
      }

      .ant-tabs-ink-bar {
        background: #1890ff;
      }
    }

    .ant-tabs-content-holder {
      .ant-tabs-content {
        .ant-tabs-tabpane {
          background: transparent;
        }
      }
    }
  }
}
</style>
