<template>
  <div class="north-lighting-overview">
    <!-- 统计卡片 -->
    <div class="grid grid-4" style="margin-bottom: 20px">
      <div class="stat-card">
        <div class="stat-label">照明地块</div>
        <div class="stat-value" style="color: var(--accent)">{{ stats.blockCount }}</div>
        <div class="stat-trend trend-up">↑ {{ stats.blockCoverage }} 覆盖</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">在线设备</div>
        <div class="stat-value" style="color: var(--accent2)">{{ stats.onlineDevices }}</div>
        <div class="stat-trend trend-up">↑ {{ stats.onlineRate }} 在线率</div>
      </div>
      <div class="stat-card orange"> 
        <div class="stat-label">今日用电</div>
        <div class="stat-value" style="color: var(--accent3)">{{ stats.todayUsage }}</div>
        <div class="stat-trend trend-up">kWh 较昨日 {{ stats.usageTrend }}</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">待处理报警</div>
        <div class="stat-value" style="color: var(--danger)">{{ stats.alarmCount }}</div>
        <div class="stat-trend trend-down">需立即处理</div>
      </div>
    </div>

    <!-- 地图模式 -->
    <div class="card">
      <div class="card-title">🗺️ 地图模式 - 北区照明地块分布</div>
      <div class="map-placeholder">
        <div style="font-size: 48px; margin-bottom: 10px">🗺️</div>
        <div style="font-size: 16px; margin-bottom: 8px">地图组件区域（集成园区GIS地图）</div>
        <div style="font-size: 12px">显示{{ stats.blockCount }}个地块的开关灯状态、设备运行状态，支持一键开关灯</div>
        <div style="display: flex; gap: 10px; margin-top: 10px">
          <span class="tag tag-green"><span class="status-dot online"></span>正常 {{ mapStatus.normal }}</span>
          <span class="tag tag-orange"><span class="status-dot warning"></span>告警 {{ mapStatus.warning }}</span>
          <span class="tag tag-red"><span class="status-dot offline"></span>离线 {{ mapStatus.offline }}</span>
        </div>
      </div>
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
            <tr v-for="item in blockList" :key="item.name">
              <td>{{ item.name }}</td>
              <td>{{ item.circuits }}</td>
              <td>{{ item.online }}</td>
              <td>
                <span :class="['tag', item.status === '运行中' ? 'tag-green' : 'tag-orange']">
                  {{ item.status }}
                </span>
              </td>
              <td>{{ item.todayUsage }} kWh</td>
              <td>
                <button class="btn btn-sm btn-primary" @click="handleControl(item)">控制</button>
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
  import { ref, onMounted } from 'vue';
  import { getOverviewStatsApi, getBlockListApi, allOnApi, allOffApi } from './comprehensivePreview.api';
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

  /** 地块列表 */
  const blockList = ref<any[]>([]);

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
    }
  }

  /** 加载地块列表 */
  async function loadBlockList() {
    try {
      const res = await getBlockListApi();
      blockList.value = res;
    } catch {
      // 接口未通时使用默认数据
      blockList.value = [
        { name: 'A1-冬奥广场', circuits: 24, online: 24, status: '运行中', todayUsage: 420 },
        { name: 'A2-服贸会场馆', circuits: 36, online: 35, status: '运行中', todayUsage: 680 },
        { name: 'B1-工业遗址公园', circuits: 18, online: 18, status: '运行中', todayUsage: 310 },
        { name: 'B2-滨水绿道', circuits: 42, online: 40, status: '部分故障', todayUsage: 520 },
        { name: 'C1-科技大厦', circuits: 56, online: 56, status: '运行中', todayUsage: 915 },
      ];
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

  /** 地块控制 */
  function handleControl(item: any) {
    createMessage.info(`正在控制: ${item.name}`);
  }

  onMounted(() => {
    loadStats();
    loadBlockList();
  });
</script>

<style lang="less">
  @import './index.less';
</style>
