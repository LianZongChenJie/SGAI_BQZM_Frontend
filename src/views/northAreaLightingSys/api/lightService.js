/**
 * 灯光点位数据服务
 * 当前使用 mock 数据，后续可对接后端接口
 */

// mock 灯光点位数据（首钢园北区附近）
const mockLightPoints = [
  {
    id: 'LIGHT-001',
    name: 'A1-冬奥广场主灯',
    type: '高杆灯',
    status: '正常',
    power: 400,
    height: 15,
    lng: 116.1610,
    lat: 39.9100,
    videoUrl: ''
  },
  {
    id: 'LIGHT-002',
    name: 'A2-服贸会场馆路灯',
    type: '路灯',
    status: '正常',
    power: 150,
    height: 10,
    lng: 116.1660,
    lat: 39.9110,
    videoUrl: ''
  },
  {
    id: 'LIGHT-003',
    name: 'B1-工业遗址公园景观灯',
    type: '景观灯',
    status: '故障',
    power: 80,
    height: 6,
    lng: 116.1690,
    lat: 39.9080,
    videoUrl: ''
  },
  {
    id: 'LIGHT-004',
    name: 'B2-滨水绿道庭院灯',
    type: '庭院灯',
    status: '正常',
    power: 60,
    height: 4,
    lng: 116.1630,
    lat: 39.9070,
    videoUrl: ''
  },
  {
    id: 'LIGHT-005',
    name: 'C1-科技大厦投光灯',
    type: '投光灯',
    status: '正常',
    power: 200,
    height: 12,
    lng: 116.1680,
    lat: 39.9050,
    videoUrl: ''
  },
  {
    id: 'LIGHT-006',
    name: 'C2-北区入口建筑照明',
    type: '建筑照明',
    status: '离线',
    power: 300,
    height: 20,
    lng: 116.1590,
    lat: 39.9085,
    videoUrl: ''
  }
]

/**
 * 获取灯光点位列表
 * @returns {Promise<Array>} 灯光点位数组
 */
export function getLightPoints() {
  return new Promise((resolve) => {
    // 模拟接口延迟
    setTimeout(() => {
      resolve(mockLightPoints)
    }, 300)
  })
}
