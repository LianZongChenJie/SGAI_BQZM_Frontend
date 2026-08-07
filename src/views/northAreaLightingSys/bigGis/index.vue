<template>
  <div class="big-gis-page" @click="onMapClick">
    <MapView ref="mapViewRef" @light-marker-single-click="onLightMarkerSingleClick" />
    
    <!-- 左上角控制面板 -->
    <div class="top-left-controls">
      <!-- 控制开关按钮 - 带指示灯 -->
      <button 
        class="control-toggle-btn" 
        :class="{ 'is-active': showControlPanel }"
        @click="showControlPanel = !showControlPanel"
      >
        <!-- 小图标 -->
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                stroke-linejoin="round" stroke-linecap="round"></path>
        </svg>
        <span class="toggle-text">整体管控</span>
      </button>
      
      <!-- 控制面板面板 -->
      <div v-if="showControlPanel" class="control-panel">
        <div class="panel-body">
          <!-- 回路模块 -->
          <div class="module-card stat-section">
            <div class="section-title">回路</div>
            <div class="stat-row">
              <span class="stat-label">回路已开/回路总数</span>
              <span class="stat-value">
                <span class="number highlight-text">{{ circuitStats.active }}</span> 
                / 
                <span class="number">{{ circuitStats.total }}</span>
              </span>
            </div>
          </div>
          
          <!-- 一键开关模块 -->
          <div class="module-card action-section">
            <div class="section-title">一键开关</div>
            <div class="mini-action-group">
              <button class="icon-btn with-text" @click="handleAllOn" title="全开">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
                <span class="btn-text">全开</span>
              </button>
              <button class="icon-btn dark-btn with-text" @click="handleAllOff" title="全关">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <span class="btn-text">全关</span>
              </button>
            </div>
          </div>
          
          <!-- 场景列表模块 -->
          <div class="module-card space-section">
            <div class="section-title">场景列表</div>
            <div class="space-list-scroll-container">
              <div class="space-list">
                <div 
                  v-for="(scene, index) in sceneList" 
                  :key="index"
                  class="space-item-row"
                  @click="selectScene(scene.id)"
                >
                  <span class="scene-indicator-icon" :style="{ backgroundColor: scene.color }"></span>
                  <div class="item-info">
                    <span class="item-name">{{ scene.name }}</span>
                  </div>
                  <button class="detail-btn" @click.stop="showSceneDetail(scene)">详情</button>
                  <div class="scene-btn-group">
                    <button class="scene-action-btn on-btn" @click.stop="handleSceneOn(scene)">开</button>
                    <button class="scene-action-btn off-btn" @click.stop="handleSceneOff(scene)">关</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 场景详情弹窗 -->
    <SceneDetailModal ref="sceneDetailModalRef" :map-view-ref="mapViewRef" />
    
    <!-- 右上角统计面板 -->
    <div class="top-right-controls">
      <button class="stats-toggle-btn" @click="toggleStatsPanel" title="查看统计数据">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="12" width="4" height="9" rx="1"/>
          <rect x="10" y="8" width="4" height="13" rx="1"/>
          <rect x="17" y="3" width="4" height="18" rx="1"/>
        </svg>
        <span class="toggle-label">统计</span>
      </button>
      
      <div v-if="showStatsPanel" class="stats-panel">
        <!-- 各地块运行时长（本月）- 柱状图 -->
        <div class="chart-section bar-chart-section">
          <h4>各地块运行时长（本月）</h4>
          <div class="bar-chart-container">
            <div class="bar-item" v-for="(item, idx) in runtimeData" :key="idx">
              <div class="bar-wrapper">
                <div 
                  class="bar-fill" 
                  :style="{ height: item.height + '%', backgroundColor: item.color }"
                ></div>
                <span class="bar-value">{{ item.value }}</span>
              </div>
              <span class="bar-label">{{ item.label }}</span>
            </div>
          </div>
        </div>
        
        <!-- 运行时长按对拜 - 数据表格 -->
        <div class="table-section runtime-table">
          <h4>运行时长按对比</h4>
          <table>
            <thead>
              <tr>
                <th>地块</th>
                <th>回路数</th>
                <th>总运行时久</th>
                <th>平均时长</th>
                <th>同比</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in runtimeTableData" :key="idx">
                <td>{{ item.area }}</td>
                <td>{{ item.circuits }}</td>
                <td>{{ item.total }} h</td>
                <td>{{ item.avg }}</td>
                <td :class="item.change >= 0 ? 'change-positive' : 'change-negative'">
                  {{ item.change > 0 ? '+' : '' }}{{ item.change }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- 地块列表面板 -->
    <div v-if="showSpacePanel" class="space-panel">
      <div class="panel-header">
        <h3>地块列表</h3>
        <button class="close-btn" @click="showSpacePanel = false">✕</button>
      </div>
      <div class="panel-body">
        <div 
          v-for="(space, index) in spaceList" 
          :key="index"
          class="space-item"
          @click="selectSpace(space.name)"
        >
          <span class="space-color" :style="{ backgroundColor: space.color }"></span>
          <span class="space-name">{{ space.name }}</span>
        </div>
      </div>
    </div>
    
    <!-- 底部控制按钮组 -->
    <div class="bottom-controls">
      <button 
        class="ctrl-btn"
        :class="{ 'is-active': activeMode === 'area' }"
        @click="handleShowArea"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>地块模式</span>
      </button>
      
      <button 
        class="ctrl-btn"
        :class="{ 'is-active': activeMode === 'detail' }"
        @click="handleShowDetails"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        <span>详情模式</span>
      </button>
    </div>

    <!-- 地块功能浮层（点击地块标点弹出，点击一级菜单项打开对应弹框） -->
    <div
      v-if="spaceMenu.visible"
      class="space-menu"
      :style="{ top: spaceMenu.y + 'px', left: spaceMenu.x + 'px' }"
      @click.stop
    >
      <div class="space-menu-item" :class="{ 'is-active': activeMenuItem === 'all' }" @click="onMenuItemClick('all')">
        <span class="menu-label">全开全关</span>
      </div>

      <div class="space-menu-item" :class="{ 'is-active': activeMenuItem === 'scene' }" @click="onMenuItemClick('scene')">
        <span class="menu-label">场景模式</span>
      </div>

      <div class="space-menu-item" :class="{ 'is-active': activeMenuItem === 'video' }" @click="onMenuItemClick('video')">
        <span class="menu-label">监控视频</span>
      </div>

      <div class="space-menu-item" :class="{ 'is-active': activeMenuItem === 'detail' }" @click="onMenuItemClick('detail')">
        <span class="menu-label">详情</span>
      </div>
    </div>

    <!-- 视频监控弹框（居中，tab 展示多个视频，tab 支持滚动） -->
    <a-modal
      v-model:open="videoModalVisible"
      title="监控视频"
      :footer="null"
      width="820px"
      centered
      class="video-modal"
      wrapClassName="video-modal"
      :bodyStyle="{ padding: '16px', background: '#0b1a2f' }"
      @cancel="onSpaceModalCancel"
    >
      <div class="video-modal-wrap">
        <a-spin :spinning="videoLoading">
          <a-tabs v-if="spaceVideoList.length" type="card" class="video-tabs">
            <a-tab-pane
              v-for="(video, idx) in spaceVideoList"
              :key="video.id || idx"
              :tab="video.videoName || '监控视频 ' + (idx + 1)"
            >
              <div class="video-modal-item">
                <VideoPlayer :url="getVideoPlayUrl(video)" />
              </div>
            </a-tab-pane>
          </a-tabs>
          <div v-else-if="!videoLoading" class="space-submenu-empty">暂无视频</div>
        </a-spin>
      </div>
    </a-modal>

    <!-- 全开全关弹框（居中） -->
    <a-modal
      v-model:open="allModalVisible"
      title="全开全关"
      :footer="null"
      width="360px"
      centered
      class="space-modal"
      wrapClassName="space-modal"
      :bodyStyle="{ padding: '20px', background: '#0b1a2f' }"
      @cancel="onSpaceModalCancel"
    >
      <div class="switch-card-body all-modal-body">
        <button class="switch-btn switch-on" @click="handleSpaceAllOn(currentSpaceName)">
         <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
          全开
        </button>
        <button class="switch-btn switch-off" @click="handleSpaceAllOff(currentSpaceName)">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
          全关
        </button>
      </div>
    </a-modal>

    <!-- 场景模式弹框（居中，场景列表虚拟滚动） -->
    <a-modal
      v-model:open="sceneModalVisible"
      title="场景模式"
      :footer="null"
      width="500px"
      centered
      class="space-modal"
      wrapClassName="space-modal"
      :bodyStyle="{ padding: '16px', background: '#0b1a2f' }"
      @cancel="onSpaceModalCancel"
    >
      <a-spin :spinning="sceneModalLoading">
        <template v-if="spaceSceneList.length">
          <div class="scene-vxe-table-wrap">
          <vxe-table
            :data="spaceSceneList"
            height="360"
            :show-header="false"
            :row-config="{ keyField: 'id', height: 44 }"
            :scroll-y="{ enabled: true, gt: 20 }"
            :virtual-config="{ enabled: true, useY: true }"
          >
            <vxe-column field="sceneName" title="场景名称" min-width="240" show-overflow>
              <template #default="{ row }">
                <div class="scene-cell">
                  <span class="scene-indicator-icon" :style="{ backgroundColor: row.color || '#38bdf8' }"></span>
                  <span class="scene-cell-name">{{ row.sceneName || '-' }}</span>
                  <button class="detail-btn scene-mid-detail" @click.stop="showSpaceSceneDetail(row)">详情</button>
                </div>
              </template>
            </vxe-column>
            <vxe-column title="操作" width="110" align="center">
              <template #default="{ row }">
                <div class="scene-btn-group">
                  <button class="scene-action-btn on-btn" @click.stop="handleSpaceSceneOn(row)">开</button>
                  <button class="scene-action-btn off-btn" @click.stop="handleSpaceSceneOff(row)">关</button>
                </div>
              </template>
            </vxe-column>
          </vxe-table>
          </div>
        </template>
        <div v-else class="space-submenu-empty">暂无场景</div>
      </a-spin>
    </a-modal>

    <!-- 详情弹框：地块回路（getSceneSpaceApi 返回的 circuits，虚拟列表） -->
    <a-modal
      v-model:open="detailModalVisible"
      title="地块回路"
      :footer="null"
      width="320px"
      centered
      class="space-modal"
      wrapClassName="space-modal"
      :bodyStyle="{ padding: '16px', background: '#0b1a2f' }"
      @cancel="onSpaceModalCancel"
    >
      <a-spin :spinning="detailModalLoading">
        <template v-if="spaceCircuitList.length">
          <div class="circuit-vxe-table-wrap">
          <vxe-table
            :data="spaceCircuitList"
            height="360"
            :row-config="{ keyField: '_key', height: 38 }"
            :scroll-y="{ enabled: true, gt: 20 }"
            :virtual-config="{ enabled: true, useY: true }"
          >
            <vxe-column type="seq" title="序号" width="60" align="center"></vxe-column>
            <vxe-column field="name" title="回路名称" min-width="100" show-overflow></vxe-column>
            <vxe-column field="electricCurrent" title="电流" min-width="55" show-overflow></vxe-column>
            <vxe-column field="status" title="状态" width="65" align="center">
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
    </a-modal>

    <!-- 详情模式标点四页签弹框（点击详情模式标点且仅单条数据时打开：回路概览/一键开关/监控视频/详情） -->
    <a-modal
      v-model:open="lightTabsModalVisible"
      :title="(currentSpaceName) +'-'+ (lightAreaName)"
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
        <!-- 1. 回路概览：回路已开/回路总数 + 电流信息，上下居中 -->
        <a-tab-pane key="summary" tab="回路概览">
          <div class="tabs-summary">
          <div class="summary-nums">
              <span class="summary-num summary-on">{{ lightCircuitSummary.on }}</span>
              <span class="summary-divider">/</span>
              <span class="summary-num">{{ lightCircuitSummary.total }}</span>
            </div>
            <div class="summary-label">回路已开 / 回路总数</div>
          </div>
        </a-tab-pane>
        <!-- 2. 一键开关（样式与左侧面板一致，调用 setAreaOpenApi/setAreaCloseApi） -->
        <a-tab-pane key="switch" tab="一键开关">
          <div class="mini-action-group">
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
        </a-tab-pane>
        <!-- 3. 监控视频（与综合预览页一致：写死地址前缀拼接 monitorAdr，不调接口） -->
        <a-tab-pane key="video" tab="监控视频">
          <div v-if="lightVideoUrl" class="video-modal-item">
            <VideoPlayer :url="lightVideoUrl" />
          </div>
          <div v-else class="space-submenu-empty">暂无监控视频</div>
        </a-tab-pane>
        <!-- 4. 详情：该标点（地块）下的回路列表（序号/名称/状态） -->
        <a-tab-pane key="detail" tab="详情">
          <a-spin :spinning="detailModalLoading">
            <template v-if="lightCircuitList.length">
              <div class="circuit-vxe-table-wrap">
              <vxe-table
                :data="lightCircuitList"
                height="400"
                :row-config="{ keyField: '_key', height: 38 }"
                :scroll-y="{ enabled: true, gt: 20 }"
                :virtual-config="{ enabled: true, useY: true }"
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
        </a-tab-pane>
      </a-tabs>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MapView from './map.vue'
import SceneDetailModal from './components/SceneDetailModal.vue'
import { getAllCircuitApi, getAllSpaceApi, getRunTimeCompareApi, openAreaApi, closeAreaApi, getSceneSpaceApi, getVideoListBySpaceApi } from '../comprehensivePreview/comprehensivePreview.api'
import { getCircuitListApi } from '@/api/baseSettingBqZm'
import { getLightingPlanAPiNew, postSceneControlApi } from '@/api/equipmentMonitoring'
import VideoPlayer from '../equipmentMonitoring/components/VideoPlayer.vue'
import { setAreaOpenApi, setAreaCloseApi } from '@/api/baseSettingBqZm';
import { message, Modal } from 'ant-design-vue'

const mapViewRef = ref<any>(null)
const sceneDetailModalRef = ref<any>(null)
const showSpacePanel = ref(false)
const showControlPanel = ref(false)
const showStatsPanel = ref(false)  // 统计面板开关
const activeMode = ref<'area' | 'detail' | null>(null)  // 当前激活模式

// 地块功能浮层状态
const spaceMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  spaceName: ''
})
// 当前激活的一级菜单项（all / scene / video / detail），弹框打开时保持高亮
const activeMenuItem = ref<string>('')

