<template>
  <div :class="prefixCls" class="login-page">
    <AppLocalePicker class="locale-picker" :showText="false" v-if="!sessionTimeout && showLocale" />
    <AppDarkModeToggle class="dark-toggle" v-if="!sessionTimeout" />

    <!-- 背景粒子 -->
    <div class="particles">
      <span v-for="i in 20" :key="i" class="particle" :style="getParticleStyle(i)" />
    </div>

    <!-- 登录卡片 -->
    <div class="login-card enter-x">
      <!-- Logo & 标题 -->
      <div class="login-header">
        <img src="../../../assets/images/logo.png" class="login-logo" alt="logo" />
        <h1 class="login-title">{{ title }}</h1>
        <p class="login-subtitle">智慧照明 · 数字孪生 · AI驱动</p>
      </div>

      <!-- 表单区域 -->
      <div class="login-body">
        <LoginForm />
        <ForgetPasswordForm />
        <RegisterForm />
        <MobileForm />
        <QrCodeForm />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import { AppLocalePicker, AppDarkModeToggle } from '/@/components/Application';
  import LoginForm from './LoginForm.vue';
  import ForgetPasswordForm from './ForgetPasswordForm.vue';
  import RegisterForm from './RegisterForm.vue';
  import MobileForm from './MobileForm.vue';
  import QrCodeForm from './QrCodeForm.vue';
  import { useGlobSetting } from '/@/hooks/setting';
  import { useLocaleStore } from '/@/store/modules/locale';
  import { useDesign } from '/@/hooks/web/useDesign';
  import { useLoginState } from './useLogin';

  defineProps({
    sessionTimeout: {
      type: Boolean,
    },
  });

  const globSetting = useGlobSetting();
  const { prefixCls } = useDesign('login');
  const localeStore = useLocaleStore();
  const showLocale = localeStore.getShowPicker;
  const title = computed(() => globSetting?.title ?? '');
  const { handleBackLogin } = useLoginState();
  handleBackLogin();

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
</script>

<style lang="less" scoped>
  @prefix-cls: ~'@{namespace}-login';

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
    max-width: 440px;
    margin: 0 16px;
    padding: 40px 36px 36px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);
  }

  .login-header {
    text-align: center;
    margin-bottom: 28px;
  }

  .login-logo {
    width: 56px;
    height: 56px;
    margin-bottom: 16px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  }

  .login-title {
    font-size: 22px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 6px;
    letter-spacing: 1px;
  }

  .login-subtitle {
    font-size: 13px;
    color: #64748b;
    margin: 0;
  }

  .login-body {
    width: 100%;
  }

  /* 移动端适配 */
  @media (max-width: 480px) {
    .login-card {
      padding: 32px 24px 28px;
      margin: 0 12px;
    }

    .login-title {
      font-size: 20px;
    }
  }
</style>

<style lang="less">
  /* 全局覆盖 ant-input 在登录页内的样式 */
  .@{namespace}-login {
    .ant-input,
    .ant-input-password {
      background-color: #f8fafc !important;
      border-color: #e2e8f0 !important;
      color: #1e293b !important;

      &::placeholder {
        color: #94a3b8 !important;
      }

      &:hover,
      &:focus {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15) !important;
      }
    }

    .ant-input-password-icon {
      color: #94a3b8 !important;
    }

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

    .ant-form-item {
      margin-bottom: 20px;
    }

    .ant-form-item-explain-error {
      font-size: 12px;
      margin-top: 2px;
    }
  }
</style>
