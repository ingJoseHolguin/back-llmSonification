<template>
    <div class="config-panel" :class="{ collapsed: isPanelCollapsed }">
      <div class="panel-header">
        <h2>Configuración</h2>
        <button class="toggle-button" @click="togglePanel">
          {{ isPanelCollapsed ? '→' : '←' }}
        </button>
      </div>
      
      <div class="panel-content" v-if="!isPanelCollapsed">
        <div class="section">
          <h3>Gráfico</h3>
          <div class="form-group">
            <label for="chartType">Tipo de gráfico</label>
            <select id="chartType" v-model="chartType" @change="updateChartType">
              <option value="line">Línea</option>
              <option value="bar">Barra</option>
              <option value="column">Columna</option>
              <option value="area">Área</option>
              <option value="pie">Circular</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="chartTitle">Título</label>
            <input id="chartTitle" v-model="chartTitle" @change="updateChartTitle" />
          </div>
        </div>
        
        <div class="section">
          <h3>Sonificación</h3>
          <div class="form-group">
            <label class="switch">
              <input type="checkbox" v-model="sonificationEnabled" @change="toggleSonification" />
              <span class="slider"></span>
            </label>
            <span>Habilitar sonificación</span>
          </div>
          
          <template v-if="sonificationEnabled">
            <div class="form-group">
              <label for="volume">Volumen: {{ volume }}</label>
              <input 
                type="range" 
                id="volume" 
                v-model="volume" 
                min="0" 
                max="1" 
                step="0.1" 
                @change="updateVolume"
              />
            </div>
            
            <div class="form-group">
              <label for="tempo">Tempo: {{ tempo }}</label>
              <input 
                type="range" 
                id="tempo" 
                v-model="tempo" 
                min="0.5" 
                max="2" 
                step="0.1" 
                @change="updateTempo"
              />
            </div>
            
            <div class="form-group">
              <label for="instrument">Instrumento</label>
              <select id="instrument" v-model="instrument" @change="updateInstrument">
                <option value="piano">Piano</option>
                <option value="synth">Sintetizador</option>
                <option value="marimba">Marimba</option>
                <option value="violin">Violín</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="mapMode">Modo de mapeo</label>
              <select id="mapMode" v-model="mapMode" @change="updateMapMode">
                <option value="linear">Lineal</option>
                <option value="logarithmic">Logarítmico</option>
                <option value="exponential">Exponencial</option>
              </select>
            </div>
          </template>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        isPanelCollapsed: false,
        chartType: 'line',
        chartTitle: '',
        sonificationEnabled: false,
        volume: 0.5,
        tempo: 1,
        instrument: 'piano',
        mapMode: 'linear'
      };
    },
    methods: {
      togglePanel() {
        this.isPanelCollapsed = !this.isPanelCollapsed;
      },
      updateChartType() {
        console.log("Tipo de gráfico cambiado a: ", this.chartType);
      },
      updateChartTitle() {
        console.log("Título del gráfico cambiado a: ", this.chartTitle);
      },
      toggleSonification() {
        console.log("Sonificación: ", this.sonificationEnabled);
      },
      updateVolume() {
        console.log("Volumen cambiado a: ", this.volume);
      },
      updateTempo() {
        console.log("Tempo cambiado a: ", this.tempo);
      },
      updateInstrument() {
        console.log("Instrumento cambiado a: ", this.instrument);
      },
      updateMapMode() {
        console.log("Modo de mapeo cambiado a: ", this.mapMode);
      }
    }
  };
  </script>
  
  <style scoped>
  .config-panel {
    width: 300px;
    background: #f8f9fa;
    border-right: 1px solid #ddd;
    padding: 10px;
    transition: width 0.3s;
  }
  .config-panel.collapsed {
    width: 50px;
  }
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid #ccc;
  }
  .toggle-button {
    background: none;
    border: none;
    cursor: pointer;
  }
  .form-group {
    margin-bottom: 10px;
  }
  .switch {
    position: relative;
    display: inline-block;
    width: 34px;
    height: 20px;
  }
  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.4s;
    border-radius: 34px;
  }
  input:checked + .slider {
    background-color: #4caf50;
  }
  </style>
  