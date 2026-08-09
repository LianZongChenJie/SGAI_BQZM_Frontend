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
            <div class="section-title-row">
              <div class="section-title">场景列表</div>
              <!-- 区域筛选下拉框：展示区域名称，支持模糊搜索，选择后筛选对应场景（写法参考 equipmentMonitoring 场景配置筛选） -->
              <a-select
                v-model:value="selectedAreaFilter"
                placeholder="全部"
                :options="areaFilterOptions"
                :allow-clear="selectedAreaFilter !== 'all'"
                style="width: 140px"
                popup-class-name="scene-area-dropdown"
                class="scene-area-select"
              />
            </div>
            <div class="space-list-scroll-container">
              <div class="space-list">
                <div 
                  v-for="(scene, index) in filteredSceneList" 
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
      <button
        class="stats-toggle-btn"
        :class="{ 'is-active': showStatsPanel }"
        @click="toggleStatsPanel"
        title="查看统计数据"
      >
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
        :aria-pressed="activeMode === 'area'"
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
        :aria-pressed="activeMode === 'detail'"
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
        <span class="menu-label">一键开关</span>
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
      title="一键开关"
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
      width="600px"
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
            height="480"
            :show-header="false"
            :row-config="{ keyField: 'id', height: 60 }"
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
      width="540px"
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
            <vxe-column field="name" title="回路名称" min-width="170" show-overflow sortable></vxe-column>
            <vxe-column field="electricCurrent" title="电流" min-width="80" show-overflow sortable></vxe-column>
            <vxe-column field="status" title="状态" width="70" align="center" sortable>
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
        <!-- 1. 灯光控制（整合页签）：一键开关（上）→ 回路概览（中）→ 回路列表（下，左上侧展示已开启/总回路数） -->
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
        <!-- 2. 监控视频（单独页签，与综合预览页一致：写死地址前缀拼接 monitorAdr，不调接口） -->
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

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MapView from './map.vue'
import SceneDetailModal from './components/SceneDetailModal.vue'
import { useScreenScale } from '../useScreenScale'

// 大屏自适应：动态 rem 基准（1rem = 100px @1920），样式统一 rem + flex + vw/vh；
// teleport 弹窗渲染到 body 后 rem 依然基于 html 根字号，同样随屏缩放
useScreenScale()
import { getAllCircuitApi, getAllSpaceApi, getRunTimeCompareApi, getSceneSpaceApi, getVideoListBySpaceApi, allOnApi, allOffApi } from '../comprehensivePreview/comprehensivePreview.api'
import { getCircuitListApi, getAllSpace } from '@/api/baseSettingBqZm'
import { postSceneControlApi, getAreaListAllTagApi, getLightingPlanAPiNew, planDetailApiNew } from '@/api/equipmentMonitoring'
import VideoPlayer from '../equipmentMonitoring/components/VideoPlayer.vue'
import { setAreaOpenApi, setAreaCloseApi } from '@/api/baseSettingBqZm';
import { message } from 'ant-design-vue'
import ConfirmModal from '../equipmentMonitoring/components/ConfirmModal.vue'

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

// 一键开关 / 场景模式 / 详情弹框显隐
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
// area/getAllSpace 返回的全量地块（每条含 spaceId / spaceName）
const allAreaSpaceOptions = ref<any[]>([])
// 最终 spaceId 列表：由有 tagId 的场景详情（/scene/detail）areaList.space 去重得到，替代 district/all 的 spaceIds 字段关联
const finalSpaceIdList = ref<number[]>([])

// 场景列表标签筛选：下拉框选项来自 district/all 返回的地块数据（取 id / districtName 字段），
// 地块 id 即场景数据中的 tagId（与设备监控页标签体系一致）；第一条固定为「全部」（value='all'，选中即展示所有且不显示清除按钮）
const selectedAreaFilter = ref<string | undefined>(undefined)
const areaFilterOptions = computed(() => {
  const options: { label: string; value: string }[] = [{ label: '全部', value: 'all' }]
  spaceList.value.forEach((s: any) => {
    options.push({ label: s.name || String(s.id), value: String(s.id) })
  })
  return options
})

// 取场景的标签 id（兼容 tagId / tagIds 字段），无标签时返回 undefined
function getSceneTagId(item: any): any {
  const t = item?.tagId ?? item?.tagIds
  return t == null || t === '' ? undefined : t
}

// 筛选后的场景列表：数据直接来自 scene/listPage（allTagScenes），按场景 tagId 与板块 id（district/all 的地块 id，同源）对应归属；
// 只展示有 tagId 的场景（无标签场景不展示），并给场景打上归属地块 id（_spaceId）；
// 未选或选「全部」展示所有地块的场景，选中后按场景 tagId 匹配筛选（与场景模式弹框的匹配逻辑一致）
const filteredSceneList = computed(() => {
  const allScenes: any[] = []
  // tagId → 板块映射：spaceList.id（district/all）与场景 tagId 同源
  const boardMap = new Map(spaceList.value.map((s: any) => [String(s.id), s]))
  allTagScenes.value.forEach((item: any) => {
    // 只展示有 tagId 的场景
    if (getSceneTagId(item) == null) return
    const space = boardMap.get(String(getSceneTagId(item)))
    allScenes.push({
      ...item,
      id: item.id || item.sceneId,
      name: item.sceneName || item.planName || '-',
      color: item.status === '开启' ? '#52c41a' : item.status === '关闭' ? '#ff4d4f' : '#38bdf8',
      enabled: item.status === '开启',
      _spaceId: space?.id,
      _spaceName: space?.name,
    })
  })
  if (!selectedAreaFilter.value || selectedAreaFilter.value === 'all') return allScenes
  return allScenes.filter((s) => String(getSceneTagId(s)) === String(selectedAreaFilter.value))
})

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
    // 标点创建后立即用已缓存的状态点亮/熄灭（数据可能早于标点加载完成，直接更新会因标点不存在而丢失）
    applyAllSpaceMarkerStates()
    // 点击地块模式时批量请求所有地块的场景数据，
    // 请求完成后按 circuits 状态更新标点亮/灭（任一回路开启=亮灯，否则熄灭）
    fetchAllSpaceSceneData()
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

