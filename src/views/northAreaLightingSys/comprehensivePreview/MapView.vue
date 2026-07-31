<template>
  <div id="mapContainer" class="map-container"></div>

  <!-- POI 详情弹窗 -->
  <el-dialog
    v-model="dialogVisible"
    :title="currentLight?.name || '灯光详情'"
    width="520px"
    top="5vh"
    :close-on-click-modal="false"
    destroy-on-close
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
          <el-descriptions-item label="设备ID" :span="2">{{ currentLight.id }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ currentLight.typeName || currentLight.type }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType" size="small" effect="dark">
              {{ currentLight.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="功率">{{ currentLight.power }}W</el-descriptions-item>
          <el-descriptions-item label="灯杆高度">{{ currentLight.height }}m</el-descriptions-item>
          <el-descriptions-item label="经度" :span="2">{{ currentLight.lng }}</el-descriptions-item>
          <el-descriptions-item label="纬度" :span="2">{{ currentLight.lat }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </template>
    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
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
  defaultCenter: { lon: 116.15551, lat: 39.916878 },
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
      AddLightingMarker();
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
const lightingData = ref<any[]>([
  {
    "id": 14,
    "space": "1",
    "spaceName": "金安桥",
    "areaName": "D2区高杆灯",
    "areaCode": "90",
    "status": "关闭",
    "lastOperationTime": null,
    "lastOperationBy": null,
    "type": "2",
    "location": "116.16144959548319,39.92051918705476",
    "monitorAdr": "0096142642943133010293b98d3214a64af5b516d49cfbb97160",
    "remark": null,
    "allDuration": 7997116,
    "startTime": null,
    "closingTime": null,
    "openCode": "9",
    "closeCode": "4",
    "relName": "室外高杆路灯",
    "sort": 14
},
{
    "id": 15,
    "space": "1",
    "spaceName": "金安桥",
    "areaName": "C1区高杆灯",
    "areaCode": "91",
    "status": "关闭",
    "lastOperationTime": null,
    "lastOperationBy": null,
    "type": "2",
    "location": "116.15718948659276,39.92302185563205",
    "monitorAdr": "0096142642914834010193b98d3214a64af5b516d49cfbb97160",
    "remark": null,
    "allDuration": 8001466,
    "startTime": null,
    "closingTime": null,
    "openCode": "9",
    "closeCode": "4",
    "relName": "室外高杆路灯",
    "sort": 15
},
{
    "id": 51,
    "space": "4",
    "spaceName": "制氧北",
    "areaName": "A楼普通照明六层",
    "areaCode": "106",
    "status": "关闭",
    "lastOperationTime": null,
    "lastOperationBy": null,
    "type": "2",
    "location": null,
    "monitorAdr": null,
    "remark": null,
    "allDuration": 0,
    "startTime": null,
    "closingTime": null,
    "openCode": "9",
    "closeCode": "12",
    "relName": "楼梯景观",
    "sort": 112
}
]);
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
        ? 15.5
        : 16.5
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
  lightingData.value.forEach((item) => {
    if (!item.location) return;
    const [lng, lat] = item.location.split(',');
    if (!lng || !lat || isNaN(parseFloat(lng)) || isNaN(parseFloat(lat))) return;

    // 3. 根据状态和类型选择对应图标
    let lightIcon: string;
    if (item.status === '关闭') {
      lightIcon = item.type == 1 ? lightOff : areaLightOff;
    } else {
      lightIcon = item.type == 1 ? lightOn : areaLightOn;
    }

    const elDom = `<div class="light-marker" id="light-${item.type}-${item.id}" style="
      width: 50px;
      height: 100px;
      background-image: url('${lightIcon}');
      background-size: contain;
      background-repeat: no-repeat;
    "></div>`;

    lightingMarkerArr.value.push(
      customizeMarker(elDom, lat, lng, item.areaName || '泛光照明', item)
    );
  });
}

/**
 * 打开灯光详情弹窗（同时缩放并聚焦地图）
 */
const openLightDetail = (item: any) => {
  currentLight.value = { ...item };
  dialogVisible.value = true;
  setMapZoom(); // 点击后控制地图缩放
  focusMapTo(item); // 点击后控制地图聚焦
};

/**
 * 开灯/关灯控制
 */
const toggleLight = async () => {
  if (!currentLight.value) return;
  const target = currentLight.value.status === '打开' ? '关闭' : '打开';
  lightingLoading.value = true;
  try {
    // TODO: 对接真实点位控制接口（如 /northAreaLighting/control/light）
    // await controlLightApi(currentLight.value.id, target === '打开' ? 1 : 0);
    await new Promise((resolve) => setTimeout(resolve, 200)); // mock 延迟

    // 更新弹窗状态
    currentLight.value.status = target;
    // 同步 lightingData 数据
    const item = lightingData.value.find((i) => i.id === currentLight.value.id);
    if (item) item.status = target;
    // 刷新地图标记图标
    AddLightingMarker();
  } catch (error) {
    console.error('灯光控制失败:', error);
  } finally {
    lightingLoading.value = false;
  }
};

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
  height: 420px;
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
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 16px;
  color: #909399;
  font-size: 14px;
}

.video-placeholder p {
  margin-top: 8px;
}

.info-table {
  margin-top: 4px;
}
</style>
