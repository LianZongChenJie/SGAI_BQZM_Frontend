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
import { getAllAreaApi, openAreaApi, closeAreaApi } from './comprehensivePreview.api'
import { VideoCamera } from '@element-plus/icons-vue'
import VideoPlayer from '../equipmentMonitoring/components/VideoPlayer.vue'

// 监控平台 iframe 地址前缀（与设备监控页面保持一致），monitorAdr 为监控通道编码
const MONITOR_BASE_URL = 'http://10.168.47.23:4000/index.html?id=';
import lightOnImg from '/@/assets/images/lightOn.png'
import lightOffImg from '/@/assets/images/lightOff.png'

let map = ref(null);
// 当前展开的成员列表（点击地图空白时自动关闭）
let openedListEl: HTMLElement | null = null;

/**
 * 关闭当前展开的成员列表
 */
function closeAllMarkerLists() {
  if (openedListEl) {
    openedListEl.style.display = 'none';
    openedListEl = null;
  }
}

/**
 * 点击地图空白时自动关闭展开的成员列表（捕获阶段，标点主体/列表项点击不触发）
 */
function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  // 点击列表项：由列表项自己处理，不在此关闭
  if (target.closest('.marker-list-item')) return;
  // 点击标点主体：由标点主体自己处理 toggle，不在此关闭
  if (target.closest('.light-marker')) return;
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
 * 标点主体点击：
 * - 成员数 >1：第一次点击展示成员列表，再次点击收起
 * - 仅 1 条：直接打开详情弹框
 */
const handleMarkerMainClick = (data: any, group: any[]) => {
  if (group.length > 1) {
    const el = document.getElementById(`light-${String(data.type)}-${String(data.id)}`);
    const listEl = el?.querySelector<HTMLElement>('.marker-list');
    if (listEl) {
      // 关闭其他已展开的列表
      closeAllMarkerLists();
      // 切换当前列表显隐
      const isHidden = listEl.style.display === 'none';
      listEl.style.display = isHidden ? 'block' : 'none';
      openedListEl = isHidden ? listEl : null;
    }
    return;
  }
  openLightDetail(data);
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
    // 成员列表项点击：打开对应设备详情并收起列表（阻止冒泡，避免触发主标点点击逻辑）
    if (domId && group.length) {
      const el = document.getElementById(domId);
      el?.addEventListener('click', (e) => {
        const li = (e.target as HTMLElement)?.closest?.('.marker-list-item');
        if (!li) return;
        e.stopPropagation();
        closeAllMarkerLists();
        const gid = li.getAttribute('data-id');
        const gtype = li.getAttribute('data-type');
        const target = group.find(
          (g) => String(g.id) === gid && String(g.type) === gtype
        );
        if (target) openLightDetail(target);
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
 */
function buildMarkerDom(item: any, group: any[] = []): string {
  let lightIcon: string;
  if (item.status === '关闭') {
    lightIcon = item.type == 1 ? lightOff : areaLightOff;
  } else {
    lightIcon = item.type == 1 ? lightOn : areaLightOn;
  }
  // 统一 type/id 为字符串，避免数字与字符串混用导致 DOM id 碰撞
  const domId = `light-${String(item.type)}-${String(item.id)}`;
  // 标点成员列表（点击标点主体时切换展示，点击某一项打开对应设备详情）
  const listItems = group
    .map(
      (g) =>
        `<div class="marker-list-item" data-id="${String(g.id)}" data-type="${String(g.type)}">${g.areaName || '灯光'}</div>`
    )
    .join('');
  const listHtml = listItems ? `<div class="marker-list" style="display: none;">${listItems}</div>` : '';
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
    position: relative;
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

    const elDom = buildMarkerDom(main, group);
    const marker = customizeMarker(elDom, lat, lng, main.areaName || '泛光照明', main, group, domId);
    if (!marker) {
      markerFail++;
      console.warn('标点创建失败:', main.areaName, '坐标:', lng, lat);
    }
    lightingMarkerArr.value.push(marker);
  });
  if (markerFail) console.warn(`标点创建失败 ${markerFail} 条`);
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
    lat: parseFloat(lat) + 0.002,
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

defineExpose({ focusToSpace });

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
/* 标点成员列表（点击标点主体时切换展示；标点 DOM 由 SDK 注入到组件作用域外，需全局样式） */
.light-marker .marker-list {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  min-width: 130px;
  max-width: 220px;
  max-height: 300px;
  overflow-y: auto;
  background: rgba(10, 22, 40, 0.95);
  border: 1px solid #2a4a6f;
  border-radius: 6px;
  padding: 4px;
  z-index: 1000;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
}

.light-marker .marker-list-item {
  padding: 6px 10px;
  color: #e0e6ed;
  font-size: 12px;
  line-height: 1.4;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 4px;
}

.light-marker .marker-list-item:hover {
  background: rgba(56, 189, 248, 0.18);
  color: #38bdf8;
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
