<template>
  <div class="energy-statistics">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <a-radio-group v-model:value="statType" class="stat-type">
        <a-radio value="area">按区域</a-radio>
        <a-radio value="box">按箱子</a-radio>
      </a-radio-group>
    </div>

    <!-- 图表区：能耗排名 + 占比 -->
    <div class="charts-grid">
      <div class="chart-card">
        <div class="card-title">
          <span class="title-bar"></span>
          能耗排名（今日 kWh，降序 Top15）
        </div>
        <div ref="rankChartRef" class="chart-box rank-chart"></div>
      </div>
      <div class="chart-card">
        <div class="card-title">
          <span class="title-bar"></span>
          占比（Top5 + 其他）
        </div>
        <div ref="pieChartRef" class="chart-box pie-chart"></div>
      </div>
    </div>

    <!-- Top5 逐时趋势对比 -->
    <div class="chart-card">
      <div class="card-title">
        <span class="title-bar"></span>
        Top5 逐时趋势对比（kW）
      </div>
      <div ref="trendChartRef" class="chart-box trend-chart"></div>
    </div>

    <!-- 汇总表 -->
    <div class="chart-card">
      <!-- 页签切换：汇总表 / 区间查询 -->
      <div class="summary-tabs">
        <button
          class="summary-tab"
          :class="{ active: summaryTab === 'tree' }"
          @click="switchSummaryTab('tree')"
        >汇总表</button>
        <button
          class="summary-tab"
          :class="{ active: summaryTab === 'meter' }"
          @click="switchSummaryTab('meter')"
        >区间查询</button>
      </div>

      <!-- 页签一：汇总表（地块 → 区域 → 箱子） -->
      <template v-if="summaryTab === 'tree'">
        <div class="title-tip" style="margin-bottom: 8px">（点击地块行展开区域，再点击展开箱子）</div>
        <a-table
          :columns="summaryColumns"
          :data-source="summaryData"
          row-key="key"
          :pagination="false"
          class="summary-table"
        >
          <template #expandIcon="{ expanded, record, onExpand }">
            <template v-if="record.children && record.children.length > 0">
              <caret-down-filled
                v-if="expanded"
                class="expand-arrow"
                @click="(e) => onExpand(record, e)"
              />
              <caret-right-filled
                v-else
                class="expand-arrow"
                @click="(e) => onExpand(record, e)"
              />
            </template>
          </template>
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'installed'">
              {{ record.installed.toFixed(1) }}
            </template>
            <template v-else-if="column.key === 'today'">
              {{ record.today.toFixed(1) }}
            </template>
            <template v-else-if="column.key === 'month'">
              {{ record.month.toFixed(1) }}
            </template>
            <template v-else-if="column.key === 'ratio'">
              <span :class="['ratio-text', record.ratio !== '0.0%' && record.children ? 'has-children' : '']">
                {{ record.ratio }}
              </span>
            </template>
          </template>
        </a-table>
      </template>

      <!-- 页签二：区间查询（按片区/箱子/时间区间查表底与累计用电量） -->
      <template v-else>
        <div class="meter-query-bar">
          <div class="query-field">
            <label class="query-label">区域</label>
            <a-select
              v-model:value="meterQuery.districtId"
              placeholder="请选择区域"
              allowClear
              :options="districtOptions"
              style="width: 180px"
            />
          </div>
          <div class="query-field">
            <label class="query-label">箱子名称</label>
            <a-input
              v-model:value="meterQuery.gateway"
              placeholder="请输入网关编号"
              allowClear
              style="width: 160px"
              @pressEnter="handleMeterSearch"
            />
          </div>
          <div class="query-field">
            <label class="query-label">开始时间</label>
            <a-date-picker
              v-model:value="meterQuery.startTime"
              show-time
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="开始时间"
              style="width: 190px"
            />
          </div>
          <div class="query-field">
            <label class="query-label">结束时间</label>
            <a-date-picker
              v-model:value="meterQuery.endTime"
              show-time
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="结束时间"
              style="width: 190px"
            />
          </div>
          <div class="query-actions">
            <button class="btn btn-primary" @click="handleMeterSearch">查询</button>
            <button class="btn btn-outline" @click="handleMeterReset">重置</button>
          </div>
        </div>

        <a-table
          :columns="meterReadColumns"
          :data-source="meterReadData"
          row-key="boxName"
          :pagination="false"
          :loading="meterReadLoading"
          class="summary-table meter-read-table"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'startValue'">
              {{ fmtNum(record.startValue) }}
            </template>
            <template v-else-if="column.key === 'endValue'">
              {{ fmtNum(record.endValue) }}
            </template>
            <template v-else-if="column.key === 'total'">
              <span class="meter-total">{{ fmtNum(record.total) }}</span>
            </template>
          </template>
        </a-table>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import { message } from 'ant-design-vue';
