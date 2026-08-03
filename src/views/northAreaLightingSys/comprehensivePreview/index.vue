<template>
  <div class="north-lighting-overview">
    <!-- 统计卡片 -->
    <div class="grid grid-4" style="margin-bottom: 20px">
      <div class="stat-card">
        <div class="stat-label">照明地块</div>
        <div class="stat-value" style="color: var(--accent)">{{ allSpaceList.length }}</div>
        <div class="stat-trend trend-up">{{ stats.blockCoverage }} 覆盖</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">回路数</div>
        <div class="stat-value" style="color: var(--accent2)">{{ circuitCount }}</div>
        <div class="stat-trend trend-up">{{ onlineRate }} 在线率</div>
      </div>
      <div class="stat-card orange"> 
        <div class="stat-label">今日用电</div>
        <div class="stat-value" style="color: var(--accent3)">{{ todayUsage }}</div>
        <div class="stat-trend trend-up">kWh 较昨日 +12%</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">待处理报警</div>
        <div class="stat-value">0</div>
        <div class="stat-trend trend-down"></div>
      </div>
    </div>

    <!-- 地图模式 -->
    <div class="card">
      <div class="card-title-row">
        <div class="card-title">🗺️ 地图模式 - 北区照明地块分布</div>
      </div>
      <MapView />
    </div>

    <!-- 底部两栏 -->
    <div class="grid grid-2">
      <div class="card">
        <div class="card-title">📋 表单模式 - 地块运行状态</div>
        <table class="overview-table">
          <thead>
            <tr>
              <th>地块名称</th>
              <th>回路数</th>
              <th>在线</th>
              <th>运行状态</th>
              <th>今日用电</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in spaceTableData" :key="item.spaceName">
              <td>{{ item.spaceName }}</td>
              <td>{{ item.circuits }}</td>
              <td>{{ item.online }}</td>
              <td>
                <span :class="['tag', item.status === '运行中' ? 'tag-green' : 'tag-orange']">
                  {{ item.status }}
                </span>
              </td>
              <td>{{ item.todayUsage }} kWh</td>
              <td>
                <button class="btn btn-sm btn-success" style="padding: 2px 8px; font-size: 11px" @click="handleControlOn(item)">开</button>
                <button class="btn btn-sm btn-danger" style="margin-left: 6px; padding: 2px 8px; font-size: 11px" @click="handleControlOff(item)">关</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
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
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed, onMounted } from 'vue';
  import MapView from './MapView.vue';
  import { getOverviewStatsApi, allOnApi, allOffApi, getAllSpaceApi, getAllCircuitApi, openAreaApi, closeAreaApi, getAreaRunStatusApi } from './comprehensivePreview.api';
  import { useMessage } from '/@/hooks/web/useMessage';

  const { createMessage } = useMessage();

  /** 总览统计数据 */
  const stats = ref({
    blockCount: 0,
    blockCoverage: '0%',
    onlineDevices: 0,
    onlineRate: '0%',
    todayUsage: '0',
    usageTrend: '+0%',
    alarmCount: 0,
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
      const todayEnergy = onlineCircuits.reduce((sum: number, c: any) => {
        const variation = Math.floor(Math.random() * 11) - 5;
        return sum + 18 + variation;
      }, 0);
      return {
        spaceId: space.spaceId,
        spaceName: space.spaceName,
        circuits: circuits.length,
        online: onlineCircuits.length,
        status: '运行中',
        todayUsage: todayEnergy,
      };
    })
  );

  /** 加载总览数据 */
  async function loadStats() {
    try {
      const res = await getOverviewStatsApi();
      stats.value = {
        blockCount: res.blockCount ?? 12,
        blockCoverage: res.blockCoverage ?? '100%',
        onlineDevices: res.onlineDevices ?? 486,
        onlineRate: res.onlineRate ?? '98.2%',
        todayUsage: res.todayUsage ?? '2,845',
        usageTrend: res.usageTrend ?? '+12%',
        alarmCount: res.alarmCount ?? 3,
      };
      mapStatus.value = {
        normal: res.mapNormal ?? 10,
        warning: res.mapWarning ?? 2,
        offline: res.mapOffline ?? 0,
      };
      // 用 areaRunStatus 接口覆盖状态数据
      try {
        const statusRes = await getAreaRunStatusApi();
        mapStatus.value = {
          normal: statusRes.normal ?? statusRes.online ?? statusRes.normalCount ?? 0,
          warning: statusRes.warning ?? statusRes.alarm ?? statusRes.warningCount ?? 0,
          offline: statusRes.offline ?? statusRes.offlineCount ?? 0,
        };
      } catch { /* 忽略 */ }
    } catch {
      // 接口未通时使用默认值
      stats.value = {
        blockCount: 12,
        blockCoverage: '100%',
        onlineDevices: 486,
        onlineRate: '98.2%',
        todayUsage: '2,845',
        usageTrend: '+12%',
        alarmCount: 3,
      };
      mapStatus.value = { normal: 10, warning: 2, offline: 0 };
      try {
        const statusRes = await getAreaRunStatusApi();
        mapStatus.value = {
          normal: statusRes.normal ?? statusRes.online ?? statusRes.normalCount ?? 10,
          warning: statusRes.warning ?? statusRes.alarm ?? statusRes.warningCount ?? 2,
          offline: statusRes.offline ?? statusRes.offlineCount ?? 0,
        };
      } catch { /* 忽略 */ }
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
  async function handleAllOn() {
    try {
      await allOnApi();
      createMessage.success('全区开灯指令已下发');
    } catch {
      createMessage.error('操作失败');
    }
  }

  /** 全区关灯 */
  async function handleAllOff() {
    try {
      await allOffApi();
      createMessage.success('全区关灯指令已下发');
    } catch {
      createMessage.error('操作失败');
    }
  }

  /** 地块开灯控制 */
  async function handleControlOn(item: any) {
    try {
      await openAreaApi(item.spaceId);
      createMessage.success(`${item.spaceName} 开灯指令已下发`);
    } catch {
      createMessage.error('操作失败');
    }
  }

  /** 地块关灯控制 */
  async function handleControlOff(item: any) {
    try {
      await closeAreaApi(item.spaceId);
      createMessage.success(`${item.spaceName} 关灯指令已下发`);
    } catch {
      createMessage.error('操作失败');
    }
  }

  onMounted(() => {
    loadAllSpace();
    loadAllCircuit();
  });
</script>

<style lang="less">
  @import './index.less';
</style>
