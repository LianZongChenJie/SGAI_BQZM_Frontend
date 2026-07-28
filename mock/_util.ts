// Interface data format used to return a unified format

export function resultSuccess<T = Recordable>(result: T, { message = 'ok' } = {}) {
  return {
    code: 0,
    result,
    message,
    type: 'success',
    success: true,
  };
}
export function resultSuccessData<T = Recordable>(result: T, { message = 'ok' } = {}) {
  return {
    code: 0,
    menu: result,
    message,
    type: 'success',
    success: true,
    // ---- 下面的字段在当前业务里可以留空，但保留它们可以防止以后报错 ----
    codeList: [ "demo.dbarray",
            "online:form:generateCode",
            "online:graphreport:delete",
            "online:graphreport:add",
            "online:graphreport:edit",
            "online:graphreport:parseField",
            "online:report:deleteBatch",
            "online:graphreport:deleteBatch",
            "online:form:deleteBatch",
            "online:form:enhanceSql:save",
            "online:form:enhanceSql:edit",
            "online:form:enhanceSql:delete",
            "online:form:enhanceSql:batchDelete",
            "online:form:importTable",
            "online:form:enhanceJava:save",
            "online:form:enhanceJava:edit",
            "online:form:delete",
            "online:form:remove",
            "onl:drag:page:delete",
            "online:codeGenerate:projectPath",
            "drag:template:edit",
            "system:user:changepwd",
            "system:user:addUserRole",
            "system:permission:add",
            "system:permission:saveRole",
            "system:user:delete",
            "system:user:deleteBatch",
            "system:user:frozenBatch",
            "system:user:updatepwd",
            "system:user:addUserRole",
            "system:user:deleteRole",
            "system:user:deleteRole",
            "system:user:deleteRoleBatch",
            "system:user:deleteRoleBatch",
            "system:user:editDepartWithUser",
            "system:user:deleteUserInDepart",
            "system:user:deleteUserInDepartBatch",
            "system:user:deleteRecycleBin",
            "system:datasource:list",
            "system:depart:add",
            "system:depart:add",
            "system:permission:editRule",
            "system:permission:edit",
            "system:depart:edit",
            "system:depart:edit",
            "system:depart:delete",
            "system:depart:delete",
            "system:depart:deleteBatch",
            "system:depart:deleteBatch",
            "system:depart:importExcel",
            "system:depart:role:add",
            "system:depart:role:edit",
            "system:depart:role:delete",
            "system:depart:role:deleteBatch",
            "system:depart:role:userAdd",
            "system:dict:add",
            "system:dict:edit",
            "system:dict:delete",
            "system:dict:deleteBatch",
            "system:dict:importExcel",
            "system:getway:delete",
            "system:permission:delete",
            "system:permission:deleteBatch",
            "system:permission:addRule",
            "system:permission:deleteRule",
            "system:permission:saveDepart",
            "system:role:queryallNoByTenant",
            "system:role:add",
            "system:role:add",
            "system:role:edit",
            "system:role:edit",
            "system:role:delete",
            "system:role:delete",
            "system:role:deleteBatch",
            "system:roleindex:add",
            "system:roleindex:edit",
            "system:user:listAll",
            "system:dict:item:add",
            "system:dict:item:edit",
            "system:dict:item:delete",
            "system:dict:item:deleteBatch",
            "system:quartzJob:add",
            "system:quartzJob:edit",
            "system:quartzJob:delete",
            "system:quartzJob:deleteBatch",
            "system:quartzJob:pause",
            "system:quartzJob:resume",
            "system:quartzJob:execute",
            "system:ossFile:upload",
            "system:user:export",
            "system:user:setting:edit",
            "system:user:queryById",
            "system:tenant:invitation:user",
            "system:tenant:invitation:user",
            "system:tenant:user:list",
            "system:tenant:user:list",
            "system:tenant:leave",
            "system:tenant:packList",
            "system:tenant:packList",
            "system:tenant:add:pack",
            "system:tenant:edit:pack",
            "system:tenant:delete:pack",
            "system:tenant:tenantPageList",
            "system:tenant:getTenantListByUserId",
            "system:tenant:updateUserTenantStatus",
            "system:tenant:list",
            "system:tenant:cancelTenant",
            "system:tenant:delete",
            "system:tenant:edit",
            "system:tenant:deleteBatch",
            "system:tenant:recycleBinPageList",
            "system:tenant:deleteTenantLogic",
            "system:tenant:revertTenantLogic",
            "system:tenant:add",
            "system:log:list",
            "system:log:delete",
            "system:log:deleteBatch",
            "system:role:list",
            "system:tenant:queryList",
            "drag:analysis:sql",
            "drag:datasource:saveOrUpate",
            "drag:datasource:delete",
            "drag:datasource:deleteBatch",
            "online:form:syncDb",
            "online:form:add",
            "online:form:edit",
            "online:form:queryTables",
            "online:report:getDictList",
            "online:report:parseSql",
            "online:report:add",
            "online:report:edit",
            "online:report:delete",
            "drag:datasource:testConnection",
            "system:permission:setDefIndex",
            "system:sys_ugroup:add",
            "system:sys_ugroup:edit",
            "system:sys_ugroup:delete",
            "system:sys_ugroup:deleteBatch",
            "system:sys_ugroup:exportXls",
            "system:sys_ugroup:importExcel",
            "system:tableWhite:list",
            "system:tableWhite:add",
            "system:tableWhite:edit",
            "system:tableWhite:delete",
            "system:tableWhite:deleteBatch",
            "system:tableWhite:queryById",
            "online:report:testConnection",
            "system:user:app:edit",
            "system:dict:deleteRecycleBin",
            "system:gateway:deleteRecycleBin",
            "system:gateway:copyRoute",
            "system:gateway:putRecycleBin",
            "drag:design:getTotalData",
            "system:tenant:syncDefaultPack",
            "onl:drag:clear:recovery",
            "airag:app:edit",
            "airag:app:delete",
            "airag:knowledge:add",
            "airag:knowledge:edit",
            "airag:knowledge:rebuild",
            "airag:knowledge:delete",
            "airag:knowledge:doc:edit",
            "airag:knowledge:doc:zip",
            "airag:knowledge:doc:rebuild",
            "airag:knowledge:doc:deleteBatch",
            "airag:knowledge:doc:deleteAll",
            "airag:model:add",
            "airag:model:edit",
            "airag:model:delete",
            "airag:flow:add",
            "airag:flow:edit",
            "airag:flow:designSave",
            "airag:flow:debug",
            "airag:flow:delete",
            "system:roleindex:add",
            "system:roleindex:edit",
            "system:roleindex:delete",
            "system:roleindex:deleteBatch",
            "app:edit:version",
            "system:depart:updateChange",
            "system:user:resetPassword",
            "system:user:queryUserRole",
            "airag:flow:copy",
            "openapi:open_api:add",
            "openapi:open_api:edit",
            "openapi:open_api:delete",
            "openapi:open_api:deleteBatch",
            "openapi:open_api:exportXls",
            "openapi:open_api:importExcel",
            "openapi:open_api_auth:add",
            "openapi:open_api_auth:edit",
            "openapi:open_api_auth:delete",
            "openapi:open_api_auth:deleteBatch",
            "openapi:open_api_auth:exportXls",
            "openapi:open_api_auth:importExcel",
            "wordtpl:template:add",
            "wordtpl:template:edit",
            "wordtpl:template:delete",
            "wordtpl:template:deleteBatch",
            "wordtpl:template:design",
            "system:datasource:add",
            "system:datasource:edit",
            "system:datasource:delete",
            "system:datasource:import",
            "system:datasource:export",
            "airag:mcp:list",
            "airag:mcp:save",
            "airag:mcp:delete",
            "airag:mcp:queryById",
            "airag:mcp:export",
            "airag:mcp:import",
            "system:gateway:updateAll",
            "system:ossFile:list",
            "system:ossFile:delete",
            "system:sysAnnouncement:list",
            "system:sysAnnouncement:add",
            "system:sysAnnouncement:edit",
            "system:sysAnnouncement:editIzTop",
            "system:sysAnnouncement:delete",
            "system:sysAnnouncement:deleteBatch",
            "system:sysAnnouncement:doReleaseData",
            "system:sysAnnouncement:doReovkeData",
            "system:sysAnnouncement:exportXls",
            "system:sysAnnouncement:importExcel",
            "system:sysAnnouncement:syncNotic",
            "btn:add",
            "system:user:edit",
            "system:user:add",
            "user:form:phone",
            "system:user:import"
    ],          // ← 权限码列表（后端也会返回）
    auth: [{
                "action": "btn:add",
                "describe": "btn:add",
                "type": "1",
                "status": "1"
            },
            {
                "action": "system:user:edit",
                "describe": "用户编辑",
                "type": "1",
                "status": "1"
            },
            {
                "action": "system:user:addTenantUser",
                "describe": "新增用户",
                "type": "1",
                "status": "1"
            },
            {
                "action": "system:user:add",
                "describe": "新增用户",
                "type": "1",
                "status": "1"
            },],              // ← 当前用户的权限项
    allAuth: [{
                "action": "demo.dbarray",
                "describe": "禁用",
                "type": "2"
            },
            {
                "action": "online:form:generateCode",
                "describe": "代码生成",
                "type": "1"
            },
            {
                "action": "online:graphreport:delete",
                "describe": "删除",
                "type": "1"
            },],           // ← 所有权限项
    sysSafeMode: false,    // ← 系统安全模式标记
  };
}


export function resultPageSuccess<T = any>(
  pageNo: number,
  pageSize: number,
  list: T[],
  { message = 'ok' } = {}
) {
  const pageData = pagination(pageNo, pageSize, list);

  return {
    ...resultSuccess({
      records: pageData,
      total: list.length,
    }),
    message,
  };
}

export function resultError(message = 'Request failed', { code = -1, result = null } = {}) {
  return {
    code,
    result,
    message,
    type: 'error',
  };
}

export function pagination<T = any>(pageNo: number, pageSize: number, array: T[]): T[] {
  const offset = (pageNo - 1) * Number(pageSize);
  const ret =
    offset + Number(pageSize) >= array.length
      ? array.slice(offset, array.length)
      : array.slice(offset, offset + Number(pageSize));
  return ret;
}

export interface requestParams {
  method: string;
  body: any;
  headers?: { authorization?: string };
  query: any;
}

/**
 * @description 本函数用于从request数据中获取token，请根据项目的实际情况修改
 *
 */
export function getRequestToken({ headers }: requestParams): string | undefined {
  return headers?.authorization;
}

//TODO 接口父路径（写死不够灵活）
export const baseUrl = '/jeecgboot/mock';
// export const baseUrl = '/jeecgboot';
