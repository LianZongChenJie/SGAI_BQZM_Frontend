<template>
  <Header v-if="showHeader" :class="getHeaderClass" style="background: #1e293b !important;">
    <!-- left start -->
    <div :class="`${prefixCls}-left`">
      <!-- logo -->
      <AppLogo v-if="getShowHeaderLogo || getIsMobile" :class="`${prefixCls}-logo`" :theme="getHeaderTheme" :style="getLogoWidth" />
      <LayoutTrigger
        v-if="!isBigGis && ((getShowContent && getShowHeaderTrigger && !getSplit && !getIsMixSidebar) || getIsMobile)"
        :theme="getHeaderTheme"
        :sider="false"
      />
      <LayoutBreadcrumb v-if="getShowContent && getShowBread" :theme="getHeaderTheme" />
      <!-- 欢迎语 -->
      <!-- <span v-if="getShowContent && getShowBreadTitle && !getIsMobile" style="background: #1e293b !important;color: #fff;"> {{t('layout.header.welcomeIn')}} {{ title }} </span> -->
      <span v-if="!isBigGis" style="color: #F1F5F9;font-size: 16px;padding-left: 30px;">{{ menuTitle }}</span>
      <span v-else style="color: #0EA5E9;font-size: 16px;font-weight: 600;padding-left: 30px;letter-spacing: 1px;">首钢园城市亮化平台</span>
      <div class="status-badge">
      <span class="status-dot"></span>
      <span>系统运行正常</span>
    </div>
    </div>
    <!-- left end -->

    <!-- menu start -->
    <div :class="`${prefixCls}-menu`" v-if="getShowTopMenu && !getIsMobile">
      <LayoutMenu :isHorizontal="true" :theme="getHeaderTheme" :splitType="getSplitType" :menuMode="getMenuMode" />
    </div>
    <!-- menu-end -->

    <!-- action  -->
    <div class="header-action">
      <!-- <AppSearch :class="`${prefixCls}-action__item `" v-if="getShowSearch" /> -->

      <!-- <ErrorAction v-if="getUseErrorHandle" :class="`${prefixCls}-action__item error-action`" /> -->

      <!-- <Notify v-if="getShowNotice" :class="`${prefixCls}-action__item notify-item`" /> -->

      <!-- <FullScreen v-if="getShowFullScreen" :class="`${prefixCls}-action__item fullscreen-item`" /> -->

      <!-- <LockScreen v-if="getUseLockPage" /> -->

      <!-- <AppLocalePicker v-if="getShowLocalePicker" :reload="true" :showText="false" :class="`${prefixCls}-action__item`" /> -->
      <a-button class="mode-toggle-btn" @click="toggleMode">
        {{ isBigGis ? '表单模式' : '地图模式' }}
      </a-button>
      <UserDropDown :theme="getHeaderTheme" />


      <!-- <SettingDrawer v-if="getShowSetting" :class="`${prefixCls}-action__item`" /> -->
      <!-- ai助手 -->
      <!-- <Aide></Aide> -->
    </div>
  </Header>
  <LoginSelect ref="loginSelectRef" @success="loginSelectOk"></LoginSelect>
