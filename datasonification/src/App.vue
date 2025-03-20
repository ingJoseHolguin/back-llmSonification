<template>
  <div id="app" class="app-container">
    <!-- Barra Superior -->
    <PageHeader />
    
    <!-- Contenedor Principal -->
    <div class="main-container">
      <!-- Panel Izquierdo -->
      <LeftSidebar />
      
      <!-- Contenido Principal -->
      <main class="main-content">
        <MainContent ref="mainContent" />
      </main>
      
      <!-- Panel Derecho -->
      <!-- <RightSidebar /> -->
    </div>
    
    <!-- Pie de Página -->
    <PageFooter />
  </div>
</template>

<script>
import PageHeader from './components/PageHeader.vue';
import MainContent from './components/MainContent.vue';
import PageFooter from './components/PageFooter.vue';
import LeftSidebar from './components/LeftSidebar.vue';
//import RightSidebar from './components/RightSidebar.vue';
import { emitter } from './eventBus';

export default {
  components: {
    PageHeader,
    LeftSidebar,
    MainContent,
    //RightSidebar,
    PageFooter
  },
  mounted() {
    // Configurar los listeners para los eventos entre componentes
    this.setupEventListeners();
  },
  beforeUnmount() {
    // Limpiar los listeners al desmontar
    this.cleanupEventListeners();
  },
  methods: {
    setupEventListeners() {
      // Escuchar solicitudes de actualización de configuración
      emitter.on('update-config', this.handleUpdateConfig);
      
      // Escuchar solicitudes de configuración
      emitter.on('request-config', this.handleRequestConfig);
    },
    
    cleanupEventListeners() {
      // Eliminar todos los listeners
      emitter.off('update-config', this.handleUpdateConfig);
      emitter.off('request-config', this.handleRequestConfig);
    },
    
    async handleRequestConfig() {
      // Asegurar que el componente MainContent esté disponible
      if (!this.$refs.mainContent) {
        console.error('MainContent ref no está disponible');
        return;
      }
      
      // Obtener la configuración actual
      try {
        const config = this.$refs.mainContent.getCurrentConfig();
        console.log('Configuración obtenida:', config);
        
        // Emitir la configuración a través del bus de eventos
        emitter.emit('provide-config', config);
      } catch (error) {
        console.error('Error al obtener la configuración:', error);
        // Emitir un objeto vacío en caso de error
        emitter.emit('provide-config', {});
      }
    },
    
    handleUpdateConfig(suggestedConfig) {
      // Asegurar que el componente MainContent esté disponible
      if (!this.$refs.mainContent) {
        console.error('MainContent ref no está disponible');
        return;
      }
      
      console.log('Aplicando configuración sugerida:', suggestedConfig);
      
      // Aplicar la configuración sugerida
      this.$refs.mainContent.applySuggestedConfig(suggestedConfig);
    }
  }
};
</script>

<style>
@import './styles/global.css';

/* Estilos generales */
.app-container {
  display: flex;
  flex-direction: column; /* Organiza los elementos en columna */
  height: 100vh; /* Altura total de la pantalla */
  overflow: hidden; /* Evita desbordamientos */
}

.main-container {
  display: flex;
  flex: 1; /* Ocupa todo el espacio restante después del header y footer */
  overflow: hidden;
}

/* Header */
header {
  background-color: #2c3e50;
  color: white;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Footer */
footer {
  background-color: #f8f9fa;
  padding: 10px 20px;
  text-align: center;
  border-top: 1px solid #ddd;
}

/* Paneles Laterales */
.left-sidebar, .right-sidebar {
  width: 250px; /* Ancho inicial de los paneles */
  padding: 10px;
  background-color: #f5f5f5;
  transition: width 0.3s ease, padding 0.3s ease;
  overflow: hidden;
}

/* Contenido Principal */
.main-content {
  flex: 1; /* El contenido principal ocupa todo el espacio restante */
  padding: 20px;
  background-color: #f9f9f9;
  overflow-y: auto; /* Permite desplazamiento vertical si es necesario */
}
</style>