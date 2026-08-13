<template>
  <Layout class="header-only-layout">
    <LayoutHeader fixed />
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