// 地块视频列表（点击监控视频时调用 listBySpace 接口获取）
const spaceVideoList = ref<any[]>([])
// 视频加载状态
const videoLoading = ref(false)
// 视频弹框显隐
const videoModalVisible = ref(false)

// 全开全关 / 场景模式 / 详情弹框显隐
const allModalVisible = ref(false)
const sceneModalVisible = ref(false)
const sceneModalLoading = ref(false)
const detailModalVisible = ref(false)
const detailModalLoading = ref(false)
// 详情模式标点四页签弹框显隐（点击标点且仅单条数据时打开）
const lightTabsModalVisible = ref(false)
// 监控平台 iframe 地址前缀（与综合预览页一致），monitorAdr 为监控通道编码
const MONITOR_BASE_URL = 'http://10.168.47.23:4000/index.html?id='
// 四页签弹框监控视频地址（点击标点时按 monitorAdr 拼接，不调接口）
const lightVideoUrl = ref('')
// 四页签弹框回路列表（circuit/listPage 按 areaId 查询）
const lightCircuitList = ref<any[]>([])
// 四页签弹框当前标点的 areaId（全开/全关接口参数）
const lightAreaId = ref('')
// 四页签弹框标题展示的区域名（取标点数据 areaName）
const lightAreaName = ref('')
// 当前弹框所属地块名（打开弹框时从浮层带出）
const currentSpaceName = ref('')

// 视频占位地址（暂用，后续接入真实视频）
const SPACE_VIDEO_PLACEHOLDER = 'https://www.w3schools.com/html/mov_bbb.mp4'

// 统计数据 - 各地块运行时长（本月）柱状图 - 科技蓝主题（由接口填充）
const runtimeData = ref<any[]>([])

// 运行时按下对拜 - 数据表格（由接口填充）
const runtimeTableData = ref<any[]>([])

// 所有地块 ID 列表（用于运行时长查询）
const allSpaceIdList = ref<string[]>([])
const spaceList = ref<any[]>([])
const sceneList = ref<any[]>([])  // 场景配置列表

// 地块默认配色
const DEFAULT_SPACE_COLORS = [
  'rgba(251, 146, 60, 0.9)',   // 橙色
  'rgba(104, 211, 145, 0.9)',  // 绿色
  'rgba(245, 158, 11, 0.9)',   // 黄色
  'rgba(167, 139, 250, 0.9)',  // 紫色
  'rgba(244, 63, 94, 0.9)',    // 玫红色
]

// 本地存储各地块场景接口数据（按 spaceName 索引，保存 getSceneSpaceApi 完整返回：scenes 与 circuits 同级）
const spaceSceneDataMap = ref<Record<string, any>>({})
// 记录正在请求中的地块，防止重复请求
const spaceSceneLoadingMap = ref<Record<string, boolean>>({})

// 照明控制相关数据
const circuitStats = ref({
  total: 0,      // 总回路数
  active: 0,     // 已开启回路数
  offline: 0,    // 离线回路数
  alert: 0       // 告警回路数
})

// "地块模式"按钮 - 绘制地块边框和标记点
// 已处于地块模式时重复点击：不取消、不重绘（缓存优化）
function handleShowArea() {
  console.log('地块模式按钮点击')
  
  // 已处于地块模式：直接返回，避免重复清空/重绘
  if (activeMode.value === 'area') return
  
  // 切换到地块模式（去掉二次取消，点击即进入并展示标点）
  activeMode.value = 'area'
  
  // 先清除其他模式的绘制（如详情模式的灯光标点）
  if (mapViewRef.value?.clearAllDrawings) {
    mapViewRef.value.clearAllDrawings()
    console.log('已清除地图上的所有绘制')
  }
  
  // 绘制地块边框和标记点
  if (mapViewRef.value?.drawAllSpacesExceptNorth) {
    mapViewRef.value.drawAllSpacesExceptNorth()
    console.log('已添加地块边框')
    // 点击地块模式时批量请求所有地块的场景数据
    //fetchAllSpaceSceneData()
  }
}

// ===== 地块标点 hover 功能浮层 =====

// 视口外边距
const VIEWPORT_MARGIN = 8
// 浮层预估尺寸
const MENU_WIDTH_LEVEL1 = 150
const MENU_WIDTH_LEVEL2 = 240
const MENU_GAP = 2
const MENU_HEIGHT_MAX = 360

// 限制浮层位置在视口内（不能超出视图边界）
function clampMenuPosition(x: number, y: number, expandLevel2: boolean) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const totalWidth = expandLevel2 ? (MENU_WIDTH_LEVEL1 + MENU_GAP + MENU_WIDTH_LEVEL2) : MENU_WIDTH_LEVEL1
  if (x + totalWidth > vw - VIEWPORT_MARGIN) {
    x = vw - totalWidth - VIEWPORT_MARGIN
  }
  if (x < VIEWPORT_MARGIN) {
    x = VIEWPORT_MARGIN
  }
  if (y + MENU_HEIGHT_MAX > vh - VIEWPORT_MARGIN) {
    y = vh - MENU_HEIGHT_MAX - VIEWPORT_MARGIN
  }
  if (y < VIEWPORT_MARGIN) {
    y = VIEWPORT_MARGIN
  }
  return { x, y }
}

// 事件委托：点击地块标点时弹出功能浮层（标点保持 active），点击其他区域时全部关闭
function onMapClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  // 灯光标点（详情模式）：点击行为由 map.vue 内部事件驱动（单条打开四页签弹框），此处不关闭任何弹框，避免弹框刚打开就被冒泡点击关闭
  if (target.closest?.('.light-marker')) return
  const markerEl = target.closest?.('.space-marker')
  if (markerEl) {
    const spaceName = markerEl.getAttribute('data-space-name') || ''
    if (!spaceName) return
    // 切换标点时取消上一个标点的 active 状态
    if (spaceMenu.value.visible && spaceMenu.value.spaceName !== spaceName) {
      mapViewRef.value?.setSpaceMarkerActive?.(spaceMenu.value.spaceName, false)
    }
    const rect = markerEl.getBoundingClientRect()
    let x = Math.round(rect.left + rect.width / 2 + 20)
    let y = Math.round(rect.top - 180)
    // 边界限制（仅一级时预估尺寸）
    const clamped = clampMenuPosition(x, y, false)
    spaceMenu.value = {
      visible: true,
      x: clamped.x,
      y: clamped.y,
      spaceName
    }
    // 一级列表展示时标点保持 active
    mapViewRef.value?.setSpaceMarkerActive?.(spaceName, true)
  } else {
    closeAll()
  }
}

// 点击一级菜单项：浮层保留并保持该项激活，打开对应居中弹框
function onMenuItemClick(key: string) {
  const spaceName = spaceMenu.value.spaceName
  activeMenuItem.value = key  // 记录激活项，弹框打开时一级列表保持高亮
  if (key === 'all') openSpaceAllModal()
  else if (key === 'scene') openSpaceSceneModal(spaceName)
  else if (key === 'video') openVideoModal(spaceName)
  else if (key === 'detail') openSpaceDetailModal(spaceName)
}

// 打开全开全关弹框
function openSpaceAllModal() {
  currentSpaceName.value = spaceMenu.value.spaceName
  allModalVisible.value = true
}

// 打开场景模式弹框（确保该地块场景数据已请求）
async function openSpaceSceneModal(spaceName: string) {
  currentSpaceName.value = spaceName
  sceneModalVisible.value = true
  sceneModalLoading.value = true
  try {
    await ensureSpaceSceneData(spaceName)
  } finally {
    sceneModalLoading.value = false
  }
}

// 打开详情弹框（展示 getSceneSpaceApi 返回的 circuits，虚拟列表）
async function openSpaceDetailModal(spaceName: string) {
  currentSpaceName.value = spaceName
  detailModalVisible.value = true
  detailModalLoading.value = true
  try {
    await ensureSpaceSceneData(spaceName)
  } finally {
    detailModalLoading.value = false
  }
}

