import { defHttp } from '/@/utils/http/axios';

enum Api {
  overviewStats = '/northAreaLighting/overview/stats',
  blockList = '/northAreaLighting/overview/blockList',
  allOn = '/sgai-bqzm/bems/lighting/home/controlAll?action=open',
  allOff = '/sgai-bqzm/bems/lighting/home/controlAll?action=close',
  getAllSpace = '/sgai-bqzm/bems/lighting/area/getAllSpace',
  getAllCircuit = '/sgai-bqzm/bems/lighting/circuit/all',
  openArea = '/sgai-bqzm/bems/lighting/area/open',
  closeArea = '/sgai-bqzm/bems/lighting/area/close',
  allArea = '/sgai-bqzm/bems/lighting/area/all',
  areaRunStatus = '/sgai-bqzm/bems/lighting/home/areaRunStatus',
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
export const openAreaApi = (id: string) => defHttp.post({ url: Api.openArea, params: { id } }, { joinParamsToUrl: true });

/** 关闭地块照明 */
export const closeAreaApi = (id: string) => defHttp.post({ url: Api.closeArea, params: { id } }, { joinParamsToUrl: true });

/** 获取所有区域标点数据 */
export const getAllAreaApi = () => defHttp.get({ url: Api.allArea });

/** 获取地块运行状态统计（正常/告警/离线） */
export const getAreaRunStatusApi = () => defHttp.get({ url: Api.areaRunStatus });

