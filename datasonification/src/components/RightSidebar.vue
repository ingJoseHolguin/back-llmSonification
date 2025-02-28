<template>
    <aside :class="['sidebar', 'right-sidebar', { collapsed: isCollapsed }]">
      <!-- Botón para colapsar/desplegar el panel -->
      <button @click="toggleSidebar" class="toggle-button">
        {{ isCollapsed ? 'Abrir' : 'Cerrar' }}
      </button>
  
      <!-- Contenido del panel -->
      <div v-if="!isCollapsed" class="sidebar-content">
        <h3>Panel de Configuración</h3>
  
        <!-- Slider -->
        <div class="config-item">
          <label>Slider:</label>
          <input type="range" v-model="config.sliderValue" min="0" max="100" />
          <span>{{ config.sliderValue }}</span>
        </div>
  
        <!-- Combo Box -->
        <div class="config-item">
          <label>Combo Box:</label>
          <select v-model="config.comboBoxSelection">
            <option value="Opción 1">Opción 1</option>
            <option value="Opción 2">Opción 2</option>
            <option value="Opción 3">Opción 3</option>
          </select>
        </div>
  
        <!-- Inyector Numérico -->
        <div class="config-item">
          <label>Inyector Numérico:</label>
          <input type="number" v-model="config.numericInput" />
        </div>
  
        <!-- Botón para guardar cambios -->
        <button @click="saveConfig" class="save-button">Guardar Configuración</button>
      </div>
    </aside>
  </template>
  
  <script>
  export default {
    data() {
      return {
        isCollapsed: false, // Estado del panel derecho
        config: {
          sliderValue: 50, // Valor inicial del slider
          comboBoxSelection: "Opción 1", // Valor inicial del combo box
          numericInput: 10 // Valor inicial del inyector numérico
        }
      };
    },
    methods: {
      toggleSidebar() {
        this.isCollapsed = !this.isCollapsed;
      },
      saveConfig() {
        // Guardar la configuración en localStorage
        localStorage.setItem("globalConfig", JSON.stringify(this.config));
        alert("Configuración guardada");
      }
    },
    created() {
      // Cargar configuración desde localStorage si existe
      const savedConfig = localStorage.getItem("globalConfig");
      if (savedConfig) {
        this.config = JSON.parse(savedConfig);
      }
    }
  };
  </script>
  
  <style scoped>
  .sidebar {
    width: 250px;
    padding: 10px;
    background-color: #34495e;
    color: white;
    transition: width 0.3s ease, padding 0.3s ease;
  }
  
  .sidebar.collapsed {
    width: 50px;
    padding: 10px 0;
  }
  
  .toggle-button {
    background-color: #e74c3c;
    color: white;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 4px;
    margin-bottom: 10px;
  }
  
  .toggle-button:hover {
    background-color: #c0392b;
  }
  
  .sidebar-content {
    margin-top: 10px;
  }
  
  .config-item {
    margin-bottom: 15px;
  }
  
  label {
    font-weight: bold;
    margin-right: 10px;
  }
  
  input[type="range"] {
    width: 100%;
  }
  
  .save-button {
    padding: 10px 20px;
    background-color: #2ecc71;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .save-button:hover {
    background-color: #27ae60;
  }
  
  </style>