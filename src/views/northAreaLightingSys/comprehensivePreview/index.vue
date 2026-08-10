<template>
  <div class="north-lighting-overview">
    <!-- 统计卡片 -->
    <div class="stats-row" style="margin-bottom: 0.16rem">
      <div class="stat-card">
        <div class="stat-label">照明地块</div>
        <div class="stat-value" style="color: var(--accent)">{{ allSpaceList.length }}</div>
        <div class="stat-trend trend-up">
          <span>{{ stats.blockCoverage }} 覆盖</span>
        </div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">回路数</div>
        <div class="stat-value" style="color: var(--accent2)">{{ circuitCount }}</div>
        <div class="stat-trend trend-up">{{ onlineRate }} 在线率</div>
      </div>
      <div class="stat-card orange"> 
        <div class="stat-label">已开启回路数</div>
        <div class="stat-value" style="color: var(--accent2)">{{ openCircuitCount }} </div>
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
          <div class="map-shell">
            <MapView ref="mapViewRef" @light-marker-single-click="onLightMarkerSingleClick" />
          </div>
        </div>
      </div>

      <!-- 右列：一键控制 + 表单模式上下排列 -->
      <div class="main-right">
        <div class="card card-control">
          <div class="card-title">一键开关</div>
          <div style="display: flex; gap: 0.15rem; flex-wrap: wrap">
            <div class="control-box">
              <div style="font-size: 0.32rem; margin-bottom: 0.1rem">☀️</div>
              <div style="font-weight: 600; margin-bottom: 0.05rem">全区开灯</div>
              <div style="font-size: 0.12rem; color: var(--text2); margin-bottom: 0.15rem">开启所有地块照明</div>
              <button class="btn btn-success" style="width: 100%" @click="handleAllOn">全开</button>
            </div>
            <div class="control-box">
              <div style="font-size: 0.32rem; margin-bottom: 0.1rem">🌙</div>
              <div style="font-weight: 600; margin-bottom: 0.05rem">全区关灯</div>
              <div style="font-size: 0.12rem; color: var(--text2); margin-bottom: 0.15rem">关闭所有地块照明</div>
              <button class="btn btn-danger" style="width: 100%" @click="handleAllOff">全关</button>
            </div>
          </div>
        </div>

        <div class="card card-table">
          <div class="card-title">表单模式 - 地块运行状态</div>
          <table class="overview-table">
            <thead>
              <tr>
                <th>标签</th>
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
                  <button class="btn btn-sm btn-success" style="padding: 0.04rem 0.12rem; font-size: 0.12rem" @click="handleControlOn(item)">开</button>
                  <button class="btn btn-sm btn-danger" style="margin-left: 0.06rem; padding: 0.04rem 0.12rem; font-size: 0.12rem" @click="handleControlOff(item)">关</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 灯光详情弹框（点击地图标点打开：一键开关/监控视频，与 bigGis 详情模式标点弹框一致） -->
    <a-modal
      v-model:open="lightTabsModalVisible"
      :title="currentSpaceName + '-' + lightAreaName"
      :footer="null"
      width="400px"
      centered
      :zIndex="90000"
      class="space-modal"
      wrapClassName="space-modal"
      :bodyStyle="{ padding: '16px', background: '#0b1a2f' }"
      @cancel="onSpaceModalCancel"
    >
      <a-tabs type="card" class="video-tabs space-tabs">
        <!-- 1. 灯光控制（整合页签）：一键开关（上）→ 回路列表（下，左上侧展示已开启/总回路数） -->
        <a-tab-pane key="control" tab="一键开关">
          <div class="light-pane">
            <!-- 一键开关（最上边） -->
            <div class="pane-switch">
              <button class="icon-btn with-text" @click="handleLightAreaOn" title="全开">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
                <span class="btn-text">全开</span>
              </button>
              <button class="icon-btn dark-btn with-text" @click="handleLightAreaOff" title="全关">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <span class="btn-text">全关</span>
              </button>
            </div>
            <!-- 回路列表（最下边，左上侧展示已开启回路数/总回路数） -->
            <div class="pane-table">
              <div class="circuit-count-tag">
                <span class="stat-label">回路已开/回路总数</span>
                <span class="stat-value">
                  <span class="number highlight-text">{{ lightCircuitSummary.on }}</span>
                  /
                  <span class="number">{{ lightCircuitSummary.total }}</span>
                </span>
              </div>
              <a-spin :spinning="detailModalLoading" class="pane-spin">
                <template v-if="lightCircuitList.length">
                  <div class="circuit-vxe-table-wrap">
                    <vxe-table
                      :data="lightCircuitList"
                      height="320"
                      :row-config="{ keyField: '_key', height: 38 }"
                      :scroll-y="{ enabled: true }"
                    >
                      <vxe-column type="seq" title="序号" width="60" align="center"></vxe-column>
                      <vxe-column field="name" title="回路名称" min-width="130" show-overflow sortable></vxe-column>
                      <vxe-column field="electricCurrent" title="电流" min-width="50" show-overflow sortable></vxe-column>
                      <vxe-column field="status" title="状态" width="80" align="center" sortable>
                        <template #default="{ row }">
                          <span class="circuit-status" :class="row.status === '开启' ? 'is-on' : 'is-off'">
                            {{ row.status || '关闭' }}
                          </span>
                        </template>
                      </vxe-column>
                    </vxe-table>
                  </div>
                </template>
                <div v-else class="space-submenu-empty">暂无回路</div>
              </a-spin>
            </div>
          </div>
        </a-tab-pane>
        <!-- 2. 监控视频（与 bigGis 一致：写死地址前缀拼接 monitorAdr，不调接口） -->
        <a-tab-pane key="video" tab="监控视频">
          <div v-if="lightVideoUrl" class="video-modal-item">
            <VideoPlayer :url="lightVideoUrl" />
          </div>
          <div v-else class="space-submenu-empty">暂无监控视频</div>
        </a-tab-pane>
      </a-tabs>
    </a-modal>

    <!-- 统一二次确认弹框（提示样式：标题栏 + 信息图标 + 动作词高亮） -->
    <ConfirmModal ref="confirmModalRef" />
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed, onMounted } from 'vue';
  import MapView from './MapView.vue';
  import { useScreenScale } from '../useScreenScale';
  import { message } from 'ant-design-vue';
  import ConfirmModal from '../equipmentMonitoring/components/ConfirmModal.vue';
  import { getCircuitListApi } from '@/api/baseSettingBqZm';
  import { postSceneSwitchApi, getLightingPlanAPiNew, planDetailApiNew } from '@/api/equipmentMonitoring';
  import VideoPlayer from '../equipmentMonitoring/components/VideoPlayer.vue';

  // 大屏自适应：动态 rem 基准（1rem = 100px @1920），样式统一 rem + flex + vw/vh
  useScreenScale();
  import { getOverviewStatsApi, allOnApi, allOffApi, getAllSpaceApi, getAllCircuitApi, getSceneSpaceApi } from './comprehensivePreview.api';
  import { useMessage } from '/@/hooks/web/useMessage';

  const mapViewRef = ref<InstanceType<typeof MapView> | null>(null);

  // ==================== 灯光详情弹框（点击地图标点打开，与 bigGis 详情模式标点弹框一致） ====================
  // 监控平台 iframe 地址前缀（与设备监控页面保持一致），monitorAdr 为监控通道编码
  const MONITOR_BASE_URL = 'http://10.168.47.23:4000/index.html?id=';
  // 详情弹框显隐（点击标点且仅单条数据时打开）
  const lightTabsModalVisible = ref(false);
  // 详情弹框监控视频地址（点击标点时按 monitorAdr 拼接，不调接口）
  const lightVideoUrl = ref('');
  // 详情弹框回路列表（circuit/listPage 按 areaId 查询）
  const lightCircuitList = ref<any[]>([]);
  // 详情弹框当前标点的 areaId（全开/全关接口参数）
  const lightAreaId = ref('');
  // 详情弹框标题展示的区域名（取标点数据 areaName）
  const lightAreaName = ref('');
  // 当前弹框所属地块名（打开弹框时从标点带出）
  const currentSpaceName = ref('');
  // 回路列表加载状态
  const detailModalLoading = ref(false);

  /** 已开启/总回路数统计 */
  const lightCircuitSummary = computed(() => {
    const list = lightCircuitList.value;
    return {
      on: list.filter((c: any) => c.status === '开启').length,
      total: list.length,
    };
  });

  /** 统一二次确认弹窗（提示样式：标题栏“提示” + 蓝色信息图标 + 动作词高亮，同 equipmentMonitoring sceneConfirmModal） */
  const confirmModalRef = ref<InstanceType<typeof ConfirmModal> | null>(null);
  function showLightConfirm(opts: {
    content: string;
    okText?: string;
    onOk: () => void | Promise<void>;
  }) {
    confirmModalRef.value?.showModal(opts);
  }

  /** 标点点击（单条数据时触发）：打开灯光详情弹框 */
  function onLightMarkerSingleClick(data: any) {
    openLightTabsModal(data);
  }

  /** 打开灯光详情弹框（一键开关/监控视频），回路数据按 areaId 查询 circuit/listPage */
  async function openLightTabsModal(data: any) {
    const spaceName = data?.spaceName || '';
    const areaId = data?.id;
    // 标点无地块归属或 areaId 时回退到原灯光详情弹窗
    if (!spaceName || !areaId) {
      mapViewRef.value?.openLightDetail?.(data);
      return;
    }
    currentSpaceName.value = spaceName;
    lightTabsModalVisible.value = true;
    lightAreaId.value = String(areaId);
    lightAreaName.value = data?.areaName || '';
    lightVideoUrl.value = data?.monitorAdr ? MONITOR_BASE_URL + data.monitorAdr : '';
    detailModalLoading.value = true;
    try {
      // 回路数据：按 areaId 查询 circuit/listPage
      await loadLightCircuit(String(areaId));
    } finally {
      detailModalLoading.value = false;
    }
  }

  /** 按 areaId 查询地块回路列表（circuit/listPage），供弹框的回路概览与详情展示 */
  async function loadLightCircuit(areaId: string) {
    const res: any = await getCircuitListApi({ pageSize: 999, areaId });
    // 分页结构返回 records，兼容纯数组
    const list = Array.isArray(res)
      ? res
      : res?.records || res?.list || res?.result || res?.data || [];
    lightCircuitList.value = list.map((item: any, idx: number) => ({
      ...item,
      _key: item.id || item.circuitId || `light-${areaId}-${idx}`,
      name: item.circuitName || item.name || '回路' + (idx + 1),
    }));
  }

  /** 弹框关闭（含遮罩/关闭按钮）：清除成员列表激活高亮（列表保持展示） */
  function onSpaceModalCancel() {
    lightTabsModalVisible.value = false;
    mapViewRef.value?.clearMarkerListActive?.();
  }

  // ==================== 场景控制（与设备监控页场景配置同一逻辑：/plan/control） ====================
  // 进入页面先查询所有场景（/scene/listPage），再按固定场景 id 过滤出目标场景（relIds / relType 等），全开/全关时作为 /plan/control 参数
  const SCENE_ID = '2086280558308143106';
  const sceneInfo = ref<any>(null);

  /** 查询场景信息（/scene/listPage?pageNo=1&pageSize=999 全量查询后按场景 id 过滤） */
  async function loadSceneInfo() {
    try {
      const data: any = await getLightingPlanAPiNew({ pageNo: 1, pageSize: 999 });
      // 兼容分页结构（records/list/result/data）与纯数组返回
      const records = Array.isArray(data) ? data : (data?.records || data?.list || data?.result || data?.data || []);
      const target = (records as any[]).find((item: any) => String(item.id) === String(SCENE_ID));
      console.log('[preview] 场景列表:', records, '目标场景:', target);
      sceneInfo.value = target || null;
    } catch (error) {
      console.error('[preview] 查询场景信息失败:', error);
      sceneInfo.value = null;
    }
  }

  /** 场景全开/全关（与设备监控页场景配置的开启/关闭一致：postSceneSwitchApi → /plan/control） */
  function handleSceneSwitch(operationType: '开启' | '关闭') {
    const actionText = operationType === '开启' ? '全开' : '全关';
    if (!sceneInfo.value) {
      message.warning('场景信息未加载，无法执行' + actionText);
      return;
    }
    const sceneName = sceneInfo.value.planName || sceneInfo.value.name || SCENE_ID;
    showLightConfirm({
      content: `确定要 <strong class="tip-action">${actionText}</strong> 场景“${sceneName}”吗？`,
      onOk: async () => {
        try {
          await postSceneSwitchApi({
            operationType,
            relIds: sceneInfo.value.relIds,
            relType: sceneInfo.value.relType,
            sceneId: sceneInfo.value.id || SCENE_ID,
          });
          message.success(actionText + '成功');
          // 刷新回路列表：表格状态与左上侧“已开启回路数/总回路数”同步更新
          if (lightAreaId.value) {
            await loadLightCircuit(lightAreaId.value);
          }
        } catch (error) {
          console.error(actionText + '失败:', error);
          message.error(actionText + '失败，请重试');
        }
      },
    });
  }

  /** 详情弹框全开（调用 /plan/control，按场景控制） */
  function handleLightAreaOn() {
    handleSceneSwitch('开启');
  }

  /** 详情弹框全关（调用 /plan/control，按场景控制） */
  function handleLightAreaOff() {
    handleSceneSwitch('关闭');
  }

  const { createMessage } = useMessage();

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

  /** 所有地块数据（新接口字段：id / districtName / spaceIds） */
  const allSpaceList = ref<{ id: string; districtName: string; spaceIds?: any }[]>([]);

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

  /** 将接口返回的 spaceIds（逗号分隔字符串，如 "901,902"；或数组；或空字符串/空数组）解析为数字数组 */
  function parseSpaceIds(spaceIds: any): number[] {
    if (spaceIds == null) return [];
    const arr = Array.isArray(spaceIds)
      ? spaceIds
      : String(spaceIds)
          .replace(/[\[\]\s]/g, '')
          .split(',');
    return arr.map((v: any) => Number(v)).filter((n: number) => !isNaN(n) && n > 0);
  }

  /** 按 id 合并数组（保留顺序，id 相同只保留第一个；无 id 的项直接追加） */
  function mergeById(list: any[], incoming: any): any[] {
    if (!Array.isArray(incoming)) return list;
    const exists = new Set(list.map((i: any) => i?.id).filter((v: any) => v != null));
    for (const item of incoming) {
      if (item?.id == null || !exists.has(item.id)) {
        list.push(item);
        if (item?.id != null) exists.add(item.id);
      }
    }
    return list;
  }

  /** 从 getSceneSpaceApi 返回的 result 中取回路列表（circuits 为回路数组） */
  function getCircuitListFromRes(res: any): any[] {
    return Array.isArray(res?.circuits) ? res.circuits : [];
  }

  /** spaceId 级回路缓存（请求成功即写入，含空结果；同一 spaceId 被多个地块引用时只请求一次，与 bigGis 一致） */
  const circuitDataById = ref<Record<string, any[]>>({});
  /** spaceId 级请求中的 Promise（并发请求同一 spaceId 时等待同一次请求，避免重复） */
  const circuitDataPromiseById: Record<string, Promise<any[] | null>> = {};

  /** 获取某个 spaceId 的回路数据（/scene/space），带 spaceId 级缓存与请求中防重；成功（含空结果）返回并缓存，失败返回 null（不缓存，可重试） */
  async function fetchCircuitDataById(sid: number | string): Promise<any[] | null> {
    const key = String(sid)
    if (circuitDataById.value[key]) return circuitDataById.value[key]
    if (circuitDataPromiseById[key]) return circuitDataPromiseById[key]
    circuitDataPromiseById[key] = (async () => {
      try {
        const res: any = await getSceneSpaceApi(key)
        const circuits = res ? getCircuitListFromRes(res) : []
        circuitDataById.value[key] = circuits
        return circuits
      } catch (e) {
        console.error(`[preview] spaceId=${key} 回路数据请求失败:`, e)
        return null
      } finally {
        delete circuitDataPromiseById[key]
      }
    })()
    return circuitDataPromiseById[key]
  }

  /** 各地块回路数据（按地块名索引：spaceIds 循环调用 /scene/space 后按 id 合并的 circuits） */
  const spaceCircuitMap = ref<Record<string, any[]>>({});

  /** 加载各地块回路数据：与 bigGis 地块模式数据逻辑一致——
   *  不再用 district 接口返回的 spaceIds 字段关联，改为：
   *  scene/listPage 过滤出有 tagId 的场景 → 并行查详情（/scene/detail）取 areaList.space，
   *  按 areaList 的 districtId 归属回各地块（districtId 匹配不上时按场景 tagId 兑底归属），
   *  再按归属的 spaceIds 循环调用 /scene/space 获取回路（spaceId 级去重，同一 spaceId 只请求一次）并按 id 合并 */
  async function loadSpaceCircuitData() {
    // 1. 查询所有场景（scene/listPage），只保留有 tagId 的场景（无 tagId 的场景过滤掉）
    let tagScenes: any[] = []
    try {
      const data: any = await getLightingPlanAPiNew({ pageNo: 1, pageSize: 999 })
      // 兼容分页结构（records/list/result/data）与纯数组返回
      const records = Array.isArray(data)
        ? data
        : (data?.records || data?.list || data?.result || data?.data || [])
      tagScenes = (records as any[]).filter((item: any) => {
        const t = item?.tagId ?? item?.tagIds
        return t != null && t !== ''
      })
    } catch (error) {
      console.error('[preview] 查询场景列表失败:', error)
    }

    // 2. 并行查询所有场景详情（一次发起），取 areaList 下的 space 字段：按 districtId 归属各地块（键统一转字符串，兼容数字/字符串）
    const districtSpaceMap = new Map<string, Set<number>>()
    // 每个 spaceId 关联的场景 tagId（districtId 匹配不上时按场景所属片区兑底归属，避免漏请求）
    const spaceIdToTagIds = new Map<number, Set<string>>()
    console.log(`[preview] 并行查询 ${tagScenes.length} 个场景详情:`, tagScenes.map((s: any) => s.id))
    await Promise.all(
      tagScenes.map(async (scene: any) => {
        try {
          const detail: any = await planDetailApiNew({ id: scene.id })
          const areaList = Array.isArray(detail?.areaList) ? detail.areaList : []
          areaList.forEach((area: any) => {
            const sid = Number(area?.space)
            if (isNaN(sid) || sid <= 0) return
            const did = area?.districtId ?? area?.tagId
            if (did != null && did !== '') {
              const didKey = String(did)
              if (!districtSpaceMap.has(didKey)) districtSpaceMap.set(didKey, new Set())
              districtSpaceMap.get(didKey)!.add(sid)
            }
            // 记录场景自身 tagId（区域归属 districtId 匹配不上时，按场景所属片区兑底归属）
            const sceneTagId = scene?.tagId ?? area?.tagId
            if (sceneTagId != null && sceneTagId !== '') {
              if (!spaceIdToTagIds.has(sid)) spaceIdToTagIds.set(sid, new Set())
              spaceIdToTagIds.get(sid)!.add(String(sceneTagId))
            }
          })
        } catch (error) {
          console.error(`[preview] 场景详情获取失败(场景 ${scene.id}):`, error)
        }
      }),
    )

    // 3. 各地块按归属的 spaceIds 请求 /scene/space 获取回路（spaceId 级去重），按 id 合并
    for (const space of allSpaceList.value) {
      const base = Array.from(districtSpaceMap.get(String(space.id)) || [])
      // 兑底：detail 里引用的 spaceId 若未按 districtId 归属，再按场景 tagId 补挂到对应地块
      const tagMatched = Array.from(spaceIdToTagIds.entries())
        .filter(([, tags]) => tags.has(String(space.id)))
        .map(([sid]) => sid)
      const spaceIds = Array.from(new Set([...base, ...tagMatched]))
      if (spaceIds.length === 0) {
        console.warn(`[preview] 地块 [${space.districtName}] 无归属 spaceIds，跳过`)
        continue
      }
      const merged: any[] = []
      await Promise.all(
        spaceIds.map(async (sid) => {
          const circuits = await fetchCircuitDataById(sid)
          if (circuits) mergeById(merged, circuits)
        }),
      )
      spaceCircuitMap.value[space.districtName] = merged
    }
  }

  /** 按地块聚合的表格数据 */
  const spaceTableData = computed(() =>
    allSpaceList.value.map((space) => {
      const circuits = spaceCircuitMap.value[space.districtName] || [];
      const onlineCircuits = circuits.filter((c: any) => c.comstat === '在线');
      const openCircuits = circuits.filter((c: any) => c.status === '开启');
      const closeCircuits = circuits.filter((c: any) => c.status === '关闭');
      const todayEnergy = onlineCircuits.reduce((sum: number, c: any) => {
        const variation = Math.floor(Math.random() * 11) - 5;
        return sum + 18 + variation;
      }, 0);
      return {
        spaceId: space.id,
        spaceName: space.districtName,
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
      // 兼容分页结构（records/list/result/data）与纯数组返回
      allSpaceList.value = Array.isArray(res)
        ? res
        : (res?.records || res?.list || res?.result || res?.data || []);
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

  /** 全区开灯（/plan/control 场景级控制，参数与场景开关一致） */
  function handleAllOn() {
    if (!sceneInfo.value) {
      createMessage.warning('场景信息未加载，无法执行全区开灯');
      return;
    }
    showLightConfirm({
      content: '确定要 <strong class="tip-action">执行全区开灯操作</strong> 吗？',
      onOk: async () => {
        try {
          await allOnApi({
            operationType: '开启',
            relIds: sceneInfo.value.relIds,
            relType: sceneInfo.value.relType,
            sceneId: sceneInfo.value.id || SCENE_ID,
          });
          createMessage.success('全区开灯指令已下发');
        } catch {
          createMessage.error('操作失败');
        }
      },
    });
  }

  /** 全区关灯（/plan/control 场景级控制，参数与场景开关一致） */
  function handleAllOff() {
    if (!sceneInfo.value) {
      createMessage.warning('场景信息未加载，无法执行全区关灯');
      return;
    }
    showLightConfirm({
      content: '确定要 <strong class="tip-action">执行全区关灯操作</strong> 吗？',
      onOk: async () => {
        try {
          await allOffApi({
            operationType: '关闭',
            relIds: sceneInfo.value.relIds,
            relType: sceneInfo.value.relType,
            sceneId: sceneInfo.value.id || SCENE_ID,
          });
          createMessage.success('全区关灯指令已下发');
        } catch {
          createMessage.error('操作失败');
        }
      },
    });
  }

  /** 地块开灯控制（/plan/control 场景级控制，与设备监控页一致） */
  function handleControlOn(item: any) {
    if (!sceneInfo.value) {
      createMessage.warning('场景信息未加载，无法执行开启');
      return;
    }
    // 聚焦地图到该地块
    mapViewRef.value?.focusToSpace(item.spaceName);
    showLightConfirm({
      content: `确定要 <strong class="tip-action">开启</strong> 【${item.spaceName}】的灯光吗？`,
      onOk: async () => {
        try {
          await postSceneSwitchApi({
            operationType: '开启',
            relIds: sceneInfo.value.relIds,
            relType: sceneInfo.value.relType,
            sceneId: sceneInfo.value.id || SCENE_ID,
          });
          createMessage.success(`${item.spaceName} 开灯指令已下发`);
        } catch {
          createMessage.error('操作失败');
        }
      },
    });
  }

  /** 地块关灯控制（/plan/control 场景级控制，与设备监控页一致） */
  function handleControlOff(item: any) {
    if (!sceneInfo.value) {
      createMessage.warning('场景信息未加载，无法执行关闭');
      return;
    }
    // 聚焦地图到该地块
    mapViewRef.value?.focusToSpace(item.spaceName);
    showLightConfirm({
      content: `确定要 <strong class="tip-action">关闭</strong> 【${item.spaceName}】的灯光吗？`,
      onOk: async () => {
        try {
          await postSceneSwitchApi({
            operationType: '关闭',
            relIds: sceneInfo.value.relIds,
            relType: sceneInfo.value.relType,
            sceneId: sceneInfo.value.id || SCENE_ID,
          });
          createMessage.success(`${item.spaceName} 关灯指令已下发`);
        } catch {
          createMessage.error('操作失败');
        }
      },
    });
  }

  onMounted(() => {
    // 进入页面先查询场景信息（固定场景 id），供弹框全开/全关的 /plan/control 控制使用
    loadSceneInfo();
    loadStats();
    loadAllSpace().then(() => loadSpaceCircuitData());
    loadAllCircuit();
  });
</script>

<style lang="less">
  @import './index.less';
</style>
