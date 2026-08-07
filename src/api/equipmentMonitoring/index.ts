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
  getLogDetailApi = '/sgai-bqzm/bems/lighting/operationLog/detail',
  getCalendarControlApi = '/sgai-bqzm/bems/lighting/calendar/events',
  getLightingPlanAPiNew = '/sgai-bqzm/bems/lighting/scene/listPage',
  planDetailApiNew = '/sgai-bqzm/bems/lighting/scene/detail',
  addLightingPlanAPiNew = '/sgai-bqzm/bems/lighting/scene/add',
  editLightingPlanAPiNew = '/sgai-bqzm/bems/lighting/scene/edit',
  postSceneSwitchApi = '/sgai-bqzm/bems/lighting/plan/control',
  getCalendarControlDetailApi = '/sgai-bqzm/bems/lighting/calendar/detail',
  getAreaListAllTagApi = '/sgai-bqzm/bems/lighting/district/all',
  getAllVidoeListApi = '/sgai-bqzm/bems/lighting/videoMonitor/list',
  deleteSceneItemAPi = '/sgai-bqzm/bems/lighting/scene/delete',
  postSceneControlApi = '/sgai-bqzm/bems/lighting/scene/control',
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
// 获取日志详情--回路信息
export const getLogDetailApi = (params) => defHttp.get({ url: Api.getLogDetailApi, params }, { joinParamsToUrl: true });

// 日历显示定时任务接口
export const getCalendarControlApi = (params) => defHttp.get({ url: Api.getCalendarControlApi, params }, { joinParamsToUrl: true });

/**
 * 获取场景数据新
 */
export const getLightingPlanAPiNew = (params) => defHttp.get({ url: Api.getLightingPlanAPiNew, params }, { joinParamsToUrl: true });
/**
 * 获取场景详情
 * @param params
 */
export const planDetailApiNew = (params) => defHttp.get({ url: Api.planDetailApiNew, params });
/**
 * 新增场景
 */
export const addLightingPlanAPiNew = (params) => defHttp.post({ url: Api.addLightingPlanAPiNew, params });
/**
 * 编辑场景
 */
export const editLightingPlanAPiNew = (params) => defHttp.post({ url: Api.editLightingPlanAPiNew, params });
// 删除场景
export const deleteSceneItemAPi = (params) => defHttp.delete({ url: Api.deleteSceneItemAPi, params }, { joinParamsToUrl: true });

// 场景的全开全关
export const postSceneSwitchApi = (params) => defHttp.post({ url: Api.postSceneSwitchApi, params });

// 场景控制（sceneId + operationType，query 传参）
export const postSceneControlApi = (params) => defHttp.post({ url: Api.postSceneControlApi, params }, { joinParamsToUrl: true });

// 获取日历详情接口
export const getCalendarControlDetailApi = (params) => defHttp.get({ url: Api.getCalendarControlDetailApi, params });
// 获取所有片区--标签
export const getAreaListAllTagApi = (params) => defHttp.get({ url: Api.getAreaListAllTagApi, params });

// 获取所有视频列表
export const getAllVidoeListApi = (params) => defHttp.get({ url: Api.getAllVidoeListApi, params });