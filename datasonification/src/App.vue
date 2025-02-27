<template>
  <div class="app-container" :class="currentTheme">
    <header class="app-header">
      <h1>Dashboard de Visualización y Sonificación</h1>
    </header>
    
    <div class="main-content">
      <!-- Panel lateral izquierdo para configuración -->
      <ConfigPanel />
      
      <div class="chart-container">
        <!-- Componente principal para visualizar el gráfico -->
        <ChartView />
        
        <!-- Controles para la sonificación -->
        <SonificationControl />
        
        <!-- Componente para importación de datos -->
        <DataImport />
      </div>
    </div>
    
    <!-- Chatbot desplegable/minimizable -->
    <ChatbotWidget />
    
    <!-- Router view para navegación entre diferentes vistas -->
    <router-view />
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import ChartView from './components/ChartView.vue'
import ConfigPanel from './components/ConfigPanel.vue'
import SonificationControl from './components/SonificationControl.vue'
import ChatbotWidget from './components/ChatbotWidget.vue'
import DataImport from './components/DataImport.vue'

export default {
  name: 'App',
  components: {
    ChartView,
    ConfigPanel,
    SonificationControl,
    ChatbotWidget,
    DataImport
  },
  setup() {
    const store = useStore()
    
    // Obtener el tema actual desde el store de Vuex
    const currentTheme = computed(() => store.state.themeStore.currentTheme)
    
    return {
      currentTheme
    }
  }
}
</script>

<style lang="scss">
@import './styles/variables.scss';

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  transition: background-color 0.3s ease;
  
  &.light-theme {
    background-color: var(--bg-color-light);
    color: var(--text-color-light);
  }
  
  &.dark-theme {
    background-color: var(--bg-color-dark);
    color: var(--text-color-dark);
  }
}

.app-header {
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.chart-container {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
}
</style>