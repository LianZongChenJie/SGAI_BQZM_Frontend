import { defHttp } from '/@/utils/http/axios';

enum Api {
  EquipmentList = '/sgai-bqzm/bems/device/equipment/list',
}
export const EquipmentListApi = (params?: Recordable) => defHttp.get<Recordable[]>({ url: Api.EquipmentList, params });