import { UploadOutlined, CaretRightFilled, CaretDownFilled } from '@ant-design/icons-vue';
import { getEnergyRanking, getEnergyProportion, getEnergyHourlyTrend, getEnergySummary, getEnergyMeterReads } from '@/api/equipmentMonitoring';
import { getAllDistrictTag } from '@/api/baseSettingBqZm';

/* ============================ 顶部工具栏 ============================ */
const statType = ref('area'); // area: 按区域 / box: 按箱子

/** 上传能耗 Excel（真实场景替换为 defHttp.uploadFile 接口） */
const handleUpload = (file: File) => {
  message.success(`文件「${file.name}」上传成功，能耗数据已更新`);
  return false; // 阻止默认上传行为
};

/* ============================ 能耗排名（横向柱状图） ============================ */
interface RankItem {
  name: string;
  value: number;
}

/** 按区域维度：今日 kWh 降序 Top15 */
const rankAreaData: RankItem[] = [
  { name: '服贸会项目 / 待确认映射', value: 849.3 },
  { name: '三高炉项目 / 本体', value: 624.4 },
  { name: '冬训中心项目 / 冰球馆', value: 619.2 },
  { name: '三高炉项目 / 秀池木栈道', value: 575.7 },
  { name: '制氧南项目 / 赛道', value: 380.4 },
  { name: '冬训中心项目 / 速滑馆', value: 352.8 },
  { name: '服贸会项目 / 展馆A区', value: 331.5 },
  { name: '脱硫车间项目 / 主车间', value: 298.6 },
  { name: '金安桥项目 / 桥面', value: 275.4 },
  { name: '制氧南项目 / 冷却塔', value: 258.3 },
  { name: '三高炉项目 / 高炉广场', value: 244.9 },
  { name: '冬训中心项目 / 冰壶馆', value: 231.7 },
  { name: '服贸会项目 / 展馆B区', value: 220.5 },
  { name: '一高炉项目 / 炉体', value: 212.4 },
  { name: '脱硫车间项目 / 群明湖北侧', value: 206.9 },
];

/** 当前展示的排名数据（接口数据加载成功后覆盖 mock） */
const rankArea = ref<RankItem[]>(rankAreaData);

/** 按箱子维度：今日 kWh 降序 Top15 */
const rankBoxData: RankItem[] = [
  { name: '服贸会项目 / 待确认映射 / 箱A', value: 320.5 },
  { name: '三高炉项目 / 本体 / 1号箱', value: 298.2 },
  { name: '冬训中心项目 / 冰球馆 / 箱A', value: 286.4 },
  { name: '服贸会项目 / 待确认映射 / 箱B', value: 275.8 },
  { name: '三高炉项目 / 本体 / 2号箱', value: 254.1 },
  { name: '三高炉项目 / 秀池木栈道 / 栈道南', value: 232.6 },
  { name: '冬训中心项目 / 冰球馆 / 箱B', value: 218.9 },
  { name: '制氧南项目 / 赛道 / 箱A', value: 205.3 },
  { name: '三高炉项目 / 秀池木栈道 / 栈道北', value: 198.7 },
  { name: '服贸会项目 / 展馆A区 / 箱A', value: 186.4 },
  { name: '制氧南项目 / 赛道 / 箱B', value: 175.1 },
  { name: '脱硫车间项目 / 主车间 / 箱A', value: 168.9 },
  { name: '冬训中心项目 / 速滑馆 / 箱A', value: 155.2 },
  { name: '服贸会项目 / 展馆B区 / 箱A', value: 143.6 },
  { name: '金安桥项目 / 桥面 / 箱A', value: 132.8 },
];

/** 当前展示的箱子排名数据（接口数据加载成功后覆盖 mock） */
const rankBox = ref<RankItem[]>(rankBoxData);

const rankChartRef = ref<HTMLDivElement | null>(null);
let rankChart: echarts.ECharts | null = null;

const initRankChart = () => {
  if (!rankChartRef.value) return;
  rankChart = echarts.init(rankChartRef.value);
  updateRankChart(statType.value);
};

