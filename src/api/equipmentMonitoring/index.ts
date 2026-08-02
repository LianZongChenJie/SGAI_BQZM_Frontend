import { defHttp } from '/@/utils/http/axios';

enum Api {
  getAreaListAll = '/sgai-bqzm/bems/lighting/area/all',
  getCircuitListAll = '/sgai-bqzm/bems/lighting/circuit/all',
  editLightingPlanAPi = '/sgai-bqzm/bems/lighting/plan/edit',
  addLightingPlanAPi = '/sgai-bqzm/bems/lighting/plan/add',
  getLightingPlanAPi = '/sgai-bqzm/bems/lighting/plan/listPage',
  planDetailApi = '/sgai-bqzm/bems/lighting/plan/detail',
  deleteLightingPlanAPi = '/sgai-bqzm/bems/lighting/plan/delete',
  disableApi = '/sgai-bqzm/bems/lighting/plan/disable',
  getPlanTimeApi = '/sgai-bqzm/bems/lighting/planExecutionTime/getByPlanId',
  enablePlanApi = '/sgai-bqzm/bems/lighting/plan/enable',
  executeNowApi = '/sgai-bqzm/bems/lighting/plan/executeNow',
  controlRecordListApi = '/sgai-bqzm/bems/lighting/operationLog/listPage',
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
/**
 * 删除定时计划
 */
export const deleteLightingPlanAPi = (params) => defHttp.delete({ url: Api.deleteLightingPlanAPi, params }, { joinParamsToUrl: true });

/**
 * 禁用
 */
export const disableApi = (params) => defHttp.post({ url: Api.disableApi, params }, { joinParamsToUrl: true });

/**
 * 获取控制计划启用信息
 */
export const getPlanTimeApi = (params) => defHttp.get({ url: Api.getPlanTimeApi, params }, { joinParamsToUrl: true });

/**
 * 启用控制计划
 */
export const enablePlanApi = (params) => defHttp.post({ url: Api.enablePlanApi, params }, { joinParamsToUrl: true });
/**
 * 立即执行计划
 * @param params
 */
export const executeNow = (params) => defHttp.post({ url: Api.executeNowApi, params }, { joinParamsToUrl: true });
/**
 * 控制记录列表
 */
export const controlRecordListApi = (params) => defHttp.get({ url: Api.controlRecordListApi, params }, { joinParamsToUrl: true });