// 打开视频弹框（加载视频列表并居中展示 tab）
async function openVideoModal(spaceName: string) {
  videoModalVisible.value = true
  await loadSpaceVideoList(spaceName)
}

// 弹框取消：点右上角 X 只关闭弹框（浮层保留）；点击遮罩等其他区域全部关闭
function onSpaceModalCancel(e: any) {
  const isCloseBtn = e?.target instanceof Element && !!e.target.closest('.ant-modal-close')
  if (isCloseBtn) {
    closeAllModals()
  } else {
    closeAll()
  }
}

// 关闭所有弹框（浮层保留，标点仍 active），同时取消一级菜单激活状态
function closeAllModals() {
  videoModalVisible.value = false
  allModalVisible.value = false
  sceneModalVisible.value = false
  detailModalVisible.value = false
  lightTabsModalVisible.value = false
  activeMenuItem.value = ''  // 取消对应一级列表的激活状态
  // 详情模式成员列表：弹框关闭后列表保持展开展示，仅清除列表项激活高亮
  mapViewRef.value?.clearMarkerListActive?.()
}

// 全部关闭：弹框 + 浮层（同时取消标点 active）
function closeAll() {
  closeAllModals()
  closeSpaceMenu()
}

// 关闭功能浮层（并取消标点 active）
function closeSpaceMenu() {
  if (spaceMenu.value.visible) {
    mapViewRef.value?.setSpaceMarkerActive?.(spaceMenu.value.spaceName, false)
  }
  spaceMenu.value.visible = false
  activeMenuItem.value = ''  // 重置一级菜单激活状态
}


// 预加载某个地块的场景/回路数据（按需请求，带缓存；保存完整返回：scenes 与 circuits 同级）
async function fetchSpaceSceneData(spaceName: string) {
  const space = spaceList.value.find((s: any) => s.name === spaceName)
  try {
    spaceSceneLoadingMap.value[spaceName] = true
    const res: any = await getSceneSpaceApi(String(space.id))
    if (res && (res.scenes || res.circuits)) {
      spaceSceneDataMap.value[spaceName] = res
    }
  } catch (e) {
    console.error(`[index] 地块 [${spaceName}] 场景接口请求失败:`, e)
  } finally {
    spaceSceneLoadingMap.value[spaceName] = false
  }
}

// 确保地块数据已加载（未加载且未请求中时发起请求，返回完整数据或 null）
async function ensureSpaceSceneData(spaceName: string): Promise<any | null> {
  const loaded = spaceSceneDataMap.value[spaceName]
  if (loaded) return loaded
  if (spaceSceneLoadingMap.value[spaceName]) return null
  await fetchSpaceSceneData(spaceName)
  return spaceSceneDataMap.value[spaceName] || null
}

// 点击地块模式时批量请求所有地块（除首钢园北区）的场景数据（带缓存）
function fetchAllSpaceSceneData() {
  const spaces = spaceList.value;

  if (spaces.length === 0) {
    console.warn('[index] 暂无地块列表数据，请稍后再试')
    return
  }
  console.log(`[index] 批量请求 ${spaces.length} 个地块场景数据...`)
  spaces.forEach((space: any) => {
    fetchSpaceSceneData(space.name)
  })
}

// 从 getSceneSpaceApi 返回的 result.scenes 中获取当前地块的场景列表（与 circuits 同级）
function getSpaceSceneListFromApi(spaceName: string): any[] {
  const data = spaceSceneDataMap.value[spaceName];
  if (!data) return [];
  const list = data.scenes;
  if (!Array.isArray(list)) return []
  return list.map((item: any, idx: number) => ({
    ...item,
    id: item.id || idx,
    name: item.sceneName || '-',
    color: item.color || defaultColors[idx % defaultColors.length],
    enabled: item.status === '开启' || item.enabled === true,
  }))
}

// 从 getSceneSpaceApi 返回的 result.circuits 中获取当前地块的回路列表（与 scenes 同级）
function getSpaceCircuitListFromApi(spaceName: string): any[] {
  const data = spaceSceneDataMap.value[spaceName];
  if (!data) return [];
  const list = data.circuits;
  if (!Array.isArray(list)) return []
  return list.map((item: any, idx: number) => ({
    ...item,
    _key: item.id || item.circuitId || `${spaceName}-${idx}`,
    name: item.circuitName || item.name || '回路' + (idx + 1),
  }))
}