const tooltipBg = 'rgba(15, 23, 42, 0.92)';
const tooltipBorder = '#334155';
const axisLabelColor = '#94a3b8';
const splitLineColor = 'rgba(148, 163, 184, 0.14)';
const axisLineColor = '#334155';

const updateRankChart = (type: string) => {
  if (!rankChart) return;
  const data = type === 'area' ? rankArea.value : rankBox.value;
  rankChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(14, 165, 233, 0.08)' } },
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      textStyle: { color: '#f1f5f9' },
      formatter: (params: any) => {
        const item = params[0];
        return `${item.name}<br/>今日能耗：${item.value.toFixed(1)} kWh`;
      },
    },
    grid: { left: '2%', right: '14%', bottom: '2%', top: '2%', containLabel: true },
    xAxis: {
      type: 'value',
      max: 1000,
      interval: 200,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: axisLabelColor, fontSize: 12 },
      splitLine: { lineStyle: { color: splitLineColor } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: data.map((item) => item.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#cbd5e1',
        fontSize: 12,
        width: 170,
        overflow: 'truncate',
      },
    },
    series: [
      {
        type: 'bar',
        data: data.map((item) => item.value),
        barWidth: 14,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#0369a1' },
            { offset: 1, color: '#38bdf8' },
          ]),
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: 'right',
          color: '#e2e8f0',
          fontSize: 12,
          formatter: (params: any) => params.value.toFixed(1),
        },
      },
    ],
  });
};

/* ============================ 占比（环形图） ============================ */
const pieColors = ['#38bdf8', '#f59e0b', '#10b981', '#facc15', '#f472b6', '#475569'];

const getPieData = () => {
  const top5 = rankArea.value.slice(0, 5);
  const others = rankArea.value.slice(5).reduce((sum, item) => sum + item.value, 0);
  return [
    ...top5.map((item) => ({ name: item.name, value: item.value })),
    { name: '其他', value: Number(others.toFixed(1)) },
  ];
};

/** 占比图数据（proportion 接口加载成功后覆盖 mock） */
const pieData = ref(getPieData());

const pieChartRef = ref<HTMLDivElement | null>(null);
let pieChart: echarts.ECharts | null = null;

const renderPie = () => {
  if (!pieChart) return;
  pieChart.setOption({
    tooltip: {
      trigger: 'item',
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      textStyle: { color: '#f1f5f9' },
      formatter: '{b}<br/>{c} kWh（{d}%）',
    },
    legend: {
      orient: 'vertical',
      right: '2%',
      top: 'center',
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 12,
      textStyle: { color: '#94a3b8', fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['42%', '46%'],
        avoidLabelOverlap: true,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 'bold', formatter: '{b}\n{d}%' },
        },
        itemStyle: { borderRadius: 4, borderColor: '#1e293b', borderWidth: 2 },
        data: pieData.value.map((item, index) => ({
          ...item,
          itemStyle: { color: pieColors[index % pieColors.length] },
        })),
      },
    ],
  });
};

const initPieChart = () => {
  if (!pieChartRef.value) return;
  pieChart = echarts.init(pieChartRef.value);
  renderPie();
};

