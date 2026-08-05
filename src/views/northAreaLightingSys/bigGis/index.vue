<template>
  <div class="big-gis-page">
    <MapView ref="mapViewRef" />
    <div class="bottom-toolbar">
      <el-button class="toolbar-btn" @click="handleShowArea">地块</el-button>
      <el-button class="toolbar-btn" @click="handleShowDetails">详情</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MapView from '../comprehensivePreview/MapView.vue'

const mapViewRef = ref<any>(null)

function handleShowArea() {
  mapViewRef.value?.showArea?.()
}

function handleShowDetails() {
  mapViewRef.value?.showDetails?.()
}
</script>

<style scoped>
.big-gis-page {
  position: relative;
  width: 100%;
  height: 100%;
  background: #0f172a;
  overflow: hidden;
}

.bottom-toolbar {
  position: absolute;
  left: 16px;
  bottom: 16px;
  z-index: 30;
  display: flex;
  gap: 8px;
}

.toolbar-btn {
  background: rgba(10, 22, 40, 0.95);
  color: #fff;
  border: 1px solid #2a4a6f;
}

.toolbar-btn:hover {
  background: #2a4a6f;
  color: #fff;
}
</style>
