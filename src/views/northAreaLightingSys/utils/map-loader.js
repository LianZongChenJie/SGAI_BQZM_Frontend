/**
 * 高德地图 JS API 动态加载器
 * 使用 useScript 方式加载高德地图 SDK
 */

const AMAP_KEY = '06313eb9c6563b674a8fd789db0692c3'
const AMAP_URL = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}`

let loadPromise = null

export function loadAMap() {
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    // 如果已经加载过
    if (window.AMap) {
      resolve(window.AMap)
      return
    }

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = AMAP_URL

    script.onload = () => {
      if (window.AMap) {
        resolve(window.AMap)
      } else {
        reject(new Error('高德地图 SDK 加载失败'))
      }
    }

    script.onerror = () => {
      reject(new Error('高德地图 SDK 脚本加载失败'))
    }

    document.head.appendChild(script)
  })

  return loadPromise
}