/* ============================ Top5 逐时趋势（折线图） ============================ */
const trendHours = ref(Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`));
/** 全园：18:00 后开启，飙升至峰值并保持至 22:00 后回落（接口数据加载成功后覆盖） */
const parkTrend = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2800, 2960, 2920, 2880, 2850, 600];
/** 当前展示的逐时趋势系列（hourlyTrend 接口加载成功后覆盖） */
const trendSeriesData = ref<{ name: string; data: number[] }[]>([{ name: '全园', data: parkTrend }]);
const trendColors = ['#38bdf8', '#f59e0b', '#10b981', '#facc15', '#f472b6'];

const trendChartRef = ref<HTMLDivElement | null>(null);
let trendChart: echarts.ECharts | null = null;

const renderTrend = () => {
  if (!trendChart) return;
  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      textStyle: { color: '#f1f5f9' },
      formatter: (params: any) => {
        const item = params[0];
        return `${item.name}<br/>${item.marker}${item.seriesName}：${item.value.toLocaleString()} kW`;
      },
    },
    legend: {
      data: trendSeriesData.value.map((s) => s.name),
      top: 0,
      right: 0,
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#94a3b8', fontSize: 12 },
    },
    grid: { left: '2%', right: '3%', bottom: '2%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendHours.value,
      axisLine: { lineStyle: { color: axisLineColor } },
      axisTick: { show: false },
      axisLabel: { color: axisLabelColor, fontSize: 12, interval: 2 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 3000,
      interval: 500,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: splitLineColor } },
      axisLabel: { color: axisLabelColor, fontSize: 12 },
    },
    series: trendSeriesData.value.map((s, idx) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: { color: trendColors[idx % trendColors.length] },
      lineStyle: { width: 2.5, color: trendColors[idx % trendColors.length] },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(56, 189, 248, 0.28)' },
          { offset: 1, color: 'rgba(56, 189, 248, 0.02)' },
        ]),
      },
    })),
  });
};

const initTrendChart = () => {
  if (!trendChartRef.value) return;
  trendChart = echarts.init(trendChartRef.value);
  renderTrend();
};

/* ============================ 汇总表（地块 → 区域 → 箱子 三级展开） ============================ */
interface SummaryNode {
  key: string;
  name: string;
  meterCount: number;
  installed: number;
  today: number;
  month: number;
  ratio: string;
  children?: SummaryNode[];
}

const summaryBase = [
  { name: '三高炉项目', meterCount: 11, installed: 537.4, today: 1861.2, month: 20941.1, ratio: '17.2%' },
  { name: '冬训中心项目', meterCount: 13, installed: 455.0, today: 1567.8, month: 17659.7, ratio: '14.5%' },
  { name: '制氧南项目', meterCount: 12, installed: 303.5, today: 1046.8, month: 11756.8, ratio: '9.7%' },
  { name: '脱硫车间项目', meterCount: 17, installed: 667.0, today: 2304.3, month: 25925.0, ratio: '21.3%' },
  { name: '服贸会项目', meterCount: 31, installed: 1112.8, today: 3846.7, month: 43291.3, ratio: '35.6%' },
  { name: '一高炉项目', meterCount: 0, installed: 0.0, today: 0.0, month: 0.0, ratio: '0.0%' },
  { name: '金安桥项目', meterCount: 4, installed: 55.4, today: 192.0, month: 2154.7, ratio: '1.8%' },
];

const regionMap: Record<string, string[]> = {
  三高炉项目: ['本体', '秀池木栈道'],
  冬训中心项目: ['冰球馆', '速滑馆'],
  制氧南项目: ['赛道', '冷却塔'],
  脱硫车间项目: ['主车间', '群明湖北侧'],
  服贸会项目: ['待确认映射', '展馆A区'],
  一高炉项目: ['炉体'],
  金安桥项目: ['桥面'],
};

/** 按电表数量比例拆分父级数值到子级 */
function splitByMeter(meterTotal: number, counts: number[], value: number): number[] {
  if (meterTotal === 0) return counts.map(() => 0);
  return counts.map((c) => Number(((value * c) / meterTotal).toFixed(1)));
}

function buildSummaryTree(): SummaryNode[] {
  return summaryBase.map((row, rowIdx) => {
    const names = regionMap[row.name] || [];
    // 前 n-1 个区域均分电表数，最后一个取剩余，保证总和与父级一致
    const each = Math.max(0, Math.floor(row.meterCount / Math.max(1, names.length)));
    const meterCounts = names.map((_, ri) =>
      ri === names.length - 1 ? Math.max(0, row.meterCount - each * (names.length - 1)) : each
    );
    const installedParts = splitByMeter(row.meterCount, meterCounts, row.installed);
    const todayParts = splitByMeter(row.meterCount, meterCounts, row.today);
    const monthParts = splitByMeter(row.meterCount, meterCounts, row.month);

    const regions: SummaryNode[] = names.map((regionName, ri) => {
      const regionMeter = meterCounts[ri];
      const boxCounts = [Math.max(0, Math.ceil(regionMeter / 2)), Math.max(0, Math.floor(regionMeter / 2))];
      const boxInstalled = splitByMeter(regionMeter, boxCounts, installedParts[ri]);
      const boxToday = splitByMeter(regionMeter, boxCounts, todayParts[ri]);
      const boxMonth = splitByMeter(regionMeter, boxCounts, monthParts[ri]);

      const boxes: SummaryNode[] = boxCounts.map((_, bi) => ({
        key: `row-${rowIdx}-${ri}-box-${bi}`,
        name: `${regionName} / ${bi === 0 ? '箱A' : '箱B'}`,
        meterCount: boxCounts[bi],
        installed: boxInstalled[bi],
        today: boxToday[bi],
        month: boxMonth[bi],
        ratio: row.meterCount === 0 ? '0.0%' : `${((boxToday[bi] / summaryBase.reduce((s, r) => s + r.today, 0)) * 100).toFixed(1)}%`,
      }));

      return {
        key: `row-${rowIdx}-region-${ri}`,
        name: regionName,
        meterCount: regionMeter,
        installed: installedParts[ri],
        today: todayParts[ri],
        month: monthParts[ri],
        ratio: row.meterCount === 0 ? '0.0%' : `${((todayParts[ri] / summaryBase.reduce((s, r) => s + r.today, 0)) * 100).toFixed(1)}%`,
        children: boxes.length ? boxes : undefined,
      };
    });

    return {
      key: `row-${rowIdx}`,
      name: row.name,
      meterCount: row.meterCount,
      installed: row.installed,
      today: row.today,
      month: row.month,
      ratio: row.ratio,
      children: regions.length ? regions : undefined,
    };
  });
}

const summaryData = ref(buildSummaryTree());

const summaryColumns = [
  { title: '名称', key: 'name', dataIndex: 'name', align: 'left' as const },
  { title: '电表', key: 'meterCount', dataIndex: 'meterCount', align: 'center' as const },
  { title: '装机(kW)', key: 'installed', dataIndex: 'installed', align: 'center' as const },
  { title: '今日(kWh)', key: 'today', dataIndex: 'today', align: 'center' as const },
  { title: '今日占比', key: 'ratio', dataIndex: 'ratio', align: 'center' as const },
  { title: '本月(kWh)', key: 'month', dataIndex: 'month', align: 'center' as const },
  { title: '本月占比', key: 'ratio', dataIndex: 'ratio', align: 'center' as const },
];

/* ============================ 汇总表页签 + 区间查询 ============================ */
/** 当前汇总表页签：tree=汇总表，meter=区间查询 */
const summaryTab = ref<'tree' | 'meter'>('tree');
/** 片区下拉是否已加载（避免重复请求） */
let districtLoaded = false;

/** 切换汇总表页签 */
function switchSummaryTab(tab: 'tree' | 'meter') {
  summaryTab.value = tab;
  if (tab === 'meter' && !districtLoaded) {
    // 首次进入区间查询时加载片区下拉
    loadDistrictOptions();
  }
}

/** 区域（片区）下拉选项：value=0 表示"全部片区"，用于不传 districtId 查询全部 */
const districtOptions = ref<{ label: string; value: number }[]>([
  { label: '全部片区', value: 0 },
]);
async function loadDistrictOptions() {
  try {
    const res = await getAllDistrictTag('1');
    const list = Array.isArray(res) ? res : (res?.records || []);
    const rest = list.map((it: any) => ({
      label: it.districtName,
      value: Number(it.id),
    }));
    // 保留开头的"全部片区"选项，追加实际片区
    districtOptions.value = [{ label: '全部片区', value: 0 }, ...rest];
    districtLoaded = true;
  } catch (err) {
    console.error('加载区域下拉失败：', err);
  }
}

/** 区间查询条件：districtId=0 表示全部片区（不传参） */
const meterQuery = ref({
  districtId: 0 as number,
  gateway: '' as string,
  startTime: null as string | null,
  endTime: null as string | null,
});

/** 区间查询结果 */
const meterReadData = ref<any[]>([]);
const meterReadLoading = ref(false);

/** 区间查询结果列 */
const meterReadColumns = [
  { title: '区域', key: 'districtName', dataIndex: 'districtName', align: 'center' as const },
  { title: '箱子名称', key: 'boxName', dataIndex: 'boxName', align: 'center' as const },
  { title: '开始时间', key: 'startTime', dataIndex: 'startTime', align: 'center' as const },
  { title: '开始表底', key: 'startValue', dataIndex: 'startValue', align: 'center' as const },
  { title: '结束时间', key: 'endTime', dataIndex: 'endTime', align: 'center' as const },
  { title: '结束表底', key: 'endValue', dataIndex: 'endValue', align: 'center' as const },
  { title: '累计用电量(kWh)', key: 'total', dataIndex: 'total', align: 'center' as const },
];

/** 数值格式化 */
function fmtNum(v: any): string {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n.toFixed(1) : '0.0';
}

/** 查询：按区域/箱子/时间区间查表底与累计用电量 */
async function handleMeterSearch() {
  const params: Record<string, any> = {};
  // districtId=0 表示全部片区，不传参（后端查全部）
  if (meterQuery.value.districtId) {
    params.districtId = meterQuery.value.districtId;
  }
  if (meterQuery.value.gateway.trim()) {
    params.gateway = meterQuery.value.gateway.trim();
  }
  if (meterQuery.value.startTime) {
    params.startTime = meterQuery.value.startTime;
  }
  if (meterQuery.value.endTime) {
    params.endTime = meterQuery.value.endTime;
  }

  meterReadLoading.value = true;
  try {
    const res = await getEnergyMeterReads(params);
    const list = Array.isArray(res) ? res : (res?.records || []);
    meterReadData.value = list.map((it: any) => ({
      districtName: it.districtName || '-',
      boxName: it.boxName || `${it.gatewayCode || '-'}号网关`,
      startTime: it.startTime || '-',
      startValue: it.startValue,
      endTime: it.endTime || '-',
      endValue: it.endValue,
      total: it.total,
    }));
    if (!list.length) {
      message.info('未查询到符合条件的电表读数');
    }
  } catch (err) {
    console.error('区间查询失败：', err);
    meterReadData.value = [];
  } finally {
    meterReadLoading.value = false;
  }
}

/** 重置查询条件 */
function handleMeterReset() {
  meterQuery.value = {
    districtId: 0,
    gateway: '',
    startTime: null,
    endTime: null,
  };
  meterReadData.value = [];
}

/* ============================ 接口数据加载 ============================ */
/** 生成当天日期字符串，sep='-' → 2026-08-13；sep='' → 20260813 */
function formatDate(sep: string): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}${sep}${m}${sep}${day}`;
}

