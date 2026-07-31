import { defHttp } from '/@/utils/http/axios';

enum Api {
  getAreaListAll = '/sgai-bqzm/bems/lighting/area/all',
  getCircuitListAll = '/sgai-bqzm/bems/lighting/circuit/all',
}

/**
 * 获取全部区域数据
 */
export const getAreaListAll = (params) => defHttp.get({ url: Api.getAreaListAll, params });
/**
 * 获取全部回路数据
 */
export const getCircuitListAll = (params) => defHttp.get({ url: Api.getCircuitListAll, params }, { joinParamsToUrl: true });
