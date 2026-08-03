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
        <!-- 视频播放区域 -->
        <div v-if="currentLight.videoUrl" class="video-wrapper">
          <iframe
            :src="currentLight.videoUrl"
            frameborder="0"
            allowfullscreen
          ></iframe>
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
import lightOnImg from '/@/assets/images/lightOn.png'
import lightOffImg from '/@/assets/images/lightOff.png'

let map = ref(null);
const buildingInfo = ref<unknown[]>([]);
let marker = ref(null);
let flid = null;
const windowWidth = window.outerWidth;
let zoomNum =
  1200 < windowWidth && windowWidth < 1440
    ? 14
    : windowWidth > 1439
      ? 14.6
      : 15.5;
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
      map.value.setZoomLevelRange(zoomNum, 23);
      buildingInfo.value = map.value.getBuildingInfo(buildingID);
      // 获取当前楼层ID（标点需绑定楼层场景，flid 为空会导致 SDK addToMap 报错）
      await initFloorId();
      // 等待地图瓦片渲染完成后再添加标点，避免标点先于地图出现
      setTimeout(async () => {
        await loadLightingData();
        AddLightingMarker();
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
 * 自定义标记：基于 DaxiMap.DXMapMarker，支持自定义 DOM
 */
const customizeMarker = (elDom: string, lat: string, lng: string, text: string, data: any) => {
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
  const marker = new DaxiMap.DXMapMarker();
  marker.initialize(map.value, markerInfo, {
    anchor: 'bottom',
    onClick: () => openLightDetail(data),
  });
  marker.addToMap();
  return marker;
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
function buildMarkerDom(item: any): string {
  let lightIcon: string;
  if (item.status === '关闭') {
    lightIcon = item.type == 1 ? lightOff : areaLightOff;
  } else {
    lightIcon = item.type == 1 ? lightOn : areaLightOn;
  }
  return `<div class="light-marker" id="light-${item.type}-${item.id}" style="
    width: 50px;
    height: 100px;
    background-image: url('${lightIcon}');
    background-size: contain;
    background-repeat: no-repeat;
  "></div>`;
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

  // 2. 遍历数据，为有经纬度的点位生成标记
  let hasLocation = 0, noLocation = 0, markerFail = 0;
  const idSet = new Set();
  lightingData.value.forEach((item) => {
    if (!item.location) { noLocation++; return; }
    const [lng, lat] = item.location.split(',');
    if (!lng || !lat || isNaN(parseFloat(lng)) || isNaN(parseFloat(lat))) { noLocation++; return; }
    hasLocation++;

    // 检查 DOM ID 是否重复
    const domId = `light-${item.type}-${item.id}`;
    if (idSet.has(domId)) {
      console.warn('标点ID重复，跳过:', domId, item.areaName);
      return;
    }
    idSet.add(domId);

    const elDom = buildMarkerDom(item);
    const marker = customizeMarker(elDom, lat, lng, item.areaName || '泛光照明', item);
    if (!marker) {
      markerFail++;
      console.warn('标点创建失败:', item.areaName, '坐标:', lng, lat);
    }
    lightingMarkerArr.value.push(marker);
  });
  console.log(`标点统计: 总数据${lightingData.value.length}条, 有坐标${hasLocation}条, 无坐标${noLocation}条, 创建失败${markerFail}条, 最终标记${lightingMarkerArr.value.filter(Boolean).length}条`);
}

/**
 * 只更新单个设备的标记图标（直接修改 DOM 背景图，不删除重建标点，避免漂移）
 */
function updateSingleMarker(item: any) {
  // 直接通过 DOM 修改标记的背景图片，不触发 SDK 的 remove/add 流程
  const el = document.getElementById(`light-${item.type}-${item.id}`);
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
  currentLight.value = { ...item, lng: lng || '', lat: lat || '' };
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
})

onUnmounted(() => {
  // 清除所有标记
  lightingMarkerArr.value.forEach((item) => clearMarker(item));
  lightingMarkerArr.value = [];
  if (map.value) {
    map.value = null
  }
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
