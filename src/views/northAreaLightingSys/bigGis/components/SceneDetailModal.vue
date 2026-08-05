<template>
  <a-modal
    v-model:open="visible"
    :title="'场景详情 - ' + currentScene?.name"
    width="650px"
    wrapClassName="scene-detail-modal"
    :footer="null"
    :maskClosable="true"
    @cancel="onCancel"
  >
    <div class="modal-content">
      <!-- 详情表格 -->
      <div class="table-section">
        <div class="table-scroll">
          <table class="device-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>区域</th>
                <th>名称</th>
                <th v-if="currentScene?.relType === '回路'">回路名称</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in tableData" :key="idx">
                <td>{{ idx + 1 }}</td>
                <td>{{ row.spaceName || '-' }}</td>
                <td>{{ row.areaName || '-' }}</td>
                <td v-if="currentScene?.relType === '回路'">{{ row.circuitName || '-' }}</td>
              </tr>
              <tr v-if="!tableData || tableData.length === 0">
                <td colspan="4" class="empty-row">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { planDetailApiNew } from '@/api/equipmentMonitoring'
import { message } from 'ant-design-vue'

// 状态
const visible = ref(false)
const currentScene = ref<any>(null)
const tableData = ref<any[]>([])

/** 打开详情弹窗 */
async function showDetail(scene: any) {
  console.log('打开场景详情:', scene)
  
  // 验证 id 是否存在
  if (!scene?.id) {
    console.error('场景 ID 不存在:', scene)
    message.error('场景数据不完整，无法查看详情')
    return
  }
  
  currentScene.value = scene
  visible.value = true
  
  // 获取详情数据
  try {
    const params = { id: scene.id }
    console.log('请求参数:', params)
    const data = await planDetailApiNew(params)
    console.log('场景详情数据:', data)
    
    if (data) {
      // 根据控制类型显示不同数据
      if (scene.relType === '区域') {
        tableData.value = Array.isArray(data.areaList) ? data.areaList : []
      } else if (scene.relType === '回路') {
        tableData.value = Array.isArray(data.circuitList) ? data.circuitList : []
      }
    }
  } catch (err: any) {
    console.error('获取场景详情失败:', err)
    message.error(err?.message || '获取场景详情失败')
  }
}

/** 关闭弹窗 */
function onCancel() {
  visible.value = false
  currentScene.value = null
  tableData.value = []
}

defineExpose({ showDetail })
</script>

<style scoped lang="less">
.modal-content {
  padding: 8px 0;
}

/* 详情表格 */
.table-section {
  background: rgba(10, 22, 40, 0.08);  /* 从 0.15 降到 0.08 */
  border: 1px solid rgba(56, 189, 248, 0.1);  /* 从 0.12 降到 0.1 */
  border-radius: 6px;
  overflow: hidden;
}

.table-scroll {
  max-height: 400px;
  overflow-y: auto;
}

.device-table {
  width: 100%;
  border-collapse: collapse;
}

.device-table th,
.device-table td {
  padding: 12px;
  text-align: left;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-table thead th {
  background: rgba(27, 37, 51, 0.15);  /* 从 0.3 降到 0.15 */
  color: #a0aabf;
  font-weight: 500;
  border-bottom: 1px solid rgba(48, 61, 80, 0.1);  /* 从 0.2 降到 0.1 */
  position: sticky;
  top: 0;
  z-index: 1;
}

.device-table tbody td {
  color: #ffffff;
  border-bottom: 1px solid #303d50;
}

.device-table tbody tr {
  transition: background 0.2s;
}

.device-table tbody tr:hover {
  background: rgba(0, 162, 232, 0.04);
}

.empty-row {
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  padding: 40px 0;
}
</style>

<style lang="less">
/* 全局 Modal 样式 - 高透深色科技风（30%不透明度） */
.scene-detail-modal {
  .ant-modal-content {
    background: rgba(10, 22, 40, 0.3) !important;  /* 从 0.5 降到 0.3 */
    backdrop-filter: blur(8px);
    border: 1px solid rgba(56, 189, 248, 0.15) !important;  /* 从 0.2 降到 0.15 */
    border-radius: 8px !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(56, 189, 248, 0.05) !important;  /* 阴影大幅减弱 */
  }

  .ant-modal-header {
    background: rgba(27, 37, 51, 0.25) !important;  /* 从 0.4 降到 0.25 */
    border-bottom: 1px solid rgba(56, 189, 248, 0.1) !important;  /* 从 0.15 降到 0.1 */
    border-radius: 8px 8px 0 0 !important;
  }

  .ant-modal-title {
    color: #38bdf8 !important;
    font-weight: 600 !important;
  }

  .ant-modal-body {
    padding: 20px 24px !important;
    color: rgba(255, 255, 255, 0.85);
  }
}
</style>
