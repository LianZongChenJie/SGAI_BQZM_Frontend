import { defHttp } from '/@/utils/http/axios';

enum Api {
  getAreaListPageApi = '/sgai-bqzm/bems/lighting/area/listPage1',
  relNameApi = '/sgai-bqzm/bems/lighting/area/getAllRelName',
  allSpaceApi = '/sgai-bqzm/bems/lighting/area/getAllSpace',
  setAreaOpenApi = '/sgai-bqzm/bems/lighting/area/open',
  setAreaCloseApi = '/sgai-bqzm/bems/lighting/area/close',
}
/**
 * 获取区域数据
 */
export const getAreaListPageApi = (params) => defHttp.get({ url: Api.getAreaListPageApi, params });
/**
 * 获取区域类型
 * @param params
 */
export const getRelName = (params) => defHttp.get({ url: Api.relNameApi, params });
/**
 * 获取全部区域
 * @param params
 */
export const getAllSpace = () => defHttp.get({ url: Api.allSpaceApi });
/**
 * 开启区域
 */
export const setAreaOpenApi = (params) => defHttp.post({ url: Api.setAreaOpenApi, params }, { joinParamsToUrl: true });

/**
 * 关闭区域
 */
export const setAreaCloseApi = (params) => defHttp.post({ url: Api.setAreaCloseApi, params }, { joinParamsToUrl: true });