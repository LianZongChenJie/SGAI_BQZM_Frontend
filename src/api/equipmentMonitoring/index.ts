import { defHttp } from '/@/utils/http/axios';

enum Api {
  getAreaListAll = '/sgai-bqzm/bems/lighting/area/all',
  getCircuitListAll = '/sgai-bqzm/bems/lighting/circuit/all',
  editLightingPlanAPi = '/sgai-bqzm/bems/lighting/plan/edit',
  addLightingPlanAPi = '/sgai-bqzm/bems/lighting/plan/add',
  getLightingPlanAPi = '/sgai-bqzm/bems/lighting/plan/listPage',
  planDetailApi = '/sgai-bqzm/bems/lighting/plan/detail',
}

/**
 * 获取全部区域数据
 */
export const getAreaListAll = (params) => defHttp.get({ url: Api.getAreaListAll, params });
/**
 * 获取全部回路数据
 */
export const getCircuitListAll = (params) => defHttp.get({ url: Api.getCircuitListAll, params }, { joinParamsToUrl: true });
/**
 * 编辑定时计划
 */
export const editLightingPlanAPi = (params) => defHttp.post({ url: Api.editLightingPlanAPi, params });

/**
 * 新增定时计划
 */
export const addLightingPlanAPi = (params) => defHttp.post({ url: Api.addLightingPlanAPi, params });
/**
 * 获取回路分页数据
 */
export const getLightingPlanAPi = (params) => defHttp.get({ url: Api.getLightingPlanAPi, params }, { joinParamsToUrl: true });
/**
 * 获取计划详情
 * @param params
 */
export const planDetailApi = (params) => defHttp.get({ url: Api.planDetailApi, params });
