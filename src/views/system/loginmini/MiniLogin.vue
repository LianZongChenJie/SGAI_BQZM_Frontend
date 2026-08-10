<template>
  <div :class="prefixCls" class="login-page">
    <AppLocalePicker class="locale-picker" :showText="false" v-if="showLocale" />
    <AppDarkModeToggle class="dark-toggle" />

    <!-- 背景粒子 -->
    <div class="particles">
      <span v-for="i in 20" :key="i" class="particle" :style="getParticleStyle(i)" />
    </div>

    <!-- 登录卡片（仅 login 模式） -->
    <div v-show="type === 'login'" class="login-card enter-x">
      <!-- Logo & 标题 -->
      <div class="login-header">
        <div class="login-logo">
          <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="56" y2="56">
                <stop offset="0%" stop-color="#3b82f6" />
                <stop offset="100%" stop-color="#06b6d4" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="52" height="52" rx="12" stroke="url(#logoGrad)" stroke-width="2.5" fill="none" />
            <polygon points="28,10 40,18 40,38 28,46 16,38 16,18" stroke="url(#logoGrad)" stroke-width="2" fill="rgba(59,130,246,0.15)" stroke-linejoin="round" />
            <circle cx="28" cy="22" r="3" fill="url(#logoGrad)" />
            <line x1="28" y1="25" x2="28" y2="34" stroke="url(#logoGrad)" stroke-width="2" stroke-linecap="round" />
            <line x1="22" y1="32" x2="34" y2="32" stroke="url(#logoGrad)" stroke-width="1.5" stroke-linecap="round" opacity="0.6" />
            <line x1="19" y1="35" x2="37" y2="35" stroke="url(#logoGrad)" stroke-width="1" stroke-linecap="round" opacity="0.35" />
          </svg>
        </div>
        <h1 class="login-title">首钢园城市亮化平台</h1>
        <p class="login-subtitle">智慧照明 · 数字孪生 · AI驱动</p>
      </div>

      <!-- 表单 -->
      <div class="login-body">
        <a-form :model="formData" name="loginForm" autocomplete="off">
          <!-- 用户名 -->
          <a-form-item name="username" :rules="[{ required: true, message: '请输入用户名' }]">
            <a-input
              size="large"
              v-model:value="formData.username"
              placeholder="用户名"
              @keyup.enter="login"
            />
          </a-form-item>

          <!-- 密码 -->
          <a-form-item name="password" :rules="[{ required: true, message: '请输入密码' }]">
            <a-input-password
              size="large"
              v-model:value="formData.password"
              placeholder="密码"
              @keyup.enter="login"
            />
          </a-form-item>

          <!-- 验证码 -->
          <a-form-item name="inputCode" :rules="[{ required: true, message: '请输入验证码' }]">
            <div class="captcha-row">
              <a-input
                size="large"
                v-model:value="formData.inputCode"
                placeholder="验证码"
                @keyup.enter="login"
              />
              <div class="captcha-img" @click="handleChangeCheckCode">
                <img v-if="randCodeData.requestCodeSuccess" :src="randCodeData.randCodeImage" />
                <img v-else :src="codeImg" />
              </div>
            </div>
          </a-form-item>

          <!-- 按钮区 -->
          <a-form-item class="btn-area">
            <a-button type="primary" size="large" block :loading="loginLoading" @click="login" class="login-btn">
              登录
            </a-button>
            <a-button size="large" block @click="handleClean" class="clean-btn">
              清除
            </a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>

    <!-- 忘记密码 -->
    <div v-show="type === 'forgot'" :class="`${prefixCls}-form`">
      <MiniForgotpad ref="forgotRef" @go-back="goBack" @success="handleSuccess" />
    </div>

    <!-- 注册 -->
    <div v-show="type === 'register'" :class="`${prefixCls}-form`">
      <MiniRegister ref="registerRef" @go-back="goBack" @success="handleSuccess" />
    </div>

    <!-- 验证码登录 -->
    <div v-show="type === 'codeLogin'" :class="`${prefixCls}-form`">
      <MiniCodelogin ref="codeRef" @go-back="goBack" @success="handleSuccess" />
    </div>

    <ThirdModal ref="thirdModalRef"></ThirdModal>
    <CaptchaModal @register="captchaRegisterModal" @ok="getLoginCode" />
  </div>
</template>

