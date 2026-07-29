import { defHttp } from '/@/utils/http/axios';

enum Api {
  overviewStats = '/northAreaLighting/overview/stats',
  blockList = '/northAreaLighting/overview/blockList',
  allOn = '/northAreaLighting/control/allOn',
  allOff = '/northAreaLighting/control/allOff',
}

/** 获取总览统计数据 */
export const getOverviewStatsApi = () => defHttp.get({ url: Api.overviewStats });

/** 获取地块运行状态列表 */
export const getBlockListApi = () => defHttp.get({ url: Api.blockList });

/** 全区开灯 */
export const allOnApi = () => defHttp.post({ url: Api.allOn });

/** 全区关灯 */
export const allOffApi = () => defHttp.post({ url: Api.allOff });