// 打开场景模式弹框（列表数据来自 scene/listPage，按地块 id 匹配 tagId 过滤）
async function openSpaceSceneModal(spaceName: string) {
  currentSpaceName.value = spaceName
  sceneModalVisible.value = true
  sceneModalLoading.value = true
  try {
    // 确保有 tagId 的场景列表已加载（弹框列表数据源）；已加载过则直接复用，为空则重新请求一次
    if (allTagScenes.value.length === 0) {
      await fetchTagSceneList()
      if (allTagScenes.value.length === 0) {
        console.warn('[index] 场景模式弹框：场景列表仍为空（listPage 无有 tagId 的场景或接口失败）')
      }
    }
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


// 地块显示名（space-boundaries.json 标点名）与 district/all 的 districtName 不一致时的映射，
// 用于点击标点（JSON 名）也能匹配到 spaceList 中的 spaceIds；
// 目前 JSON 标点名已与接口 districtName 保持一致，该映射仅作兼容兜底
const SPACE_NAME_ALIAS: Record<string, string> = {
  '通明湖': '群明湖',
  '制氧区域': '制氧区',
  '首钢园服贸会': '服贸会区',
  // 标点/接口写法不一时双向兜底（群明湖=群名湖为同一地块的两种写法）
  '群名湖': '群明湖',
  '群明湖': '群名湖',
}

// 将地块名归一化为 spaceList 中的规范名（districtName）；映射不到时返回原值
function normalizeSpaceName(spaceName: string): string {
  if (!spaceName) return spaceName
  if (spaceList.value.some((s: any) => s.name === spaceName)) return spaceName
  const alias = SPACE_NAME_ALIAS[spaceName]
  if (alias && spaceList.value.some((s: any) => s.name === alias)) return alias
  return spaceName
}

// 获取地块所有可能的标点名（原值 + 归一化名 + SPACE_NAME_ALIAS 反查的 JSON 标点名），
// 用于 updateSpaceMarkerState 匹配 DOM 标点：批量请求传的是 spaceList 的 districtName，标点 DOM 名是 JSON 标点名，两者写法可能不一致
function getSpaceMarkerNames(spaceName: string): string[] {
  const names = new Set<string>()
  const normName = normalizeSpaceName(spaceName)
  names.add(spaceName)
  names.add(normName)
  for (const [jsonName, districtName] of Object.entries(SPACE_NAME_ALIAS)) {
    if (districtName === normName) names.add(jsonName)
  }
  return Array.from(names)
}

// 将接口返回的 spaceIds（逗号分隔字符串，如 "901,902"；或数组；或空字符串/空数组）解析为数字数组
function parseSpaceIds(spaceIds: any): number[] {
  if (spaceIds == null) return []
  const arr = Array.isArray(spaceIds)
    ? spaceIds
    : String(spaceIds)
        .replace(/[\[\]\s]/g, '')
        .split(',')
  return arr.map((v: any) => Number(v)).filter((n: number) => !isNaN(n) && n > 0)
}

// 按 id 合并数组（保留顺序，id 相同只保留第一个；无 id 的项直接追加）
function mergeById(list: any[], incoming: any): any[] {
  if (!Array.isArray(incoming)) return list
  const exists = new Set(list.map((i: any) => i?.id).filter((v: any) => v != null))
  for (const item of incoming) {
    if (item?.id == null || !exists.has(item.id)) {
      list.push(item)
      if (item?.id != null) exists.add(item.id)
    }
  }
  return list
}

// 从 getSceneSpaceApi 返回的 result 中取场景列表（scenes 为场景数组）
function getSceneListFromRes(res: any): any[] {
  return Array.isArray(res?.scenes) ? res.scenes : []
}

// 从 getSceneSpaceApi 返回的 result 中取回路列表（circuits 为回路数组）
function getCircuitListFromRes(res: any): any[] {
  return Array.isArray(res?.circuits) ? res.circuits : []
}

// spaceId 级数据缓存（请求成功即写入，含空结果；同一 spaceId 被多个地块引用时只请求一次）
const spaceDataById = ref<Record<string, any>>({})
// spaceId 级请求中的 Promise（并发请求同一 spaceId 时等待同一次请求，避免重复）
const spaceDataPromiseById: Record<string, Promise<any>> = {}

// 获取某个 spaceId 的场景/回路数据（/scene/space），带 spaceId 级缓存与请求中防重；
// 成功（含空结果）返回 { scenes, circuits } 并缓存；失败返回 null（不缓存，可重试）
async function fetchSpaceDataById(sid: number | string): Promise<any> {
  const key = String(sid)
  if (spaceDataById.value[key]) return spaceDataById.value[key]
  if (spaceDataPromiseById[key]) return spaceDataPromiseById[key]
  spaceDataPromiseById[key] = (async () => {
    try {
      const res: any = await getSceneSpaceApi(key)
      if (res) {
        const data = {
          scenes: mergeById([], getSceneListFromRes(res)),
          circuits: mergeById([], getCircuitListFromRes(res)),
        }
        spaceDataById.value[key] = data
        return data
      }
      return null
    } catch (e) {
      console.error(`[index] spaceId=${key} 场景接口请求失败:`, e)
      return null
    } finally {
      delete spaceDataPromiseById[key]
    }
  })()
  return spaceDataPromiseById[key]
}

// 预加载某个地块的场景/回路数据（按需请求，带缓存；保存完整返回：scenes 与 circuits 同级）
async function fetchSpaceSceneData(spaceName: string) {
  // 名称归一化：JSON 标点名（制氧区域/通明湖/首钢园服贸会）与 districtName（制氧区/群明湖/服贸会区）不一致，
  // 统一映射为 spaceList 中的规范名，保证批量请求与点击标点共用同一份缓存
  const key = normalizeSpaceName(spaceName)
  // 已成功请求过（有缓存）直接返回，避免重复请求（如初始化后再点地块模式不再重新调用）
  if (spaceSceneDataMap.value[key]) return
  const space = spaceList.value.find((s: any) => s.name === key)
  // spaceId 来源：spaceList 中该地块归属的 spaceId 数组（由场景详情 areaList.space 按 districtId 归属组装）
  const spaceIds: number[] = parseSpaceIds(space?.spaceIds)
  if (spaceIds.length === 0) {
    console.warn(`[index] 地块 [${key}] 无 spaceIds，跳过状态更新`)
    return
  }
  try {
    spaceSceneLoadingMap.value[key] = true
    console.log(`[index] 地块 [${key}] 合并 spaceId 数据:`, spaceIds)
    // 每个 spaceId 走 spaceId 级缓存（同一 spaceId 只请求一次），再按 id 合并到地块
    const merged: any = { scenes: [], circuits: [] }
    let hasError = false
    const results = await Promise.all(
      spaceIds.map(async (sid) => {
        const r = await fetchSpaceDataById(sid)
        if (r === null) hasError = true
        return r
      }),
    )
    results.forEach((res) => {
      if (!res) return
      merged.scenes = mergeById(merged.scenes, res.scenes || [])
      merged.circuits = mergeById(merged.circuits, res.circuits || [])
    })
    if (merged.scenes.length || merged.circuits.length) {
      // 更新地块标点状态：circuits 中任一回路 status === '开启' → 亮灯，否则熄灭（空数组/无 circuits 均熄灭）
      // 短路遍历：发现第一个开启回路立即终止，避免全量扫描（最好 O(1)，最坏 O(n)，空间 O(1)）
      let isOn = false
      for (const c of merged.circuits) {
        if (c.status === '开启') {
          isOn = true
          break
        }
      }
      // 状态缓存进数据缓存（_isOn），供标点创建后重放：数据请求完成时标点可能尚未绘制，直接更新会因 DOM 不存在而丢失
      spaceSceneDataMap.value[key] = { ...merged, _isOn: isOn }
      // 用所有可能的标点名更新（districtName 与 JSON 标点名写法可能不一致）
      getSpaceMarkerNames(spaceName).forEach((n) => {
        mapViewRef.value?.updateSpaceMarkerState?.(n, isOn)
      })
    } else if (hasError) {
      // 所有请求均失败时按无开启回路处理，标点置为熄灭（不写缓存，下次可重试）
      getSpaceMarkerNames(spaceName).forEach((n) => {
        mapViewRef.value?.updateSpaceMarkerState?.(n, false)
      })
    }
  } finally {
    spaceSceneLoadingMap.value[key] = false
  }
}

// 确保地块数据已加载（未加载且未请求中时发起请求，返回完整数据或 null）
async function ensureSpaceSceneData(spaceName: string): Promise<any | null> {
  const key = normalizeSpaceName(spaceName)
  const loaded = spaceSceneDataMap.value[key]
  if (loaded) return loaded
  if (spaceSceneLoadingMap.value[key]) return null
  await fetchSpaceSceneData(spaceName)
  return spaceSceneDataMap.value[key] || null
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

// 将已缓存的地块灯泡状态重放到标点上（标点创建晚于数据加载时，直接用缓存状态点亮/熄灭）
function applyAllSpaceMarkerStates() {
  spaceList.value.forEach((space: any) => {
    const key = normalizeSpaceName(space.name)
    const data = spaceSceneDataMap.value[key]
    // 优先用缓存的 _isOn；兼容旧缓存（无 _isOn 时按 circuits 实时判断）
    const isOn =
      data?._isOn ??
      (Array.isArray(data?.circuits) ? data.circuits.some((c: any) => c.status === '开启') : false)
    console.log(`[index] 重放灯泡状态: ${space.name} → ${isOn ? '亮' : '灭'}`)
    getSpaceMarkerNames(space.name).forEach((n) => {
      mapViewRef.value?.updateSpaceMarkerState?.(n, isOn)
    })
  })
}

// 从 getSceneSpaceApi 返回的 result.circuits 中获取当前地块的回路列表（与 scenes 同级）
function getSpaceCircuitListFromApi(spaceName: string): any[] {
  const data = spaceSceneDataMap.value[normalizeSpaceName(spaceName)];
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
// 场景模式弹框列表：数据来自 scene/listPage 返回的有 tagId 的场景，按当前地块 id 匹配 tagId 过滤
const spaceSceneList = computed(() => {
  const space = spaceList.value.find((s: any) => s.name === normalizeSpaceName(currentSpaceName.value))
  if (!space) {
    console.warn('[index] 场景模式弹框：当前地块未匹配到 spaceList，', {
      currentSpaceName: currentSpaceName.value,
      normalizeName: normalizeSpaceName(currentSpaceName.value),
      spaceListNames: spaceList.value.map((s: any) => s.name),
    })
    return []
  }
  const matched = allTagScenes.value.filter((item: any) => String(getSceneTagId(item)) === String(space.id))
  if (allTagScenes.value.length && !matched.length) {
    console.warn('[index] 场景模式弹框：无匹配场景', {
      spaceName: space.name,
      spaceId: space.id,
      sceneTagIds: allTagScenes.value.map((item: any) => getSceneTagId(item)),
      sceneTagNames: allTagScenes.value.map((item: any) => item.tagName),
    })
  }
  return matched.map((item: any, idx: number) => ({
    ...item,
    id: item.id || item.sceneId || idx,
    // 名称字段兼容：接口字段为 sceneName / planName，统一回退到 name 供确认弹框等场景使用
    name: item.name || item.sceneName || item.planName || '-',
    sceneName: item.sceneName || item.planName || '-',
    color: defaultColors[idx % defaultColors.length],
    enabled: item.status === '开启' || item.enabled === true,
  }))
})
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

// 统一二次确认弹窗（提示样式：标题栏“提示” + 蓝色信息图标 + 动作词高亮，同 comprehensivePreview ConfirmModal）
const confirmModalRef = ref<InstanceType<typeof ConfirmModal> | null>(null)
function showLightConfirm(opts: {
  content: string
  okText?: string
  onOk: () => void | Promise<void>
}) {
  confirmModalRef.value?.showModal(opts)
}

// 四页签弹框全开（调用 setAreaOpenApi，按 areaId）
function handleLightAreaOn() {
  if (!lightAreaId.value) {
    message.warning('该标点无地块 ID，无法执行全开')
    return
  }
  showLightConfirm({
    content: `确定要 <strong class="tip-action">全开</strong> 地块“${lightAreaName.value || '该标点'}”的所有回路吗？`,
    onOk: async () => {
      try {
        await setAreaOpenApi({ id: lightAreaId.value })
        message.success('全开成功')
        // 刷新回路列表：表格状态与左上侧“已开启回路数/总回路数”同步更新
        await loadLightCircuit(lightAreaId.value)
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
    content: `确定要 <strong class="tip-action">全关</strong> 地块“${lightAreaName.value || '该标点'}”的所有回路吗？`,
    onOk: async () => {
      try {
        await setAreaCloseApi({ id: lightAreaId.value })
        message.success('全关成功')
        // 刷新回路列表：表格状态与左上侧“已开启回路数/总回路数”同步更新
        await loadLightCircuit(lightAreaId.value)
      } catch (error) {
        console.error('全关失败:', error)
        message.error('全关失败，请重试')
      }
    },
  })
}

// 地块级全开（/plan/control：对当前板块匹配的场景循环调用 allOnApi，参数用场景自身数据，与场景模式弹框的匹配逻辑一致）
function handleSpaceAllOn(spaceName: string) {
  const space = spaceList.value.find((s: any) => s.name === normalizeSpaceName(spaceName))
  if (!space?.id) {
    message.warning('该地块无 ID，无法执行全开')
    return
  }
  // 场景模式同款匹配：板块 id（spaceList.id）与场景 tagId 对应，取该板块匹配的场景作为控制参数来源
  const scenes = allTagScenes.value.filter((item: any) => String(getSceneTagId(item)) === String(space.id))
  if (scenes.length === 0) {
    message.warning(`地块【${spaceName}】无匹配场景，无法执行全开`)
    return
  }
  console.log('[bigGis] 地块全开场景列表:', scenes.map((s: any) => ({ id: s.id, sceneName: s.sceneName || s.planName, relIds: s.relIds, relType: s.relType })))
  showLightConfirm({
    content: `确定要 <strong class="tip-action">全开</strong> 地块“${spaceName}”的 ${scenes.length} 个场景吗？`,
    onOk: async () => {
      let successCount = 0
      let failCount = 0
      await Promise.all(
        scenes.map(async (scene: any) => {
          try {
            await allOnApi({
              operationType: '开启',
              relIds: scene.relIds,
              relType: scene.relType,
              sceneId: scene.id,
            })
            successCount++
          } catch (error) {
            failCount++
            console.error(`[bigGis] 地块 [${spaceName}] 场景 ${scene.id} 全开失败:`, error)
          }
        }),
      )
      if (failCount === 0) {
        message.success(`【${spaceName}】全开指令已下发（${successCount} 个场景）`)
      } else if (successCount > 0) {
        message.warning(`【${spaceName}】全开：${successCount} 个成功，${failCount} 个失败`)
      } else {
        message.error('全开失败，请重试')
      }
      allModalVisible.value = false
    },
  })
}

// 地块级全关（/plan/control：对当前板块匹配的场景循环调用 allOffApi，参数用场景自身数据，与场景模式弹框的匹配逻辑一致）
function handleSpaceAllOff(spaceName: string) {
  const space = spaceList.value.find((s: any) => s.name === normalizeSpaceName(spaceName))
  if (!space?.id) {
    message.warning('该地块无 ID，无法执行全关')
    return
  }
  // 场景模式同款匹配：板块 id（spaceList.id）与场景 tagId 对应，取该板块匹配的场景作为控制参数来源
  const scenes = allTagScenes.value.filter((item: any) => String(getSceneTagId(item)) === String(space.id))
  if (scenes.length === 0) {
    message.warning(`地块【${spaceName}】无匹配场景，无法执行全关`)
    return
  }
  console.log('[bigGis] 地块全关场景列表:', scenes.map((s: any) => ({ id: s.id, sceneName: s.sceneName || s.planName, relIds: s.relIds, relType: s.relType })))
  showLightConfirm({
    content: `确定要 <strong class="tip-action">全关</strong> 地块“${spaceName}”的 ${scenes.length} 个场景吗？`,
    onOk: async () => {
      let successCount = 0
      let failCount = 0
      await Promise.all(
        scenes.map(async (scene: any) => {
          try {
            await allOffApi({
              operationType: '关闭',
              relIds: scene.relIds,
              relType: scene.relType,
              sceneId: scene.id,
            })
            successCount++
          } catch (error) {
            failCount++
            console.error(`[bigGis] 地块 [${spaceName}] 场景 ${scene.id} 全关失败:`, error)
          }
        }),
      )
      if (failCount === 0) {
        message.success(`【${spaceName}】全关指令已下发（${successCount} 个场景）`)
      } else if (successCount > 0) {
        message.warning(`【${spaceName}】全关：${successCount} 个成功，${failCount} 个失败`)
      } else {
        message.error('全关失败，请重试')
      }
      allModalVisible.value = false
    },
  })
}

// ==================== 一键开关场景信息（复用综合预览页：/plan/control 场景级控制） ====================
// 进入页面先查询所有场景（/scene/listPage），再按固定场景 id 过滤出目标场景（relIds / relType 等），全开/全关时作为 /plan/control 参数
const SCENE_ID = '2086280558308143106'
const sceneInfo = ref<any>(null)

/** 查询场景信息（/scene/listPage?pageNo=1&pageSize=999 全量查询后按场景 id 过滤） */
async function loadSceneInfo() {
  try {
    const data: any = await getLightingPlanAPiNew({ pageNo: 1, pageSize: 999 })
    // 兼容分页结构（records/list/result/data）与纯数组返回
    const records = Array.isArray(data) ? data : (data?.records || data?.list || data?.result || data?.data || [])
    const target = (records as any[]).find((item: any) => String(item.id) === String(SCENE_ID))
    console.log('[bigGis] 场景列表:', records, '目标场景:', target)
    sceneInfo.value = target || null
  } catch (error) {
    console.error('[bigGis] 查询场景信息失败:', error)
    sceneInfo.value = null
  }
}

// 一键全开（复用综合预览页：/plan/control 场景级控制）
function handleAllOn() {
  if (!sceneInfo.value) {
    message.warning('场景信息未加载，无法执行一键全开')
    return
  }
  showLightConfirm({
    content: '确定要 <strong class="tip-action">一键全开</strong> 所有地块灯光吗？',
    onOk: async () => {
      try {
        await allOnApi({
          operationType: '开启',
          relIds: sceneInfo.value.relIds,
          relType: sceneInfo.value.relType,
          sceneId: sceneInfo.value.id || SCENE_ID,
        })
        message.success('一键全开指令已下发')
        fetchCircuitStats() // 刷新数据
      } catch (error) {
        console.error('一键全开失败:', error)
        message.error('一键全开失败，请重试')
      }
    },
  })
}

// 一键全关（复用综合预览页：/plan/control 场景级控制）
function handleAllOff() {
  if (!sceneInfo.value) {
    message.warning('场景信息未加载，无法执行一键全关')
    return
  }
  showLightConfirm({
    content: '确定要 <strong class="tip-action">一键全关</strong> 所有地块灯光吗？',
    onOk: async () => {
      try {
        await allOffApi({
          operationType: '关闭',
          relIds: sceneInfo.value.relIds,
          relType: sceneInfo.value.relType,
          sceneId: sceneInfo.value.id || SCENE_ID,
        })
        message.success('一键全关指令已下发')
        fetchCircuitStats() // 刷新数据
      } catch (error) {
        console.error('一键全关失败:', error)
        message.error('一键全关失败，请重试')
      }
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


// 获取全量地块（area/getAllSpace，返回每条含 spaceId / spaceName），初始化时优先调用，
// 作为 /scene/space 请求 spaceId 的来源；场景数据按 district/all 每条数据的 id/name 归组组装
async function fetchAllAreaSpaces() {
  try {
    const res: any = await getAllSpace()
    // 兼容分页结构（records/list/result/data）与纯数组返回
    const list = Array.isArray(res) ? res : (res?.records || res?.list || res?.result || res?.data || [])
    allAreaSpaceOptions.value = list
    console.log('[index] 全量地块数据(area/getAllSpace):', list)
    return list
  } catch (error) {
    console.error('获取全量地块数据(area/getAllSpace)失败:', error)
    return []
  }
}

// 全量场景列表：scene/listPage 返回的有 tagId 的场景（场景模式弹框按地块 id 匹配 tagId 使用）
const allTagScenes = ref<any[]>([])
const tagSceneListLoading = ref(false)

// 查询所有场景并过滤出有 tagId 的场景（带加载中防重）
async function fetchTagSceneList(): Promise<any[]> {
  if (tagSceneListLoading.value) return allTagScenes.value
  tagSceneListLoading.value = true
  try {
    const data: any = await getLightingPlanAPiNew({ pageNo: 1, pageSize: 999 })
    // 兼容分页结构（records/list/result/data）与纯数组返回
    const records = Array.isArray(data) ? data : (data?.records || data?.list || data?.result || data?.data || [])
    allTagScenes.value = (records as any[]).filter((item: any) => getSceneTagId(item) != null)
    console.log('[index] 有 tagId 的场景:', allTagScenes.value.length, allTagScenes.value)
    return allTagScenes.value
  } catch (error) {
    console.error('[index] 查询场景列表失败:', error)
    return []
  } finally {
    tagSceneListLoading.value = false
  }
}

// 获取所有片区数据并组装最终 spaceId 列表：
// 不再使用 district/all 的 spaceIds 字段关联，改为：scene/listPage 过滤出有 tagId 的场景 →
// 逐场景查详情（/scene/detail），取 areaList 下的 space 字段去重得到最终 spaceId 数组，
// 并按 areaList 的 districtId 归属回各地块，作为 /scene/space 请求的 spaceId 来源
async function fetchAllDistrictTags() {
  try {
    // 1. 查询所有场景（scene/listPage），只保留有 tagId 的场景（无 tagId 的场景过滤掉）
    const tagScenes = await fetchTagSceneList()

    // 2. 并行查询所有场景详情（一次发起，便于核对调用个数），取 areaList 下的 space 字段：
    // 全局去重为最终 spaceId 数组，并按 districtId 归属各地块（键统一转字符串，兼容数字/字符串）
    const spaceIdSet = new Set<number>()
    const districtSpaceMap = new Map<string, Set<number>>()
    // 每个 spaceId 关联的场景 tagId（districtId 匹配不上时按场景所属片区兑底归属，避免 detail 里有 space 却不发起请求）
    const spaceIdToTagIds = new Map<number, Set<string>>()
    console.log(`[index] 初始化并行查询 ${tagScenes.length} 个场景详情:`, tagScenes.map((s: any) => s.id))
    await Promise.all(
      tagScenes.map(async (scene: any) => {
        try {
          const detail: any = await planDetailApiNew({ id: scene.id })
          const areaList = Array.isArray(detail?.areaList) ? detail.areaList : []
          areaList.forEach((area: any) => {
            const sid = Number(area?.space)
            if (isNaN(sid) || sid <= 0) return
            spaceIdSet.add(sid)
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
          console.error(`[index] 场景详情获取失败(场景 ${scene.id}):`, error)
        }
      }),
    )
    finalSpaceIdList.value = Array.from(spaceIdSet)
    console.log('[index] 最终 spaceId 列表(场景 areaList.space 去重):', finalSpaceIdList.value)

    // 3. allSpaceIdList 直接用最终 spaceId 数组组装（不再用 spaceIds 字段关联）
    allSpaceIdList.value = finalSpaceIdList.value.map(String)

    // 4. 填充地块列表 spaceList（district/all）：
    // 各地块 spaceIds = districtId 归属 + 场景 tagId 归属（兑底）合并去重，保证 detail 里引用过的 spaceId 全部被请求
    const res: any = await getAreaListAllTagApi()
    const list = Array.isArray(res) ? res : (res?.records || res?.list || res?.result || res?.data || [])
    console.log('[index] 所有片区数据(district/all):', list)
    if (list.length > 0) {
      spaceList.value = list.map((space: any, index: number) => {
        const base = districtSpaceMap.has(String(space.id)) ? Array.from(districtSpaceMap.get(String(space.id))!) : []
        // 兑底：detail 里引用的 spaceId 若未按 districtId 归属，再按场景 tagId 补挂到对应地块
        const tagMatched = finalSpaceIdList.value.filter((sid) => spaceIdToTagIds.get(sid)?.has(String(space.id)))
        return {
          id: space.id,
          name: space.districtName,
          spaceIds: Array.from(new Set([...base, ...tagMatched])),
          color: DEFAULT_SPACE_COLORS[index % DEFAULT_SPACE_COLORS.length],
          enabled: false
        }
      })
      console.log('[index] spaceList 已由 district/all + 场景详情归属初始化:', spaceList.value.length, '个地块')
      // 校验：仍有 spaceId 无法归属到任何地块（districtId/tagId 均匹配不上）
      const lostSpaceIds = finalSpaceIdList.value.filter((sid) => !spaceList.value.some((s: any) => s.spaceIds.includes(sid)))
      if (lostSpaceIds.length) {
        console.warn('[index] 以下 spaceId 无法归属到任何地块（districtId/tagId 均匹配不上，不会发起请求）:', lostSpaceIds)
      }
      // 初始化后批量请求各地块场景数据（填充左侧场景列表与标点亮灭状态）
      fetchAllSpaceSceneData()
    }
  } catch (error) {
    console.error('获取片区数据(district/all)失败:', error)
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
    // 注意：不再用 getAllSpaceApi 的旧 spaceIds 字段初始化 spaceList / 发起 /scene/space 请求，
    // spaceList 与 space 请求统一由 fetchAllDistrictTags（detail 全部完成后）驱动，避免在 detail 之前提前调用
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
  const scene = filteredSceneList.value.find(s => s.id === sceneId)
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
  const actionText = action === '开启' ? '开启' : '关闭'
  return new Promise<void>((resolve, reject) => {
    if (!confirmModalRef.value) {
      resolve()
      return
    }
    confirmModalRef.value.showModal({
      content: `确定要 <strong class="tip-action">${actionText}</strong> 场景“${scene.name || scene.sceneName || '-'}”吗？`,
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
    const space = spaceList.value.find((s: any) => s.name === normalizeSpaceName(spaceName))
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
  // 初始化先调用 area/getAllSpace 获取全量地块（scene/space 请求的 spaceId 来源），
  // 完成后再加载 district/all 填充地块列表 spaceList 并批量请求各地块场景数据
  fetchAllAreaSpaces().then(() => fetchAllDistrictTags())
  // 初始化时获取回路统计数据
  fetchCircuitStats()
  // 获取各地块运行时长对比
  fetchRunTimeCompare()
  // 加载一键开关所需的场景信息（/plan/control 参数来源）
  loadSceneInfo()
})
</script>

<style scoped>
.big-gis-page {
  position: relative;
  width: 100%;
  height: 100%;
  /* 大屏底：深蓝黑底 + 顶部青色光晕 + 细网格纹理（地图加载间隙同样保持科技感） */
  background-color: #050d1a;
  background-image:
    radial-gradient(ellipse 65% 45% at 50% -8%, rgba(0, 150, 255, 0.16) 0%, transparent 62%),
    radial-gradient(ellipse 45% 35% at 100% 105%, rgba(0, 200, 255, 0.1) 0%, transparent 60%),
    linear-gradient(rgba(0, 200, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 200, 255, 0.04) 1px, transparent 1px);
  background-size: auto, auto, 2.5vw 2.5vw, 2.5vw 2.5vw;
  /* 修复地图滚动问题：允许滚轮事件穿透 */
  overflow: visible;
}

/* 底部居中控制按钮 */
.bottom-controls {
  position: absolute;
  left: 50%;
  bottom: 0.32rem;
  transform: translateX(-50%);
  z-index: 60000;  /* 高于地图标点，确保不被遮挡 */
  display: flex;
  gap: 1.2rem;
}

.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.08rem;
  padding: 0.1rem 0.16rem;
  min-width: 1.04rem;
  background: linear-gradient(135deg, rgba(10, 34, 60, 0.92) 0%, rgba(4, 20, 42, 0.92) 100%);
  border: 1.5px solid rgba(0, 217, 255, 0.55);
  border-radius: 0.06rem;
  color: #8fe8ff;
  font-size: 0.14rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 
    0 0.04rem 0.16rem rgba(0, 150, 230, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  text-shadow: 0 0 0.08rem rgba(0, 217, 255, 0.5);
}

/* 外边框光晕层 */
.ctrl-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, 
    rgba(0, 217, 255, 0.14) 0%,
    rgba(0, 150, 255, 0.07) 100%
  );
  opacity: 0.6;
  pointer-events: none;
}

/* 内发光和高光层 */
.ctrl-btn::after {
  content: '';
  position: absolute;
  inset: 1px;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.1) 0%, 
    rgba(255, 255, 255, 0) 50%,
    rgba(255, 255, 255, 0.04) 100%
  );
  pointer-events: none;
}

/* 图标样式 */
.ctrl-btn svg {
  width: 0.2rem;
  height: 0.2rem;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 2px 0.04rem rgba(0, 0, 0, 0.3)) drop-shadow(0 0 0.06rem rgba(0, 217, 255, 0.5));
  transition: all 0.3s ease;
}

/* 文字提升层级，避免被光晕层覆盖 */
.ctrl-btn span {
  position: relative;
  z-index: 1;
}

/* Hover 效果（未激活时也可感知可点击） */
.ctrl-btn:hover {
  background: linear-gradient(135deg, rgba(13, 46, 82, 0.95) 0%, rgba(6, 30, 60, 0.95) 100%);
  border-color: rgba(0, 240, 255, 0.95);
  color: #fff;
  transform: translateY(-0.03rem);
  box-shadow: 
    0 0.08rem 0.24rem rgba(0, 180, 255, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.ctrl-btn:hover::before {
  opacity: 1;
}

.ctrl-btn:hover svg {
  filter: drop-shadow(0 0.04rem 0.08rem rgba(0, 0, 0, 0.4)) drop-shadow(0 0 0.12rem rgba(0, 217, 255, 0.9));
}

/* 激活状态 - 亮青实心填充 + 发光 + 底部指示条，与未激活深底形成强烈反差 */
.ctrl-btn.is-active {
  background: linear-gradient(135deg, #00d9ff 0%, #00a6ff 100%);
  border-color: rgba(255, 255, 255, 0.95);
  color: #fff;
  text-shadow: 0 0 0.1rem rgba(255, 255, 255, 0.9), 0 0 0.2rem rgba(0, 217, 255, 0.7);
  box-shadow: 
    0 0.06rem 0.28rem rgba(0, 220, 255, 0.8),
    0 0 0.18rem rgba(0, 220, 255, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 0 -0.03rem 0 #ffffff;
  animation: ctrlBtnActivePulse 2.2s ease-in-out infinite;
}

/* 激活状态呼吸发光动画 */
@keyframes ctrlBtnActivePulse {
  0%, 100% {
    box-shadow: 
      0 0.06rem 0.28rem rgba(0, 220, 255, 0.8),
      0 0 0.14rem rgba(0, 220, 255, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.45),
      inset 0 -0.03rem 0 #ffffff;
  }
  50% {
    box-shadow: 
      0 0.06rem 0.32rem rgba(0, 220, 255, 1),
      0 0 0.26rem rgba(0, 220, 255, 0.75),
      inset 0 1px 0 rgba(255, 255, 255, 0.45),
      inset 0 -0.03rem 0 #ffffff;
  }
}

.ctrl-btn.is-active::before {
  opacity: 1;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(0, 220, 255, 0.2) 100%);
}

.ctrl-btn.is-active::after {
  opacity: 0.7;
}

.ctrl-btn.is-active svg {
  filter: drop-shadow(0 0 0.08rem rgba(255, 255, 255, 0.9)) drop-shadow(0 0 0.16rem rgba(0, 220, 255, 1));
  transform: scale(1.08);
}

.ctrl-btn.is-active span {
  text-shadow: 0 0 0.12rem rgba(255, 255, 255, 0.95), 0 0 0.24rem rgba(0, 230, 255, 0.8);
}

/* 左上角控制按钮（位置用 vw/vh，随视口自适应） */
.top-left-controls {
  position: absolute;
  left: 1.05vw;  /* 0.2rem @1920 */
  top: 10.5vh;    /* 1.13rem @1080，位置下移避免遮挡地图内容 */
  z-index: 60000;  /* 高于地图标点（最高50000），确保不被遮挡 */
}

/* 控制开关按钮 - 矩形风格 */
.control-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.417vw;
  padding: 0.729vw 1.25vw;  /* 0.14rem 0.24rem @1920，随屏缩放 */
  background: linear-gradient(135deg, rgba(0, 30, 60, 0.85) 0%, rgba(0, 20, 40, 0.75) 100%);
  backdrop-filter: blur(0.12rem);
  border: 1px solid rgba(0, 150, 255, 0.4);
  border-radius: 0.417vw;
  color: #00d9ff;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 
    0 0 1.042vw rgba(0, 150, 255, 0.2),
    0 0.208vw 0.833vw rgba(0, 100, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.control-toggle-btn .toggle-text {
  font-size: 0.781vw;  /* 0.15rem @1920 */
  font-weight: 500;
  white-space: nowrap;
  letter-spacing: 0.052vw;
  text-shadow: 0 0 0.417vw rgba(0, 217, 255, 0.6);
}

.control-toggle-btn svg {
  flex-shrink: 0;
  width: 1.25vw;  /* 0.24rem @1920，覆盖模板固定属性，随屏缩放 */
  height: 1.25vw;
  filter: drop-shadow(0 0 0.208vw rgba(0, 217, 255, 0.6));
}

/* 指示灯 - 未激活时暗淡 */
.control-toggle-btn .indicator-dot {
  position: absolute;
  top: 0.06rem;
  right: 0.06rem;
  width: 0.08rem;
  height: 0.08rem;
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
    0 0.06rem 0.24rem rgba(0, 150, 255, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

/* 激活状态 - 指示灯亮起 */
.control-toggle-btn.is-active .indicator-dot {
  background: #00d9ff;
  box-shadow: 0 0 0.08rem rgba(0, 217, 255, 0.8), 0 0 0.04rem rgba(0, 217, 255, 1);
}

/* Click效果 */
.control-toggle-btn:active {
  transform: translateY(0);
}

/* 控制面板 - 简洁玻璃底（无边框/角标装饰） */
.control-panel {
  position: absolute;
  left: 0;
  top: 3.333vw;  /* 按钮放大后下移，确保在图标下方 */
  width: 22.917vw;  /* 4.4rem @1920，随屏缩放 */
  z-index: 60000;  /* 高于地图标点，确保不被遮挡 */
  max-height: calc(100vh - 3.646vw);
  background: linear-gradient(180deg, rgba(14, 32, 56, 0.88) 0%, rgba(8, 20, 38, 0.88) 100%);
  border-radius: 0.417vw;
  backdrop-filter: blur(0.12rem);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 紧凑状态栏 - 直接显示统计信息，无标题 */
.stat-bar.compact {
  padding: 0.521vw 0.729vw;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.05), rgba(16, 185, 129, 0.03));  /* 更低透明度 */
  border-bottom: 1px solid rgba(56, 189, 248, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.521vw;
}

.stat-bar .stat-text {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.625vw;  /* 0.12rem @1920 */
  line-height: 1.4;
  flex: 1;
  white-space: nowrap;
}

.stat-bar .stat-text .highlight {
  color: #38bdf8;
  font-weight: 600;
}

.close-btn-small {
  width: 0.22rem;
  height: 0.22rem;
  min-width: 0.22rem;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.04rem;
  color: #ef4444;
  font-size: 0.14rem;
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
  padding: 0.521vw;
}

.control-panel .panel-body::-webkit-scrollbar {
  width: 0.06rem;
}

.control-panel .panel-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.control-panel .panel-body::-webkit-scrollbar-thumb {
  background: rgba(56, 189, 248, 0.3);
  border-radius: 0.03rem;
}

/* 面板头部 */
.panel-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.1rem 0.14rem;  /* 减小内边距 */
  background: transparent;  /* 移除渐变背景 */
  border-bottom: 1px solid rgba(56, 189, 248, 0.2);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  color: #38bdf8;
  font-size: 0.14rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.close-btn-small {
  width: 0.22rem;
  height: 0.22rem;
  background: rgba(255, 255, 255, 0.08);  /* 透明度从 0.05 提高到 0.08 */
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.04rem;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.14rem;
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
  gap: 0.521vw;
  padding: 0.521vw;
  overflow-y: auto;
}

/* 三个独立模块卡片 - 统一风格 */
.module-card {
  background: rgba(0, 30, 60, 0.5);
  border: 1px solid rgba(0, 150, 255, 0.2);
  border-radius: 0.313vw;
  padding: 0.521vw 0.625vw;
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
  border-radius: 0.313vw;
  padding: 0.521vw 0.625vw;
}

.action-section.module-card {
  background: rgba(0, 30, 60, 0.5);
  border: 1px solid rgba(0, 150, 255, 0.2);
  border-radius: 0.313vw;
  padding: 0.521vw 0.625vw;
}

.space-section.module-card {
  background: rgba(0, 30, 60, 0.5);
  border: 1px solid rgba(0, 150, 255, 0.2);
  border-radius: 0.313vw;
  padding: 0.521vw 0.625vw;
}

/* 统计区域 */
.stat-section {
  background: transparent;  /* 完全透明 */
  border: none;  /* 移除边框 */
  border-radius: 0;
  padding: 0.08rem 0.12rem;  /* 减小内边距 */
}

.stat-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.08rem;
}

.stat-label {
  color: rgba(0, 217, 255, 0.7);  /* 青色 */
  font-size: 0.15rem;
  font-weight: 500;
  white-space: nowrap;  /* 保证与数字同行不换行 */
}

.stat-value {
  color: #00d9ff;  /* 青色亮色 */
  font-size: 0.22rem;  /* 数字放大突出 */
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  text-shadow: 0 0 0.08rem rgba(0, 217, 255, 0.6);
}

.highlight-text {
  color: #00d9ff;  /* 青色高亮 */
  font-weight: 700;
  text-shadow: 0 0 0.1rem rgba(0, 217, 255, 0.8);
}

.number {
  font-variant-numeric: tabular-nums;
}

/* 一键操作区域 */
.action-section {
  background: transparent;  /* 完全透明 */
  border: none;  /* 移除边框 */
  border-radius: 0;
  padding: 0.06rem 0;  /* 简化间距 */
}

.mini-action-group {
  display: flex;
  gap: 0.08rem;
  justify-content: center;
}

.icon-btn {
  display: flex;
  align-items: center;
  gap: 0.06rem;
  padding: 0.08rem 0.14rem;  /* 调整内边距 */
  background: rgba(56, 189, 248, 0.15);  /* 稍微提高 */
  border: 1px solid rgba(56, 189, 248, 0.3);  /* 恢复边框 */
  border-radius: 0.04rem;  /* 参考图的小圆角 */
  color: #38bdf8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn.with-text {
  width: auto;
  min-width: 0.56rem;
}

.icon-btn .btn-text {
  font-size: 0.14rem;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.icon-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 0.04rem 0.12rem rgba(56, 189, 248, 0.2);
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
  box-shadow: 0 0 0.14rem rgba(0, 200, 120, 0.3);
}

.mini-action-group .icon-btn.dark-btn {
  background: rgba(255, 80, 80, 0.15);
  border-color: rgba(255, 80, 80, 0.45);
  color: #ff5252;
}

.mini-action-group .icon-btn.dark-btn:hover {
  background: rgba(255, 80, 80, 0.3);
  border-color: rgba(255, 80, 80, 0.7);
  box-shadow: 0 0 0.14rem rgba(255, 80, 80, 0.3);
}

/* 地块列表区域 */
.space-section {
  flex: 1;
  min-height: 0;
}

.section-title {
  color: #00d9ff;  /* 青色，科技发光 */
  font-size: 0.781vw;  /* 0.15rem @1920 */
  font-weight: 600;
  padding: 0 0 0.417vw 0.417vw;
  margin-bottom: 0.417vw;
  border-left: 0.104vw solid rgba(0, 150, 255, 0.6);
  text-transform: none;
  letter-spacing: normal;
  text-shadow: 0 0 0.417vw rgba(0, 217, 255, 0.6);
  border-bottom: 1px dashed rgba(0, 150, 255, 0.2);
}

/* 场景列表标题行：标题 + 区域筛选下拉框 */
.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.417vw;
}

.section-title-row .section-title {
  margin-bottom: 0;
}

/* 区域筛选下拉框本体：深色底 + 紧凑高度（与场景行按钮协调） */
.scene-area-select :deep(.ant-select-selector) {
  background: rgba(0, 20, 45, 0.9) !important;
  border-color: rgba(0, 150, 255, 0.4) !important;
  border-radius: 0.04rem !important;
  height: 0.2rem !important;
  font-size: 0.14rem;
  display: flex;
  align-items: center;
}

.scene-area-select :deep(.ant-select-selection-placeholder),
.scene-area-select :deep(.ant-select-selection-item) {
  color: #8fe8ff;
  line-height: 0.2rem !important;
}

/* 搜索输入文字 + 清除按钮（X）：深色透明底，与整体风格一致 */
.scene-area-select :deep(.ant-select-selection-search-input) {
  color: #e8f4ff;
}

/* 选中文字（含「全部」）：青色发光，选中态清晰可见 */
.scene-area-select :deep(.ant-select-selection-item) {
  color: #00e5ff !important;
  text-shadow: 0 0 0.06rem rgba(0, 217, 255, 0.6);
}

.scene-area-select :deep(.ant-select-clear) {
  background: rgba(0, 60, 110, 0.6);
  color: rgba(143, 232, 255, 0.85);
  border-radius: 50%;
  font-size: 0.1rem;
  width: 0.14rem;
  height: 0.14rem;
  right: 0.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.scene-area-select :deep(.ant-select-clear:hover) {
  color: #00e5ff;
  background: rgba(0, 100, 170, 0.85);
  box-shadow: 0 0 0.08rem rgba(0, 217, 255, 0.5);
}

.scene-area-select :deep(.ant-select-arrow) {
  color: rgba(0, 217, 255, 0.7);
}

/* 虚拟滚动容器 - 限制高度，支持滚动 */
.space-list-scroll-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  max-height: 30vh;  /* 3.2rem @1080，高度随视口 */
  padding-right: 0.208vw;  /* 留出滚动条空间 */
}

/* 自定义滚动条 - 科技感 */
.space-list-scroll-container::-webkit-scrollbar {
  width: 0.05rem;
}

.space-list-scroll-container::-webkit-scrollbar-track {
  background: rgba(0, 30, 60, 0.2);
  border-radius: 0.03rem;
}

.space-list-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(0, 150, 255, 0.4);
  border-radius: 0.03rem;
  transition: background 0.3s ease;
}

.space-list-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 200, 255, 0.6);
}

.space-list {
  display: flex;
  flex-direction: column;
  gap: 0.06rem;
}

.space-item-row {
  display: flex;
  align-items: center;
  gap: 0.365vw;
  padding: 0.469vw 0.365vw;  /* 0.09rem 0.07rem @1920 */
  background: transparent;  /* 完全透明 */
  border: none;  /* 移除边框 */
  border-radius: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.space-item-row:hover {
  background: rgba(56, 189, 248, 0.15);  /* 更明显的 hover 效果 */
  border-color: transparent;
  transform: translateX(0.03rem);  /* 增强左移效果 */
}

.space-item-row:active {
  transform: translateX(0);
}

.space-indicator {
  width: 0.08rem;
  height: 0.08rem;
  min-width: 0.08rem;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.scene-indicator-icon {
  width: 0.12rem;
  height: 0.12rem;
  min-width: 0.12rem;
  border-radius: 0.04rem;
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
  font-size: 0.781vw;  /* 0.15rem @1920 */
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 0 0.313vw rgba(0, 217, 255, 0.5);
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-space {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.573vw;  /* 0.11rem @1920 */
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
  font-size: 0.573vw;  /* 0.11rem @1920 */
  font-weight: 500;
  margin-right: 0.417vw;
  flex-shrink: 0;
  text-shadow: 0 0 0.208vw rgba(0, 217, 255, 0.4);
}

/* 详情按钮 */
.detail-btn {
  padding: 0.208vw 0.417vw;
  height: auto;
  min-width: 1.563vw;
  background: rgba(0, 150, 255, 0.25);
  border: 1px solid rgba(0, 180, 255, 0.55);
  border-radius: 0.26vw;
  color: #ffffff;
  font-size: 0.781vw;  /* 0.15rem @1920 */
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-right: 0.208vw;
}

.detail-btn:hover {
  background: rgba(0, 170, 255, 0.4);
  border-color: rgba(0, 200, 255, 0.8);
  transform: translateY(-1px);
}

/* 场景开/关按钮组 */
.scene-btn-group {
  display: flex;
  gap: 0.03rem;
  flex-shrink: 0;
}

.scene-action-btn {
  padding: 0.26vw 0.469vw;
  height: auto;
  min-width: 1.25vw;
  border-radius: 0.156vw;
  font-size: 0.781vw;  /* 0.15rem @1920 */
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
  box-shadow: 0 0 0.1rem rgba(0, 200, 120, 0.3);
}

.scene-action-btn.off-btn {
  background: rgba(255, 80, 80, 0.15);
  border: 1px solid rgba(255, 80, 80, 0.4);
  color: #ff5252;
}

.scene-action-btn.off-btn:hover {
  background: rgba(255, 80, 80, 0.3);
  border-color: rgba(255, 80, 80, 0.6);
  box-shadow: 0 0 0.1rem rgba(255, 80, 80, 0.3);
}

/* 现代开关 - 更简洁 */
.toggle-switch {
  position: relative;
  width: 0.42rem;
  height: 0.24rem;
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
  border-radius: 0.24rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-slider:before {
  content: "";
  position: absolute;
  height: 0.18rem;
  width: 0.18rem;
  left: 2px;
  bottom: 2px;
  background: rgba(255, 255, 255, 0.5);  /* 更淡的滑块 */
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 0.04rem rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked + .toggle-slider {
  background: rgba(56, 189, 248, 0.3);  /* 更柔和的开启色 */
  border-color: rgba(56, 189, 248, 0.5);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(0.18rem);
  background: #38bdf8;  /* 开启时显示蓝色 */
  box-shadow: 0 2px 0.08rem rgba(56, 189, 248, 0.5);
}

/* 地块列表面板 */
.space-panel {
  position: absolute;
  right: 0.2rem;
  top: 0.8rem;
  width: 2.8rem;
  max-height: calc(100vh - 2rem);
  background: rgba(10, 22, 40, 0.95);
  border: 1px solid rgba(56, 189, 248, 0.4);
  border-radius: 0.08rem;
  backdrop-filter: blur(0.1rem);
  box-shadow: 0 0.08rem 0.32rem rgba(0, 0, 0, 0.5), 0 0 0.2rem rgba(56, 189, 248, 0.2);
  z-index: 60000;  /* 高于地图标点，确保不被遮挡 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.14rem 0.16rem;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(16, 185, 129, 0.1));
  border-bottom: 1px solid rgba(56, 189, 248, 0.3);
}

.panel-header h3 {
  margin: 0;
  color: #fff;
  font-size: 0.16rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.close-btn {
  width: 0.28rem;
  height: 0.28rem;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 0.04rem;
  color: #ef4444;
  font-size: 0.16rem;
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
  padding: 0.08rem;
}

.panel-body::-webkit-scrollbar {
  width: 0.06rem;
}

.panel-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.panel-body::-webkit-scrollbar-thumb {
  background: rgba(56, 189, 248, 0.3);
  border-radius: 0.03rem;
}

.panel-body::-webkit-scrollbar-thumb:hover {
  background: rgba(56, 189, 248, 0.5);
}

.space-item {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  padding: 0.12rem 0.12rem;
  margin-bottom: 0.06rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.06rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.space-item:hover {
  background: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.3);
  transform: translateX(-0.04rem);
  box-shadow: 0 2px 0.08rem rgba(56, 189, 248, 0.15);
}

.space-item:active {
  transform: translateX(-2px);
}

.space-color {
  width: 0.12rem;
  height: 0.12rem;
  min-width: 0.12rem;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.space-name {
  flex: 1;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.14rem;
  font-weight: 500;
}

/* ========== 右上角统计面板 - 科技蓝主题 ========== */
.top-right-controls {
  position: absolute;
  top: 10.5vh;  /* 1.13rem @1080，与左上角整体管控按钮同步下移，随视口自适应 */
  right: 1.25vw;  /* 0.24rem @1920 */
  z-index: 60000;  /* 高于地图标点（最高50000），确保统计面板不被遮挡 */
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.521vw;
}

/* 统计切换按钮 - 精致科技风 */
.stats-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.417vw;
  padding: 0.729vw 1.25vw;  /* 0.14rem 0.24rem @1920，随屏缩放 */
  background: linear-gradient(135deg, rgba(0, 30, 60, 0.85) 0%, rgba(0, 20, 40, 0.75) 100%);
  backdrop-filter: blur(0.12rem);
  border: 1px solid rgba(0, 150, 255, 0.4);
  border-radius: 0.417vw;
  color: #00d9ff;
  font-size: 0.781vw;  /* 0.15rem @1920 */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;  /* 支撑 ::before 光晕层定位 */
  box-shadow: 
    0 0 1.042vw rgba(0, 150, 255, 0.2),
    0 0.208vw 0.833vw rgba(0, 100, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  text-shadow: 0 0 0.417vw rgba(0, 217, 255, 0.6);
}

.stats-toggle-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 0.06rem;
  background: linear-gradient(135deg, rgba(0, 200, 255, 0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.stats-toggle-btn:hover {
  background: linear-gradient(135deg, rgba(0, 40, 80, 0.9) 0%, rgba(0, 30, 60, 0.85) 100%);
  border-color: rgba(0, 217, 255, 0.6);
  box-shadow: 
    0 0.06rem 0.24rem rgba(0, 150, 255, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.stats-toggle-btn:hover::before {
  opacity: 1;
}

.stats-toggle-btn:active {
  transform: translateY(0);
}

/* ===== 整体管控 / 统计按钮激活态（定义在所有 hover 之后，确保打开面板时高亮始终生效） ===== */
.control-toggle-btn::after,
.stats-toggle-btn::after {
  content: '';
  position: absolute;
  left: 20%;
  right: 20%;
  bottom: -0.03rem;
  height: 0.03rem;
  border-radius: 0.015rem;
  background: linear-gradient(90deg, transparent, #00d9ff, transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.control-toggle-btn.is-active,
.stats-toggle-btn.is-active {
  background: linear-gradient(135deg, rgba(0, 55, 105, 0.95) 0%, rgba(0, 35, 80, 0.92) 100%);
  border-color: rgba(0, 217, 255, 0.95);
  color: #00e5ff;
  box-shadow:
    0 0 0.24rem rgba(0, 200, 255, 0.45),
    0 0 0.6rem rgba(0, 180, 255, 0.2),
    inset 0 0 0.2rem rgba(0, 217, 255, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.control-toggle-btn.is-active .toggle-text,
.stats-toggle-btn.is-active .toggle-label {
  text-shadow: 0 0 0.3rem rgba(0, 229, 255, 0.9);
}

.control-toggle-btn.is-active::after,
.stats-toggle-btn.is-active::after {
  opacity: 1;
  box-shadow: 0 0 0.08rem rgba(0, 217, 255, 0.8);
}

/* 激活状态 - 指示灯亮起（整体管控按钮） */
.control-toggle-btn.is-active .indicator-dot {
  background: #00d9ff;
  box-shadow: 0 0 0.08rem rgba(0, 217, 255, 0.8), 0 0 0.04rem rgba(0, 217, 255, 1);
}

.stats-toggle-btn svg {
  flex-shrink: 0;
  width: 1.25vw;  /* 0.24rem @1920，覆盖模板固定属性，随屏缩放 */
  height: 1.25vw;
  filter: drop-shadow(0 0 0.208vw rgba(0, 217, 255, 0.6));
}

.toggle-label {
  white-space: nowrap;
  letter-spacing: 0.026vw;
}

/* 统计面板 - 大屏科技风：发光边框 + 渐变玻璃底 */
.stats-panel {
  width: 25vw;  /* 4.8rem @1920，随屏缩放 */
  max-height: 52vh;  /* 5.6rem @1080，高度随视口 */
  overflow-y: auto;
  background: linear-gradient(180deg, rgba(14, 32, 56, 0.88) 0%, rgba(8, 20, 38, 0.88) 100%);
  backdrop-filter: blur(0.12rem);
  border: 1px solid rgba(0, 217, 255, 0.35);
  border-radius: 0.417vw;
  box-shadow: 
    0 0 1.354vw rgba(0, 150, 255, 0.14),
    0 0.417vw 1.25vw rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(0, 150, 255, 0.05);
  padding: 0.625vw;
  display: flex;
  flex-direction: column;
  gap: 0.625vw;
}

/* 滚动条美化 */
.stats-panel::-webkit-scrollbar {
  width: 0.06rem;
}

.stats-panel::-webkit-scrollbar-track {
  background: rgba(0, 30, 60, 0.2);
  border-radius: 0.03rem;
}

.stats-panel::-webkit-scrollbar-thumb {
  background: rgba(0, 150, 255, 0.4);
  border-radius: 0.03rem;
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
  border-radius: 0.313vw;
  padding: 0.833vw;
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
  margin: 0 0 0.833vw 0;
  font-size: 0.729vw;  /* 0.14rem @1920 */
  font-weight: 600;
  color: #00d9ff;
  text-shadow: 0 0 0.625vw rgba(0, 217, 255, 0.5);
  letter-spacing: 0.042vw;
  display: flex;
  align-items: center;
  gap: 0.313vw;
}

.chart-section h4::before,
.table-section h4::before {
  content: '';
  width: 0.156vw;
  height: 0.729vw;
  background: linear-gradient(180deg, #00d9ff, #0088ff);
  border-radius: 0.104vw;
  box-shadow: 0 0 0.417vw rgba(0, 217, 255, 0.6);
}

/* 柱状图区域 - 优化宽度 */
.bar-chart-section {
  min-height: 10.417vw;  /* 2rem @1920 */
}

.bar-chart-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 7.813vw;  /* 1.5rem @1920 */
  padding: 0 0.208vw;
  gap: 0.417vw;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.06rem;
  flex: 1;
  max-width: 0.7rem;  /* 限制每个条目的最大宽度 */
}

.bar-wrapper {
  position: relative;
  width: 100%;
  height: 1.2rem;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.bar-fill {
  width: 0.36rem;  /* 柱体宽度从0.48rem减小到0.36rem */
  min-width: 0.32rem;
  background: linear-gradient(180deg, rgba(0, 200, 255, 0.9) 0%, rgba(0, 100, 255, 0.7) 100%);
  border-radius: 0.04rem 0.04rem 0 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 0 0.12rem rgba(0, 150, 255, 0.5),
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
  border-radius: 0.04rem 0.04rem 0 0;
}

.bar-value {
  position: absolute;
  top: -0.2rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.11rem;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 0 0.08rem rgba(0, 217, 255, 0.6);
  white-space: nowrap;
}

.bar-label {
  font-size: 0.12rem;  /* 字体从0.13rem减小到0.12rem */
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
  font-size: 0.125rem;
}

.runtime-table thead th {
  background: linear-gradient(180deg, rgba(0, 80, 150, 0.4) 0%, rgba(0, 50, 100, 0.25) 100%);
  color: rgba(0, 217, 255, 0.95);
  padding: 0.12rem 0.06rem;
  text-align: left;
  font-weight: 600;
  white-space: nowrap;  /* 表头文字不换行 */
  border-bottom: 2px solid rgba(0, 150, 255, 0.35);
  text-shadow: 0 0 0.08rem rgba(0, 217, 255, 0.4);
  letter-spacing: 0.5px;
}

.runtime-table thead th:first-child {
  border-radius: 0.04rem 0 0 0;
}

.runtime-table thead th:last-child {
  border-radius: 0 0.04rem 0 0;
}

.runtime-table tbody td {
  padding: 0.11rem 0.1rem;
  color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(0, 100, 180, 0.12);
  transition: all 0.2s ease;
}

.runtime-table tbody tr {
  transition: all 0.2s ease;
}

.runtime-table tbody tr:hover {
  background: rgba(0, 150, 255, 0.1);
  box-shadow: inset 0 0 0.12rem rgba(0, 150, 255, 0.1);
}

.runtime-table tbody tr:last-child td {
  border-bottom: none;
}

.runtime-table tbody td:first-child {
  color: #00d9ff;
  font-weight: 600;
  text-shadow: 0 0 0.06rem rgba(0, 217, 255, 0.4);
}

.runtime-table .change-positive {
  color: #00e676;
  font-weight: 700;
  text-shadow: 0 0 0.06rem rgba(0, 230, 118, 0.5);
}

.runtime-table .change-negative {
  color: #ff5252;
  font-weight: 700;
  text-shadow: 0 0 0.06rem rgba(255, 82, 82, 0.5);
}

@media (max-width: 7.68rem) {
  .stats-panel {
    width: calc(100vw - 0.48rem);
    max-height: 4.8rem;
  }
}

/* ===== 地块标点功能浮层 ===== */
.space-menu {
  position: fixed;
  z-index: 70000;
  width: 1.5rem;
  background: linear-gradient(180deg, rgba(12, 28, 52, 0.97) 0%, rgba(8, 18, 36, 0.97) 100%);
  border: 1px solid rgba(0, 200, 255, 0.35);
  border-radius: 0.08rem;
  box-shadow: 0 0.12rem 0.4rem rgba(0, 0, 0, 0.6), 0 0 0.2rem rgba(0, 180, 255, 0.15);
  overflow: visible;
  animation: spaceMenuIn 0.18s ease-out;
  backdrop-filter: blur(0.12rem);
}

@keyframes spaceMenuIn {
  from { opacity: 0; transform: translateY(0.06rem); }
  to { opacity: 1; transform: translateY(0); }
}

.space-menu-item {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  padding: 0.1rem 0.14rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.13rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.space-menu-item:hover {
  background: rgba(0, 200, 255, 0.15);
  color: #00d9ff;
  padding-left: 0.18rem;
}

/* 激活状态（点击后弹框打开时保持高亮） */
.space-menu-item.is-active {
  background: rgba(0, 200, 255, 0.25);
  color: #00d9ff;
  border-left: 0.03rem solid #00d9ff;
  font-weight: 600;
  text-shadow: 0 0 0.08rem rgba(0, 217, 255, 0.6);
}

.space-menu-item.is-active .menu-label {
  color: #00d9ff;
}

.menu-label {
  flex: 1;
}

.menu-arrow {
  color: rgba(0, 200, 255, 0.6);
  font-size: 0.12rem;
}

/* 二级菜单（位于一级项内部，left:100% 相对一级项定位） */
.space-menu-item {
  position: relative;
}

.space-card {
  position: absolute;
  left: 100%;
  top: -0.04rem;
  width: 2.4rem;
  margin-left: 2px;
  background: linear-gradient(180deg, rgba(12, 28, 52, 0.98) 0%, rgba(8, 18, 36, 0.98) 100%);
  border: 1px solid rgba(0, 200, 255, 0.35);
  border-radius: 0.08rem;
  box-shadow: 0 0.12rem 0.32rem rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(0.12rem);
  animation: spaceMenuIn 0.15s ease-out;
  overflow: hidden;
}

.space-card-title {
  padding: 0.09rem 0.14rem;
  color: #00d9ff;
  font-size: 0.12rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(0, 200, 255, 0.2);
}

/* 全开全关卡片 */
.switch-card-body {
  display: flex;
  gap: 0.08rem;
  padding: 0.08rem 0.14rem;
}

.switch-btn {
  flex: 1;
  padding: 0.06rem 0;
  border-radius: 0.05rem;
  font-size: 0.12rem;
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
  box-shadow: 0 0 0.14rem rgba(0, 200, 120, 0.3);
}

.switch-off {
  background: rgba(255, 80, 80, 0.15);
  border: 1px solid rgba(255, 80, 80, 0.45);
  color: #ff5252;
}

.switch-off:hover {
  background: rgba(255, 80, 80, 0.3);
  border-color: rgba(255, 80, 80, 0.7);
  box-shadow: 0 0 0.14rem rgba(255, 80, 80, 0.3);
}

/* 视频卡片 */
.video-card-body {
  padding: 0.1rem;
  height: 1.5rem;
}

.video-card-body :deep(.video-player-wrap) {
  width: 100%;
  height: 100%;
  border-radius: 0.06rem;
  overflow: hidden;
}

/* 视频列表卡片 */
.video-card-list {
  max-height: 3.2rem;
  overflow-y: auto;
}

.video-card-item {
  padding: 0.08rem 0.1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.video-card-item:last-child {
  border-bottom: none;
}

.video-item-name {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.12rem;
  margin-bottom: 0.06rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-card-item :deep(.video-player-wrap) {
  width: 100%;
  height: 1.3rem;
  border-radius: 0.06rem;
  overflow: hidden;
}

/* 详情（回路）卡片 */
.detail-card-list {
  max-height: 2.6rem;
  overflow-y: auto;
}

.circuit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.08rem 0.14rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.2s ease;
}

.circuit-row:hover {
  background: rgba(0, 200, 255, 0.12);
}

.circuit-name {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.12rem;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 0.1rem;
}

.circuit-status {
  font-size: 0.12rem;
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
  gap: 0.08rem;
  padding: 0.09rem 0.14rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.12rem;
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
  padding: 0.14rem;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.12rem;
  text-align: center;
}

/* ===== 视频监控弹框 ===== */
.video-modal-wrap {
  background: #0b1a2f;
  border-radius: 0.06rem;
  /* 固定内容区高度：tab 导航约 0.52rem + 播放器区 4.2rem，空数据时保持一致 */
  height: 4.72rem;
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
  height: 4.2rem;
  background: #060d1a;
  border-radius: 0.06rem;
  overflow: hidden;
}

.video-modal-item :deep(.video-player-wrap) {
  width: 100%;
  height: 100%;
}

/* ===== 详情模式标点四页签弹框 ===== */
/* 内容区固定高度：页签切换时弹框尺寸稳定（4.4rem，视频页签播放器与之契合） */
.space-tabs :deep(.ant-tabs-content-holder) {
  height: 4.4rem;
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
  padding: 0.06rem 0 !important;  /* 压缩 tab 高度，让下部表格更宽绰 */
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
  height: 4.4rem;
}

/* 1. 灯光控制（整合页签）：一键开关（上）→ 回路列表（下），纵向排列 */
.light-pane {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  height: 100%;
}

/* 一键开关区（最上边）：两按钮居中，绿/红扁平风格（对称内边距保证按钮上下居中）
   注意：本区域位于 teleport 弹窗内，rem 基于 html 根字号全局生效（useScreenScale），同样随屏缩放 */
.pane-switch {
  display: flex;
  align-items: center;  /* 按钮垂直居中 */
  justify-content: center;
  gap: 0.18rem;
  padding: 0.08rem 0;  /* 上下对称，按钮在开关区内上下居中 */
  border-bottom: 1px dashed rgba(0, 150, 255, 0.25);
}

/* 全开：对齐全开全关弹框 switch-on 风格（半透明底 + 同色描边 + 同色文字，扁平化） */
.pane-switch .icon-btn {
  padding: 0.08rem 0.28rem;
  border-radius: 0.06rem;
  background: rgba(0, 200, 120, 0.15);
  border: 1px solid rgba(0, 200, 120, 0.45);
  color: #00e676;
}

.pane-switch .icon-btn:hover {
  background: rgba(0, 200, 120, 0.3);
  border-color: rgba(0, 200, 120, 0.7);
  box-shadow: 0 0 0.14rem rgba(0, 200, 120, 0.3);
}

/* 全关：对齐 switch-off 风格 */
.pane-switch .icon-btn.dark-btn {
  background: rgba(255, 80, 80, 0.15);
  border: 1px solid rgba(255, 80, 80, 0.45);
  color: #ff5252;
}

.pane-switch .icon-btn.dark-btn:hover {
  background: rgba(255, 80, 80, 0.3);
  border-color: rgba(255, 80, 80, 0.7);
  box-shadow: 0 0 0.14rem rgba(255, 80, 80, 0.3);
}

.pane-switch .icon-btn svg {
  width: 0.18rem;
  height: 0.18rem;
}

.pane-switch .icon-btn .btn-text {
  font-size: 0.13rem;
  font-weight: 600;
  letter-spacing: 2px;
}

/* 回路列表区（最下边）：标签 + 表格纵向排列，撑满剩余高度 */
.pane-table {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 回路统计标签：占满整行，标签左、数字右（space-between），整体加粗
   注意：位于 teleport 弹窗内，rem 全局生效随屏缩放 */
.circuit-count-tag {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 0.08rem;
  padding: 0.06rem 0.12rem;
  font-size: 0.13rem;
  color: #8fe8ff;
  background: rgba(0, 200, 255, 0.1);
  border: 1px solid rgba(0, 200, 255, 0.3);
  border-radius: 0.04rem;
  white-space: nowrap;
}

.circuit-count-tag .stat-label {
  font-size: 0.13rem;
  font-weight: 700;  /* 加粗 */
  color: #8fe8ff;
}

.circuit-count-tag .stat-value {
  font-size: 0.2rem;  /* 数字放大，与主界面回路统计一致 */
  font-weight: 700;
  color: #00d9ff;
  text-shadow: 0 0 0.08rem rgba(0, 217, 255, 0.6);
}

.circuit-count-tag .stat-value .highlight-text {
  color: #00e676;
  text-shadow: 0 0 0.1rem rgba(0, 230, 118, 0.8);
}

/* 表格加载区：撑满剩余高度 */
.pane-table .pane-spin {
  flex: 1;
  min-height: 0;
}

.pane-table .pane-spin :deep(.ant-spin-nested-loading),
.pane-table .pane-spin :deep(.ant-spin-container) {
  height: 100%;
  min-height: 0;
}

/* 回路表格容器：自适应剩余高度（表格与弹框契合） */
.space-tabs .circuit-vxe-table-wrap {
  height: 100%;
}

/* ===== 地块功能弹框内容（弹框头部/内容主题见文件底部全局样式） ===== */
.space-modal-subtitle {
  padding: 2px 2px 0.1rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.12rem;
  letter-spacing: 0.5px;
  border-bottom: 1px dashed rgba(0, 150, 255, 0.2);
  margin-bottom: 0.1rem;
}

/* 全开全关弹框按钮（放大） */
.all-modal-body {
  padding: 0.06rem 2px 2px;
}

.all-modal-body .switch-btn {
  padding: 0.14rem 0;
  font-size: 0.15rem;
  letter-spacing: 2px;
  border-radius: 0.06rem;
}

/* 场景虚拟列表：场景名单元格（颜色指示点 + 名称） */
.scene-cell {
  display: flex;
  align-items: center;
  gap: 0.08rem;
}

.scene-cell-name {
  color: #e8f4ff;
  font-size: 0.16rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 场景虚拟列表操作列按钮组 */
.scene-btn-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.06rem;
}

/* tab 标签栏深色主题 */
.video-tabs {
  color: rgba(255, 255, 255, 0.85);
}

.video-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0.06rem;  /* 压缩 tab 与内容的间距 */
}

.video-tabs :deep(.ant-tabs-nav-wrap) {
  overflow-x: auto;
}

.video-tabs :deep(.ant-tabs-tab) {
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(0, 200, 255, 0.25) !important;
  color: rgba(255, 255, 255, 0.7) !important;
  border-radius: 0.04rem;
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
  width: 0.08rem;
  height: 0.08rem;
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
  font-size: 0.1rem;
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
/* ===== 场景区域筛选下拉框：深色科技风 + 高层级（teleport 渲染到 body，需全局样式） ===== */
.scene-area-dropdown {
  background: linear-gradient(180deg, #0c1e38 0%, #081527 100%) !important;
  border: 1px solid rgba(0, 200, 255, 0.3) !important;
  border-radius: 0.06rem !important;
  box-shadow: 0 0.12rem 0.4rem rgba(0, 0, 0, 0.6), 0 0 0.2rem rgba(0, 180, 255, 0.15) !important;
  padding: 0.04rem !important;
  z-index: 70000 !important;  /* 高于控制面板 60000 与地图标点 50000，避免被遮挡 */
}

.scene-area-dropdown .ant-select-item {
  font-size: 0.13rem;
  color: rgba(255, 255, 255, 0.85);
  background: transparent;
  border-radius: 0.04rem;
  min-height: 0.32rem;
  line-height: 0.32rem;
}

.scene-area-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
  background: rgba(0, 200, 255, 0.15);
  color: #00e5ff;
}

.scene-area-dropdown .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
  background: rgba(0, 150, 255, 0.25);
}

.scene-area-dropdown .ant-select-item-empty {
  color: rgba(255, 255, 255, 0.45);
}

.scene-area-dropdown .ant-empty-description {
  color: rgba(255, 255, 255, 0.45);
}

/* 搜索输入框（show-search 时面板内会出现） */
.scene-area-dropdown .ant-select-selection-search-input {
  color: #e8f4ff;
}

.scene-area-dropdown ::-webkit-scrollbar {
  width: 0.05rem;
}

.scene-area-dropdown ::-webkit-scrollbar-thumb {
  background: rgba(0, 150, 255, 0.4);
  border-radius: 0.03rem;
}

.scene-area-dropdown ::-webkit-scrollbar-track {
  background: rgba(0, 30, 60, 0.2);
}

/* ===== 地块功能弹框 / 视频弹框 深色科技主题 =====
   弹框经 teleport 渲染到 body，scoped 样式不生效，需全局样式（class + wrapClassName 均挂载到 .ant-modal-root） */
.video-modal .ant-modal-header,
.space-modal .ant-modal-header {
  background: linear-gradient(135deg, #102a4a 0%, #0a1a30 100%) !important;
  border-bottom: 1px solid rgba(0, 200, 255, 0.35) !important;
  border-radius: 0.08rem 0.08rem 0 0 !important;
  padding: 0.16rem 0.24rem !important;
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
  font-size: 0.16rem !important;
  font-weight: 600 !important;
  letter-spacing: 1px;
  text-shadow: 0 0 0.1rem rgba(0, 217, 255, 0.55);
}

.video-modal .ant-modal-close,
.space-modal .ant-modal-close {
  color: rgba(255, 255, 255, 0.55) !important;
  background: rgba(0, 200, 255, 0.08) !important;
  border-radius: 50% !important;
  top: 0.15rem !important;
  right: 0.15rem !important;
  width: 0.3rem !important;
  height: 0.3rem !important;
  transition: all 0.25s ease;
}

.video-modal .ant-modal-close:hover,
.space-modal .ant-modal-close:hover {
  color: #ffffff !important;
  background: rgba(0, 200, 255, 0.28) !important;
  box-shadow: 0 0 0.14rem rgba(0, 200, 255, 0.5);
  transform: rotate(90deg);
}

.video-modal .ant-modal-content,
.space-modal .ant-modal-content {
  background: linear-gradient(180deg, #0c1e38 0%, #081527 100%) !important;
  border: 1px solid rgba(0, 200, 255, 0.3) !important;
  border-radius: 0.08rem !important;
  box-shadow: 0 0.16rem 0.48rem rgba(0, 0, 0, 0.7), 0 0 0.24rem rgba(0, 180, 255, 0.18) !important;
}

/* 弹框遮罩 */
.video-modal .ant-modal-mask,
.space-modal .ant-modal-mask {
  background: rgba(2, 10, 22, 0.6) !important;
  backdrop-filter: blur(2px);
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
  --vxe-ui-table-border-radius: 0.06rem;
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
  --vxe-ui-base-popup-box-shadow: 0 0.08rem 0.24rem rgba(0, 0, 0, 0.6);
  /* 元素级兜底 */
  background: transparent !important;
  color: rgba(255, 255, 255, 0.85) !important;
  font-size: 0.13rem;
}

/* 场景列表：最小宽度 5.68rem（比原内容区 4.68rem 宽 1rem，配合弹框加宽到 6rem） */
.scene-vxe-table-wrap {
  min-width: 5.68rem;
}

.scene-vxe-table-wrap .vxe-table--header-wrapper,
.circuit-vxe-table-wrap .vxe-table--header-wrapper {
  background: rgba(0, 40, 80, 0.35) !important;
}

.scene-vxe-table-wrap .vxe-header--column,
.circuit-vxe-table-wrap .vxe-header--column {
  background: transparent !important;
  color: #00d9ff !important;
  border-bottom: 1px solid rgba(0, 200, 255, 0.25) !important;
}

/* 回路表头：字号调小、不加粗，与正文内容拉开层次
   注意：位于 teleport 弹窗内，rem 全局生效（useScreenScale），随屏缩放 */
.circuit-vxe-table-wrap .vxe-header--column {
  font-size: 0.12rem;
  font-weight: 400;
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
  padding: 0 0.1rem !important;
}

/* 回路表格深色滚动条（列表超宽/超高时可滚动查看） */
.circuit-vxe-table-wrap ::-webkit-scrollbar {
  width: 0.06rem;
  height: 0.06rem;
}

.circuit-vxe-table-wrap ::-webkit-scrollbar-track {
  background: rgba(0, 30, 60, 0.2);
  border-radius: 0.03rem;
}

.circuit-vxe-table-wrap ::-webkit-scrollbar-thumb {
  background: rgba(0, 150, 255, 0.4);
  border-radius: 0.03rem;
}

.circuit-vxe-table-wrap ::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 200, 255, 0.6);
}

/* 固定列分隔阴影 */
.scene-vxe-table-wrap .vxe-table--fixed-left-wrapper,
.circuit-vxe-table-wrap .vxe-table--fixed-left-wrapper {
  box-shadow: 0.04rem 0 0.12rem rgba(0, 0, 0, 0.25);
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
  width: 0.06rem;
  height: 0.06rem;
}

.scene-vxe-table-wrap .vxe-table--body-wrapper::-webkit-scrollbar-thumb,
.circuit-vxe-table-wrap .vxe-table--body-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 150, 255, 0.4);
  border-radius: 0.03rem;
}

.scene-vxe-table-wrap .vxe-table--body-wrapper::-webkit-scrollbar-track,
.circuit-vxe-table-wrap .vxe-table--body-wrapper::-webkit-scrollbar-track {
  background: rgba(0, 30, 60, 0.2);
}

/* ===== 场景列表单元格内容（teleport 后 scoped 可能失效，全局兜底） ===== */
.scene-cell {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}

.scene-indicator-icon {
  width: 0.12rem;
  height: 0.12rem;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0.06rem currentColor;
}

.scene-cell-name {
  flex: 1;
  min-width: 0;
  color: #e8f4ff;
  font-size: 0.16rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 场景行中间详情按钮：玻璃态描边风格 */
.scene-mid-detail {
  flex-shrink: 0;
  margin: 0 !important;
  padding: 0.04rem 0.18rem;
  height: 0.34rem;
  min-width: 0.68rem;
  border-radius: 0.08rem;
  font-size: 0.17rem;
  font-weight: 600;
  letter-spacing: 1px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 150, 255, 0.25);
  border: 1px solid rgba(0, 180, 255, 0.55);
  color: #ffffff;
  transition: all 0.2s ease;
}

.scene-mid-detail:hover {
  background: rgba(0, 170, 255, 0.4);
  border-color: rgba(0, 200, 255, 0.85);
  transform: translateY(-1px);
}

/* 场景行按钮组：统一玻璃态描边风格（详情/开/关） */
.scene-btn-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.06rem;
}

.scene-btn-group .detail-btn,
.scene-btn-group .scene-action-btn {
  padding: 0.03rem 0.1rem;
  height: 0.24rem;
  min-width: 0.4rem;
  border-radius: 0.04rem;
  font-size: 0.11rem;
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
  text-shadow: 0 0 0.06rem rgba(0, 217, 255, 0.5);
  transition: all 0.2s ease;
}

.scene-btn-group .detail-btn:hover {
  background: rgba(56, 189, 248, 0.25);
  border-color: rgba(56, 189, 248, 0.7);
  box-shadow: 0 0 0.12rem rgba(0, 200, 255, 0.35);
  transform: translateY(-1px);
}

.scene-btn-group .on-btn {
  background: rgba(16, 120, 80, 0.15);
  border-color: rgba(34, 197, 94, 0.5);
  color: #34d399;
  text-shadow: 0 0 0.06rem rgba(52, 211, 153, 0.5);
}

.scene-btn-group .on-btn:hover {
  background: rgba(34, 197, 94, 0.25);
  border-color: rgba(34, 197, 94, 0.8);
  box-shadow: 0 0 0.12rem rgba(34, 197, 94, 0.35);
  transform: translateY(-1px);
}

.scene-btn-group .off-btn {
  background: rgba(180, 40, 40, 0.15);
  border-color: rgba(239, 68, 68, 0.5);
  color: #f87171;
  text-shadow: 0 0 0.06rem rgba(248, 113, 113, 0.5);
}

.scene-btn-group .off-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.8);
  box-shadow: 0 0 0.12rem rgba(239, 68, 68, 0.35);
  transform: translateY(-1px);
}

/* 回路状态徽章（全局兜底） */
.circuit-vxe-table-wrap .circuit-status {
  font-size: 0.12rem;
  font-weight: 600;
  flex-shrink: 0;
}

.circuit-vxe-table-wrap .circuit-status.is-on {
  color: #00e676;
  text-shadow: 0 0 0.08rem rgba(0, 230, 118, 0.45);
}

.circuit-vxe-table-wrap .circuit-status.is-off {
  color: #ff5252;
  text-shadow: 0 0 0.08rem rgba(255, 82, 82, 0.45);
}
</style>