/** 兼容多种返回结构：数组 / { records } / { list } / { data } / { result } */
function normalizeList(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== 'object') return [];
  const v = res.records ?? res.list ?? res.result ?? res.data ?? res.rows;
  return Array.isArray(v) ? v : [];
}

/** 排名项字段兼容映射（name/value 多字段回退） */
function mapRankItem(it: any): RankItem {
  return {
    name: it.name || it.regionName || it.areaName || it.spaceName || it.circuitName || it.deviceName || it.boxName || '-',
    value: Number(it.value ?? it.energy ?? it.kwh ?? it.consumption ?? it.today ?? 0),
  };
}

/** 维度映射：按区域 → zone，按箱子 → box */
const levelByStatType = () => (statType.value === 'area' ? 'zone' : 'box');

/** 能耗排名（随维度切换，今天，Top 15） */
const loadRanking = async () => {
  try {
    const res = await getEnergyRanking({ level: levelByStatType(), top: 15 });
    const list = normalizeList(res)
      .map(mapRankItem)
      .filter((i) => i.value > 0);
    if (!list.length) return;
    if (statType.value === 'area') {
      rankArea.value = list;
    } else {
      rankBox.value = list;
    }
    updateRankChart(statType.value);
  } catch (err) {
    console.error('能耗排名加载失败：', err);
  }
};

