<template>
  <div class="video-player-wrap">
    <video
      ref="videoRef"
      class="video-player"
      :muted="muted"
      :autoplay="autoplay"
      :loop="loop"
      :controls="controls"
      playsinline
      webkit-playsinline
    />
    <div v-if="loading" class="video-loading">
      <a-spin size="small" />
    </div>
    <div v-if="error" class="video-error">
      <video-camera-outlined class="error-icon" />
      <span class="error-text">视频加载失败</span>
      <span v-if="errorMsg" class="error-detail">{{ errorMsg }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Hls from 'hls.js'
import { VideoCameraOutlined } from '@ant-design/icons-vue'

const props = withDefaults(
  defineProps<{
    url: string
    muted?: boolean
    autoplay?: boolean
    loop?: boolean
    controls?: boolean
  }>(),
  {
    muted: true,
    autoplay: true,
    loop: false,
    controls: false,
  },
)

const videoRef = ref<HTMLVideoElement | null>(null)
const loading = ref(true)
const error = ref(false)
const errorMsg = ref('')
let hls: Hls | null = null

/* ==================== video 原生事件（缓冲状态） ==================== */
const onVideoWaiting = () => {
  loading.value = true
}
const onVideoPlaying = () => {
  loading.value = false
}
const onVideoCanPlay = () => {
  loading.value = false
}

// 清理事件绑定
const cleanupVideoEvents = (video: HTMLVideoElement) => {
  video.removeEventListener('waiting', onVideoWaiting)
  video.removeEventListener('playing', onVideoPlaying)
  video.removeEventListener('canplay', onVideoCanPlay)
}

const destroyHls = () => {
  if (hls) {
    hls.destroy()
    hls = null
  }
  if (videoRef.value) {
    cleanupVideoEvents(videoRef.value)
  }
}

const play = () => {
  if (!videoRef.value || !props.url) {
    loading.value = false
    error.value = true
    errorMsg.value = '无效的视频地址'
    return
  }

  destroyHls()
  loading.value = true
  error.value = false
  errorMsg.value = ''
  const video = videoRef.value

  // 清除旧事件，绑定缓冲状态监听
  cleanupVideoEvents(video)
  video.addEventListener('waiting', onVideoWaiting)
  video.addEventListener('playing', onVideoPlaying)
  video.addEventListener('canplay', onVideoCanPlay)

  // 设置跨域属性（必须在 src 之前设置）
  video.setAttribute('crossorigin', 'anonymous')

  // 优先 hls.js（Chrome / Firefox / Edge 等）
  if (Hls.isSupported()) {
    hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      xhrSetup: (xhr, _url) => {
        xhr.withCredentials = false
      },
    })
    hls.loadSource(props.url)
    hls.attachMedia(video)
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log('[VideoPlayer] hls.js MANIFEST_PARSED 成功')
      // 不在此关闭 loading，等 video.playing 事件触发后自动关闭（第一帧渲染完成）
      video.play().catch((err) => {
        console.error('[VideoPlayer] play() 失败:', err)
      })
    })
    hls.on(Hls.Events.ERROR, (_event, data) => {
      const errInfo = {
        type: data.type,
        details: data.details,
        fatal: data.fatal,
        url: data.url,
        response: data.response,
        reason: (data as any).reason,
        error: data.error,
      }
      console.error('[VideoPlayer] hls.js 错误:', JSON.stringify(errInfo, null, 2))

      if (data.fatal) {
        loading.value = false
        error.value = true
        errorMsg.value = `hls.js 致命错误: ${data.type} - ${data.details}`
        destroyHls()
      }
    })
    return
  }

  // 原生 HLS 回退（仅 Safari / iOS 走到这里）
  const nativeHls = video.canPlayType('application/vnd.apple.mpegurl')
  if (nativeHls === 'probably' || nativeHls === 'maybe') {
    video.src = props.url
    video.addEventListener('loadedmetadata', () => {
      video.play().catch(() => {})
    })
    video.addEventListener('error', (e) => {
      console.error('[VideoPlayer] 原生 HLS 播放失败:', e)
      loading.value = false
      error.value = true
      errorMsg.value = '原生播放失败'
    })
    return
  }

  loading.value = false
  error.value = true
  errorMsg.value = '当前浏览器不支持 HLS 播放'
}

watch(
  () => props.url,
  () => {
    play()
  },
)

onMounted(() => {
  play()
})

onBeforeUnmount(() => {
  destroyHls()
})
</script>

<style scoped lang="less">
.video-player-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.video-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
}

.video-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  color: rgba(255, 255, 255, 0.5);

  .error-icon {
    font-size: 28px;
    margin-bottom: 6px;
  }

  .error-text {
    font-size: 11px;
  }

  .error-detail {
    margin-top: 4px;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.3);
    word-break: break-all;
    max-width: 90%;
    text-align: center;
  }
}
</style>
