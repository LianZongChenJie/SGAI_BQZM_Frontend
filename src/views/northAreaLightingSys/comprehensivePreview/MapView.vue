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
          <el-descriptions-item label="类型">{{ currentLight.type }}</el-descriptions-item>
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
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { loadMapScripts } from '/@/components/map/loadMapScripts'


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
    map.value.on("loadComplete", () => {
      console.log("地图加载完成");
      map.value.setZoomLevelRange(zoomNum, 23);
      buildingInfo.value = map.value.getBuildingInfo(buildingID);
    });
    console.log("地图初始化成功");
  } catch (error) {
    console.error("地图初始化失败:", error);
  }
};


onMounted(async () => {
  await loadMapScripts()
  initMap()
})

onUnmounted(() => {
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
