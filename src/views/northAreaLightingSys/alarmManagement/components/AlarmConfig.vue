<template>
  <div class="alarm-config">
    <div class="config-layout">
      <!-- 左侧：报警条件配置 -->
      <div class="config-form-card">
        <div class="card-title">
          <span class="title-icon">⚠️</span>
          <span>报警条件配置</span>
        </div>

        <a-form :model="formState" layout="vertical" class="config-form">
          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item label="报警名称">
                <a-input v-model:value="formState.alarmName" placeholder="请输入报警名称" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="监测对象">
                <a-select v-model:value="formState.monitorTarget" placeholder="请选择监测对象">
                  <a-select-option v-for="item in circuitList" :key="item.circuitCode" :value="item.circuitCode">
                    {{item.circuitName}}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item label="报警条件">
                <a-select v-model:value="formState.alarmCondition" placeholder="请选择报警条件">
                  <a-select-option value="功率 > 阈值">功率 &gt; 阈值</a-select-option>
                  <a-select-option value="电压 < 阈值">电压 &lt; 阈值</a-select-option>
                  <a-select-option value="离线时长 > 阈值">离线时长 &gt; 阈值</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="阈值">
                <a-input v-model:value="formState.threshold" placeholder="请输入阈值">
                  <template #addonAfter>kW</template>
                </a-input>
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item label="报警等级">
                <a-select v-model:value="formState.alarmLevel" placeholder="请选择报警等级">
                  <a-select-option v-for="item in alarmLevelList" :key="item.id" :value="item.alarmLevelName">
                    {{ item.alarmLevelName }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="通知方式">
                <a-select v-model:value="formState.notifyMethod" placeholder="请选择通知方式">
                  <a-select-option value="短信">短信</a-select-option>
                  <a-select-option value="邮件">邮件</a-select-option>
                  <a-select-option value="平台">平台</a-select-option>
                  <a-select-option value="短信+平台">短信+平台</a-select-option>
                  <a-select-option value="平台+邮件">平台+邮件</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <div class="form-actions">
            <a-button type="primary" @click="handleSave">保存配置</a-button>
          </div>
        </a-form>
      </div>

      <!-- 右侧：报警类别与等级 -->
      <div class="config-table-card">
        <div class="card-title">
          <span class="title-icon">📋</span>
          <span>报警类别与等级</span>
        </div>

        <a-table
          :columns="columns"
          :data-source="categoryList"
          :pagination="false"
          row-key="id"
          class="config-table"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'color'">
              <span class="color-dot" :style="{ background: record.colorValue }"></span>
              {{ record.color }}
            </template>
          </template>
        </a-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { getAlarmLevelListApi, getAlarmCategoryListApi, getCircuitListApi, saveAlarmConfigApi } from '../alarmManagement.api';

const formState = reactive({
  alarmName: '功率超限报警',
  monitorTarget: 'A1地块',
  alarmCondition: '功率 > 阈值',
  threshold: '6.0',
  alarmLevel: '重要',
  notifyMethod: '短信',
});

const alarmLevelList = ref<any[]>([]);
const categoryList = ref<any[]>([]);
const circuitList = ref<any[]>([]);

const loadAlarmLevels = async () => {
  const res = await getAlarmLevelListApi();
  const list = res?.result || res || [];
  alarmLevelList.value = Array.isArray(list) ? list : [];
};

const loadCategoryList = async () => {
  const res = await getAlarmCategoryListApi();
  const list = res?.result || res || [];
  categoryList.value = (Array.isArray(list) ? list : []).map((item: any) => ({
    ...item,
    colorValue: levelColorMap[item.alarmLevelName] || '#1890ff',
    color: item.alarmLevelName === '一般' ? '蓝色' : item.alarmLevelName === '紧急' || item.alarmLevelName === '非常紧急' ? '红色' : '橙色',
  }));
};

const loadCircuitList = async () => {
  const res = await getCircuitListApi({ pageNo: 1, pageSize: 999 });
  const list = res?.records || res?.result?.records || res?.result || res || [];
  circuitList.value = Array.isArray(list) ? list : [];
  console.log(circuitList.value, 444);
};

onMounted(() => {
  loadAlarmLevels();
  loadCategoryList();
  loadCircuitList();
});

const levelColorMap: Record<string, string> = {
  '紧急': '#ff4d4f',
  '非常紧急': '#ff4d4f',
  '重要': '#fa8c16',
  '一般': '#1890ff',
};

const columns = [
  { title: '类别', dataIndex: 'alarmCategoryName', key: 'alarmCategoryName' },
  { title: '等级', dataIndex: 'alarmLevelName', key: 'alarmLevelName' },
  { title: '颜色', dataIndex: 'color', key: 'color' },
  { title: '通知方式', dataIndex: 'noticeWay', key: 'noticeWay' },
];

const handleSave = async () => {
  // 从报警条件中提取操作符
  const operatorMap: Record<string, string> = { '功率 > 阈值': '>', '电压 < 阈值': '<', '离线时长 > 阈值': '>' };
  const operator = operatorMap[formState.alarmCondition] || '>';

  // 查找报警等级对应的ID
  const levelItem = alarmLevelList.value.find((l) => l.alarmLevelName === formState.alarmLevel);

  // 从circuitList构建points
  const points = circuitList.value.map((item: any) => ({
    deviceId: item.deviceId || item.id,
    deviceName: item.circuitName || item.deviceName || item.name,
    pointId: item.pointId || null,
    pointName: item.pointName || item.name || '',
    timeGranularity: item.timeGranularity || '',
    operator,
    conditionValue: formState.threshold,
  }));

  const params = {
    ruleName: formState.alarmName,
    alarmLevelId: levelItem?.id,
    alarmLevelName: formState.alarmLevel,
    noticeWay: formState.notifyMethod,
    pointType: 'instant',
    frequency: 5,
    frequencyUnit: 'm',
    noticeUser: 'admin',
    points,
  };

  await saveAlarmConfigApi(params);
  message.success('报警配置已保存');
};
</script>

<style scoped lang="less">
.alarm-config {
  .config-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .config-form-card,
  .config-table-card {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 24px;

    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 24px;

      .title-icon {
        font-size: 20px;
      }
    }
  }

  .config-form {
    :deep(.ant-form-item-label > label) {
      color: rgba(255, 255, 255, 0.75);
      font-size: 14px;
    }

    :deep(.ant-input),
    :deep(.ant-select-selector) {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.12);
      color: #fff;

      &::placeholder {
        color: rgba(255, 255, 255, 0.35);
      }
    }

    :deep(.ant-select-selection-item) {
      color: #fff !important;
    }

    :deep(.ant-select-arrow) {
      color: rgba(255, 255, 255, 0.45);
    }

    :deep(.ant-select-dropdown) {
      background: #1a1a2e;

      .ant-select-item {
        color: #fff !important;

        &.ant-select-item-option-selected {
          background: rgba(24, 144, 255, 0.2) !important;
        }

        &.ant-select-item-option-active {
          background: rgba(255, 255, 255, 0.08) !important;
        }
      }
    }

    :deep(.ant-input-group-addon) {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.65);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
    }
  }

  .config-table {
    :deep(.ant-table) {
      background: transparent;
      color: #fff;

      .ant-table-thead > tr > th {
        background: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.75);
        border-bottom-color: rgba(255, 255, 255, 0.1);
      }

      .ant-table-tbody > tr > td {
        border-bottom-color: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.85);
      }

      .ant-table-tbody > tr:hover > td {
        background: rgba(255, 255, 255, 0.04);
      }
    }

    .color-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 6px;
      vertical-align: middle;
    }
  }
}
</style>