const defaultColors = ['#52c41a', '#38bdf8', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

// 场景/回路列表缓存：模板中使用稳定的数组引用，避免每次渲染都生成新数组导致 vxe-table 递归更新
const spaceSceneList = computed(() => getSpaceSceneListFromApi(currentSpaceName.value))
const spaceCircuitList = computed(() => getSpaceCircuitListFromApi(currentSpaceName.value))

// 四页签弹框回路概览（开启数/总回路数，来自 circuit/listPage）
const lightCircuitSummary = computed(() => {
  const list = lightCircuitList.value
  return {
    on: list.filter((c: any) => c.status === '开启').length,
    total: list.length
  }
})

// 地块浮层内的场景详情
function showSpaceSceneDetail(scene: any) {
  sceneDetailModalRef.value?.showDetail?.(scene)
}

// 地块浮层内场景开
async function handleSpaceSceneOn(scene: any) {
  return handleSceneAction(scene, '开启')
}

// 地块浮层内场景关
async function handleSpaceSceneOff(scene: any) {
  return handleSceneAction(scene, '关闭')
}

// 统一二次确认弹窗（深色主题样式：全局 .dark-confirm-modal）
function showLightConfirm(opts: {
  content: string
  title?: string
  okText?: string
  onOk: () => void | Promise<void>
}) {
  Modal.confirm({
    title: opts.title || '确认操作',
    content: opts.content,
    okText: opts.okText || '确认',
    cancelText: '取消',
    wrapClassName: 'dark-confirm-modal',
    zIndex: 92000, // 二次确认最高层级：高于四页签/详情弹框(90000)
    onOk: opts.onOk,
  })
}

// 四页签弹框全开（调用 setAreaOpenApi，按 areaId）
function handleLightAreaOn() {
  if (!lightAreaId.value) {
    message.warning('该标点无地块 ID，无法执行全开')
    return
  }
  showLightConfirm({
    content: `确定要全开地块“${lightAreaName.value || '该标点'}”的所有回路吗？`,
    onOk: async () => {
      try {
        await setAreaOpenApi({ id: lightAreaId.value })
        message.success('全开成功')
      } catch (error) {
        console.error('全开失败:', error)
        message.error('全开失败，请重试')
      }
    },
  })
}

// 四页签弹框全关（调用 setAreaCloseApi，按 areaId）
function handleLightAreaOff() {
  if (!lightAreaId.value) {
    message.warning('该标点无地块 ID，无法执行全关')
    return
  }
  showLightConfirm({
    content: `确定要全关地块“${lightAreaName.value || '该标点'}”的所有回路吗？`,
    onOk: async () => {
      try {
        await setAreaCloseApi({ id: lightAreaId.value })
        message.success('全关成功')
      } catch (error) {
        console.error('全关失败:', error)
        message.error('全关失败，请重试')
      }
    },
  })
}

// 地块级全开（调用 openAreaApi）
function handleSpaceAllOn(spaceName: string) {
  const space = spaceList.value.find((s: any) => s.name === spaceName)
  if (!space?.id) {
    message.warning('该地块无 ID，无法执行全开')
    return
  }
  showLightConfirm({
    content: `确定要全开地块“${spaceName}”的所有回路吗？`,
    onOk: async () => {
      try {
        await openAreaApi(space.id)
        message.success(`【${spaceName}】全开成功`)
      } catch (error) {
        console.error('地块全开失败:', error)
        message.error('全开失败，请重试')
      }
      allModalVisible.value = false
    },
  })
}

// 地块级全关（调用 closeAreaApi）
function handleSpaceAllOff(spaceName: string) {
  const space = spaceList.value.find((s: any) => s.name === spaceName)
  if (!space?.id) {
    message.warning('该地块无 ID，无法执行全关')
    return
  }
  showLightConfirm({
    content: `确定要全关地块“${spaceName}”的所有回路吗？`,
    onOk: async () => {
      try {
        await closeAreaApi(space.id)
        message.success(`【${spaceName}】全关成功`)
      } catch (error) {
        console.error('地块全关失败:', error)
        message.error('全关失败，请重试')
      }
      allModalVisible.value = false
    },
  })
}

// 一键全开
function handleAllOn() {
  showLightConfirm({
    content: '确定要一键全开所有地块灯光吗？',
    onOk: () => {
      console.log('一键全开')
      spaceList.value.forEach(space => {
        space.enabled = true
      })
      // TODO: 调用 API 实现一键全开
      fetchCircuitStats() // 刷新数据
    },
  })
}

// 一键全关
function handleAllOff() {
  showLightConfirm({
    content: '确定要一键全关所有地块灯光吗？',
    onOk: () => {
      console.log('一键全关')
      spaceList.value.forEach(space => {
        space.enabled = false
      })
      // TODO: 调用 API 实现一键全关
      fetchCircuitStats() // 刷新数据
    },
  })
}

// 获取回路统计数据 - 参考综合预览逻辑
async function fetchCircuitStats() {
  try {
    const circuitData = await getAllCircuitApi()
    
    console.log('回路数据:', circuitData)
    
    // 解析回路总数
    if (circuitData && Array.isArray(circuitData)) {
      circuitStats.value.total = circuitData.length
      
      // 参考综合预览：统计 status === '开启' 的回路数
      const openCircuits = circuitData.filter((c: any) => c.status === '开启')
      circuitStats.value.active = openCircuits.length
      
      console.log(`回路初始化完成 - 总数: ${circuitStats.value.total}, 开启: ${circuitStats.value.active}`)
    } else if (circuitData && typeof circuitData === 'object') {
      circuitStats.value.total = circuitData.total || circuitData.count || circuitData.length || 0
      // 如果对象中有 status 字段，也可以尝试解析
      circuitStats.value.active = circuitData.open || circuitData.active || 0
    }
    
    console.log('最终回路统计:', circuitStats.value)
  } catch (error) {
    console.error('获取回路统计数据失败:', error)
    // 设置默认值
    circuitStats.value = {
      total: 0,
      active: 0,
      offline: 0,
      alert: 0
    }
  }
}


// 获取所有地块 ID（用于运行时长查询）
async function fetchAllSpaceIds() {
  try {
    const res: any = await getAllSpaceApi()
    // 兼容分页结构（records/list/result/data）与纯数组返回
    const list = Array.isArray(res) ? res : (res?.records || res?.list || res?.result || res?.data || [])
    // 新接口字段：id / districtName
    allSpaceIdList.value = list.map((item: any) => item.id).filter(Boolean)
    console.log('所有地块 ID:', allSpaceIdList.value)
    // 获取完所有地块后，若 spaceList 尚未初始化，则用接口返回数据赋值
    if (spaceList.value.length === 0) {
      spaceList.value = list.map((space: any, index: number) => ({
        id: space.id,
        name: space.districtName,
        color: DEFAULT_SPACE_COLORS[index % DEFAULT_SPACE_COLORS.length],
        enabled: false
      }))
      console.log('spaceList 已由接口数据初始化:', spaceList.value.length, '个地块')
      fetchAllSpaceSceneData()
    }
    return allSpaceIdList.value
  } catch (error) {
    console.error('获取地块 ID 失败:', error)
    return []
  }
}

// 获取各地块运行时长对比（本月）
async function fetchRunTimeCompare() {
  try {
    // 确保地块 ID 已加载
    if (allSpaceIdList.value.length === 0) {
      await fetchAllSpaceIds()
    }
    if (allSpaceIdList.value.length === 0) {
      console.warn('无地块 ID，跳过运行时长查询')
      return
    }

    // 计算本月起止时间
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const lastDay = new Date(year, month + 1, 0).getDate()
    const startTime = `${year}-${String(month + 1).padStart(2, '0')}-01 00:00:00`
    const endTime = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay} 23:59:59`

    // 手动拼接查询字符串，避免 axios 数组序列化为 areaIds[] 导致 Tomcat 报错
    const areaQuery = allSpaceIdList.value.map((id) => `areaIds=${encodeURIComponent(id)}`).join('&')
    const queryStr =
      `?${areaQuery}` +
      `&startTime=${encodeURIComponent(startTime)}` +
      `&endTime=${encodeURIComponent(endTime)}`

    const res: any = await getRunTimeCompareApi(queryStr)

    console.log('运行时长对比数据:', res)

    const data = Array.isArray(res) ? res : res?.result || res?.data || []
    if (!Array.isArray(data)) {
      console.warn('运行时长返回数据格式异常:', data)
      return
    }

    // 柱状图颜色
    const colors = [
      'rgba(0, 200, 255, 0.85)',
      'rgba(0, 180, 255, 0.85)',
      'rgba(0, 160, 255, 0.85)',
      'rgba(0, 140, 255, 0.85)',
      'rgba(0, 120, 255, 0.85)'
    ]

    // 计算最大时长用于柱状图高度
    const totals = data.map((item: any) => Number(item.totalRunTime ?? item.total ?? item.runTime ?? 0))
    const maxTotal = Math.max(...totals, 1)

    // 填充柱状图数据
    runtimeData.value = data.map((item: any, index: number) => {
      const total = Number(item.totalRunTime ?? item.total ?? item.runTime ?? 0)
      const height = Math.round((total / maxTotal) * 98)
      return {
        label: item.spaceName || item.areaName || item.name || '未知',
        value: formatRuntime(total),
        height,
        color: colors[index % colors.length]
      }
    })

    // 填充表格数据
    runtimeTableData.value = data.map((item: any) => ({
      area: item.spaceName || item.areaName || item.name || '-',
      circuits: item.circuitCount ?? item.circuits ?? 0,
      total: formatRuntime(Number(item.totalRunTime ?? item.total ?? item.runTime ?? 0)),
      avg: item.avgRunTime != null ? `${item.avgRunTime} h/日` : '-',
      change: Number(item.yoy ?? item.change ?? item.changeRate ?? 0)
    }))
  } catch (error) {
    console.error('获取运行时长对比失败:', error)
  }
}

// 格式化运行时长：小时转 "x.yk" 或 "x,xxx"
function formatRuntime(hours: number) {
  if (!hours && hours !== 0) return '0'
  if (hours >= 1000) return (hours / 1000).toFixed(1) + 'k'
  return hours.toLocaleString()
}

// 统计面板开关（展开时刷新数据）
function toggleStatsPanel() {
  showStatsPanel.value = !showStatsPanel.value
  if (showStatsPanel.value) {
    fetchRunTimeCompare()
  }
}

// 选择地块并绘制边框（粗红线）
function selectSpace(spaceName: string) {
  console.log('选择地块:', spaceName)
  
  // 调用地图组件，用粗红线绘制该地块边框
  mapViewRef.value?.highlightSpaceBySelected?.(spaceName)
  
  // 关闭面板
  showSpacePanel.value = false
}

// 选择场景并绘制边框
function selectScene(sceneId: string) {
  console.log('选择场景:', sceneId)
  const scene = sceneList.value.find(s => s.id === sceneId)
  if (scene) {
    // TODO: 根据场景ID绘制对应的地块边框
    console.log('场景信息:', scene)
  }
}

// 显示场景详情
async function showSceneDetail(scene: any) {
  console.log('查看场景详情:', scene)
  console.log('场景 ID:', scene.id)
  
  // 先清除地图上的所有绘制（包括地块边框、标点等）
  if (mapViewRef.value?.clearAllDrawings) {
    mapViewRef.value.clearAllDrawings()
    console.log('✓ 已清除地图上的所有绘制')
  } else {
    console.warn('⚠️ mapViewRef 或 clearAllDrawings 不存在')
  }
  
  // 额外检查：直接调用 clearLightingMarkers 确保标点也被清除
  if (mapViewRef.value?.clearLightingMarkers) {
    mapViewRef.value.clearLightingMarkers()
    console.log('✓ 已额外清除灯光标点')
  }
  
  // 打开详情弹窗（显示表格数据）
  sceneDetailModalRef.value?.showDetail(scene)
}

// 场景开/关通用操作
async function handleSceneAction(scene: any, action: '开启' | '关闭') {
  debugger
  const actionText = action === '开启' ? '开' : '关'
  return new Promise<void>((resolve, reject) => {
    Modal.confirm({
      title: '确认操作',
      content: `确定要${actionText}场景“${scene.name}”吗？`,
      okText: '确认',
      cancelText: '取消',
      wrapClassName: 'dark-confirm-modal',
      zIndex: 92000,  // 二次确认最高层级：高于四页签/详情弹框(90000)
      onOk: async () => {
        try {
          await postSceneControlApi({
            sceneId: scene.id,
            operationType: action
          })
          message.success(`${actionText}成功`)
          scene.enabled = action === '开启'
          await fetchCircuitStats()
          resolve()
        } catch (error) {
          console.error(`场景${actionText}失败:`, error)
          message.error('操作失败，请重试')
          reject(error)
        }
      },
      onCancel: () => {
        resolve()
      }
    })
  })
}

// 场景开启
function handleSceneOn(scene: any) {
  return handleSceneAction(scene, '开启')
}

// 场景关闭
function handleSceneOff(scene: any) {
  return handleSceneAction(scene, '关闭')
}

// 获取场景配置列表
async function fetchSceneList() {
  try {
    const params = {
      pageNo: 1,
      pageSize: 999  // 获取所有场景
    }
    
    const data = await getLightingPlanAPiNew(params)
    console.log('场景列表数据:', data)
    
    if (data?.records && Array.isArray(data.records)) {
      const iconMap: Record<string, string> = {
        '开启': '#52c41a',
        '关闭': '#ff4d4f',
      }
      
      sceneList.value = data.records.map((item: any) => {
        const relCount = item.relIds ? item.relIds.split(',').length : 0
        
        // 获取地块/区域名称（使用areaName或spaceName）
        let areaName = '-'
        if (item.areaName) {
          areaName = item.areaName
        } else if (item.spaceName) {
          areaName = item.spaceName
        }
        
        console.log(`场景 [${item.planName}] 数据:`, {
          areaName: item.areaName,
          spaceName: item.spaceName,
          解析后的areaName: areaName
        })
        
        return {
          ...item,
          id: item.id,
          name: item.planName || '',
          color: iconMap[item.operationType] || '#38bdf8',
          circuitCount: relCount,
          desc: `控制类型 · ${item.relType || '-'}`,
          spaceName: areaName,  // 地块/区域名称
          relType: item.relType,
          enabled: false,  // 默认关闭
          relIds: item.relIds,
        }
      })
      
      console.log(`已加载 ${sceneList.value.length} 个场景`, sceneList.value)
    }
  } catch (error) {
    console.error('获取场景列表失败:', error)
    message.error('获取场景列表失败')
  }
}

// "详情模式"按钮 - 显示所有标点，清除地块
function handleShowDetails() {
  console.log('详情模式按钮点击')
  
  // 切换激活状态（再点一次取消）
  activeMode.value = activeMode.value === 'detail' ? null : 'detail'
  
  // 先清除地块绘制（如果存在）
  if (mapViewRef.value?.clearAllDrawings) {
    mapViewRef.value.clearAllDrawings()
    console.log('已清除地图上的地块绘制')
  }
  
  // 激活时添加标点（数据已在初始化时加载）
  if (activeMode.value === 'detail' && mapViewRef.value?.AddLightingMarker) {
    mapViewRef.value.AddLightingMarker()
    console.log('✅ 已添加标点')
  }
}

// 详情模式标点点击（仅单条数据时触发）：详情模式下打开四页签弹框，其他情况保持原灯光详情弹窗
function onLightMarkerSingleClick(data: any) {
  if (activeMode.value !== 'detail') {
    // 非详情模式：点击列表项后收起列表（保持原行为），打开原灯光详情弹窗
    mapViewRef.value?.collapseMarkerList?.()
    mapViewRef.value?.openLightDetail?.(data)
    return
  }
  openLightTabsModal(data)
}

// 打开标点四页签弹框（回路概览/一键开关/监控视频/详情），回路数据按 areaId 查询 circuit/listPage
async function openLightTabsModal(data: any) {
  const spaceName = data?.spaceName || ''
  const areaId = data?.id
  // 标点无地块归属或 areaId 时回退到原灯光详情弹窗
  if (!spaceName || !areaId) {
    mapViewRef.value?.openLightDetail?.(data)
    return
  }
  currentSpaceName.value = spaceName
  lightTabsModalVisible.value = true
  lightAreaId.value = String(areaId)
  lightAreaName.value = data?.areaName || ''
  lightVideoUrl.value = data?.monitorAdr ? MONITOR_BASE_URL + data.monitorAdr : ''
  detailModalLoading.value = true
  try {
    // 回路概览/详情数据：按 areaId 查询 circuit/listPage
    await loadLightCircuit(String(areaId))
  } finally {
    detailModalLoading.value = false
  }
}

// 按 areaId 查询地块回路列表（circuit/listPage），供四页签弹框的回路概览与详情展示
async function loadLightCircuit(areaId: string) {
  const res: any = await getCircuitListApi({ pageSize: 999, areaId })
  // 分页结构返回 records，兼容纯数组
  const list = Array.isArray(res) ? res : (res?.records || res?.list || res?.result || res?.data || [])
  lightCircuitList.value = list.map((item: any, idx: number) => ({
    ...item,
    _key: item.id || item.circuitId || `light-${areaId}-${idx}`,
    name: item.circuitName || item.name || '回路' + (idx + 1),
  }))
}

// 加载地块视频列表（按地块 spaceId 查询，不再写死）
async function loadSpaceVideoList(spaceName: string) {
  videoLoading.value = true
  try {
    const space = spaceList.value.find((s: any) => s.name === spaceName)
    const res: any = await getVideoListBySpaceApi(space?.id ? String(space.id) : '')
    spaceVideoList.value = Array.isArray(res) ? res : (res?.result || res?.data || [])
    console.log('地块视频列表:', spaceVideoList.value)
  } catch (error) {
    console.error('获取地块视频列表失败:', error)
    spaceVideoList.value = []
  } finally {
    videoLoading.value = false
  }
}

// 构建视频播放地址（直接用返回结果的 videoAddress 完整地址，不拼接）
function getVideoPlayUrl(item: any) {
  const adr = item?.videoAddress
  return adr || SPACE_VIDEO_PLACEHOLDER
}

onMounted(() => {
  console.log('页面已挂载')
  // 初始化时获取回路统计数据
  fetchCircuitStats()
  // 获取场景配置列表
  fetchSceneList()
  // 获取各地块运行时长对比
  fetchRunTimeCompare()
})
</script>

<style scoped>
.big-gis-page {
  position: relative;
  width: 100%;
  height: 100%;
  background: #0f172a;
  /* 修复地图滚动问题：允许滚轮事件穿透 */
  overflow: visible;
}

/* 底部居中控制按钮 */
.bottom-controls {
  position: absolute;
  left: 50%;
  bottom: 32px;
  transform: translateX(-50%);
  z-index: 60000;  /* 高于地图标点，确保不被遮挡 */
  display: flex;
  gap: 120px;
}

.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 10px 16px;
  min-width: 104px;
  background: linear-gradient(135deg, rgba(0, 200, 255, 0.6) 0%, rgba(0, 130, 255, 0.55) 100%);
  border: 1.5px solid rgba(0, 240, 255, 0.85);
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 
    0 4px 20px rgba(0, 180, 255, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  text-shadow: 0 0 8px rgba(0, 217, 255, 0.7);
}

/* 外边框光晕层 */
.ctrl-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, 
    rgba(0, 217, 255, 0.2) 0%,
    rgba(0, 150, 255, 0.1) 100%
  );
  opacity: 0.5;
}

/* 内发光和高光层 */
.ctrl-btn::after {
  content: '';
  position: absolute;
  inset: 1px;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.15) 0%, 
    rgba(255, 255, 255, 0) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  pointer-events: none;
}

/* 图标样式 */
.ctrl-btn svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 6px rgba(0, 217, 255, 0.5));
}

/* Hover 效果 */
.ctrl-btn:hover {
  background: linear-gradient(135deg, rgba(0, 220, 255, 0.75) 0%, rgba(0, 160, 255, 0.7) 100%);
  border-color: rgba(0, 240, 255, 1);
  transform: translateY(-3px);
  box-shadow: 
    0 8px 28px rgba(0, 180, 255, 0.65),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.ctrl-btn:hover::before {
  opacity: 1;
}

.ctrl-btn:hover svg {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 12px rgba(0, 217, 255, 0.8));
}

/* 激活状态 - 高亮效果 */
.ctrl-btn.is-active {
  background: linear-gradient(135deg, rgba(0, 220, 255, 0.9) 0%, rgba(0, 160, 255, 0.85) 100%);
  border-color: rgba(255, 255, 255, 0.9);
  color: #fff;
  box-shadow: 
    0 6px 26px rgba(0, 220, 255, 0.75),
    0 0 16px rgba(0, 220, 255, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.ctrl-btn.is-active::before {
  opacity: 1;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(0, 220, 255, 0.15) 100%);
}

.ctrl-btn.is-active svg {
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 16px rgba(0, 220, 255, 1));
  transform: scale(1.05);
}

/* 左上角控制按钮 */
.top-left-controls {
  position: absolute;
  left: 20px;
  top: 90px;  /* 调整位置：从20px改为90px */
  z-index: 60000;  /* 高于地图标点（最高50000），确保不被遮挡 */
}

/* 控制开关按钮 - 矩形风格 */
.control-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, rgba(0, 30, 60, 0.85) 0%, rgba(0, 20, 40, 0.75) 100%);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 150, 255, 0.4);
  border-radius: 6px;
  color: #00d9ff;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 
    0 4px 16px rgba(0, 100, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.control-toggle-btn .toggle-text {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  letter-spacing: 0.5px;
  text-shadow: 0 0 8px rgba(0, 217, 255, 0.6);
}

.control-toggle-btn svg {
  flex-shrink: 0;
  filter: drop-shadow(0 0 4px rgba(0, 217, 255, 0.6));
}

/* 指示灯 - 未激活时暗淡 */
.control-toggle-btn .indicator-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: none;
}

/* Hover效果 */
.control-toggle-btn:hover {
  background: linear-gradient(135deg, rgba(0, 40, 80, 0.9) 0%, rgba(0, 30, 60, 0.85) 100%);
  border-color: rgba(0, 217, 255, 0.6);
  box-shadow: 
    0 6px 24px rgba(0, 150, 255, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

/* 激活状态 - 指示灯亮起 */
.control-toggle-btn.is-active {
  background: linear-gradient(135deg, rgba(0, 40, 80, 0.9) 0%, rgba(0, 30, 60, 0.85) 100%);
  border-color: rgba(0, 217, 255, 0.7);
  color: #00d9ff;
}

.control-toggle-btn.is-active .indicator-dot {
  background: #00d9ff;
  box-shadow: 0 0 8px rgba(0, 217, 255, 0.8), 0 0 4px rgba(0, 217, 255, 1);
}

/* Click效果 */
.control-toggle-btn:active {
  transform: translateY(0);
}

/* 控制面板面板 */
.control-panel {
  position: absolute;
  left: 0;
  top: 55px;  /* 相对于父容器，确保在图标下方 */
  width: 340px;  /* 加宽：与统计面板保持一致宽度 */
  z-index: 60000;  /* 高于地图标点，确保不被遮挡 */
  max-height: calc(100vh - 70px);
  background: rgba(10, 22, 40, 0.7);  /* 提高不透明度 */
  border: 1px solid rgba(56, 189, 248, 0.35);  /* 边框透明度提高 */
  border-radius: 4px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(56, 189, 248, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 紧凑状态栏 - 直接显示统计信息，无标题 */
.stat-bar.compact {
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.05), rgba(16, 185, 129, 0.03));  /* 更低透明度 */
  border-bottom: 1px solid rgba(56, 189, 248, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.stat-bar .stat-text {
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  line-height: 1.4;
  flex: 1;
  white-space: nowrap;
}

.stat-bar .stat-text .highlight {
  color: #38bdf8;
  font-weight: 600;
}

.close-btn-small {
  width: 22px;
  height: 22px;
  min-width: 22px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 4px;
  color: #ef4444;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.close-btn-small:hover {
  background: rgba(239, 68, 68, 0.3);
  transform: scale(1.1);
}

.control-panel .panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.control-panel .panel-body::-webkit-scrollbar {
  width: 6px;
}

.control-panel .panel-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.control-panel .panel-body::-webkit-scrollbar-thumb {
  background: rgba(56, 189, 248, 0.3);
  border-radius: 3px;
}

/* 面板头部 */
.panel-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;  /* 减小内边距 */
  background: transparent;  /* 移除渐变背景 */
  border-bottom: 1px solid rgba(56, 189, 248, 0.2);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #38bdf8;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.close-btn-small {
  width: 22px;
  height: 22px;
  background: rgba(255, 255, 255, 0.08);  /* 透明度从 0.05 提高到 0.08 */
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s ease;
}

.close-btn-small:hover {
  background: rgba(255, 77, 77, 0.2);
  border-color: rgba(255, 77, 77, 0.4);
  color: #ff6b6b;
}

/* 面板主体 */
.panel-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  overflow-y: auto;
}

/* 三个独立模块卡片 - 统一风格 */
.module-card {
  background: rgba(0, 30, 60, 0.5);
  border: 1px solid rgba(0, 150, 255, 0.2);
  border-radius: 6px;
  padding: 10px 12px;
  position: relative;
  overflow: hidden;
}

/* 模块顶部高光线 */
.module-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 200, 255, 0.4), transparent);
}

/* 覆盖原有的 stat-section / action-section 透明样式 */
.stat-section.module-card {
  background: rgba(0, 30, 60, 0.5);
  border: 1px solid rgba(0, 150, 255, 0.2);
  border-radius: 6px;
  padding: 10px 12px;
}

.action-section.module-card {
  background: rgba(0, 30, 60, 0.5);
  border: 1px solid rgba(0, 150, 255, 0.2);
  border-radius: 6px;
  padding: 10px 12px;
}

.space-section.module-card {
  background: rgba(0, 30, 60, 0.5);
  border: 1px solid rgba(0, 150, 255, 0.2);
  border-radius: 6px;
  padding: 10px 12px;
}

/* 统计区域 */
.stat-section {
  background: transparent;  /* 完全透明 */
  border: none;  /* 移除边框 */
  border-radius: 0;
  padding: 8px 12px;  /* 减小内边距 */
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-label {
  color: rgba(0, 217, 255, 0.7);  /* 青色 */
  font-size: 12px;
  font-weight: 500;
}

.stat-value {
  color: #00d9ff;  /* 青色亮色 */
  font-size: 14px;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(0, 217, 255, 0.6);
}

.highlight-text {
  color: #00d9ff;  /* 青色高亮 */
  font-weight: 700;
  text-shadow: 0 0 10px rgba(0, 217, 255, 0.8);
}

.number {
  font-variant-numeric: tabular-nums;
}

/* 一键操作区域 */
.action-section {
  background: transparent;  /* 完全透明 */
  border: none;  /* 移除边框 */
  border-radius: 0;
  padding: 6px 0;  /* 简化间距 */
}

.mini-action-group {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.icon-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;  /* 调整内边距 */
  background: rgba(56, 189, 248, 0.15);  /* 稍微提高 */
  border: 1px solid rgba(56, 189, 248, 0.3);  /* 恢复边框 */
  border-radius: 4px;  /* 参考图的小圆角 */
  color: #38bdf8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn.with-text {
  width: auto;
  min-width: 56px;
}

.icon-btn .btn-text {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.icon-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.2);
}

.icon-btn:active {
  transform: translateY(0);
}

.dark-btn {
  background: rgba(100, 100, 100, 0.25);  /* 从 0.2 提高到 0.25 */
  border-color: rgba(100, 100, 100, 0.35);  /* 从 0.3 提高到 0.35 */
  color: rgba(255, 255, 255, 0.8);
}

.dark-btn:hover {
  background: rgba(150, 150, 150, 0.25);
  border-color: rgba(150, 150, 150, 0.4);
}

/* 左侧一键开关按钮：主体颜色对齐弹框全开/全关按钮（绿/红） */
.mini-action-group .icon-btn:first-child {
  background: rgba(0, 200, 120, 0.15);
  border-color: rgba(0, 200, 120, 0.45);
  color: #00e676;
}

.mini-action-group .icon-btn:first-child:hover {
  background: rgba(0, 200, 120, 0.3);
  border-color: rgba(0, 200, 120, 0.7);
  box-shadow: 0 0 14px rgba(0, 200, 120, 0.3);
}

.mini-action-group .icon-btn.dark-btn {
  background: rgba(255, 80, 80, 0.15);
  border-color: rgba(255, 80, 80, 0.45);
  color: #ff5252;
}

.mini-action-group .icon-btn.dark-btn:hover {
  background: rgba(255, 80, 80, 0.3);
  border-color: rgba(255, 80, 80, 0.7);
  box-shadow: 0 0 14px rgba(255, 80, 80, 0.3);
}

/* 地块列表区域 */
.space-section {
  flex: 1;
  min-height: 0;
}

.section-title {
  color: #00d9ff;  /* 青色，科技发光 */
  font-size: 13px;
  font-weight: 600;
  padding: 0 0 8px 8px;
  margin-bottom: 8px;
  border-left: 2px solid rgba(0, 150, 255, 0.6);
  text-transform: none;
  letter-spacing: normal;
  text-shadow: 0 0 8px rgba(0, 217, 255, 0.6);
  border-bottom: 1px dashed rgba(0, 150, 255, 0.2);
}

/* 虚拟滚动容器 - 限制高度，支持滚动 */
.space-list-scroll-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  max-height: 320px;  /* 限制最大高度 */
  padding-right: 4px;  /* 留出滚动条空间 */
}

/* 自定义滚动条 - 科技感 */
.space-list-scroll-container::-webkit-scrollbar {
  width: 5px;
}

.space-list-scroll-container::-webkit-scrollbar-track {
  background: rgba(0, 30, 60, 0.2);
  border-radius: 3px;
}

.space-list-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(0, 150, 255, 0.4);
  border-radius: 3px;
  transition: background 0.3s ease;
}

.space-list-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 200, 255, 0.6);
}

.space-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.space-item-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 6px;  /* 减小高度和左右内边距 */
  background: transparent;  /* 完全透明 */
  border: none;  /* 移除边框 */
  border-radius: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.space-item-row:hover {
  background: rgba(56, 189, 248, 0.15);  /* 更明显的 hover 效果 */
  border-color: transparent;
  transform: translateX(3px);  /* 增强左移效果 */
}

.space-item-row:active {
  transform: translateX(0);
}

.space-indicator {
  width: 8px;
  height: 8px;
  min-width: 8px;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.scene-indicator-icon {
  width: 10px;
  height: 10px;
  min-width: 10px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-name {
  color: #00d9ff;  /* 青色科技感 */
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 0 6px rgba(0, 217, 255, 0.5);
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-space {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-space.empty {
  color: rgba(255, 255, 255, 0.2);
}

.scene-info {
  color: #00d9ff;  /* 青色 */
  font-size: 11px;
  font-weight: 500;
  margin-right: 8px;
  flex-shrink: 0;
  text-shadow: 0 0 4px rgba(0, 217, 255, 0.4);
}

/* 详情按钮 */
.detail-btn {
  padding: 3px 6px;
  height: auto;
  min-width: 30px;
  background: rgba(0, 80, 150, 0.2);
  border: 1px solid rgba(0, 150, 255, 0.4);
  border-radius: 4px;
  color: #00d9ff;  /* 青色 */
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-right: 4px;
  text-shadow: 0 0 6px rgba(0, 217, 255, 0.5);
}

.detail-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.15);
}

/* 场景开/关按钮组 */
.scene-btn-group {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}

.scene-action-btn {
  padding: 3px 7px;
  height: auto;
  min-width: 24px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.scene-action-btn.on-btn {
  background: rgba(0, 200, 120, 0.15);
  border: 1px solid rgba(0, 200, 120, 0.4);
  color: #00e676;
}

.scene-action-btn.on-btn:hover {
  background: rgba(0, 200, 120, 0.3);
  border-color: rgba(0, 200, 120, 0.6);
  box-shadow: 0 0 10px rgba(0, 200, 120, 0.3);
}

.scene-action-btn.off-btn {
  background: rgba(255, 80, 80, 0.15);
  border: 1px solid rgba(255, 80, 80, 0.4);
  color: #ff5252;
}

.scene-action-btn.off-btn:hover {
  background: rgba(255, 80, 80, 0.3);
  border-color: rgba(255, 80, 80, 0.6);
  box-shadow: 0 0 10px rgba(255, 80, 80, 0.3);
}

/* 现代开关 - 更简洁 */
.toggle-switch {
  position: relative;
  width: 42px;
  height: 24px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: rgba(255, 255, 255, 0.08);  /* 更低透明度 */
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-slider:before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background: rgba(255, 255, 255, 0.5);  /* 更淡的滑块 */
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked + .toggle-slider {
  background: rgba(56, 189, 248, 0.3);  /* 更柔和的开启色 */
  border-color: rgba(56, 189, 248, 0.5);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(18px);
  background: #38bdf8;  /* 开启时显示蓝色 */
  box-shadow: 0 2px 8px rgba(56, 189, 248, 0.5);
}

/* 地块列表面板 */
.space-panel {
  position: absolute;
  right: 20px;
  top: 80px;
  width: 280px;
  max-height: calc(100vh - 200px);
  background: rgba(10, 22, 40, 0.95);
  border: 1px solid rgba(56, 189, 248, 0.4);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.2);
  z-index: 60000;  /* 高于地图标点，确保不被遮挡 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(16, 185, 129, 0.1));
  border-bottom: 1px solid rgba(56, 189, 248, 0.3);
}

.panel-header h3 {
  margin: 0;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.close-btn {
  width: 28px;
  height: 28px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 4px;
  color: #ef4444;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.4);
  transform: scale(1.1);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.panel-body::-webkit-scrollbar {
  width: 6px;
}

.panel-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.panel-body::-webkit-scrollbar-thumb {
  background: rgba(56, 189, 248, 0.3);
  border-radius: 3px;
}

.panel-body::-webkit-scrollbar-thumb:hover {
  background: rgba(56, 189, 248, 0.5);
}

.space-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px;
  margin-bottom: 6px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.space-item:hover {
  background: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.3);
  transform: translateX(-4px);
  box-shadow: 0 2px 8px rgba(56, 189, 248, 0.15);
}

.space-item:active {
  transform: translateX(-2px);
}

.space-color {
  width: 12px;
  height: 12px;
  min-width: 12px;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.space-name {
  flex: 1;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 500;
}

/* ========== 右上角统计面板 - 科技蓝主题 ========== */
.top-right-controls {
  position: absolute;
  top: 90px;  /* 与左上角整体管控按钮对齐 */
  right: 24px;
  z-index: 60000;  /* 高于地图标点（最高50000），确保统计面板不被遮挡 */
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

/* 统计切换按钮 - 精致科技风 */
.stats-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, rgba(0, 30, 60, 0.85) 0%, rgba(0, 20, 40, 0.75) 100%);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 150, 255, 0.4);
  border-radius: 6px;
  color: #00d9ff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 16px rgba(0, 100, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  text-shadow: 0 0 8px rgba(0, 217, 255, 0.6);
}

.stats-toggle-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(0, 200, 255, 0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.stats-toggle-btn:hover {
  background: linear-gradient(135deg, rgba(0, 40, 80, 0.9) 0%, rgba(0, 30, 60, 0.85) 100%);
  border-color: rgba(0, 217, 255, 0.6);
  box-shadow: 
    0 6px 24px rgba(0, 150, 255, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.stats-toggle-btn:hover::before {
  opacity: 1;
}

.stats-toggle-btn:active {
  transform: translateY(0);
}

.stats-toggle-btn svg {
  flex-shrink: 0;
  filter: drop-shadow(0 0 4px rgba(0, 217, 255, 0.6));
}

.toggle-label {
  white-space: nowrap;
  letter-spacing: 0.5px;
}

/* 统计面板 - 高不透明深蓝主题（92%不透明度） */
.stats-panel {
  width: 400px;  /* 加宽：容纳柱状图与运行时长对比表格（5列） */
  max-height: 560px;
  overflow-y: auto;
  background: rgba(10, 22, 40, 0.7);  /* 与整体管控面板透明度保持一致 */
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 150, 255, 0.35);  /* 提高边框透明度 */
  border-radius: 6px;
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(0, 150, 255, 0.05);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 滚动条美化 */
.stats-panel::-webkit-scrollbar {
  width: 6px;
}

.stats-panel::-webkit-scrollbar-track {
  background: rgba(0, 30, 60, 0.2);
  border-radius: 3px;
}

.stats-panel::-webkit-scrollbar-thumb {
  background: rgba(0, 150, 255, 0.4);
  border-radius: 3px;
  transition: background 0.3s ease;
}

.stats-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 200, 255, 0.6);
}

/* 图表区域通用样式 - 科技感 */
.chart-section,
.table-section {
  background: rgba(0, 30, 60, 0.15);
  border: 1px solid rgba(0, 150, 255, 0.15);
  border-radius: 6px;
  padding: 16px;
  position: relative;
  overflow: hidden;
}

.chart-section::before,
.table-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 200, 255, 0.3), transparent);
}

.chart-section h4,
.table-section h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #00d9ff;
  text-shadow: 0 0 12px rgba(0, 217, 255, 0.5);
  letter-spacing: 0.8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.chart-section h4::before,
.table-section h4::before {
  content: '';
  width: 3px;
  height: 14px;
  background: linear-gradient(180deg, #00d9ff, #0088ff);
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(0, 217, 255, 0.6);
}

/* 柱状图区域 - 优化宽度 */
.bar-chart-section {
  min-height: 200px;
}

.bar-chart-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 150px;
  padding: 0 4px;
  gap: 8px;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  max-width: 70px;  /* 限制每个条目的最大宽度 */
}

.bar-wrapper {
  position: relative;
  width: 100%;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.bar-fill {
  width: 36px;  /* 柱体宽度从48px减小到36px */
  min-width: 32px;
  background: linear-gradient(180deg, rgba(0, 200, 255, 0.9) 0%, rgba(0, 100, 255, 0.7) 100%);
  border-radius: 4px 4px 0 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 0 12px rgba(0, 150, 255, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  position: relative;
}

.bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%);
  border-radius: 4px 4px 0 0;
}

.bar-value {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 0 8px rgba(0, 217, 255, 0.6);
  white-space: nowrap;
}

.bar-label {
  font-size: 12px;  /* 字体从13px减小到12px */
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);  /* 提高一点颜色亮度 */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  white-space: nowrap;  /* 不换行 */
}

/* 运行时长按对比表格 - 精致科技风 */
.runtime-table {
  overflow-x: auto;
}

.runtime-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}

.runtime-table thead th {
  background: linear-gradient(180deg, rgba(0, 80, 150, 0.4) 0%, rgba(0, 50, 100, 0.25) 100%);
  color: rgba(0, 217, 255, 0.95);
  padding: 12px 6px;
  text-align: left;
  font-weight: 600;
  white-space: nowrap;  /* 表头文字不换行 */
  border-bottom: 2px solid rgba(0, 150, 255, 0.35);
  text-shadow: 0 0 8px rgba(0, 217, 255, 0.4);
  letter-spacing: 0.5px;
}

.runtime-table thead th:first-child {
  border-radius: 4px 0 0 0;
}

.runtime-table thead th:last-child {
  border-radius: 0 4px 0 0;
}

.runtime-table tbody td {
  padding: 11px 10px;
  color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(0, 100, 180, 0.12);
  transition: all 0.2s ease;
}

.runtime-table tbody tr {
  transition: all 0.2s ease;
}

.runtime-table tbody tr:hover {
  background: rgba(0, 150, 255, 0.1);
  box-shadow: inset 0 0 12px rgba(0, 150, 255, 0.1);
}

.runtime-table tbody tr:last-child td {
  border-bottom: none;
}

.runtime-table tbody td:first-child {
  color: #00d9ff;
  font-weight: 600;
  text-shadow: 0 0 6px rgba(0, 217, 255, 0.4);
}

.runtime-table .change-positive {
  color: #00e676;
  font-weight: 700;
  text-shadow: 0 0 6px rgba(0, 230, 118, 0.5);
}

.runtime-table .change-negative {
  color: #ff5252;
  font-weight: 700;
  text-shadow: 0 0 6px rgba(255, 82, 82, 0.5);
}

@media (max-width: 768px) {
  .stats-panel {
    width: calc(100vw - 48px);
    max-height: 480px;
  }
}

/* ===== 地块标点功能浮层 ===== */
.space-menu {
  position: fixed;
  z-index: 70000;
  width: 150px;
  background: linear-gradient(180deg, rgba(12, 28, 52, 0.97) 0%, rgba(8, 18, 36, 0.97) 100%);
  border: 1px solid rgba(0, 200, 255, 0.35);
  border-radius: 8px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 180, 255, 0.15);
  overflow: visible;
  animation: spaceMenuIn 0.18s ease-out;
  backdrop-filter: blur(12px);
}

@keyframes spaceMenuIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.space-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.space-menu-item:hover {
  background: rgba(0, 200, 255, 0.15);
  color: #00d9ff;
  padding-left: 18px;
}

/* 激活状态（点击后弹框打开时保持高亮） */
.space-menu-item.is-active {
  background: rgba(0, 200, 255, 0.25);
  color: #00d9ff;
  border-left: 3px solid #00d9ff;
  font-weight: 600;
  text-shadow: 0 0 8px rgba(0, 217, 255, 0.6);
}

.space-menu-item.is-active .menu-label {
  color: #00d9ff;
}

.menu-label {
  flex: 1;
}

.menu-arrow {
  color: rgba(0, 200, 255, 0.6);
  font-size: 12px;
}

/* 二级菜单（位于一级项内部，left:100% 相对一级项定位） */
.space-menu-item {
  position: relative;
}

.space-card {
  position: absolute;
  left: 100%;
  top: -4px;
  width: 240px;
  margin-left: 2px;
  background: linear-gradient(180deg, rgba(12, 28, 52, 0.98) 0%, rgba(8, 18, 36, 0.98) 100%);
  border: 1px solid rgba(0, 200, 255, 0.35);
  border-radius: 8px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  animation: spaceMenuIn 0.15s ease-out;
  overflow: hidden;
}

.space-card-title {
  padding: 9px 14px;
  color: #00d9ff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(0, 200, 255, 0.2);
}

/* 全开全关卡片 */
.switch-card-body {
  display: flex;
  gap: 8px;
  padding: 8px 14px;
}

.switch-btn {
  flex: 1;
  padding: 6px 0;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.switch-on {
  background: rgba(0, 200, 120, 0.15);
  border: 1px solid rgba(0, 200, 120, 0.45);
  color: #00e676;
}

.switch-on:hover {
  background: rgba(0, 200, 120, 0.3);
  border-color: rgba(0, 200, 120, 0.7);
  box-shadow: 0 0 14px rgba(0, 200, 120, 0.3);
}

.switch-off {
  background: rgba(255, 80, 80, 0.15);
  border: 1px solid rgba(255, 80, 80, 0.45);
  color: #ff5252;
}

.switch-off:hover {
  background: rgba(255, 80, 80, 0.3);
  border-color: rgba(255, 80, 80, 0.7);
  box-shadow: 0 0 14px rgba(255, 80, 80, 0.3);
}

/* 视频卡片 */
.video-card-body {
  padding: 10px;
  height: 150px;
}

.video-card-body :deep(.video-player-wrap) {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  overflow: hidden;
}

/* 视频列表卡片 */
.video-card-list {
  max-height: 320px;
  overflow-y: auto;
}

.video-card-item {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.video-card-item:last-child {
  border-bottom: none;
}

.video-item-name {
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-card-item :deep(.video-player-wrap) {
  width: 100%;
  height: 130px;
  border-radius: 6px;
  overflow: hidden;
}

/* 详情（回路）卡片 */
.detail-card-list {
  max-height: 260px;
  overflow-y: auto;
}

.circuit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.2s ease;
}

.circuit-row:hover {
  background: rgba(0, 200, 255, 0.12);
}

.circuit-name {
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 10px;
}

.circuit-status {
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.circuit-status.is-on {
  color: #00e676;
}

.circuit-status.is-off {
  color: #ff5252;
}

.space-submenu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.space-submenu-item:hover {
  background: rgba(0, 200, 255, 0.15);
  color: #fff;
}

.all-on:hover {
  background: rgba(0, 200, 120, 0.2);
  color: #00e676;
}

.all-off:hover {
  background: rgba(255, 80, 80, 0.2);
  color: #ff5252;
}

.space-submenu-empty {
  padding: 14px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  text-align: center;
}

/* ===== 视频监控弹框 ===== */
.video-modal-wrap {
  background: #0b1a2f;
  border-radius: 6px;
  /* 固定内容区高度：tab 导航约 52px + 播放器区 420px，空数据时保持一致 */
  height: 472px;
  overflow: hidden;
}

.video-modal-wrap :deep(.ant-spin-nested-loading),
.video-modal-wrap :deep(.ant-spin-container) {
  height: 100%;
}

/* 视频弹框空状态：撑满固定高度并垂直居中 */
.video-modal-wrap .space-submenu-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.video-modal-item {
  height: 420px;
  background: #060d1a;
  border-radius: 6px;
  overflow: hidden;
}

.video-modal-item :deep(.video-player-wrap) {
  width: 100%;
  height: 100%;
}

/* ===== 详情模式标点四页签弹框 ===== */
/* 内容区固定高度：四页签切换时弹框尺寸稳定（400px，视频页签播放器与之契合） */
.space-tabs :deep(.ant-tabs-content-holder) {
  height: 400px;
}

/* 页签内容撑满高度，保证上下居中生效 */
.space-tabs :deep(.ant-tabs-content) {
  height: 100%;
}

.space-tabs :deep(.ant-tabs-tabpane) {
  height: 100%;
}

/* 四个页签铺满弹框宽度（flex 平分） */
.space-tabs :deep(.ant-tabs-nav-list) {
  display: flex;
  width: 100%;
}

.space-tabs :deep(.ant-tabs-tab) {
  flex: 1;
  margin: 0 !important;
  padding: 8px 0 !important;
  justify-content: center;
  text-align: center;
  border-radius: 0 !important;
}

.space-tabs :deep(.ant-tabs-tab .ant-tabs-tab-btn) {
  width: 100%;
  text-align: center;
}

/* 四页签弹框内视频播放器：与内容区高度契合 */
.space-tabs .video-modal-item {
  height: 400px;
}

/* 1. 回路概览：标签 + 大数字 + 电流信息，垂直水平居中 */
.tabs-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  height: 100%;
}

.summary-nums {
  display: flex;
  align-items: center;
  gap: 14px;
}

.summary-num {
  font-size: 48px;
  font-weight: 700;
  color: #e8f4ff;
  line-height: 1;
  text-shadow: 0 0 12px rgba(56, 189, 248, 0.5);
}

.summary-num.summary-on {
  color: #00e676;
  text-shadow: 0 0 12px rgba(0, 230, 118, 0.5);
}

.summary-divider {
  font-size: 40px;
  color: rgba(255, 255, 255, 0.3);
}

.summary-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 1px;
}

/* 概览页签：电流信息 */
.summary-power {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.summary-power .power-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 1px;
}

.summary-power .power-num {
  font-size: 22px;
  font-weight: 600;
  color: #38bdf8;
  text-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
}

.summary-power .power-unit {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

/* 2. 一键开关：按钮与左侧面板样式一致，弹框内加大尺寸与间距，上下居中 */
.space-tabs .mini-action-group {
  height: 100%;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.space-tabs .mini-action-group .icon-btn {
  padding: 12px 28px;
  font-size: 14px;
}

.space-tabs .mini-action-group .icon-btn svg {
  width: 20px;
  height: 20px;
}

/* 4. 详情页签：回路表格容器（与内容区高度一致，表格与弹框契合） */
.space-tabs .circuit-vxe-table-wrap {
  height: 400px;
}

/* ===== 地块功能弹框内容（弹框头部/内容主题见文件底部全局样式） ===== */
.space-modal-subtitle {
  padding: 2px 2px 10px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  letter-spacing: 0.5px;
  border-bottom: 1px dashed rgba(0, 150, 255, 0.2);
  margin-bottom: 10px;
}

/* 全开全关弹框按钮（放大） */
.all-modal-body {
  padding: 6px 2px 2px;
}

.all-modal-body .switch-btn {
  padding: 14px 0;
  font-size: 15px;
  letter-spacing: 2px;
  border-radius: 6px;
}

/* 场景虚拟列表：场景名单元格（颜色指示点 + 名称） */
.scene-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.scene-cell-name {
  color: #e8f4ff;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 场景虚拟列表操作列按钮组 */
.scene-btn-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* tab 标签栏深色主题 */
.video-tabs {
  color: rgba(255, 255, 255, 0.85);
}

.video-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 12px;
}

.video-tabs :deep(.ant-tabs-nav-wrap) {
  overflow-x: auto;
}

.video-tabs :deep(.ant-tabs-tab) {
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(0, 200, 255, 0.25) !important;
  color: rgba(255, 255, 255, 0.7) !important;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.video-tabs :deep(.ant-tabs-tab-active) {
  background: rgba(0, 200, 255, 0.2) !important;
  border-color: rgba(0, 200, 255, 0.6) !important;
}

.video-tabs :deep(.ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: #00d9ff !important;
  font-weight: 600;
}

.scene-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.submenu-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scene-enable {
  font-size: 10px;
  flex-shrink: 0;
}

.scene-enable.is-on {
  color: #00e676;
}

.scene-enable.is-off {
  color: #ff5252;
}
</style>

<style>
/* ===== 地块功能弹框 / 视频弹框 深色科技主题 =====
   弹框经 teleport 渲染到 body，scoped 样式不生效，需全局样式（class + wrapClassName 均挂载到 .ant-modal-root） */
.video-modal .ant-modal-header,
.space-modal .ant-modal-header {
  background: linear-gradient(135deg, #102a4a 0%, #0a1a30 100%) !important;
  border-bottom: 1px solid rgba(0, 200, 255, 0.35) !important;
  border-radius: 8px 8px 0 0 !important;
  padding: 16px 24px !important;
  position: relative;
}

/* header 底部发光线条 */
.video-modal .ant-modal-header::after,
.space-modal .ant-modal-header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 217, 255, 0.55), transparent);
  pointer-events: none;
}

.video-modal .ant-modal-title,
.space-modal .ant-modal-title {
  color: #00d9ff !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(0, 217, 255, 0.55);
}

.video-modal .ant-modal-close,
.space-modal .ant-modal-close {
  color: rgba(255, 255, 255, 0.55) !important;
  background: rgba(0, 200, 255, 0.08) !important;
  border-radius: 50% !important;
  top: 15px !important;
  right: 15px !important;
  width: 30px !important;
  height: 30px !important;
  transition: all 0.25s ease;
}

.video-modal .ant-modal-close:hover,
.space-modal .ant-modal-close:hover {
  color: #ffffff !important;
  background: rgba(0, 200, 255, 0.28) !important;
  box-shadow: 0 0 14px rgba(0, 200, 255, 0.5);
  transform: rotate(90deg);
}

.video-modal .ant-modal-content,
.space-modal .ant-modal-content {
  background: linear-gradient(180deg, #0c1e38 0%, #081527 100%) !important;
  border: 1px solid rgba(0, 200, 255, 0.3) !important;
  border-radius: 8px !important;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7), 0 0 24px rgba(0, 180, 255, 0.18) !important;
}

/* 弹框遮罩 */
.video-modal .ant-modal-mask,
.space-modal .ant-modal-mask {
  background: rgba(2, 10, 22, 0.6) !important;
  backdrop-filter: blur(2px);
}

/* ===== 二次确认弹窗（Modal.confirm，全开全关/场景操作统一深色风格） =====
   wrapClassName: 'dark-confirm-modal' 挂载到 .ant-modal-wrap，全局生效；
   白色底在 .ant-modal-content（cssinjs 生成），需同时覆盖 content 与 confirm 两层 */
.dark-confirm-modal .ant-modal-content,
.dark-confirm-modal .ant-modal-confirm {
  background: linear-gradient(180deg, #15253c 0%, #0f1a2b 100%) !important;
}

.dark-confirm-modal .ant-modal-content {
  border: 1px solid rgba(0, 200, 255, 0.3) !important;
  border-radius: 8px !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55), 0 0 20px rgba(0, 180, 255, 0.15) !important;
}

.dark-confirm-modal .ant-modal-confirm .ant-modal-confirm-body {
  padding: 20px 24px 6px !important;
}

.dark-confirm-modal .ant-modal-confirm .ant-modal-confirm-title {
  color: #ffffff !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px;
}

.dark-confirm-modal .ant-modal-confirm .ant-modal-confirm-content {
  color: rgba(240, 245, 255, 0.85) !important;
  font-size: 13px !important;
  margin-top: 8px !important;
}

/* 警告图标：黄色警示，深底上更醒目 */
.dark-confirm-modal .ant-modal-confirm-body > .anticon {
  color: #ffc53d !important;
  font-size: 20px !important;
}

.dark-confirm-modal .ant-modal-confirm .ant-modal-confirm-btns {
  padding: 12px 24px 18px !important;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.dark-confirm-modal .ant-modal-confirm-btns .ant-btn {
  border-radius: 6px !important;
  height: 32px !important;
  padding: 0 18px !important;
  font-size: 13px !important;
}

/* 取消按钮：深灰底 + 浅灰边框 */
.dark-confirm-modal .ant-modal-confirm-btns .ant-btn-default {
  background: rgba(255, 255, 255, 0.06) !important;
  border-color: rgba(255, 255, 255, 0.35) !important;
  color: rgba(240, 245, 255, 0.85) !important;
}

.dark-confirm-modal .ant-modal-confirm-btns .ant-btn-default:hover {
  background: rgba(255, 255, 255, 0.12) !important;
  border-color: rgba(255, 255, 255, 0.6) !important;
  color: #ffffff !important;
}

/* 确认按钮：系统主蓝渐变 */
.dark-confirm-modal .ant-modal-confirm-btns .ant-btn-primary {
  background: linear-gradient(135deg, #409eff 0%, #6b5ce7 100%) !important;
  border: none !important;
  color: #ffffff !important;
  box-shadow: 0 0 12px rgba(64, 158, 255, 0.35);
}

.dark-confirm-modal .ant-modal-confirm-btns .ant-btn-primary:hover {
  background: linear-gradient(135deg, #55aaff 0%, #7d6ff0 100%) !important;
  box-shadow: 0 0 16px rgba(64, 158, 255, 0.5) !important;
}

/* ===== 弹框层级：高于一级列表浮层（space-menu z-index: 70000） ===== */
.video-modal.ant-modal-root,
.space-modal.ant-modal-root,
.video-modal.ant-modal-wrap,
.space-modal.ant-modal-wrap,
.video-modal .ant-modal-wrap,
.space-modal .ant-modal-wrap,
.video-modal .ant-modal-mask,
.space-modal .ant-modal-mask {
  z-index: 90000 !important;
}

/* ===== 场景/回路 vxe-table 虚拟列表深色主题 =====
   vxe-table 4.7 全部颜色基于 CSS 变量（由 [data-vxe-ui-theme=light] 定义），
   在表格根元素重新定义变量即可全局继承生效；另加元素级 !important 双保险 */
.scene-vxe-table-wrap,
.circuit-vxe-table-wrap {
  /* 主题变量覆盖 */
  --vxe-ui-font-color: rgba(255, 255, 255, 0.85);
  --vxe-ui-font-primary-color: #00d9ff;
  --vxe-ui-font-lighten-color: rgba(255, 255, 255, 0.55);
  --vxe-ui-font-darken-color: #ffffff;
  --vxe-ui-font-disabled-color: rgba(255, 255, 255, 0.25);
  --vxe-ui-layout-background-color: #0b1a2f;
  --vxe-ui-table-background-color: transparent;
  --vxe-ui-table-border-color: rgba(0, 200, 255, 0.15);
  --vxe-ui-table-border-radius: 6px;
  --vxe-ui-table-header-background-color: rgba(0, 40, 80, 0.35);
  --vxe-ui-table-header-hover-background-color: rgba(0, 60, 110, 0.45);
  --vxe-ui-table-header-font-color: #00d9ff;
  --vxe-ui-table-header-font-weight: 600;
  --vxe-ui-table-row-hover-background-color: rgba(0, 200, 255, 0.1);
  --vxe-ui-table-row-hover-color: #ffffff;
  --vxe-ui-table-row-striped-background-color: rgba(255, 255, 255, 0.02);
  --vxe-ui-table-row-hover-striped-background-color: rgba(0, 200, 255, 0.12);
  --vxe-ui-table-column-hover-background-color: rgba(0, 200, 255, 0.08);
  --vxe-ui-table-column-current-background-color: rgba(0, 200, 255, 0.08);
  --vxe-ui-table-row-current-background-color: rgba(0, 200, 255, 0.12);
  --vxe-ui-base-popup-border-color: rgba(0, 200, 255, 0.25);
  --vxe-ui-base-popup-box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  /* 元素级兜底 */
  background: transparent !important;
  color: rgba(255, 255, 255, 0.85) !important;
  font-size: 13px;
}

.scene-vxe-table-wrap .vxe-table--header-wrapper,
.circuit-vxe-table-wrap .vxe-table--header-wrapper {
  background: rgba(0, 40, 80, 0.35) !important;
}

.scene-vxe-table-wrap .vxe-header--column,
.circuit-vxe-table-wrap .vxe-header--column {
  background: transparent !important;
  color: #00d9ff !important;
  font-weight: 600;
  border-bottom: 1px solid rgba(0, 200, 255, 0.25) !important;
}

.scene-vxe-table-wrap .vxe-body--column,
.circuit-vxe-table-wrap .vxe-body--column {
  background: transparent !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  color: rgba(255, 255, 255, 0.85) !important;
}

.scene-vxe-table-wrap .vxe-row:hover .vxe-body--column,
.circuit-vxe-table-wrap .vxe-row:hover .vxe-body--column {
  background: rgba(0, 200, 255, 0.1) !important;
  color: #ffffff !important;
}

/* 单元格内边距：列间距更透气 */
.scene-vxe-table-wrap .vxe-cell,
.circuit-vxe-table-wrap .vxe-cell {
  padding: 0 10px !important;
}

/* 固定列分隔阴影 */
.scene-vxe-table-wrap .vxe-table--fixed-left-wrapper,
.circuit-vxe-table-wrap .vxe-table--fixed-left-wrapper {
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.25);
}

.scene-vxe-table-wrap .vxe-table--border-line,
.circuit-vxe-table-wrap .vxe-table--border-line,
.scene-vxe-table-wrap .vxe-table--main-wrapper,
.circuit-vxe-table-wrap .vxe-table--main-wrapper {
  border-color: rgba(0, 200, 255, 0.15) !important;
}

.scene-vxe-table-wrap .vxe-table--body-wrapper,
.circuit-vxe-table-wrap .vxe-table--body-wrapper,
.scene-vxe-table-wrap .vxe-table--virtual-wrapper,
.circuit-vxe-table-wrap .vxe-table--virtual-wrapper {
  background: transparent !important;
}

.scene-vxe-table-wrap .vxe-table--body-wrapper::-webkit-scrollbar,
.circuit-vxe-table-wrap .vxe-table--body-wrapper::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scene-vxe-table-wrap .vxe-table--body-wrapper::-webkit-scrollbar-thumb,
.circuit-vxe-table-wrap .vxe-table--body-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 150, 255, 0.4);
  border-radius: 3px;
}

.scene-vxe-table-wrap .vxe-table--body-wrapper::-webkit-scrollbar-track,
.circuit-vxe-table-wrap .vxe-table--body-wrapper::-webkit-scrollbar-track {
  background: rgba(0, 30, 60, 0.2);
}

/* ===== 场景列表单元格内容（teleport 后 scoped 可能失效，全局兜底） ===== */
.scene-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.scene-indicator-icon {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 6px currentColor;
}

.scene-cell-name {
  flex: 1;
  min-width: 0;
  color: #e8f4ff;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 场景行中间详情按钮：玻璃态描边风格 */
.scene-mid-detail {
  flex-shrink: 0;
  margin: 0 !important;
  padding: 3px 10px;
  height: 24px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 80, 150, 0.15);
  border: 1px solid rgba(0, 150, 255, 0.45);
  color: #00d9ff;
  text-shadow: 0 0 6px rgba(0, 217, 255, 0.5);
  transition: all 0.2s ease;
}

.scene-mid-detail:hover {
  background: rgba(56, 189, 248, 0.25);
  border-color: rgba(56, 189, 248, 0.7);
  box-shadow: 0 0 12px rgba(0, 200, 255, 0.35);
  transform: translateY(-1px);
}

/* 场景行按钮组：统一玻璃态描边风格（详情/开/关） */
.scene-btn-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.scene-btn-group .detail-btn,
.scene-btn-group .scene-action-btn {
  padding: 3px 10px;
  height: 24px;
  min-width: 40px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(0, 80, 150, 0.15);
  border: 1px solid rgba(0, 150, 255, 0.45);
  color: #00d9ff;
  text-shadow: 0 0 6px rgba(0, 217, 255, 0.5);
  transition: all 0.2s ease;
}

.scene-btn-group .detail-btn:hover {
  background: rgba(56, 189, 248, 0.25);
  border-color: rgba(56, 189, 248, 0.7);
  box-shadow: 0 0 12px rgba(0, 200, 255, 0.35);
  transform: translateY(-1px);
}

.scene-btn-group .on-btn {
  background: rgba(16, 120, 80, 0.15);
  border-color: rgba(34, 197, 94, 0.5);
  color: #34d399;
  text-shadow: 0 0 6px rgba(52, 211, 153, 0.5);
}

.scene-btn-group .on-btn:hover {
  background: rgba(34, 197, 94, 0.25);
  border-color: rgba(34, 197, 94, 0.8);
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.35);
  transform: translateY(-1px);
}

.scene-btn-group .off-btn {
  background: rgba(180, 40, 40, 0.15);
  border-color: rgba(239, 68, 68, 0.5);
  color: #f87171;
  text-shadow: 0 0 6px rgba(248, 113, 113, 0.5);
}

.scene-btn-group .off-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.8);
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.35);
  transform: translateY(-1px);
}

/* 回路状态徽章（全局兜底） */
.circuit-vxe-table-wrap .circuit-status {
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.circuit-vxe-table-wrap .circuit-status.is-on {
  color: #00e676;
  text-shadow: 0 0 8px rgba(0, 230, 118, 0.45);
}

.circuit-vxe-table-wrap .circuit-status.is-off {
  color: #ff5252;
  text-shadow: 0 0 8px rgba(255, 82, 82, 0.45);
}
</style>