/** 能耗占比（随维度切换，当天） */
const loadProportion = async () => {
  try {
    const res = await getEnergyProportion({ level: levelByStatType(), date: formatDate('-') });
    const list = normalizeList(res)
      .map((it: any) => ({
        name: it.name || it.regionName || it.areaName || it.deviceName || '其他',
        value: Number(it.value ?? it.energy ?? it.kwh ?? it.proportion ?? 0),
      }))
      .filter((i) => i.value > 0);
    if (!list.length) return;
    pieData.value = list;
    renderPie();
  } catch (err) {
    console.error('能耗占比加载失败：', err);
  }
};

/** Top5 逐时趋势对比（按地块，当天） */
const loadTrend = async () => {
  try {
    const res = await getEnergyHourlyTrend({ level: 'parcel', date: formatDate('') });
    let hours: string[] = [];
    let series: { name: string; data: number[] }[] = [];
    if (Array.isArray(res)) {
      // 平铺数组：[{ name, data }]
      series = res.map((s: any) => ({
        name: s.name || s.seriesName || s.deviceName || '-',
        data: (s.data || s.values || s.points || []).map(Number),
      }));
    } else if (res && typeof res === 'object') {
      // 对象：{ hours: [], series: [{ name, data }] }
      hours = res.hours || res.timeList || res.times || res.xAxis || [];
      const arr = res.series || res.dataList || res.seriesList || [];
      series = arr.map((s: any) => ({
        name: s.name || s.seriesName || s.deviceName || '-',
        data: (s.data || s.values || s.points || []).map(Number),
      }));
    }
    if (!series.length) return;
    if (hours.length) trendHours.value = hours;
    trendSeriesData.value = series;
    renderTrend();
  } catch (err) {
    console.error('逐时趋势加载失败：', err);
  }
};

