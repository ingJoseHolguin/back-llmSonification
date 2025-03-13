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
        <MainContent />
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

export default {
  components: {
    PageHeader,
    LeftSidebar,
    MainContent,
    //RightSidebar,
    PageFooter
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
.left-sidebar,
.right-sidebar {
  width: 250px; /* Ancho inicial de los paneles */
  padding: 10px;
  background-color: #2c3e50;
  color: white;
  transition: width 0.3s ease, padding 0.3s ease;
  overflow: hidden;
}

.left-sidebar.collapsed,
.right-sidebar.collapsed {
  width: 50px; /* Ancho reducido cuando está colapsado */
  padding: 10px 0;
}

/* Contenido Principal */
.main-content {
  flex: 1; /* El contenido principal ocupa todo el espacio restante */
  padding: 20px;
  background-color: #f9f9f9;
  overflow-y: auto; /* Permite desplazamiento vertical si es necesario */
}

/* Botones de Colapso */
.toggle-button {
  background-color: #1abc9c;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 10px;
}

.toggle-button:hover {
  background-color: #16a085;
}
</style>