</template>
<script lang="ts">
  import { defineComponent, unref, computed, ref, onMounted, toRaw } from 'vue';
  import { useGlobSetting } from '/@/hooks/setting';
  import { propTypes } from '/@/utils/propTypes';

  import { Layout } from 'ant-design-vue';
  import { AppLogo } from '/@/components/Application';
  import LayoutMenu from '../menu/index.vue';
  import LayoutTrigger from '../trigger/index.vue';

  import { AppSearch } from '/@/components/Application';

  import { useHeaderSetting } from '/@/hooks/setting/useHeaderSetting';
  import { useMenuSetting } from '/@/hooks/setting/useMenuSetting';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';

  import { MenuModeEnum, MenuSplitTyeEnum } from '/@/enums/menuEnum';
  import { SettingButtonPositionEnum } from '/@/enums/appEnum';
  import { AppLocalePicker } from '/@/components/Application';

  import { UserDropDown, LayoutBreadcrumb, FullScreen, Notify, ErrorAction, LockScreen } from './components';
  import { useAppInject } from '/@/hooks/web/useAppInject';
  import { useDesign } from '/@/hooks/web/useDesign';

  import { createAsyncComponent } from '/@/utils/factory/createAsyncComponent';
  import { useLocale } from '/@/locales/useLocale';

  import LoginSelect from '/@/views/sys/login/LoginSelect.vue';
  import { useUserStore } from '/@/store/modules/user';
  import { useI18n } from '/@/hooks/web/useI18n';
  import Aide from "@/views/dashboard/ai/components/aide/index.vue"

  import { useRoute, useRouter } from 'vue-router';

  const { t } = useI18n();

  export default defineComponent({
    name: 'LayoutHeader',
    components: {
      Header: Layout.Header,
      AppLogo,
      LayoutTrigger,
      LayoutBreadcrumb,
      LayoutMenu,
      UserDropDown,
      AppLocalePicker,
      FullScreen,
      Notify,
      AppSearch,
      ErrorAction,
      LockScreen,
      LoginSelect,
      SettingDrawer: createAsyncComponent(() => import('/@/layouts/default/setting/index.vue'), {
        loading: true,
      }),
      Aide
    },
    props: {
      fixed: propTypes.bool,
    },
    setup(props) {
      const { prefixCls } = useDesign('layout-header');
      // IOC 平台 iframe 嵌入（URL 携带 from=ioc）：不展示框架顶部导航栏，只展示页面主体
      const fromParam = new URLSearchParams(window.location.search).get('from') ?? '';
      const showHeader = fromParam.replace(/['"]/g, '').toLowerCase() !== 'ioc';
      const userStore = useUserStore();
      const { getShowTopMenu, getShowHeaderTrigger, getSplit, getIsMixMode, getMenuWidth, getIsMixSidebar } = useMenuSetting();
      const { getUseErrorHandle, getShowSettingButton, getSettingButtonPosition } = useRootSetting();
      const { title } = useGlobSetting();
        const route = useRoute();
  const router = useRouter();
  const menuTitle = computed(() => route.meta?.title ?? (route.name as
  string));
  console.log("---------------vue-------")
  console.log(menuTitle.value)
  const isBigGis = computed(() => route.path.startsWith('/bigGis'));
  function toggleMode() {
    if (isBigGis.value) {
      router.push('/northAreaLightingSys/comprehensivePreview');
    } else {
      router.push('/bigGis');
    }
  }
      const {
        getHeaderTheme,
        getShowFullScreen,
        getShowNotice,
        getShowContent,
        getShowBread,
        getShowHeaderLogo,
        getShowHeader,
        getShowSearch,
        getUseLockPage,
        getShowBreadTitle,
      } = useHeaderSetting();

      const { getShowLocalePicker } = useLocale();

      const { getIsMobile } = useAppInject();

      const getHeaderClass = computed(() => {
        const theme = unref(getHeaderTheme);
        return [
          prefixCls,
          {
            [`${prefixCls}--fixed`]: props.fixed,
            [`${prefixCls}--mobile`]: unref(getIsMobile),
            [`${prefixCls}--${theme}`]: theme,
          },
        ];
      });

      const getShowSetting = computed(() => {
        if (!unref(getShowSettingButton)) {
          return false;
        }
        const settingButtonPosition = unref(getSettingButtonPosition);

        if (settingButtonPosition === SettingButtonPositionEnum.AUTO) {
          return unref(getShowHeader);
        }
        return settingButtonPosition === SettingButtonPositionEnum.HEADER;
      });

      const getLogoWidth = computed(() => {
        if (!unref(getIsMixMode) || unref(getIsMobile)) {
          return {};
        }
        const width = unref(getMenuWidth) < 180 ? 180 : unref(getMenuWidth);
        return { width: `${width}px` };
      });

      const getSplitType = computed(() => {
        return unref(getSplit) ? MenuSplitTyeEnum.TOP : MenuSplitTyeEnum.NONE;
      });

      const getMenuMode = computed(() => {
        return unref(getSplit) ? MenuModeEnum.HORIZONTAL : null;
      });

      /**
       * 首页多租户部门弹窗逻辑
       */
      const loginSelectRef = ref();

      function showLoginSelect() {
        //update-begin---author:liusq  Date:20220101  for：判断登录进来是否需要弹窗选择租户----
        //判断是否是登陆进来
        const loginInfo = toRaw(userStore.getLoginInfo) || {};
        if (!!loginInfo.isLogin) {
          loginSelectRef.value.show(loginInfo);
        }
        //update-end---author:liusq  Date:20220101  for：判断登录进来是否需要弹窗选择租户----
      }

      function loginSelectOk() {
        console.log('成功。。。。。');
      }

      onMounted(() => {
        showLoginSelect();
      });

      return {
        prefixCls,
        getHeaderClass,
        getShowHeaderLogo,
        getHeaderTheme,
        getShowHeaderTrigger,
        getIsMobile,
        getShowBreadTitle,
        getShowBread,
        getShowContent,
        getSplitType,
        getSplit,
        getMenuMode,
        getShowTopMenu,
        getShowLocalePicker,
        getShowFullScreen,
        getShowNotice,
        getUseErrorHandle,
        getLogoWidth,
        getIsMixSidebar,
        getShowSettingButton,
        getShowSetting,
        getShowSearch,
        getUseLockPage,
        loginSelectOk,
        loginSelectRef,
        title,
        t,
        menuTitle,
        isBigGis,
        toggleMode,
        showHeader
      };
    },
  });
</script>
<style lang="less">
  @import './index.less';
  //update-begin---author:scott ---date:2022-09-30  for：默认隐藏顶部菜单面包屑-----------
  //顶部欢迎语展示样式
  @prefix-cls: ~'@{namespace}-layout-header';
  
  .ant-layout .@{prefix-cls} {
    display: flex;
    padding: 0 8px;
    // update-begin--author:liaozhiyang---date:20240407---for：【QQYUN-8762】顶栏高度
    height: @header-height;
    // update-end--author:liaozhiyang---date:20240407---for：【QQYUN-8762】顶栏高度
    align-items: center;
    .headerIntroductionClass {
      margin-right: 4px;
      margin-bottom: 2px;
      border-bottom: 0px;
      border-left: 0px;
    }
    
    &--light {
      .headerIntroductionClass {
        color: #000;
      }
    }

    &--dark {
      .headerIntroductionClass {
        color: rgba(255, 255, 255, 1);
      }
      .anticon, .truncate {
        color: rgba(255, 255, 255, 1);
      }
    }
    //update-end---author:scott ---date::2022-09-30  for：默认隐藏顶部菜单面包屑--------------
  }
  /* 容器样式 */
.status-badge {
  display: inline-flex;
  align-items: center;
  margin-left: 36px;
  gap: 8px; /* 圆点和文字的间距 */
  height: 32px;
  /* 背景与边框 */
  background-color: rgba(16, 185, 129, 0.1); /* 极淡的绿色背景，增加层次感 */
  border: 1px solid rgba(16, 185, 129, 0.2); /* 微弱的绿色描边 */
  
  /* 形状与尺寸 */
  padding: 1px 16px;
  border-radius: 99px; /* 胶囊形状 */
  
  /* 文字样式 */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  color: #34d399; /* 亮绿色文字 (Emerald-400) */
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 状态圆点样式 */
.status-dot {
  width: 8px;
  height: 8px;
  background-color: #10b981; /* 实心绿色 (Emerald-500) */
  border-radius: 50%;

  /* 关键：添加外发光效果，模拟指示灯 */
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
}

/* 头部操作区：按钮与用户信息并排 */
.header-action {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 地图/表单模式切换按钮 */
.mode-toggle-btn {
  background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
  border: 1px solid rgba(59, 130, 246, 0.5) !important;
  color: #fff !important;
  border-radius: 6px;
  height: 32px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.5px;
  &:hover {
    background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
    border-color: rgba(59, 130, 246, 0.8) !important;
  }
}
</style>
