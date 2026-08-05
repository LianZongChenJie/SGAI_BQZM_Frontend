<template>
  <div class="north-lighting-overview">
    <!-- 统计卡片 -->
    <div class="grid grid-4" style="margin-bottom: 20px">
      <div class="stat-card">
        <div class="stat-label">照明地块</div>
        <div class="stat-value" style="color: var(--accent)">{{ allSpaceList.length }}</div>
        <div class="stat-trend trend-up">
          <span>{{ stats.blockCoverage }} 覆盖</span>
          <span style="margin-left: 10px">开启的回路数： {{ openCircuitCount }}</span>
        </div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">回路数</div>
        <div class="stat-value" style="color: var(--accent2)">{{ circuitCount }}</div>
        <div class="stat-trend trend-up">{{ onlineRate }} 在线率</div>
      </div>
      <div class="stat-card orange"> 
        <div class="stat-label">今日用电</div>
        <div class="stat-value" style="color: var(--accent3)">{{ todayUsage }} <span style="font-size: 14px; font-weight: 400;">kWh</span></div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">待处理报警</div>
        <div class="stat-value">0</div>
        <div class="stat-trend trend-down"></div>
      </div>
    </div>

    <!-- 主内容区：左侧地图 + 右侧两栏 -->
    <div class="main-area">
      <!-- 左列：地图 -->
      <div class="main-left">
        <div class="card card-fill">
          <div class="card-title-row">
            <div class="card-title">🗺️ 地图模式 - 北区照明地块分布</div>
          </div>
          <MapView ref="mapViewRef" />
        </div>
      </div>

      <!-- 右列：一键控制 + 表单模式上下排列 -->
      <div class="main-right">
        <div class="card card-control">
          <div class="card-title">⚡ 一键控制</div>
          <div style="display: flex; gap: 15px; flex-wrap: wrap">
            <div class="control-box">
              <div style="font-size: 32px; margin-bottom: 10px">☀️</div>
              <div style="font-weight: 600; margin-bottom: 5px">全区开灯</div>
              <div style="font-size: 12px; color: var(--text2); margin-bottom: 15px">开启所有地块照明</div>
              <button class="btn btn-success" style="width: 100%" @click="handleAllOn">执行开灯</button>
            </div>
            <div class="control-box">
              <div style="font-size: 32px; margin-bottom: 10px">🌙</div>
              <div style="font-weight: 600; margin-bottom: 5px">全区关灯</div>
              <div style="font-size: 12px; color: var(--text2); margin-bottom: 15px">关闭所有地块照明</div>
              <button class="btn btn-danger" style="width: 100%" @click="handleAllOff">执行关灯</button>
            </div>
          </div>
        </div>

        <div class="card card-table">
          <div class="card-title">📋 表单模式 - 地块运行状态</div>
          <table class="overview-table">
            <thead>
              <tr>
                <th>地块名称</th>
                <th>回路数</th>
                <th>回路开启数</th>
                <th>回路关闭数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in spaceTableData" :key="item.spaceName">
                <td>{{ item.spaceName }}</td>
                <td>{{ item.circuits }}</td>
                <td>{{ item.openCount }}</td>
                <td>{{ item.closeCount }}</td>
                <td>
                  <button class="btn btn-sm btn-success" style="padding: 2px 8px; font-size: 11px" @click="handleControlOn(item)">开</button>
                  <button class="btn btn-sm btn-danger" style="margin-left: 6px; padding: 2px 8px; font-size: 11px" @click="handleControlOff(item)">关</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed, onMounted } from 'vue';
  import MapView from './MapView.vue';
  import { getOverviewStatsApi, allOnApi, allOffApi, getAllSpaceApi, getAllCircuitApi, openAreaApi, closeAreaApi } from './comprehensivePreview.api';
  import { useMessage } from '/@/hooks/web/useMessage';

  const mapViewRef = ref<InstanceType<typeof MapView> | null>(null);

  const { createMessage, createConfirm } = useMessage();

  /** 总览统计数据 */
  const stats = ref({
    blockCoverage: '0%',
  });

  /** 地图状态统计 */
  const mapStatus = ref({
    normal: 0,
    warning: 0,
    offline: 0,
  });

  /** 所有地块数据 */
  const allSpaceList = ref<{ spaceId: string; spaceName: string }[]>([]);

  /** 回路总数 */
  const circuitCount = ref(0);

  /** 在线数（comstat === "在线"） */
  const onlineCount = ref(0);

  /** 在线率 */
  const onlineRate = ref('0%');

  /** 今日用电（在线数 * 18kWh + 随机波动） */
  const todayUsage = computed(() => {
    const base = onlineCount.value * 18;
    // 每个在线回路随机波动 ±5 kWh
    const variation = Array.from({ length: onlineCount.value }, () => Math.floor(Math.random() * 11) - 5)
      .reduce((sum, v) => sum + v, 0);
    return base + variation;
  });

  /** 所有回路原始数据 */
  const circuitList = ref<any[]>([]);

  /** 按地块聚合的表格数据 */
  const spaceTableData = computed(() =>
    allSpaceList.value.map((space) => {
      const circuits = circuitList.value.filter((c: any) => c.spaceName === space.spaceName);
      const onlineCircuits = circuits.filter((c: any) => c.comstat === '在线');
      const openCircuits = circuits.filter((c: any) => c.status === '开启');
      const closeCircuits = circuits.filter((c: any) => c.status === '关闭');
      const todayEnergy = onlineCircuits.reduce((sum: number, c: any) => {
        const variation = Math.floor(Math.random() * 11) - 5;
        return sum + 18 + variation;
      }, 0);
      return {
        spaceId: space.spaceId,
        spaceName: space.spaceName,
        circuits: circuits.length,
        openCount: openCircuits.length,
        closeCount: closeCircuits.length,
        todayUsage: todayEnergy,
      };
    })
  );

  /** 开启的回路数（status === "开启"） */
  const openCircuitCount = computed(() => circuitList.value.filter((c: any) => c.status === '开启').length);

  /** 查询地块覆盖率 */
  async function loadStats() {
    try {
      const res = await getOverviewStatsApi();
      const data = res?.result ?? res;
      stats.value = {
        blockCoverage: data.coverageRate != null ? `${data.coverageRate}%` : '0%',
      };
    } catch {
      stats.value = {
        blockCoverage: '0%',
      };
    }
  }

  /** 加载所有地块 */
  async function loadAllSpace() {
    try {
      const res = await getAllSpaceApi();
      allSpaceList.value = res ?? [];
    } catch {
      allSpaceList.value = [];
    }
  }

  /** 查询所有回路数 */
  async function loadAllCircuit() {
    try {
      const res = await getAllCircuitApi();
      const list = Array.isArray(res) ? res : [];
      circuitList.value = list;
      circuitCount.value = list.length;
      const online = list.filter((item: any) => item.comstat === '在线');
      onlineCount.value = online.length;
      onlineRate.value = list.length > 0
        ? (online.length / list.length * 100).toFixed(1) + '%'
        : '0%';
    } catch {
      circuitCount.value = 0;
      onlineCount.value = 0;
      onlineRate.value = '0%';
      circuitList.value = [];
    }
  }

  /** 全区开灯 */
  function handleAllOn() {
    createConfirm({
      iconType: 'warning',
      title: '确认操作',
      content: '确定要执行全区开灯操作吗？',
      onOk: async () => {
        try {
          await allOnApi();
          createMessage.success('全区开灯指令已下发');
        } catch {
          createMessage.error('操作失败');
        }
      },
    });
  }

  /** 全区关灯 */
  function handleAllOff() {
    createConfirm({
      iconType: 'warning',
      title: '确认操作',
      content: '确定要执行全区关灯操作吗？',
      onOk: async () => {
        try {
          await allOffApi();
          createMessage.success('全区关灯指令已下发');
        } catch {
          createMessage.error('操作失败');
        }
      },
    });
  }

  /** 地块开灯控制 */
  function handleControlOn(item: any) {
    // 聚焦地图到该地块
    mapViewRef.value?.focusToSpace(item.spaceName);
    createConfirm({
      iconType: 'warning',
      title: '确认操作',
      content: `确定要开启【${item.spaceName}】的灯光吗？`,
      onOk: async () => {
        try {
          await openAreaApi(item.spaceId);
          createMessage.success(`${item.spaceName} 开灯指令已下发`);
        } catch {
          createMessage.error('操作失败');
        }
      },
    });
  }

  /** 地块关灯控制 */
  function handleControlOff(item: any) {
    // 聚焦地图到该地块
    mapViewRef.value?.focusToSpace(item.spaceName);
    createConfirm({
      iconType: 'warning',
      title: '确认操作',
      content: `确定要关闭【${item.spaceName}】的灯光吗？`,
      onOk: async () => {
        try {
          await closeAreaApi(item.spaceId);
          createMessage.success(`${item.spaceName} 关灯指令已下发`);
        } catch {
          createMessage.error('操作失败');
        }
      },
    });
  }

  onMounted(() => {
    loadStats();
    loadAllSpace();
    loadAllCircuit();
  });
</script>

<style lang="less">
  @import './index.less';
</style>
