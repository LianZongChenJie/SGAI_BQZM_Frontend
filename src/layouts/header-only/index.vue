<template>
  <Layout class="header-only-layout">
    <LayoutHeader v-if="showHeader" fixed />
    <Layout class="header-only-main">
      <PageLayout />
    </Layout>
  </Layout>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
  import { Layout } from 'ant-design-vue';
  import LayoutHeader from '/@/layouts/default/header/index.vue';
  import PageLayout from '/@/layouts/page/index.vue';

  export default defineComponent({
    name: 'HeaderOnlyLayout',
    components: { Layout, LayoutHeader, PageLayout },
    setup() {
      // IOC 平台 iframe 嵌入（URL 携带 from=ioc）：不展示顶部导航栏，只展示页面主体内容
      const fromParam = new URLSearchParams(window.location.search).get('from') ?? '';
      const showHeader = fromParam.replace(/['"]/g, '').toLowerCase() !== 'ioc';
      return { showHeader };
    },
  });
</script>
<style lang="less" scoped>
  .header-only-layout {
    min-height: 100%;
  }
  .header-only-main {
    flex: 1 1 auto;
    min-height: 0;
  }
</style>
