<template>
  <div id="mapContainer" class="map-container"></div>

  <!-- POI 详情弹窗 -->
  <el-dialog
    v-model="dialogVisible"
    :title="currentLight?.name || '详情'"
    width="520px"
    top="5vh"
    :close-on-click-modal="false"
    destroy-on-close
    class="dark-dialog"
  >
    <template v-if="currentLight">
      <div class="detail-body">
        <!-- 视频播放区域（iframe 形式，monitorAdr 作为参数拼接地址） -->
        <div v-if="currentLight.videoUrl" class="video-wrapper">
          <VideoPlayer :url="currentLight.videoUrl" />
        </div>
        <div v-else class="video-placeholder">
          <el-icon :size="48" color="#dcdfe6">
            <VideoCamera />
          </el-icon>
          <p>暂无监控视频</p>
        </div>

        <!-- 设备信息 -->
        <el-descriptions :column="2" border size="small" class="info-table">
          <el-descriptions-item label="地块名称">{{ currentLight.spaceName }}</el-descriptions-item>
          <el-descriptions-item label="区域名称">
              {{ currentLight.areaName }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </template>
    <template #footer>
      <el-button class="btn-dark" @click="dialogVisible = false">关闭</el-button>
      <el-button
        type="primary"
        :loading="lightingLoading"
        @click="toggleLight"
      >
        {{ currentLight?.status === '打开' ? '关灯' : '开灯' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { loadMapScripts } from '/@/components/map/loadMapScripts'
import { getAllAreaApi, getAllCircuitApi, openAreaApi, closeAreaApi } from './comprehensivePreview.api'
import { VideoCamera } from '@element-plus/icons-vue'
import VideoPlayer from '../equipmentMonitoring/components/VideoPlayer.vue'

// 单条标点点击事件：父组件根据当前模式决定打开详情弹框（与 bigGis/map.vue 详情模式标点行为一致）
const emit = defineEmits<{ (e: 'light-marker-single-click', data: any): void }>()

// 监控平台 iframe 地址前缀（与设备监控页面保持一致），monitorAdr 为监控通道编码
const MONITOR_BASE_URL = 'http://10.168.47.23:4000/index.html?id=';
import lightOnImg from '/@/assets/images/lightOn.png'
import lightOffImg from '/@/assets/images/lightOff.png'

let map = ref(null);
// 当前展开的成员列表（点击地图空白时自动关闭）
let openedListEl: HTMLElement | null = null;
// 展开列表时对应 marker 容器的原始 z-index（关闭时还原）
let openedMarkerEl: HTMLElement | null = null;
let openedMarkerOriginalZ: string = '';
// 展开列表的滚轮拦截处理函数（收起时移除）
let openedListWheelHandler: ((e: WheelEvent) => void) | null = null;

/**
 * 关闭当前展开的成员列表
 */
function closeAllMarkerLists() {
  if (openedListEl) {
    // 移除滚轮拦截监听，避免内存泄漏
    if (openedListWheelHandler) {
      openedListEl.removeEventListener('wheel', openedListWheelHandler, true);
      openedListWheelHandler = null;
    }
    openedListEl.style.display = 'none';
    // 清除边界适配残留的内联样式（top/bottom/transform/maxHeight），下次展开重新计算
    openedListEl.style.top = '';
    openedListEl.style.bottom = '';
    openedListEl.style.maxHeight = '';
    openedListEl.style.transform = '';
    openedListEl = null;
  }
  // 还原之前展开的 marker 容器 z-index
  if (openedMarkerEl) {
    openedMarkerEl.style.zIndex = openedMarkerOriginalZ;
    openedMarkerEl = null;
    openedMarkerOriginalZ = '';
  }
  // 清除列表项激活高亮
  document.querySelectorAll('.marker-list-item.is-active').forEach((li) => li.classList.remove('is-active'));
}

/**
 * 列表滚轮拦截：鼠标悬停在列表内滚动时只滚动列表本身，不穿透到地图触发缩放
 * - 捕获阶段拦截，阻止 wheel 事件到达地图容器的监听器
 * - 列表滚动到顶部/底部或无需滚动时，阻止默认行为（防止地图缩放）
 */
function bindListWheelGuard(listEl: HTMLElement) {
  if (openedListWheelHandler) {
    listEl.removeEventListener('wheel', openedListWheelHandler, true);
    openedListWheelHandler = null;
  }
  const handler = (e: WheelEvent) => {
    e.stopPropagation();
    const { scrollTop, scrollHeight, clientHeight } = listEl;
    const canScroll = scrollHeight > clientHeight;
    const atTop = scrollTop <= 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
    if (!canScroll || (e.deltaY > 0 && atBottom) || (e.deltaY < 0 && atTop)) {
      e.preventDefault();
    }
  };
  listEl.addEventListener('wheel', handler, { passive: false, capture: true });
  openedListWheelHandler = handler;
}

/**
 * 清除成员列表项的激活高亮（列表保持展开展示），供父组件在弹框关闭时调用
 */
const clearMarkerListActive = () => {
  document.querySelectorAll('.marker-list-item.is-active').forEach((li) => li.classList.remove('is-active'));
};

/**
 * 收起当前展开的成员列表（供父组件需要时调用）
 */
const collapseMarkerList = () => {
  closeAllMarkerLists();
};

/**
 * 点击地图空白时自动关闭展开的成员列表（捕获阶段）：
 * - 标点主体/列表项点击不触发（各自处理）
 * - 弹框（含遮罩与 X 关闭按钮，teleport 到 body）点击不触发，弹框打开/关闭期间列表保持展示
 * - 点击地图其他空白区域时收起列表
 */
function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  // 点击列表项：由列表项自己处理，不在此关闭
  if (target.closest('.marker-list-item')) return;
  // 点击标点主体：由标点主体自己处理 toggle，不在此关闭
  if (target.closest('.light-marker')) return;
  // 点击弹框内部（.ant-modal-wrap 含遮罩与 X，.el-dialog 为原灯光详情弹窗）：不在此关闭
  if (target.closest('.ant-modal-wrap') || target.closest('.el-dialog')) return;
  closeAllMarkerLists();
}
const buildingInfo = ref<unknown[]>([]);
let marker = ref(null);
let flid = null;
const windowWidth = window.outerWidth;
// 根据屏幕宽度设置初始缩放级别
let zoomNum: number;
if (windowWidth > 1439) {
  zoomNum = 15.95; // 大屏
} else if (windowWidth > 1200) {
  zoomNum = 14.45; // 中屏
} else {
  zoomNum = 15.95; // 小屏
}
console.log(zoomNum);
// 配置参数
const buildingID = "B000A11DMD";
const token = "572d6c0c869b3e2ce85a63ab2a1d5a0a";
const mapConfig = {
  token: token,
  appName: "HelloWorld", //开发者应用名称
  projectPath: "",
  baseMapPath: "/map/",
  spriteUrl: `${window.location.origin}/map/assets/images/default_markers`,
  scenePath: "/data/",
  buildingId: buildingID,
  defaultCenter: { lon: 116.162, lat: 39.912 },
  defaultZoomLevel: zoomNum,
  showOutDoorMap: false,
  mapDataPath: "/data/572d6c0c869b3e2ce85a63ab2a1d5a0a/{{bdid}}/",
};
// 初始化地图
const initMap = async () => {
  try {
    map.value = await new DaxiMap.Map("mapContainer", mapConfig);
    map.value.on("loadComplete", async () => {
      console.log("地图加载完成");
      // 设置缩放范围：最小10级，最大23级
      map.value.setZoomLevelRange(10, 23);
      buildingInfo.value = map.value.getBuildingInfo(buildingID);
      // 获取当前楼层ID（标点需绑定楼层场景，flid 为空会导致 SDK addToMap 报错）
      await initFloorId();
      // 等待地图瓦片渲染完成后再添加标点，避免标点先于地图出现
      setTimeout(async () => {
        await loadLightingData();
        AddLightingMarker();
        // 初始化时聚焦到金安桥
        map.value.easeTo({
          bdid: buildingID,
          lon: 116.15521113890562,
          lat: 39.924386114869634-0.0036,
          floorId: flid,
        });
      }, 800);
    });
    console.log("地图初始化成功");
  } catch (error) {
    console.error("地图初始化失败:", error);
  }
};

/**
 * 获取楼层ID，带重试机制和硬编码兜底
 */
const DEFAULT_FLID = 'DX0003640110100001'; // 首钢园 F1 楼层ID（来自 map.json 配置）

async function initFloorId(retryCount = 0) {
  // 方式1：通过 SDK API 获取
  flid = map.value.getCurrentFloorId();
  console.log(flid, 'flid (getCurrentFloorId)');

  if (!flid) {
    // 方式2：通过楼层列表获取
    const floors = map.value.getCurrentFloorsInfo();
    console.log(floors, 'floors (getCurrentFloorsInfo)');
    flid = floors && floors.length ? floors[0].flid : null;
  }

  if (!flid && retryCount < 3) {
    // 方式3：重试（楼层数据可能还未加载完成）
    console.log(`楼层ID为空，第 ${retryCount + 1} 次重试...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return initFloorId(retryCount + 1);
  }

  if (!flid) {
    // 方式4：硬编码兜底
    flid = DEFAULT_FLID;
    console.warn('楼层ID获取失败，使用默认值:', flid);
  }

  console.log('最终楼层ID:', flid);
}

// ==================== 灯光标点 ====================
const lightingData = ref<any[]>([]);

/** 加载标点数据 */
async function loadLightingData() {
  try {
    const res = await getAllAreaApi();
    console.log(res);
    lightingData.value = Array.isArray(res) ? res : [];
  } catch {
    lightingData.value = [];
  }
}
const lightingMarkerArr = ref<any[]>([]);
const dialogVisible = ref(false);
const currentLight = ref<any>(null);
const lightingLoading = ref(false);

const statusTagType = computed(() => {
  if (!currentLight.value) return 'info';
  return currentLight.value.status === '打开' ? 'success' : 'info';
});

// 标记图标：type=1 泛光照明；type!=1 区域照明
// 区域照明暂无专用图标，暂时复用泛光照明图标，后续可替换
const lightOn = lightOnImg;
const lightOff = lightOffImg;
const areaLightOn = lightOnImg;
const areaLightOff = lightOffImg;



/**
 * 点击后控制地图缩放（按窗口宽度分级）
 */
const setMapZoom = () => {
  if (!map.value) return;
  map.value.setZoom(
    1200 < windowWidth && windowWidth < 1440
      ? 14.8
      : windowWidth > 1439
        ? 16.5
        : 18.5
  );
};

/**
 * 点击后控制地图聚焦到指定灯光点位
 */
const focusMapTo = (item: any) => {
  if (!map.value || !item) return;
  // location 格式为 "lng,lat"
  const [lng, lat] = (item.location || '').split(',');
  if (!lng || !lat) return;
  map.value.easeTo({
    bdid: buildingID,
    lon: lng,
    lat: lat,
    floorId: flid,
  });
};

/**
 * 视口边界适配：列表展开后自动调整位置/高度，避免靠近屏幕边缘时被截断。
 * 边界基准 = 地图容器（#mapContainer，overflow:hidden）可视区域：
 * - 列表展开不能超出地图容器顶部/底部/左右（超出即被容器裁剪遮挡）
 * - 标点到达临界点时自动切换展开方向（上方放不下切下方，下方放不下回上方）
 * - 空间不足时压缩高度（>6 条限高滚动；≤6 条仅当两侧都放不下时才压缩，避免被遮挡）
 */
function adjustMarkerListPosition(el: HTMLElement, listEl: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const MARGIN = 8;
  const GAP = 4;
  // 视觉图标（按钮）约占容器上部 40%（lightOn/lightOff 两图比例一致），其余为细线+基座区
  const ICON_BUTTON_RATIO = 0.4;
  // 边界基准 = 地图容器可视区域（容器 overflow:hidden，超出即被裁剪；地图容器本身已在页面 header/统计栏下方）
  const mapEl = document.getElementById('mapContainer');
  const mapRect = mapEl ? mapEl.getBoundingClientRect() : null;
  const topBound = mapRect ? mapRect.top + MARGIN : MARGIN;
  const bottomBound = mapRect ? mapRect.bottom - MARGIN : vh - MARGIN;
  const leftBound = mapRect ? mapRect.left + MARGIN : MARGIN;
  const rightBound = mapRect ? mapRect.right - MARGIN : vw - MARGIN;
  // display 已置为 block 后再测量实际尺寸
  const listW = listEl.offsetWidth;
  const listH = listEl.offsetHeight;
  // 滚动阈值：6 条以内完整展示（不出现滚动条），超过 6 条才限高滚动
  const itemEls = listEl.querySelectorAll<HTMLElement>('.marker-list-item');
  const headerH = listEl.querySelector<HTMLElement>('.marker-list-header')?.offsetHeight || 0;
  const itemH = itemEls.length > 0 ? (itemEls[0].offsetHeight || 0) : 0;
  // 内容自然总高：直接用 scrollHeight 实测（含列表底部 padding，避免估算偏矮几像素导致误出滚动条）
  const fullListH = listEl.scrollHeight;

  // 水平偏移（dx > 0 右移、dx < 0 左移，叠加在默认的 -50% 居中之上），以地图容器左右边界为准
  const centerX = rect.left + rect.width / 2;
  let dx = 0;
  if (centerX - listW / 2 < leftBound) {
    dx = leftBound - (centerX - listW / 2);
  } else if (centerX + listW / 2 > rightBound) {
    dx = rightBound - (centerX + listW / 2);
  }

  // 垂直：优先选择能完整容纳列表的一侧（标点临界时自动切换方向），两侧都放不下时选空间更足的一侧
  const spaceAbove = rect.top - topBound; // 标点顶部 → 地图容器顶部 可用高度
  const spaceBelow = bottomBound - rect.bottom - GAP; // 标点底部 → 地图容器底部 可用高度
  const fitAbove = spaceAbove >= fullListH;
  const fitBelow = spaceBelow >= fullListH;
  let openBelow: boolean;
  if (fitBelow && !fitAbove) openBelow = true;
  else if (fitAbove) openBelow = false;
  else openBelow = spaceBelow > spaceAbove;

  let maxH = listH;
  let dy = 0;
  if (openBelow) {
    // 下方展开：上移使列表顶边对齐视觉图标（按钮）底部，紧贴标点
    listEl.style.top = '100%';
    listEl.style.bottom = 'auto';
    dy = -(el.offsetHeight * (1 - ICON_BUTTON_RATIO));
    maxH = Math.min(listH, spaceBelow - MARGIN);
  } else {
    listEl.style.top = 'auto';
    listEl.style.bottom = '100%';
    maxH = Math.min(listH, spaceAbove - MARGIN);
  }
  // 超过 6 条：限制为表头 + 6 行高度（空间更小时按空间），多出的条目滚动查看；
  // 6 条以内：空间足够时完整展示（不出现滚动条），临界点空间不足时按空间压缩，避免被容器裁剪遮挡
  const finalMaxH =
    itemEls.length > 6
      ? Math.min(Math.max(60, maxH - 6), headerH + itemH * 6)
      : Math.max(60, Math.min(maxH - 6, fullListH));
  listEl.style.maxHeight = `${finalMaxH}px`;
  listEl.style.transform = `translate(-50%, ${dy}px) translateX(${dx}px)`;
}

/**
 * 标点主体点击：
 * - 成员数 >1：第一次点击展示成员列表，再次点击收起
 * - 仅 1 条：通知父组件打开详情弹框
 */
const handleMarkerMainClick = (data: any, group: any[]) => {
  if (group.length > 1) {
    const el = document.getElementById(`light-${String(data.type)}-${String(data.id)}`);
    const listEl = el?.querySelector<HTMLElement>('.marker-list');
    if (listEl) {
      // 关闭其他已展开的列表（同时还原它们的 marker z-index）
      closeAllMarkerLists();
      // 切换当前列表显隐
      const isHidden = listEl.style.display === 'none';
      listEl.style.display = isHidden ? 'block' : 'none';
      openedListEl = isHidden ? listEl : null;
      // 展开时将 marker 容器（含 SDK wrapper）提升到最高层级，确保弹框列表不被其他标点/地图文字遮挡
      if (isHidden && el) {
        const wrapper = (el.parentElement && el.parentElement !== document.body) ? el.parentElement : el;
        openedMarkerEl = wrapper;
        openedMarkerOriginalZ = wrapper.style.zIndex;
        wrapper.style.zIndex = '60000';
        // 拦截列表内滚轮事件，避免穿透到地图触发缩放
        bindListWheelGuard(listEl);
        // 展开后做视口边界适配，避免列表靠近屏幕边缘时被截断
        adjustMarkerListPosition(el, listEl);
      }
    }
    return;
  }
  // 仅 1 条：通知父组件打开详情弹框
  emit('light-marker-single-click', data);
};

/**
 * 自定义标记：基于 DaxiMap.DXMapMarker，支持自定义 DOM
 */
const customizeMarker = (
  elDom: string,
  lat: string,
  lng: string,
  text: string,
  data: any,
  group: any[] = [],
  domId: string = ''
) => {
  if (!map.value) return null;
  const markerInfo = {
    bdid: buildingID, // 楼栋ID
    text,
    lon: parseFloat(lng),
    lat: parseFloat(lat),
    floorId: flid, // 楼层ID（必须有效，否则 SDK addToMap 内部报错）
    dom: elDom,
  };
  if (!flid) {
    console.warn('当前无有效楼层ID，跳过标记:', text);
    return null;
  }
  try {
    const marker = new DaxiMap.DXMapMarker();
    marker.initialize(map.value, markerInfo, {
      anchor: 'bottom',
      onClick: () => handleMarkerMainClick(data, group),
    });
    marker.addToMap();
    // 成员列表项点击：保持列表展开并高亮当前项，通知父组件打开弹框（阻止冒泡，避免触发主标点点击逻辑）
    if (domId && group.length) {
      const el = document.getElementById(domId);
      el?.addEventListener('click', (e) => {
        const li = (e.target as HTMLElement)?.closest?.('.marker-list-item');
        if (!li) return;
        e.stopPropagation();
        // 切换激活高亮：弹框打开期间列表保持激活，关闭后由父组件调用 clearMarkerListActive 清除
        const listEl = el.querySelector<HTMLElement>('.marker-list');
        listEl?.querySelectorAll('.marker-list-item.is-active').forEach((o) => o.classList.remove('is-active'));
        li.classList.add('is-active');
        const gid = li.getAttribute('data-id');
        const gtype = li.getAttribute('data-type');
        const target = group.find(
          (g) => String(g.id) === gid && String(g.type) === gtype
        );
        if (target) emit('light-marker-single-click', target);
      });
    }
    return marker;
  } catch (error) {
    console.error('标点创建异常:', text, '坐标:', lng, lat, '数据:', data, '错误:', error);
    return null;
  }
};

/**
 * 清除单个标记
 */
const clearMarker = (marker: any) => {
  if (!marker) return;
  try {
    marker.removeFromMap && marker.removeFromMap();
  } catch (error) {
    console.warn('移除标记失败:', error);
  }
};

/**
 * 根据单个设备数据生成对应的标记 DOM
 * @param forceOff 统一先熄灭，亮灭状态随后由 getAllCircuitApi 回路数据驱动（避免双状态源不一致）
 */
function buildMarkerDom(item: any, group: any[] = [], forceOff = false): string {
  let lightIcon: string;
  if (forceOff || item.status === '关闭') {
    lightIcon = item.type == 1 ? lightOff : areaLightOff;
  } else {
    lightIcon = item.type == 1 ? lightOn : areaLightOn;
  }
  // 统一 type/id 为字符串，避免数字与字符串混用导致 DOM id 碰撞
  const domId = `light-${String(item.type)}-${String(item.id)}`;
  // 标点成员列表（点击标点主体时切换展示，点击某一项打开对应设备详情），列表顶部展示“区域名称”表头；
  // 超过 6 条时加 marker-list-many 类（CSS 限高滚动），6 条以内不加（CSS 默认完整展示，不出现滚动条）
  const listItems = group
    .map(
      (g) =>
        `<div class="marker-list-item" data-id="${String(g.id)}" data-type="${String(g.type)}">${g.areaName || '灯光'}</div>`
    )
    .join('');
  const listHtml = listItems
    ? `<div class="marker-list${group.length > 6 ? ' marker-list-many' : ''}" style="display: none;">
      <div class="marker-list-header">区域名称</div>
      ${listItems}
    </div>`
    : '';
  // 同坐标成员个数徽标（大于 1 时展示）
  const badgeHtml =
    group.length > 1
      ? `<span class="marker-count-badge" style="
          position: absolute;
          top: 2px;
          right: 2px;
          background: #0ea5e9;
          color: #ffffff;
          font-size: 10px;
          font-weight: 600;
          line-height: 16px;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          border-radius: 8px;
          text-align: center;
          box-sizing: border-box;
          z-index: 20;
        ">${group.length}</span>`
      : '';
  return `<div class="light-marker" id="${domId}" style="
    width: 50px;
    height: 100px;
    background-image: url('${lightIcon}');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center top;
    position: relative;
    opacity: 1;
  ">
    ${badgeHtml}
    ${listHtml}
  </div>`;
}

/**
 * 在地图上标记所有灯光点位
 */
async function AddLightingMarker() {
  if (!map.value) return;
  // 1. 清除旧标记
  lightingMarkerArr.value.forEach((item) => {
    clearMarker(item);
  });
  lightingMarkerArr.value = [];

  // 2. 按坐标分组：同坐标的多个标点合并为一个标点，hover 时展示成员列表
  const locGroupMap = new Map<string, any[]>();
  lightingData.value.forEach((item) => {
    if (!item.location) return;
    const [lng, lat] = item.location.split(',');
    if (!lng || !lat || isNaN(parseFloat(lng)) || isNaN(parseFloat(lat))) return;
    const key = String(item.location).trim();
    if (!locGroupMap.has(key)) locGroupMap.set(key, []);
    locGroupMap.get(key)!.push(item);
  });

  // 2.1 坐标点 -> 标点信息映射：同坐标合并后，收集该坐标关联的全部 areaId（用于后续按回路数据点亮标点）
  // 空间复杂度 O(k)（k=有坐标标点数）；标点 DOM id = light-{type}-{id}，其中 id 即 areaId
  const areaIdByMarker = new Map<string, { domId: string; type: any; areaIds: string[] }>();
  locGroupMap.forEach((group, locKey) => {
    const main = group[0];
    const areaIds = new Set<string>();
    group.forEach((g) => {
      if (g.id !== undefined && g.id !== null && g.id !== '') areaIds.add(String(g.id));
    });
    areaIdByMarker.set(locKey, {
      domId: `light-${String(main.type)}-${String(main.id)}`,
      type: main.type,
      areaIds: Array.from(areaIds),
    });
  });

  // 3. 遍历数据，为有经纬度的点位生成标记（同坐标合并为一个标点）
  let markerFail = 0;
  const handledLoc = new Set<string>();
  lightingData.value.forEach((item) => {
    if (!item.location) return;
    const [lng, lat] = item.location.split(',');
    if (!lng || !lat || isNaN(parseFloat(lng)) || isNaN(parseFloat(lat))) return;

    const locKey = String(item.location).trim();
    const group = locGroupMap.get(locKey) || [item];

    // 同坐标只创建一个标点，其余成员合并进 hover 列表
    if (handledLoc.has(locKey)) return;
    handledLoc.add(locKey);

    // 组内第一条作为主标点
    const main = group[0];
    const domId = `light-${String(main.type)}-${String(main.id)}`;

    // 统一先熄灭：标点亮灭状态由 getAllCircuitApi 的回路数据驱动（避免双状态源不一致）
    const elDom = buildMarkerDom(main, group, true);
    const marker = customizeMarker(elDom, lat, lng, main.areaName || '泛光照明', main, group, domId);
    if (!marker) {
      markerFail++;
      console.warn('标点创建失败:', main.areaName, '坐标:', lng, lat);
    }
    lightingMarkerArr.value.push(marker);
  });
  if (markerFail) console.warn(`标点创建失败 ${markerFail} 条`);

  // 等待标点 DOM 渲染完成后，按屏幕 y 坐标排序层级（前面的盖住后面的）
  setTimeout(() => {
    sortMarkerZByY();
    // 每次重新请求最新回路数据后点亮标点（不做缓存，保证状态最新）
    lightMarkersByCircuitStatus(areaIdByMarker);
  }, 300);
}

/**
 * 按屏幕 y 坐标排序标点层级：
 * - y 越大（越靠下/越靠前）z-index 越高，前面的标点盖住后面的
 * - 基数 100 + 排名
 * - 弹框列表 .marker-list 的 z-index 恒高于所有标点（样式层已设 10000）
 *
 * 重要：DaxiMap SDK 为每个 marker 创建一个外层 wrapper 容器，wrapper 才是真正的
 * 叠放上下文。直接给 .light-marker（内层）设 z-index 容易被外层 wrapper 覆盖，
 * 因此优先操作 wrapper，找不到时退化到 .light-marker 本身。
 */
function sortMarkerZByY() {
  if (!document) return;
  const markers: { el: HTMLElement; y: number }[] = [];
  document.querySelectorAll<HTMLElement>('.light-marker').forEach((el) => {
    // 优先取外层 SDK wrapper 容器（如果有），否则用内层
    const parent = el.parentElement as HTMLElement | null;
    const wrapper = parent && parent.contains(el) && parent !== document.body ? parent : el;
    // 跳过展开列表中的容器（展开时由 handleMarkerMainClick 提升到 60000，避免重新排序覆盖其层级）
    if (wrapper.style.zIndex === '60000') return;
    const rect = wrapper.getBoundingClientRect();
    markers.push({ el: wrapper, y: rect.top + rect.height / 2 });
  });
  // 按 y 升序排序，y 大（靠下/前面）→ 分配更高 z-index
  markers.sort((a, b) => a.y - b.y);
  markers.forEach((m, index) => {
    // 基础 100 + 排名，确保前面的（y 大）盖住后面的
    m.el.style.zIndex = String(100 + index);
  });
}

/**
 * 按 getAllCircuitApi 回路数据点亮标点（性能优化）：
 * 1. 每次重新请求 getAllCircuitApi，不做缓存（保证标点状态为最新）；
 * 2. 单次遍历回路数组（O(m)），用 Set 以 O(1) 收集 areaId -> 是否有开启回路；
 * 3. 遍历坐标标点（O(k)），任一组内 areaId 有开启回路即点亮（some 短路，发现即停）；
 * 4. DOM 用 getElementById O(1) 定位（标点 id 即 areaId），不做全量 DOM 扫描。
 */
async function lightMarkersByCircuitStatus(
  areaIdByMarker: Map<string, { domId: string; type: any; areaIds: string[] }>
) {
  if (!areaIdByMarker.size) return;

  // 1. 重新请求最新回路状态（不做缓存，保证标点亮灭反映最新数据）
  let circuits: any[] = [];
  try {
    const res: any = await getAllCircuitApi();
    circuits = Array.isArray(res) ? res : [];
  } catch (e) {
    console.error('[MapView] 获取全部回路数据失败，标点保持熄灭:', e);
    return;
  }
  if (!circuits.length) return;

  // 2. 单次遍历回路数组，收集“有开启回路”的 areaId 集合（status === '开启'，Set 去重 O(1)）
  const onAreaIds = new Set<string>();
  for (const c of circuits) {
    if (!c || c.status !== '开启') continue;
    const aid = String(c.areaId ?? '');
    if (aid) onAreaIds.add(aid);
  }
  if (!onAreaIds.size) return;

  // 3. 遍历坐标标点：组内任一 areaId 有开启回路即点亮（some 短路，发现即停）
  areaIdByMarker.forEach(({ domId, type, areaIds }) => {
    const lit = areaIds.some((aid) => onAreaIds.has(aid));
    if (!lit) return;
    const el = document.getElementById(domId);
    if (!el) return;
    const lightIcon = type == 1 ? lightOn : areaLightOn;
    if (el.style.backgroundImage !== `url('${lightIcon}')`) {
      el.style.backgroundImage = `url('${lightIcon}')`;
    }
  });
}

/**
 * 只更新单个设备的标记图标（直接修改 DOM 背景图，不删除重建标点，避免漂移）
 */
function updateSingleMarker(item: any) {
  // 直接通过 DOM 修改标记的背景图片，不触发 SDK 的 remove/add 流程
  const el = document.getElementById(`light-${String(item.type)}-${String(item.id)}`);
  if (el) {
    let lightIcon: string;
    if (item.status === '关闭') {
      lightIcon = item.type == 1 ? lightOff : areaLightOff;
    } else {
      lightIcon = item.type == 1 ? lightOn : areaLightOn;
    }
    el.style.backgroundImage = `url('${lightIcon}')`;
  }
}

/**
 * 打开灯光详情弹窗
 */
const openLightDetail = (item: any) => {
  const [lng, lat] = (item.location || '').split(',');
  // 直接根据监控通道编码（monitorAdr）拼接 iframe 地址，不再走接口
  const videoUrl = item.monitorAdr ? `${MONITOR_BASE_URL}${item.monitorAdr}` : '';
  currentLight.value = { ...item, lng: lng || '', lat: lat || '', videoUrl };
  dialogVisible.value = true;
};

/**
 * 开灯/关灯控制
 */
const toggleLight = async () => {
  if (!currentLight.value) return;
  const target = currentLight.value.status === '打开' ? '关闭' : '打开';
  lightingLoading.value = true;
  try {
    const item = currentLight.value;
    if (item.status === '打开') {
      await closeAreaApi(item.id);
    } else {
      await openAreaApi(item.id);
    }

    // 更新弹窗状态
    currentLight.value.status = target;
    // 同步 lightingData 数据
    const dataItem = lightingData.value.find((i) => i.id === currentLight.value.id);
    if (dataItem) dataItem.status = target;
    // 只更新变化的单个标点，不重建全部（避免漂移）
    if (dataItem) updateSingleMarker(dataItem);
  } catch (error) {
    console.error('灯光控制失败:', error);
  } finally {
    lightingLoading.value = false;
  }
};

/**
 * 根据地块名称聚焦地图到该区域（取该地块下第一个标点作为基点）
 */
function focusToSpace(spaceName: string) {
  if (!map.value || !spaceName) return;
  // 从标点数据中找出属于该地块的第一个有效坐标
  const target = lightingData.value.find(
    (item) => item.spaceName === spaceName && item.location
  );
  if (!target) {
    console.warn('未找到地块对应的标点:', spaceName);
    return;
  }
  const [lng, lat] = target.location.split(',');
  console.log(buildingID, parseFloat(lng), parseFloat(lat) + 0.002, flid)
  if (!lng || !lat) return;
  // 聚焦并放大（纬度微偏，使目标点在视觉上偏上）
  map.value.easeTo({
    bdid: buildingID,
    lon: parseFloat(lng),
    lat: parseFloat(lat),
    floorId: flid,
  });
  setTimeout(() => {
    map.value.setZoom(
      1200 < windowWidth && windowWidth < 1440
        ? 15.5
        : windowWidth > 1439
          ? 16.0
          : 16.5
    );
  }, 300);
}

defineExpose({
  focusToSpace,
  map,
  getCurrentFloorId: () => flid,
  AddLightingMarker,
  loadLightingData,
  openLightDetail,  // 灯光详情弹窗（父组件回退调用）
  clearMarkerListActive,  // 清除成员列表项激活高亮（列表保持展示）
  collapseMarkerList,  // 收起成员列表
});

onMounted(async () => {
  await loadMapScripts()
  initMap()
  // 点击地图空白时自动关闭展开的成员列表（捕获阶段）
  document.addEventListener('click', handleDocumentClick, true);
})

onUnmounted(() => {
  // 清除所有标记
  lightingMarkerArr.value.forEach((item) => clearMarker(item));
  lightingMarkerArr.value = [];
  if (map.value) {
    map.value = null
  }
  // 移除全局点击监听
  document.removeEventListener('click', handleDocumentClick, true);
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 820px;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  /* 隔离大屏页 rem 基准（useScreenScale 动态根字号），地图 UI 保持固定字号不受缩放影响 */
  font-size: 16px;
}

/* 弹窗样式 */
.detail-body {
  padding: 0 4px;
}

.video-wrapper {
  width: 100%;
  height: 260px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 16px;
  background: #000;
}

.video-wrapper iframe {
  width: 100%;
  height: 100%;
}

.video-wrapper :deep(.video-player-wrap) {
  width: 100%;
  height: 100%;
}

.video-placeholder {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #1a2d47;
  border-radius: 6px;
  margin-bottom: 16px;
  color: #8899aa;
  font-size: 14px;
}

.video-placeholder p {
  margin-top: 8px;
}

.info-table {
  margin-top: 4px;
}
</style>

<style>
/* 标点成员列表（点击标点主体时切换展示；标点 DOM 由 SDK 注入到组件作用域外，需全局样式）
   与 bigGis/map.vue 详情模式标点浮层样式保持一致 */
.light-marker .marker-list {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  /* 保底 200px：min-width 用 max() 兜底，根字号异常（<100px）时列表宽度也至少 200px；大屏根字号>100px 时仍随屏放大 */
  min-width: max(2rem, 200px);   /* 2rem = 200px @1920，随屏缩放 + 200px 保底 */
  max-width: max(3.4rem, 340px);   /* 340px @1920 */
  /* 6 条以内不设高度限制且 overflow 为 visible：内容完整展示，彻底不出现滚动条；
     超过 6 条由 .marker-list-many 切换为限高滚动 */
  max-height: none;
  overflow-y: visible;
  background: linear-gradient(180deg, rgba(12, 28, 52, 1) 0%, rgba(8, 18, 36, 1) 100%);
  border: 1px solid rgba(0, 200, 255, 0.35);
  border-radius: 0.08rem;
  /* 顶部不设 padding：表头（区域名称）sticky 贴顶时才能完全盖住滚动内容，不留漏缝；底部留足空间避免最后一项被截断 */
  padding: 0 0.04rem 0.08rem;
  /* 列表在 marker 容器内最上层（容器展开时 z-index:60000，列表自身再 +1） */
  z-index: 10000;
  box-shadow: 0 0.12rem 0.4rem rgba(0, 0, 0, 0.6), 0 0 0.2rem rgba(0, 180, 255, 0.15);
  backdrop-filter: blur(0.12rem);
  animation: markerListIn 0.18s ease-out;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 200, 255, 0.45) transparent;
}

/* 超过 6 条：限高滚动，多出的条目滚动查看（300px @1920）；表头 sticky 贴顶盖住滚动内容 */
.light-marker .marker-list.marker-list-many {
  max-height: max(3rem, 300px);
  overflow-y: auto;
}

.light-marker .marker-list.marker-list-many .marker-list-header {
  position: sticky;
  top: 0;
  z-index: 2;
}

/* 列表自定义滚动条（数据多时提示可滚动，避免最后一项“看似截断”） */
.light-marker .marker-list::-webkit-scrollbar {
  width: 0.05rem;
}

.light-marker .marker-list::-webkit-scrollbar-thumb {
  background: rgba(0, 200, 255, 0.45);
  border-radius: 0.03rem;
}

.light-marker .marker-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 217, 255, 0.75);
}

.light-marker .marker-list::-webkit-scrollbar-track {
  background: transparent;
}

/* 列表表头（区域名称）：默认普通流定位（6 条以内不滚动，表头始终在顶部）；
   超过 6 条滚动时由 .marker-list-many 切换为 sticky 固定在列表顶部 */
.light-marker .marker-list-header {
  position: relative;
  padding: 0.08rem 0.14rem;
  font-size: 0.12rem;
  font-weight: 700;
  letter-spacing: 1px;
  color: #8fe8ff;
  background: linear-gradient(180deg, rgba(12, 28, 52, 1) 0%, rgba(10, 22, 40, 1) 100%);
  border-bottom: 1px solid rgba(0, 200, 255, 0.35);
  border-radius: 0.06rem 0.06rem 0 0;
  text-shadow: 0 0 0.08rem rgba(0, 217, 255, 0.5);
  pointer-events: none;
}

/* 与地块模式功能浮层一致的入场动画（列表定位依赖 translateX，动画仅用透明度避免位移） */
@keyframes markerListIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.light-marker .marker-list-item {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  padding: 0.1rem 0.14rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.13rem;
  line-height: 1.4;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.light-marker .marker-list-item:hover {
  background: rgba(0, 200, 255, 0.15);
  color: #00d9ff;
  padding-left: 0.18rem;
}

/* 列表项激活高亮（点击列表项弹出弹框期间保持），与 bigGis 详情模式激活态一致 */
.light-marker .marker-list-item.is-active {
  background: rgba(0, 200, 255, 0.25);
  color: #00d9ff;
  border-left: 0.03rem solid #00d9ff;
  font-weight: 600;
  text-shadow: 0 0 0.08rem rgba(0, 217, 255, 0.6);
}

/* 深色弹窗样式（全局，因为 el-dialog 会 teleport 到 body） */
.dark-dialog.el-dialog {
  background: #0f2035 !important;
  border: 1px solid #1e3a5f !important;
}

.dark-dialog .el-dialog__header {
  background: #0f2035 !important;
  border-bottom: 1px solid #1e3a5f !important;
}

.dark-dialog .el-dialog__title {
  color: #e0e6ed !important;
}

.dark-dialog .el-dialog__body {
  background: #0f2035 !important;
  color: #e0e6ed !important;
}

.dark-dialog .el-dialog__footer {
  background: #0f2035 !important;
  border-top: 1px solid #1e3a5f !important;
}

.dark-dialog .el-descriptions {
  --el-descriptions-table-border: #1e3a5f !important;
}

.dark-dialog .el-descriptions .el-descriptions__content {
  background-color: #0f2035 !important;
  color: #ffffff !important;
}

.dark-dialog .el-descriptions .el-descriptions__label {
  background-color: #152a42 !important;
  color: #8899aa !important;
}

/* 深色主题按钮 */
.dark-dialog .btn-dark {
  background-color: #1e3a5f !important;
  color: #ffffff !important;
  border: 1px solid #2a4a6f !important;
}

.dark-dialog .btn-dark:hover {
  background-color: #2a4a6f !important;
}
</style>
