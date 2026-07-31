<template>
  <div ref="mapContainer" class="map-container"></div>

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

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoCamera } from '@element-plus/icons-vue'
import { loadAMap } from '../utils/map-loader.js'
import { getLightPoints } from '../api/lightService.js'

const mapContainer = ref(null)
let map = null
let markers = []

// 弹窗控制
const dialogVisible = ref(false)
const currentLight = ref(null)

const statusTagType = computed(() => {
  const map = { '正常': 'success', '故障': 'danger', '离线': 'info' }
  return map[currentLight.value?.status] || 'info'
})

/** 根据状态返回对应颜色 */
function getStatusColor(status) {
  const colorMap = {
    '正常': '#67C23A',
    '故障': '#F56C6C',
    '离线': '#909399'
  }
  return colorMap[status] || '#409EFF'
}

/** 根据类型返回图标大小 */
function getIconSize(type) {
  const sizeMap = {
    '路灯': 10,
    '景观灯': 8,
    '高杆灯': 14,
    '建筑照明': 12,
    '庭院灯': 7,
    '投光灯': 11
  }
  return sizeMap[type] || 9
}

async function initMap() {
  try {
    const AMap = await loadAMap()

    // 初始化地图，定位到首钢园
    map = new AMap.Map(mapContainer.value, {
      zoom: 16,
      center: [116.164, 39.909],
      viewMode: '2D',
      resizeEnable: true,
      mapStyle: 'amap://styles/light'
    })

    // 加载灯光点位
    const lights = await getLightPoints()
    addLightMarkers(AMap, lights)

    // 自适应视野
    if (lights.length > 0) {
      map.setFitView(null, false, [30, 30, 30, 30])
    }
  } catch (error) {
    console.error('地图加载失败:', error.message)
    ElMessage.error('地图加载失败：' + error.message)
  }
}

function addLightMarkers(AMap, lights) {
  lights.forEach(light => {
    const color = getStatusColor(light.status)
    const size = getIconSize(light.type)

    // 创建圆形标记
    const markerContent = document.createElement('div')
    markerContent.style.cssText = `
      width: ${size * 2}px;
      height: ${size * 2}px;
      background: ${color};
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: transform 0.2s;
    `
    markerContent.title = light.name

    const marker = new AMap.Marker({
      position: [light.lng, light.lat],
      content: markerContent,
      offset: new AMap.Pixel(-size, -size)
    })

    // 点击弹出 Element Plus Dialog
    marker.on('click', () => {
      currentLight.value = light
      dialogVisible.value = true
    })

    // hover 放大效果
    marker.on('mouseover', () => {
      markerContent.style.transform = 'scale(1.3)'
    })
    marker.on('mouseout', () => {
      markerContent.style.transform = 'scale(1)'
    })

    map.add(marker)
    markers.push(marker)
  })
}

function clearMarkers() {
  markers.forEach(m => map.remove(m))
  markers = []
}

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  clearMarkers()
  if (map) {
    map.destroy()
    map = null
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