/** 汇总表节点字段兼容映射（递归，path 用于生成唯一 key，避免多层 idx 重复导致树形展开错乱） */
function mapSummaryNode(it: any, path: string): SummaryNode {
  // 空数组视为无子级，避免 a-table 渲染出无意义的展开箭头
  const rawChildren = Array.isArray(it.children) ? it.children : undefined;
  const hasChildren = rawChildren && rawChildren.length > 0;
  const ratioRaw = it.ratio ?? it.proportion ?? it.percent;
  const ratioStr =
    ratioRaw === null || ratioRaw === undefined || ratioRaw === ''
      ? '0.0%'
      : String(ratioRaw).includes('%')
        ? String(ratioRaw)
        : `${Number(ratioRaw).toFixed(1)}%`;
  return {
    key: path,
    name: String(it.name || '-'),
    meterCount: Number(it.meterCount ?? it.meters ?? it.meterNum ?? it.meter ?? it.equipmentCount ?? 0),
    installed: Number(it.installed ?? it.kw ?? it.installedPower ?? it.capacity ?? it.power ?? 0),
    today: Number(it.today ?? it.todayEnergy ?? it.todayKwh ?? it.energy ?? 0),
    month: Number(it.month ?? it.monthEnergy ?? it.monthKwh ?? 0),
    ratio: ratioStr,
    children: hasChildren
      ? rawChildren.map((c: any, ci: number) => mapSummaryNode(c, `${path}-${ci}`))
      : undefined,
  };
}

/** 能耗汇总表（当天） */
const loadSummary = async () => {
  try {
    const res = await getEnergySummary({ date: formatDate('-') });
    const list = normalizeList(res);
    if (!list.length) return;
    summaryData.value = list.map((it: any, idx: number) => mapSummaryNode(it, `row-${idx}`));
  } catch (err) {
    console.error('能耗汇总加载失败：', err);
  }
};

/* ============================ 维度切换与生命周期 ============================ */
watch(statType, (type) => {
  nextTick(() => {
    updateRankChart(type);
  });
  // 维度切换时重新拉取排名与占比
  loadRanking();
  loadProportion();
});

const handleResize = () => {
  rankChart?.resize();
  pieChart?.resize();
  trendChart?.resize();
};

onMounted(() => {
  initRankChart();
  initPieChart();
  initTrendChart();
  window.addEventListener('resize', handleResize);
  // 加载真实接口数据（失败时保留 mock 兜底）
  loadRanking();
  loadProportion();
  loadTrend();
  loadSummary();
});

onUnmounted(() => {
  rankChart?.dispose();
  pieChart?.dispose();
  trendChart?.dispose();
  rankChart = null;
  pieChart = null;
  trendChart = null;
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.energy-statistics {
  --bg: #0f172a;
  --panel: #1e293b;
  --border: #334155;
  --text: #f1f5f9;
  --text2: #94a3b8;
  --primary: #0ea5e9;

  /* 撑满视口并内部滚动：全局 html overflow:hidden，需自行开启滚动 */
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  padding: 16px;
  background: #0f172a;

  /* 深色主题滚动条（全局滚动条透明度低不可见，此处覆盖为青色） */
}

.energy-statistics::-webkit-scrollbar {
  width: 6px;
}
.energy-statistics::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 6px;
}
.energy-statistics::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.5);
  border-radius: 6px;
}
.energy-statistics::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 212, 255, 0.8);
}

/* ---------- 顶部工具栏 ---------- */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.stat-type :deep(.ant-radio-wrapper) {
  font-size: 14px;
  margin-right: 20px;
  color: var(--text2);
}

.stat-type :deep(.ant-radio-wrapper:hover),
.stat-type :deep(.ant-radio-wrapper:hover .ant-radio-inner) {
  border-color: var(--primary);
}

.stat-type :deep(.ant-radio-inner) {
  background: #16233a;
  border-color: #334155;
}

.stat-type :deep(.ant-radio-checked .ant-radio-inner) {
  border-color: var(--primary);
  background: var(--primary);
}

.stat-type :deep(.ant-radio-checked .ant-radio-inner::after) {
  background-color: #ffffff;
}

