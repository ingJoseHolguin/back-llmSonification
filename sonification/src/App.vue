<template>
  <div id="app">
    <TopBar />
    <div class="main-content">
      <LeftPanel />
      <DataVisualization />
      <RightPanel />
    </div>
    <BottomBanner />
  </div>
</template>

<script>
import TopBar from './components/TopBar.vue';
import LeftPanel from './components/LeftPanel.vue';
import RightPanel from './components/RightPanel.vue';
import DataVisualization from './components/DataVisualization.vue';
import BottomBanner from './components/BottomBanner.vue';

export default {
  components: {
    TopBar,
    LeftPanel,
    RightPanel,
    DataVisualization,
    BottomBanner
  }
};
</script>

<style>
/* Estilos globales */
</style>