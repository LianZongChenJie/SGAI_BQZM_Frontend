<template>
  <LoginFormTitle v-show="getShow" class="enter-x" />
  <Form class="login-form enter-x" :model="formData" :rules="getFormRules" ref="formRef" v-show="getShow" @keypress.enter="handleLogin">
    <!-- 用户名 -->
    <FormItem name="account" class="enter-x">
      <Input size="large" v-model:value="formData.account" :placeholder="t('sys.login.userName')" class="fix-auto-fill login-input" />
    </FormItem>

    <!-- 密码 -->
    <FormItem name="password" class="enter-x">
      <InputPassword size="large" visibilityToggle v-model:value="formData.password" :placeholder="t('sys.login.password')" class="login-input" />
    </FormItem>

    <!-- 验证码 -->
    <FormItem name="inputCode" class="enter-x">
      <div class="verify-row">
        <Input size="large" v-model:value="formData.inputCode" :placeholder="t('sys.login.inputCode')" class="verify-input fix-auto-fill" />
        <div class="verify-img" @click="handleChangeCheckCode">
          <img v-if="randCodeData.requestCodeSuccess" :src="randCodeData.randCodeImage" />
          <img v-else src="../../../assets/images/checkcode.png" />
        </div>
      </div>
    </FormItem>

    <!-- 登录按钮 -->
    <FormItem class="enter-x" style="margin-top: 24px; margin-bottom: 0">
      <Button type="primary" size="large" block @click="handleLogin" :loading="loading" class="login-btn">
        {{ t('sys.login.loginButton') }}
      </Button>
    </FormItem>
  </Form>

  <!-- 第三方登录相关弹框 -->
  <ThirdModal ref="thirdModalRef"></ThirdModal>
</template>

<script lang="ts" setup>
  import { reactive, ref, toRaw, unref, computed, onMounted } from 'vue';

  import { Form, Input, Button } from 'ant-design-vue';
  import LoginFormTitle from './LoginFormTitle.vue';
  import ThirdModal from './ThirdModal.vue';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useMessage } from '/@/hooks/web/useMessage';

  import { useUserStore } from '/@/store/modules/user';
  import { LoginStateEnum, useLoginState, useFormRules, useFormValid } from './useLogin';
  import { getCodeInfo } from '/@/api/sys/user';

  const FormItem = Form.Item;
  const InputPassword = Input.Password;
  const { t } = useI18n();
  const { notification, createErrorModal } = useMessage();
  const userStore = useUserStore();

  const { getLoginState } = useLoginState();
  const { getFormRules } = useFormRules();

  const formRef = ref();
  const thirdModalRef = ref();
  const loading = ref(false);

  const formData = reactive({
    account: '',
    password: '',
    inputCode: '',
  });
  const randCodeData = reactive({
    randCodeImage: '',
    requestCodeSuccess: false,
    checkKey: null,
  });

  const { validForm } = useFormValid(formRef);

  const getShow = computed(() => unref(getLoginState) === LoginStateEnum.LOGIN);

  async function handleLogin() {
    const data = await validForm();
    if (!data) return;
    try {
      loading.value = true;
      const { userInfo } = await userStore.login(
        toRaw({
          password: data.password,
          username: data.account,
          captcha: data.inputCode,
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
    } catch (error) {
      notification.error({
        message: t('sys.api.errorTip'),
        description: error.message || t('sys.api.networkExceptionMsg'),
        duration: 3,
      });
      loading.value = false;
      handleChangeCheckCode();
    }
  }

  function handleChangeCheckCode() {
    formData.inputCode = '';
    randCodeData.checkKey = 1629428467008;
    getCodeInfo(randCodeData.checkKey).then((res) => {
      randCodeData.randCodeImage = res;
      randCodeData.requestCodeSuccess = true;
    });
  }

  onMounted(() => {
    handleChangeCheckCode();
  });
</script>

<style lang="less" scoped>
  .login-form {
    width: 100%;
  }

  .login-input {
    :deep(.ant-input) {
      height: 44px;
      border-radius: 8px;
      padding-left: 14px;
      font-size: 14px;
    }
  }

  .verify-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .verify-input {
    flex: 1;

    :deep(.ant-input) {
      height: 44px;
      border-radius: 8px;
      padding-left: 14px;
      font-size: 14px;
    }
  }

  .verify-img {
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

  .login-btn {
    height: 46px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 2px;
  }
</style>