.stat-type :deep(.ant-radio-checked + span) {
  color: #e2e8f0;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #0284c7, #0ea5e9);
  color: #ffffff;
  padding: 7px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.upload-btn:hover {
  background: linear-gradient(135deg, #0369a1, #38bdf8);
}

/* ---------- 图表卡片 ---------- */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.chart-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  margin-bottom: 16px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
}

.title-bar {
  width: 4px;
  height: 16px;
  background: var(--primary);
  border-radius: 2px;
}

.title-tip {
  font-size: 12px;
  font-weight: 400;
  color: var(--text2);
}

.chart-box {
  width: 100%;
}

.rank-chart {
  height: 420px;
}

.pie-chart {
  height: 420px;
}

.trend-chart {
  height: 320px;
}

/* ---------- 汇总表/区间查询 页签切换 ---------- */
.summary-tabs {
  display: inline-flex;
  gap: 6px;
  margin-bottom: 12px;
}

.summary-tab {
  height: 30px;
  padding: 0 18px;
  border: 1px solid rgba(0, 162, 232, 0.35);
  border-radius: 4px;
  font-size: 13px;
  color: #8ba3c0;
  background: rgba(0, 162, 232, 0.08);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #00a2e8;
    border-color: rgba(0, 162, 232, 0.6);
  }

  &.active {
    color: #ffffff;
    border-color: rgba(0, 162, 232, 0.9);
    background: rgba(0, 162, 232, 0.9);
  }
}

/* ---------- 区间查询条件栏 ---------- */
.meter-query-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(0, 162, 232, 0.15);
  border-radius: 6px;
}

.query-field {
  display: flex;
  align-items: center;
  gap: 6px;
}

.query-label {
  font-size: 13px;
  color: #8ba3c0;
  white-space: nowrap;
}

.query-actions {
  display: flex;
  gap: 8px;
}

.btn {
  height: 32px;
  padding: 0 16px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &.btn-primary {
    background: #00a2e8;
    color: #fff;
    border: none;

    &:hover {
      background: #0090cf;
    }
  }

  &.btn-outline {
    background: transparent;
    color: #fff;
    border: 1px solid #334155;

    &:hover {
      border-color: #00a2e8;
      color: #00a2e8;
    }
  }
}

.meter-read-table .meter-total {
  color: #00d4ff;
  font-weight: 600;
}

/* ---------- 汇总表 ---------- */
/* 全面覆盖 antd 表格默认白色背景 */
.summary-table :deep(.ant-table),
.summary-table :deep(.ant-table-container),
.summary-table :deep(.ant-table-content),
.summary-table :deep(.ant-table-cell),
.summary-table :deep(.ant-table-cell-fix-left),
.summary-table :deep(.ant-table-cell-fix-right) {
  font-size: 14px;
  background: transparent !important;
}

.summary-table :deep(.ant-table-thead > tr > th) {
  background: #16233a !important;
  color: #94a3b8 !important;
  font-weight: 600;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6) !important;
}

/* 去掉表头单元格之间的垂直小白线（antd 用 th::before 绘制表头分隔竖线） */
.summary-table :deep(.ant-table-thead > tr > th::before) {
  display: none !important;
}

/* 压暗行分隔线：antd 非 bordered 表格实际用 border-top 画线（默认 #f0f0f0 亮色），需覆盖 border-top */
.summary-table :deep(.ant-table-tbody > tr > td),
.summary-table :deep(.ant-table-tbody .ant-table-cell),
.summary-table :deep(.ant-table-wrapper .ant-table-tbody > tr > td),
.summary-table :deep(.ant-table-wrapper .ant-table-tbody .ant-table-cell) {
  background: transparent !important;
  color: #e2e8f0;
  border-top: 1px solid rgba(51, 65, 85, 0.18) !important;
  border-bottom: none !important;
}

.summary-table :deep(.ant-table-tbody > tr:hover > td) {
  background: rgba(14, 165, 233, 0.1) !important;
}

.summary-table :deep(.ant-table-row-expand-icon) {
  background: transparent;
  border-color: var(--border);
  color: var(--text2);
}

.expand-arrow {
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.expand-arrow:hover {
  color: #38bdf8;
}

.summary-table :deep(.ant-table-expanded-row > td) {
  background: rgba(15, 23, 42, 0.6) !important;
}

.summary-table :deep(.ant-table-cell-row-hover) {
  background: rgba(14, 165, 233, 0.08) !important;
}

.summary-table :deep(.ant-table-placeholder) {
  background: transparent !important;
}

.ratio-text {
  font-weight: 500;
  color: #e2e8f0;
}

.ratio-text.has-children {
  color: var(--primary);
}

/* ---------- 响应式 ---------- */
@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
