import { defHttp } from '/@/utils/http/axios';

enum Api {
  overviewStats = '/northAreaLighting/overview/stats',
  blockList = '/northAreaLighting/overview/blockList',
  allOn = '/northAreaLighting/control/allOn',
  allOff = '/northAreaLighting/control/allOff',
  getAllSpace = '/sgai-bqzm/bems/lighting/area/getAllSpace',
  getAllCircuit = '/sgai-bqzm/bems/lighting/circuit/all',
  openArea = '/sgai-bqzm/bems/lighting/area/open',
  closeArea = '/sgai-bqzm/bems/lighting/area/close',
}

/** 获取总览统计数据 */
export const getOverviewStatsApi = () => defHttp.get({ url: Api.overviewStats });

/** 获取地块运行状态列表 */
export const getBlockListApi = () => defHttp.get({ url: Api.blockList });

/** 全区开灯 */
export const allOnApi = () => defHttp.post({ url: Api.allOn });

/** 全区关灯 */
export const allOffApi = () => defHttp.post({ url: Api.allOff });

/** 获取所有地块 */
export const getAllSpaceApi = () => defHttp.get({ url: Api.getAllSpace });

/** 查询所有回路 */
export const getAllCircuitApi = () => defHttp.get({ url: Api.getAllCircuit });

/** 开启地块照明 */
export const openAreaApi = (id: string) => defHttp.post({ url: Api.openArea, params: { id } });

/** 关闭地块照明 */
export const closeAreaApi = (id: string) => defHttp.post({ url: Api.closeArea, params: { id } });

