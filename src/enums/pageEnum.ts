export enum PageEnum {
  // basic login path
  BASE_LOGIN = '/login',
  // basic home path（默认首页：综合预览，静态路由 /largeScreenDisplay → /largeScreenDisplay/index）
  BASE_HOME = '/largeScreenDisplay',
  // error page path
  ERROR_PAGE = '/exception',
  // error log page path
  ERROR_LOG_PAGE = '/error-log/list',
  // auth2登录路由路径
  OAUTH2_LOGIN_PAGE_PATH = '/oauth2-app/login',
  //文件路由
  SYS_FILES_PATH = '/file/share',
  // 邮件中的跳转地址
  TOKEN_LOGIN = '/tokenLogin',
  // 邮件中的跳转地址
  TOKEN_TransferJump = '/transferJump'
}