<script lang="ts" setup name="login-mini">
  import { getCaptcha, getCodeInfo } from '/@/api/sys/user';
  import { computed, onMounted, reactive, ref, toRaw, unref } from 'vue';
  import codeImg from '/@/assets/images/checkcode.png';
  import { Rule } from '/@/components/Form';
  import { useUserStore } from '/@/store/modules/user';
  import { useMessage } from '/@/hooks/web/useMessage';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { SmsEnum } from '/@/views/sys/login/useLogin';
  import ThirdModal from '/@/views/sys/login/ThirdModal.vue';
  import MiniForgotpad from './MiniForgotpad.vue';
  import MiniRegister from './MiniRegister.vue';
  import MiniCodelogin from './MiniCodelogin.vue';
  import logoImg from '/@/assets/loginmini/icon/jeecg_logo.png';
  import adTextImg from '/@/assets/loginmini/icon/jeecg_ad_text.png';
  import { AppLocalePicker, AppDarkModeToggle } from '/@/components/Application';
  import { useLocaleStore } from '/@/store/modules/locale';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { useAppInject } from '/@/hooks/web/useAppInject';
  import { GithubFilled, WechatFilled, DingtalkCircleFilled, createFromIconfontCN } from '@ant-design/icons-vue';
  import CaptchaModal from '@/components/jeecg/captcha/CaptchaModal.vue';
  import { useModal } from '@/components/Modal';
  import { ExceptionEnum } from '@/enums/exceptionEnum';

  const IconFont = createFromIconfontCN({
    scriptUrl: '//at.alicdn.com/t/font_2316098_umqusozousr.js',
  });
  const { prefixCls } = useDesign('mini-login');
  const { notification, createMessage } = useMessage();
  const userStore = useUserStore();
  const { t } = useI18n();
  const localeStore = useLocaleStore();
  const showLocale = localeStore.getShowPicker;
  const randCodeData = reactive<any>({
    randCodeImage: '',
    requestCodeSuccess: false,
    checkKey: null,
  });
  const rememberMe = ref<string>('0');
  const activeIndex = ref<string>('accountLogin');
  const type = ref<string>('login');
  const formData = reactive<any>({
    inputCode: '',
    username: '',
    password: '',
  });
  const phoneFormData = reactive<any>({
    mobile: '',
    smscode: '',
  });
  const loginRef = ref();
  const thirdModalRef = ref();
  const codeRef = ref();
  const showInterval = ref<boolean>(true);
  const timeRuning = ref<number>(60);
  const timer = ref<any>(null);
  const forgotRef = ref();
  const registerRef = ref();
  const loginLoading = ref<boolean>(false);
  const { getIsMobile } = useAppInject();
  const [captchaRegisterModal, { openModal: openCaptchaModal }] = useModal();
  defineProps({
    sessionTimeout: {
      type: Boolean,
    },
  });

  /** 随机粒子样式 */
  function getParticleStyle(_index: number) {
    const size = Math.random() * 4 + 2;
    const left = Math.random() * 100;
    const delay = Math.random() * 5;
    const duration = Math.random() * 10 + 10;
    return {
      width: `${size}px`,
      height: `${size}px`,
      left: `${left}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    };
  }

  function handleChangeCheckCode() {
    formData.inputCode = '';
    randCodeData.checkKey = 1629428467008;
    getCodeInfo(randCodeData.checkKey).then((res) => {
      randCodeData.randCodeImage = res;
      randCodeData.requestCodeSuccess = true;
    });
  }

  function loginClick(type: string) {
    activeIndex.value = type;
  }

  async function loginHandleClick() {
    if (unref(activeIndex) === 'accountLogin') {
      accountLogin();
    } else {
      phoneLogin();
    }
  }

  async function accountLogin() {
    if (!formData.username) {
      createMessage.warn(t('sys.login.accountPlaceholder'));
      return;
    }
    if (!formData.password) {
      createMessage.warn(t('sys.login.passwordPlaceholder'));
      return;
    }
    try {
      loginLoading.value = true;
      const { userInfo } = await userStore.login(
        toRaw({
          password: formData.password,
          username: formData.username,
          captcha: formData.inputCode,
          checkKey: randCodeData.checkKey,
          mode: 'none',
        })
      );
      if (userInfo) {
        notification.success({
          message: t('sys.login.loginSuccessTitle'),
          description: `${t('sys.login.loginSuccessDesc')}: ${userInfo.realname}`,
          duration: 3,
        });
      }
    } catch (error: any) {
      notification.error({
        message: t('sys.api.errorTip'),
        description: error.message || t('sys.login.networkExceptionMsg'),
        duration: 3,
      });
      handleChangeCheckCode();
    } finally {
      loginLoading.value = false;
    }
  }

  async function phoneLogin() {
    if (!phoneFormData.mobile) {
      createMessage.warn(t('sys.login.mobilePlaceholder'));
      return;
    }
    if (!phoneFormData.smscode) {
      createMessage.warn(t('sys.login.smsPlaceholder'));
      return;
    }
    try {
      loginLoading.value = true;
      const { userInfo }: any = await userStore.phoneLogin({
        mobile: phoneFormData.mobile,
        captcha: phoneFormData.smscode,
        mode: 'none',
      });
      if (userInfo) {
        notification.success({
          message: t('sys.login.loginSuccessTitle'),
          description: `${t('sys.login.loginSuccessDesc')}: ${userInfo.realname}`,
          duration: 3,
        });
      }
    } catch (error: any) {
      notification.error({
        message: t('sys.api.errorTip'),
        description: error.message || t('sys.login.networkExceptionMsg'),
        duration: 3,
      });
    } finally {
      loginLoading.value = false;
    }
  }

  async function getLoginCode() {
    if (!phoneFormData.mobile) {
      createMessage.warn(t('sys.login.mobilePlaceholder'));
      return;
    }
    const result = await getCaptcha({ mobile: phoneFormData.mobile, smsmode: SmsEnum.FORGET_PASSWORD }).catch((res: any) => {
      if (res.code === ExceptionEnum.PHONE_SMS_FAIL_CODE) {
        openCaptchaModal(true, {});
      }
    });
    if (result) {
      const TIME_COUNT = 60;
      if (!unref(timer)) {
        timeRuning.value = TIME_COUNT;
        showInterval.value = false;
        timer.value = setInterval(() => {
          if (unref(timeRuning) > 0 && unref(timeRuning) <= TIME_COUNT) {
            timeRuning.value = timeRuning.value - 1;
          } else {
            showInterval.value = true;
            clearInterval(unref(timer));
            timer.value = null;
          }
        }, 1000);
      }
    }
  }

  function onThirdLogin(type: string) {
    thirdModalRef.value.onThirdLogin(type);
  }

  function forgetHandelClick() {
    type.value = 'forgot';
    setTimeout(() => {
      forgotRef.value.initForm();
    }, 300);
  }

  function goBack() {
    activeIndex.value = 'accountLogin';
    type.value = 'login';
  }

  function handleSuccess(value: any) {
    Object.assign(formData, value);
    Object.assign(phoneFormData, { mobile: '', smscode: '' });
    type.value = 'login';
    activeIndex.value = 'accountLogin';
    handleChangeCheckCode();
  }

  function registerHandleClick() {
    type.value = 'register';
    setTimeout(() => {
      registerRef.value.initForm();
    }, 300);
  }

  function codeHandleClick() {
    type.value = 'codeLogin';
    setTimeout(() => {
      codeRef.value.initFrom();
    }, 300);
  }

  const login = () => {
    loginHandleClick();
  };

  const handleClean = () => {
    formData.inputCode = null;
    formData.username = null;
    formData.password = null;
  };

  onMounted(() => {
    handleChangeCheckCode();
  });
</script>

<style lang="less" scoped>
  @prefix-cls: ~'@{namespace}-mini-login';

  .login-page {
    position: relative;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: linear-gradient(135deg, #0c1a2d 0%, #0f2744 40%, #1a4a7a 70%, #2563eb 100%);
  }

  /* 粒子背景 */
  .particles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
  }

  .particle {
    position: absolute;
    bottom: -10px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    animation: floatUp linear infinite;
  }

  @keyframes floatUp {
    0% {
      transform: translateY(0) scale(1);
      opacity: 0;
    }
    10% {
      opacity: 0.6;
    }
    90% {
      opacity: 0.6;
    }
    100% {
      transform: translateY(-110vh) scale(0.5);
      opacity: 0;
    }
  }

  /* 顶部控件 */
  .locale-picker {
    position: absolute;
    top: 16px;
    right: 56px;
    z-index: 10;
    color: #fff;
  }

  .dark-toggle {
    position: absolute;
    top: 14px;
    right: 16px;
    z-index: 10;
  }

  /* 登录卡片 */
  .login-card {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 420px;
    margin: 0 16px;
    padding: 36px 32px 30px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);
  }

  .login-header {
    text-align: center;
    margin-bottom: 26px;
  }

  .login-logo {
    width: 56px;
    height: 56px;
    margin: 0 auto 14px;

    svg {
      display: block;
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 4px 12px rgba(37, 99, 235, 0.3));
    }
  }

  .login-title {
    font-size: 22px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 6px;
    letter-spacing: 2px;
  }

  .login-subtitle {
    font-size: 13px;
    color: #64748b;
    margin: 0;
  }

  .login-body {
    width: 100%;
  }

  /* 验证码行 */
  .captcha-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .captcha-row .ant-input {
    flex: 1;
  }

  .captcha-img {
    flex-shrink: 0;
    width: 110px;
    height: 44px;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid #e2e8f0;
    transition: all 0.2s;

    &:hover {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  /* 按钮区 */
  .btn-area {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    margin-bottom: 0;

    :deep(.ant-form-item-control-input-content) {
      display: flex;
      gap: 12px;
    }
  }

  .login-btn {
    height: 46px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    letter-spacing: 2px;
  }

  .clean-btn {
    height: 46px;
    border-radius: 8px;
    font-size: 15px;
    color: #94a3b8;
    border-color: #e2e8f0;

    &:hover {
      color: #3b82f6;
      border-color: #3b82f6;
    }
  }

  /* 移动端适配 */
  @media (max-width: 480px) {
    .login-card {
      padding: 28px 20px 24px;
      margin: 0 12px;
    }

    .login-title {
      font-size: 20px;
    }
  }
</style>

<style lang="less">
  @prefix-cls: ~'@{namespace}-mini-login';

  /* 全局覆盖输入框样式 */
  .@{prefix-cls} {
    .ant-input,
    .ant-input-affix-wrapper {
      height: 44px;
      border-radius: 8px;
      background-color: #f8fafc !important;
      border-color: #e2e8f0 !important;
      box-shadow: none !important;

      input {
        background-color: transparent !important;
        color: #1e293b !important;
        &::placeholder {
          color: #94a3b8 !important;
        }
      }

      &:hover {
        border-color: #3b82f6 !important;
      }

      &:focus,
      &.ant-input-affix-wrapper-focused {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15) !important;
      }
    }

    .ant-input-password-icon {
      color: #94a3b8 !important;

      &:hover {
        color: #64748b !important;
      }
    }

    .ant-form-item {
      margin-bottom: 18px;
    }

    .ant-form-item-explain-error {
      font-size: 12px;
      padding-top: 2px;
    }

    /* 登录按钮蓝色渐变 */
    .ant-btn-primary {
      background: linear-gradient(90deg, #3b82f6, #2563eb) !important;
      border: none !important;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35) !important;
      transition: all 0.3s ease !important;

      &:hover {
        background: linear-gradient(90deg, #2563eb, #1d4ed8) !important;
        box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45) !important;
        transform: translateY(-1px);
      }
    }

    /* 深色主题适配 */
    &-form {
      .ant-form {
        background: transparent !important;
      }
    }
  }

  /* 深色模式 */
  html[data-theme='dark'] {
    .@{prefix-cls} {
      background: linear-gradient(135deg, #0a0f1a 0%, #0d1a2d 40%, #112240 70%, #1a365d 100%) !important;
      background-image: none;

      .login-card {
        background: #1e293b;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08);
      }

      .login-title {
        color: #f1f5f9;
      }

      .login-subtitle {
        color: #94a3b8;
      }

      .ant-input,
      .ant-input-affix-wrapper {
        background-color: #0f172a !important;
        border-color: #334155 !important;

        input {
          color: #e2e8f0 !important;
          &::placeholder {
            color: #64748b !important;
          }
        }

        &:hover {
          border-color: #3b82f6 !important;
        }
      }

      .captcha-img {
        border-color: #334155;

        &:hover {
          border-color: #3b82f6;
        }
      }

      .clean-btn {
        color: #64748b;
        border-color: #334155;

        &:hover {
          color: #60a5fa;
          border-color: #3b82f6;
        }
      }

      .ant-input-password-icon {
        color: #64748b !important;
      }
    }
  }
</style>
