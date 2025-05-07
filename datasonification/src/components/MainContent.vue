<template>
  <div class="main-content-container">
    <div class="chart-wrapper">
      <!-- Componente de Highcharts adaptado de tu código -->
      <div class="import-controls">
        <button @click="handleFileImport" class="import-button">Importar CSV/Excel</button>
        <input 
          type="file" 
          ref="fileInput" 
          @change="onFileChange" 
          accept=".csv,.txt,.xlsx,.xls" 
          style="display: none;"
        >
      </div>

      <figure class="highcharts-figure">
        <!-- Área del gráfico ampliada -->
        <div id="container" ref="chartContainer" class="chart-container"></div>
        
        <!-- MOVIDO: Botón de reproducción colocado aquí, justo después del gráfico -->
        <div class="playback-controls">
          <button id="sonify" @click="toggleSonify">{{ isPlaying ? 'Detener' : 'Reproducir gráfico' }}</button>
          <button id="export-midi" @click="exportMIDI">Exportar MIDI</button>
        </div>
        
        <div id="controls">
          <!-- Panel de configuración organizado en pestañas -->
          <div class="tabs-container">
            <div class="tabs">
              <button 
                :class="{ 'active-tab': activeTab === 'params' }" 
                @click="activeTab = 'params'"
              >
                Parámetros de Mapeo
              </button>
              <button 
                :class="{ 'active-tab': activeTab === 'json' }" 
                @click="activeTab = 'json'"
              >
                Configuración JSON
              </button>
            </div>
            
            <!-- Pestaña de parámetros -->
            <div v-if="activeTab === 'params'" class="tab-content">
              <div class="parameters-container">
                <h4>Selecciona Parámetros:</h4>
                <div class="checkbox-grid">
                  <div v-for="param in availableParams" :key="param.value" class="parameter-checkbox">
                    <input 
                      type="checkbox" 
                      :id="param.value" 
                      :value="param.value" 
                      v-model="activeParams"
                      @change="updateMapping"
                    >
                    <label :for="param.value">{{ param.label }}</label>
                  </div>
                </div>
              </div>

              <!-- Configuración de rango para parámetros activos -->
              <div v-if="activeParams.length > 0" class="min-max-container">
                <h4>Configuración de Rangos:</h4>
                <div v-for="param in activeParams" :key="param" class="param-range-controls">
                  <h5>{{ getParamLabel(param) }}</h5>
                  <div class="min-max-controls">
                    <div class="control-group">
                      <label :for="`${param}-min`">Min:</label>
                      <input 
                        :type="getInputType(param)" 
                        :id="`${param}-min`" 
                        v-model="paramRanges[param].min" 
                        @change="updateParamRange(param)"
                      />
                    </div>
                    <div class="control-group">
                      <label :for="`${param}-max`">Max:</label>
                      <input 
                        :type="getInputType(param)" 
                        :id="`${param}-max`" 
                        v-model="paramRanges[param].max" 
                        @change="updateParamRange(param)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="control-row">
                <div class="control-group">
                  <label for="scale">Escala:</label>
                  <select id="scale" v-model="selectedScale" @change="updateMapping">
                    <option v-for="scale in availableScales" :key="scale" :value="scale">
                      {{ scale }}
                    </option>
                  </select>
                </div>
                
                <div class="control-group">
                  <label for="instrument">Instrumento:</label>
                  <select id="instrument" v-model="selectedInstrument" @change="updateMapping">
                    <option v-for="instrument in availableInstruments" :key="instrument" :value="instrument">
                      {{ instrument }}
                    </option>
                  </select>
                </div>
                
                <div class="control-group">
                  <label for="duration">Duración (ms):</label>
                  <input 
                    type="number" 
                    id="duration" 
                    v-model.number="sonificationDuration" 
                    min="1000" 
                    max="15000" 
                    step="500"
                    @change="updateMapping"
                  />
                </div>
              </div>
            </div>
            
            <!-- Pestaña de configuración JSON -->
            <div v-if="activeTab === 'json'" class="tab-content">
              <div class="json-config-container">
                <h4>Configuración JSON:</h4>
                <textarea 
                  v-model="jsonConfig" 
                  placeholder="Pega tu configuración JSON aquí..." 
                  class="json-textarea"
                  @input="validateJson"
                ></textarea>
                <div class="json-status" :class="{ 'json-valid': isJsonValid, 'json-invalid': !isJsonValid && jsonConfig }">
                  {{ jsonStatusMessage }}
                </div>
                <button 
                  id="apply-config" 
                  @click="applyJsonConfig" 
                  :disabled="!isJsonValid || !jsonConfig"
                  :class="{ 'button-disabled': !isJsonValid || !jsonConfig }"
                >
                  Aplicar Configuración
                </button>
                
                <div class="json-example">
                  <h5>Ejemplo de formato JSON:</h5>
                  <pre>{{ jsonExample }}</pre>
                </div>
              </div>
            </div>
          </div>
          
          <!-- ELIMINADO: El botón ya no está aquí -->
        </div>
        
        <div class="help-container" v-if="activeParams.length > 0">
          <h4>Parámetros Activos:</h4>
          <div v-for="param in activeParams" :key="param" class="active-param">
            <strong>{{ getParamLabel(param) }}:</strong> {{ helpTexts[param] }}
          </div>
        </div>
        
        <p class="highcharts-description">
          Este gráfico demuestra el mapeo de sonificación multi-parámetro. Selecciona múltiples parámetros de mapeo, 
          luego elige una escala e instrumento antes de reproducir el gráfico para escuchar cómo los datos se representan 
          con múltiples dimensiones de sonido. También puedes pegar una configuración JSON para aplicar rápidamente ajustes complejos.
        </p>
      </figure>
    </div>
  </div>
</template>

<script>
// Import Highcharts as a complete module
import Highcharts from 'highcharts';
// Import necessary modules
import 'highcharts/modules/sonification';
import 'highcharts/modules/accessibility';
import { parse } from 'papaparse'; // Para CSV
import * as XLSX from 'xlsx'; // Para Excel
import { emitter } from '../eventBus';

export default {
  name: 'MainContent',
  data() {
    return {
      chart: null,
      isPlaying: false,
      importedData: [],
      jsonConfig: '',
      isJsonValid: false,
      jsonStatusMessage: '',
      selectedScale: 'major',
      selectedInstrument: 'piano',
      sonificationDuration: 4500,
      activeParams: ['pitch'], // Default to pitch mapping
      activeTab: 'params', // Default active tab
      availableParams: [
        { value: 'pitch', label: 'Tono (Pitch)' },
        { value: 'frequency', label: 'Frequency' },
        { value: 'volume', label: 'Volume' },
        { value: 'pan', label: 'Panning' },
        { value: 'tremolo', label: 'Trémolo' },
        { value: 'lowpass', label: 'Low-pass filter' },
        { value: 'highpass', label: 'High-pass filter' },
        { value: 'noteDuration', label: 'Note length' },
        { value: 'gapBetweenNotes', label: 'Espacio entre notas' }
      ],
      availableScales: [],
      availableInstruments: [],
      // Default ranges for each parameter
      paramRanges: {
        pitch: { min: 'c2', max: 'c6' },
        frequency: { min: 65.41, max: 1046.50 },
        volume: { min: 0.1, max: 1.2 },
        pan: { min: -1, max: 1 },
        tremolo: { min: 0.2, max: 0.8 }, // Using depth as main control
        lowpass: { min: 100, max: 4000 }, // Using frequency as main control
        highpass: { min: 1, max: 4000 }, // Using frequency as main control
        noteDuration: { min: 30, max: 1000 },
        gapBetweenNotes: { min: 40, max: 250 }
      },
      defaultMappingOptionsUnmapped: {
        // Default opts for each param when not mapped to Y
        pitch: 'g3',
        volume: 1,
        pan: 'x',
        frequency: undefined,
        tremolo: undefined,
        lowpass: undefined,
        highpass: undefined,
        noteDuration: 200,
        playDelay: 0,
        gapBetweenNotes: 50
      },
      mappingOptionsMapped: {
        // Default opts for each param whenever they are mapped to Y
        pitch: {
          mapTo: 'y',
          min: 'c2',
          max: 'c6',
          scale: undefined // Will be set based on selectedScale
        },
        frequency: {
          mapTo: 'y',
          min: 65.41, // c2
          max: 1046.50 // c6
        },
        volume: {
          mapTo: 'y',
          min: 0.1,
          max: 1.2
        },
        pan: {
          mapTo: 'y',
          min: -1,
          max: 1
        },
        tremolo: {
          depth: {
            mapTo: 'y',
            min: 0.2,
            max: 0.8
          },
          speed: {
            mapTo: 'y',
            min: 0.3,
            max: 1
          }
        },
        lowpass: {
          frequency: {
            mapTo: 'y',
            min: 100,
            max: 4000
          },
          resonance: 1
        },
        highpass: {
          frequency: {
            mapTo: '-y',
            min: 1,
            max: 4000,
            mapFunction: 'logarithmic'
          },
          resonance: 1
        },
        noteDuration: {
          mapTo: 'y',
          min: 30,
          max: 1000
        },
        gapBetweenNotes: {
          mapTo: '-y',
          min: 40,
          max: 250
        }
      },
      helpTexts: {
        pitch: 'Se reproducirán notas más altas cuando el valor Y aumente, como tocar teclas de piano de grave a agudo.',
        frequency: 'Similar al mapeo de tono pero usa frecuencias en Hertz que se duplican por octava, creando un efecto sónico diferente.',
        volume: 'Valores Y bajos suenan con volumen bajo mientras que valores altos suenan con volumen alto.',
        pan: 'Valores Y bajos se escuchan en el oído izquierdo, valores altos en el derecho.',
        tremolo: 'Valores Y más altos causan cambios de volumen más rápidos y dramáticos.',
        lowpass: 'Valores Y bajos suenan más apagados (filtrados), valores altos más naturales.',
        highpass: 'Valores Y bajos suenan más delgados, valores altos más naturales.',
        noteDuration: 'Valores Y bajos producen notas cortas, valores altos producen notas largas.',
        gapBetweenNotes: 'Valores Y bajos tienen más espacio entre notas, valores Y altos reproducen notas más rápidamente.'
      },
      jsonExample: `{
  "activeParams": ["pitch", "volume", "pan"],
  "scale": "major",
  "instrument": "piano",
  "duration": 5000,
  "paramRanges": {
    "pitch": { "min": "c2", "max": "c6" },
    "volume": { "min": 0.2, "max": 1.0 },
    "pan": { "min": -1, "max": 1 }
  },
  "mappingOptions": {
    "pitch": {
      "mapTo": "y",
      "min": "c2",
      "max": "c6"
    }
  },
  "data": [1, 3, 5, 8, 6, 4, 2]
}`
    };
  },
  mounted() {
    // Configurar listener para solicitudes de configuración
    emitter.on('request-config', () => {
      const config = this.getCurrentConfig();
      emitter.emit('provide-config', config);
    });
    
    // Ensure DOM is ready
    this.$nextTick(() => {
      // Set global Highcharts options to avoid locale issues
      Highcharts.setOptions({
        lang: {
          decimalPoint: '.',
          thousandsSep: ','
        },
        credits: {
          enabled: false // Remove the Highcharts.com link
        }
      });
      
      // Check if modules are correctly loaded
      if (!Highcharts.sonification) {
        console.error('Sonification module is not loaded correctly');
        this.loadHighchartsModules();
      } else {
        this.initializeChart();
      }
    });
  },
  beforeUnmount() {
    // Limpiar el listener al desmontar
    emitter.off('request-config');
    
    // Clean up when component is unmounted
    if (this.chart) {
      this.chart.destroy();
    }
  },
  methods: {
    exportMIDI() {
  if (!this.chart) {
    console.error('El gráfico no está inicializado');
    return;
  }
  
  try {
    // Verifica si podemos obtener acceso al objeto timeline directamente
    const timeline = this.chart.sonification && this.chart.sonification.timeline;
    
    if (timeline) {
      console.log('Timeline encontrado, intentando exportar');
      // Intentar acceder al método de descarga MIDI con distintos nombres posibles
      if (typeof timeline.downloadMIDI === 'function') {
        timeline.downloadMIDI();
      } else if (typeof timeline.exportMIDI === 'function') {
        timeline.exportMIDI();
      } else {
        console.error('Método de exportación MIDI no disponible en el objeto timeline');
        this.usarMetodoAlternativo();
      }
    } else {
      console.log('No se encontró el objeto timeline, usando método alternativo');
      this.usarMetodoAlternativo();
    }
  } catch (error) {
    console.error('Error al exportar MIDI:', error);
    this.usarMetodoAlternativo();
  }
},

// Método alternativo cuando la exportación directa falla
usarMetodoAlternativo() {
  // Implementar la grabación de audio como alternativa
  alert('La exportación MIDI directa no está disponible en esta versión de Highcharts. ¿Deseas exportar como audio WAV en su lugar?');
  
  // Si el usuario confirma, exportar audio
  if (confirm('Presiona OK para exportar como audio WAV')) {
    this.exportAudio();
  }
},
    // Método que expone la configuración actual para el chatbot
    getCurrentConfig() {
    // Asegúrate de que chart esté inicializado
    if (!this.chart) {
      console.warn("El gráfico no está inicializado aún");
      return {
        activeParams: this.activeParams,
        scale: this.selectedScale,
        instrument: this.selectedInstrument,
        duration: this.sonificationDuration,
        paramRanges: JSON.parse(JSON.stringify(this.paramRanges)),
        data: this.importedData
      };
    }
    
    // Recolectar datos de configuración actual
    const config = {
      activeParams: [...this.activeParams],
      scale: this.selectedScale,
      instrument: this.selectedInstrument,
      duration: this.sonificationDuration,
      paramRanges: {},
      data: this.chart.series[0].data.map(point => point.y)
    };
    
    // Incluir rangos para todos los parámetros activos
    this.activeParams.forEach(param => {
      config.paramRanges[param] = { ...this.paramRanges[param] };
    });
    
    console.log("Configuración generada:", config);
    return config;
  },
    
    // Método para aplicar la configuración sugerida por el chatbot
    applySuggestedConfig(suggestedConfig) {
    console.log('Aplicando configuración sugerida:', suggestedConfig);
    
    try {
      // Aplicar parámetros activos
      if (suggestedConfig.activeParams && Array.isArray(suggestedConfig.activeParams)) {
        this.activeParams = suggestedConfig.activeParams.filter(param => 
          this.availableParams.some(ap => ap.value === param)
        );
      }
      
      // Aplicar escala seleccionada
      if (suggestedConfig.scale && this.availableScales.includes(suggestedConfig.scale)) {
        this.selectedScale = suggestedConfig.scale;
      }
      
      // Aplicar instrumento seleccionado
      if (suggestedConfig.instrument && this.availableInstruments.includes(suggestedConfig.instrument)) {
        this.selectedInstrument = suggestedConfig.instrument;
      }
      
      // Aplicar duración de sonificación
      if (suggestedConfig.duration && !isNaN(suggestedConfig.duration)) {
        this.sonificationDuration = Math.max(1000, Math.min(15000, suggestedConfig.duration));
      }
      
      // Aplicar rangos de parámetros
      if (suggestedConfig.paramRanges) {
        for (const param in suggestedConfig.paramRanges) {
          if (this.paramRanges[param]) {
            if (suggestedConfig.paramRanges[param].min !== undefined) {
              this.paramRanges[param].min = suggestedConfig.paramRanges[param].min;
            }
            if (suggestedConfig.paramRanges[param].max !== undefined) {
              this.paramRanges[param].max = suggestedConfig.paramRanges[param].max;
            }
          }
        }
      }
      
      // Aplicar datos si se proporcionan
      if (suggestedConfig.data && Array.isArray(suggestedConfig.data) && this.chart) {
        this.chart.series[0].setData(suggestedConfig.data, false);
      }
      
      // Actualizar el mapeo y redibujar el gráfico
      this.updateMapping();
      if (this.chart) {
        this.chart.redraw();
      }
      
    } catch (error) {
      console.error('Error al aplicar la configuración sugerida:', error);
    }
  },
    
    updateChartData(data) {
      this.importedData = data;
      
      // Actualizamos el gráfico si ya está inicializado
      if (this.chart) {
        this.chart.series[0].setData(data, true);
        
        // Actualizamos el ejemplo de JSON con los nuevos datos
        this.jsonExample = this.generateJsonWithData(data);
        
        // Actualizamos la configuración JSON si es válida
        if (this.isJsonValid) {
          const config = JSON.parse(this.jsonConfig);
          config.data = data;
          this.jsonConfig = JSON.stringify(config, null, 2);
        }
      }
    },
    handleFileImport() {
      this.$refs.fileInput.click();
    },
    onFileChange(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const fileType = file.name.split('.').pop().toLowerCase();
      
      if (fileType === 'csv' || fileType === 'txt') {
        this.processCSV(file);
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        this.processExcel(file);
      } else {
        alert('Formato de archivo no soportado. Por favor, sube un archivo CSV, TXT, XLSX o XLS.');
      }
    },
    processCSV(file) {
      parse(file, {
        complete: (results) => {
          this.handleParsedData(results.data);
        },
        header: true,
        skipEmptyLines: true
      });
    },
    processExcel(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        this.handleParsedData(jsonData);
      };
      reader.readAsBinaryString(file);
    },
    handleParsedData(data) {
      if (!data || data.length === 0) {
        alert('El archivo está vacío o no contiene datos válidos.');
        return;
      }
      
      const columns = Object.keys(data[0]);
      if (columns.length === 0) {
        alert('No se encontraron columnas en los datos.');
        return;
      }
      
      this.showColumnSelector(columns, data);
    },
    showColumnSelector(columns, data) {
      const columnIndex = prompt('Columnas disponibles: ' + columns.join(', ') + '\nIngresa el nombre de la columna que deseas extraer:');
      
      if (!columnIndex || !columns.includes(columnIndex)) {
        alert('Columna no válida o cancelada.');
        return;
      }
      
      const vector = data.map(row => {
        const value = row[columnIndex];
        return isNaN(Number(value)) ? value : Number(value);
      });
      
      // Llamamos directamente a updateChartData en lugar de emitir un evento
      this.updateChartData(vector);
      
      console.log('Vector extraído:', vector);
      alert(`Se han extraído ${vector.length} valores de la columna "${columnIndex}".`);
    },
    generateJsonWithData(data) {
      // Limitar la cantidad de datos mostrados en el ejemplo para evitar que sea demasiado largo
      const sampleData = data.slice(0, 10);
      
      return `{
  "activeParams": ["pitch", "volume", "pan"],
  "scale": "major",
  "instrument": "piano",
  "duration": 5000,
  "paramRanges": {
    "pitch": { "min": "c2", "max": "c6" },
    "volume": { "min": 0.2, "max": 1.0 },
    "pan": { "min": -1, "max": 1 }
  },
  "mappingOptions": {
    "pitch": {
      "mapTo": "y",
      "min": "c2",
      "max": "c6"
    }
  },
  "data": ${JSON.stringify(sampleData)}${data.length > 10 ? ', ...' : ''}
}`;
    },
    getParamLabel(paramValue) {
      const param = this.availableParams.find(p => p.value === paramValue);
      return param ? param.label : paramValue;
    },
    getInputType(param) {
      // Return appropriate input type based on parameter
      if (param === 'pitch') {
        return 'text'; // For musical notes
      }
      return 'number'; // For numeric values
    },
    loadHighchartsModules() {
      // Load scripts directly from CDN
      const loadScript = (src) => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      };

      Promise.all([
        loadScript('https://code.highcharts.com/highcharts.js'),
        loadScript('https://code.highcharts.com/modules/sonification.js'),
        loadScript('https://code.highcharts.com/modules/accessibility.js')
      ]).then(() => {
        // Set global options after loading scripts
        Highcharts.setOptions({
          lang: {
            decimalPoint: '.',
            thousandsSep: ','
          },
          credits: {
            enabled: false // Remove the Highcharts.com link
          }
        });
        this.initializeChart();
      }).catch(error => {
        console.error('Error loading Highcharts scripts:', error);
      });
    },
    validateJson() {
      if (!this.jsonConfig) {
        this.isJsonValid = false;
        this.jsonStatusMessage = '';
        return;
      }
      
      try {
        const config = JSON.parse(this.jsonConfig);
        
        // Basic validation: check if it has at least one expected property
        if (typeof config === 'object' && config !== null) {
          this.isJsonValid = true;
          this.jsonStatusMessage = 'Configuración JSON válida';
        } else {
          this.isJsonValid = false;
          this.jsonStatusMessage = 'Formato de configuración inválido';
        }
      } catch (e) {
        this.isJsonValid = false;
        this.jsonStatusMessage = 'JSON inválido: ' + e.message;
      }
    },
    applyJsonConfig() {
      if (!this.isJsonValid || !this.jsonConfig) return;
      
      try {
        const config = JSON.parse(this.jsonConfig);
        this.applySuggestedConfig(config);
        this.jsonStatusMessage = 'Configuración aplicada exitosamente';
      } catch (e) {
        console.error('Error applying JSON configuration:', e);
        this.jsonStatusMessage = 'Error al aplicar configuración: ' + e.message;
      }
    },
    updateParamRange(param) {
      // Update the mapping options with new min/max values
      if (param === 'tremolo') {
        this.mappingOptionsMapped.tremolo.depth.min = this.paramRanges.tremolo.min;
        this.mappingOptionsMapped.tremolo.depth.max = this.paramRanges.tremolo.max;
      } else if (param === 'lowpass') {
        this.mappingOptionsMapped.lowpass.frequency.min = this.paramRanges.lowpass.min;
        this.mappingOptionsMapped.lowpass.frequency.max = this.paramRanges.lowpass.max;
      } else if (param === 'highpass') {
        this.mappingOptionsMapped.highpass.frequency.min = this.paramRanges.highpass.min;
        this.mappingOptionsMapped.highpass.frequency.max = this.paramRanges.highpass.max;
      } else if (this.mappingOptionsMapped[param]) {
        this.mappingOptionsMapped[param].min = this.paramRanges[param].min;
        this.mappingOptionsMapped[param].max = this.paramRanges[param].max;
      }
      
      // Update the mapping
      this.updateMapping();
    },
    deepMerge(target, source) {
      const output = { ...target };
      
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          if (
            typeof source[key] === 'object' && 
            source[key] !== null && 
            !Array.isArray(source[key])
          ) {
            if (typeof target[key] === 'object' && target[key] !== null) {
              output[key] = this.deepMerge(target[key], source[key]);
            } else {
              output[key] = { ...source[key] };
            }
          } else {
            output[key] = source[key];
          }
        }
      }
      
      return output;
    },
    initializeChart() {
      try {
        // Verify that the container reference exists
        if (!this.$refs.chartContainer) {
          console.error('Chart container is not available');
          return;
        }

        // Verify that Highcharts and its modules are available
        if (!Highcharts || !Highcharts.sonification || !Highcharts.sonification.Scales) {
          console.error('Highcharts or its modules are not available');
          return;
        }

        // Add a custom scale to presets
        Highcharts.sonification.Scales.custom = [0, 1, 5, 7, 8, 10, 11];
        
        // Get all available scales
        this.availableScales = Object.keys(Highcharts.sonification.Scales);
        
        // Get all available instruments
        this.availableInstruments = Object.keys(Highcharts.sonification.InstrumentPresets);

        // Usar los datos importados si existen, o los datos de ejemplo
        const chartData = this.importedData.length > 0 ? 
          this.importedData : 
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
            14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
        
        // Create the chart
        this.chart = Highcharts.chart(this.$refs.chartContainer, {
          chart: {
            type: 'line',
            height: 400 // Increased height for better visibility
          },
          title: {
            text: 'Sonificación de Datos con Mapeo Multi-Parámetro'
          },
          legend: {
            enabled: false
          },
          credits: {
            enabled: false // Remove the Highcharts.com link
          },
          xAxis: {
            crosshair: {
              enabled: true,
              width: 50,
              color: 'rgba(90, 140, 210, 0.1)',
              className: 'hc-crosshair'
            },
            labels: {
              enabled: true,
              formatter: function() {
                return this.value; // Simple format without locale
              }
            }
          },
          yAxis: {
            labels: {
              enabled: true,
              formatter: function() {
                return this.value; // Simple format without locale
              }
            }
          },
          tooltip: {
            headerFormat: '',
            pointFormat: '<b>{point.y}</b>',
            padding: 10
          },
          accessibility: {
            landmarkVerbosity: 'one',
            series: {
              describeSingleSeries: true
            }
          },
          sonification: {
            duration: this.sonificationDuration,
            updateInterval: 0, // Allow chart updates without delay
            defaultInstrumentOptions: {
              instrument: this.selectedInstrument,
              mapping: this.getCombinedMapping()
            }
          },
          series: [{
            data: chartData,
            color: '#3070d0'
          }]
        });

        // Initialize the mapping
        this.updateMapping();
        
        console.log('Chart initialized successfully');
      } catch (error) {
        console.error('Error initializing chart:', error);
      }
    },
    getCombinedMapping() {
      // Start with default unmapped options
      const mapping = { ...this.defaultMappingOptionsUnmapped };
      
      // Check for special cases
      const hasPitch = this.activeParams.includes('pitch');
      const hasGapBetweenNotes = this.activeParams.includes('gapBetweenNotes');
      
      // Update scale for pitch mapping
      if (hasPitch) {
        this.mappingOptionsMapped.pitch.scale = 
          Highcharts.sonification.Scales[this.selectedScale];
      }
      
      // Special case for gap between notes - requires pitch arrays
      if (hasGapBetweenNotes && !hasPitch) {
        mapping.pitch = ['g3', 'g3', 'g3'];
      }
      
      // Apply all active parameter mappings
      this.activeParams.forEach(param => {
        mapping[param] = this.mappingOptionsMapped[param];
      });
      
      return mapping;
    },
    toggleSonify() {
      if (this.chart) {
        try {
          this.chart.toggleSonify();
          this.isPlaying = !this.isPlaying;
          console.log('Sonification toggled');
        } catch (error) {
          console.error('Error toggling sonification:', error);
          this.isPlaying = false;
        }
      } else {
        console.error('Chart is not initialized');
      }
    },
    updateMapping() {
      if (!this.chart || !Highcharts.sonification) {
        console.error('Chart or sonification is not available');
        return;
      }
      
      try {
        // Determine if we need to use flute for note duration
        const hasNoteDuration = this.activeParams.includes('noteDuration');
        let instrument = hasNoteDuration ? 'flute' : this.selectedInstrument;
        let duration = hasNoteDuration ? 8500 : this.sonificationDuration;
        
        // Get combined mapping for all active parameters
        const combinedMapping = this.getCombinedMapping();
        
        // Update the chart
        this.chart.update({
          sonification: {
            duration: duration,
            defaultInstrumentOptions: {
              instrument: instrument,
              mapping: combinedMapping
            }
          }
        });
        
        // Generate and update the JSON config for reference
        this.generateJsonConfig();
        
        console.log('Mapping updated with active parameters:', this.activeParams);
      } catch (error) {
        console.error('Error updating mapping:', error);
      }
    }
  }
}
</script>

<style scoped>
* {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  box-sizing: border-box;
}

h4, h5 {
  color: #25386f;
}

.highcharts-description {
  margin: 20px 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #555;
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #eaeaea;
}

.main-content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.chart-wrapper {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 24px;
}

.highcharts-figure {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0;
}

/* Chart container with increased height */
.chart-container {
  min-height: 450px;
  width: 100%;
  margin: 0 0 20px 0;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.03);
}

#controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 24px 0;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #eaeaea;
  border-radius: 5px;
}

/* Tabs styling */
.tabs-container {
  width: 100%;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 20px;
  gap: 4px;
}

.tabs button {
  padding: 12px 18px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: #555;
  position: relative;
  transition: all 0.2s ease;
  border-radius: 6px 6px 0 0;
}

.tabs button:hover {
  background-color: rgba(48, 112, 208, 0.05);
  color: #3070d0;
}

.active-tab {
  color: #3070d0 !important;
  background-color: #fff !important;
  border: 1px solid #e0e0e0 !important;
  border-bottom: 2px solid #fff !important;
  margin-bottom: -1px;
}

.tab-content {
  background-color: #fff;
  border-radius: 0 0 8px 8px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-top: none;
}

/* JSON section */
.json-config-container {
  width: 100%;
}

.json-config-container h4 {
  margin: 0 0 10px 0;
}

.json-textarea {
  width: 100%;
  min-height: 200px;
  font-family: monospace;
  padding: 14px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  resize: vertical;
  margin-bottom: 12px;
  font-size: 0.9rem;
  line-height: 1.5;
  background-color: #f8f9fa;
}

.json-textarea:focus {
  border-color: #3070d0;
  box-shadow: 0 0 0 3px rgba(48, 112, 208, 0.2);
  outline: none;
}

.json-status {
  font-size: 0.9rem;
  margin-bottom: 15px;
  padding: 8px;
  border-radius: 4px;
}

.json-valid {
  background-color: #e6f4ea;
  color: #137333;
  border-left: 3px solid #137333;
  padding-left: 12px;
}

.json-invalid {
  background-color: #fce8e6;
  color: #c5221f;
  border-left: 3px solid #c5221f;
  padding-left: 12px;
}

#apply-config {
  background-color: #25386f;
  color: white;
  border: none;
  font-size: 0.95rem;
  min-height: 42px;
  font-weight: 500;
  border-radius: 6px;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: 250px;
}

.parameters-container {
  width: 100%;
}

.parameters-container h4 {
  margin: 0 0 10px 0;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.parameter-checkbox {
  display: flex;
  align-items: center;
  padding: 10px 10px 10px 15px; /* Padding izquierdo consistente */
  background-color: #f5f7fa;
  border-radius: 6px;
  transition: background-color 0.2s;
  position: relative; /* Para posicionamiento preciso */
}

.parameter-checkbox:hover {
  background-color: #edf2f7;
}

.parameter-checkbox input[type="checkbox"] {
  position: absolute;
  left: 15px; /* Distancia fija desde el borde izquierdo */
  margin: 0;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  accent-color: #3070d0;
}

.parameter-checkbox label {
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  flex-grow: 1;
  margin: 0;
  padding-left: 30px; /* Espacio para el checkbox */
  text-align: left;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-basis: 50%;
}

.control-group label {
  font-size: 0.9rem;
  font-weight: 600;
  min-width: 40px;
  color: #555;
}

.control-group input, .control-group select {
  flex-grow: 1;
  min-height: 36px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #d0d7de;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.control-group input:focus, .control-group select:focus {
  border-color: #3070d0;
  box-shadow: 0 0 0 3px rgba(48, 112, 208, 0.2);
  outline: none;
}


.control-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
}

select, input {
  min-height: 30px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  flex-grow: 1;
}

label {
  font-size: 0.9rem;
  font-weight: 500;
}

#sonify {
  background-color: #3070d0;
  color: white;
  border: none;
  font-size: 1rem;
  min-height: 46px;
  font-weight: 600;
  border-radius: 6px;
  padding: 12px 20px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  max-width: 250px;
  margin: 20px auto 0;
}

#apply-config:hover, #sonify:hover {
  background-color: #2560b8;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

#sonify:active {
  transform: translateY(1px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.button-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none !important;
}

.json-example {
  margin-top: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #eaeaea;
}

.json-example h5 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 0.9rem;
  color: #555;
}

.json-example pre {
  margin: 0;
  font-family: monospace;
  font-size: 0.8rem;
  white-space: pre-wrap;
  color: #444;
}

.min-max-container {
  background-color: #f9fafc;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  border: 1px solid #eaeaea;
}

.min-max-container h4 {
  margin: 0 0 10px 0;
}

.param-range-controls {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #e0e0e0;
}

.param-range-controls:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.param-range-controls h5 {
  margin: 0 0 8px 0;
  font-size: 0.9rem;
}

.min-max-controls {
  display: flex;
  gap: 20px;
}

/* Mejora del contenedor de ayuda */
.help-container {
  margin: 24px 0;
  padding: 18px;
  background-color: #f0f7ff;
  border-radius: 8px;
  border-left: 5px solid #3070d0;
}

.help-container h4 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #25386f;
}

.active-param {
  margin-bottom: 10px;
  font-size: 0.95rem;
  line-height: 1.5;
  padding-left: 12px;
  border-left: 2px solid rgba(48, 112, 208, 0.3);
}

.active-param:last-child {
  margin-bottom: 0;
}

.helptext {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.highcharts-description {
  margin: 15px 0;
  font-size: 0.9rem;
  color: #666;
}

/* Ensure chart container has height */
#container {
  min-height: 300px;
  margin: 10px 0;
}

/* Crosshair animation */
.hc-crosshair {
  transition: all 0.1s ease-in-out;
}

@media (max-width: 768px) {
  .checkbox-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .control-row {
    flex-direction: column;
    gap: 16px;
  }
  
  .min-max-controls {
    flex-direction: column;
    gap: 16px;
  }
  
  .tabs button {
    padding: 10px 12px;
    font-size: 0.9rem;
  }
  
  .tab-content {
    padding: 16px;
  }
  
  #sonify {
    width: 100%;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .checkbox-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-wrapper {
    padding: 16px;
  }
  
  .control-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .control-group label {
    min-width: auto;
  }
}

.import-controls {
  margin: 0 0 16px 0;
  text-align: left;
}


.import-button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background-color: #25386f;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.import-button:hover {
  background-color: #0056b3;
}

.import-button:hover {
  background-color: #1a2a57;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.import-button:active {
  transform: translateY(1px);
}
#export-midi {
  background-color: #25386f;
  color: white;
  border: none;
  font-size: 1rem;
  min-height: 46px;
  font-weight: 600;
  border-radius: 6px;
  padding: 12px 20px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  max-width: 250px;
  margin: 20px auto 0;
}

#export-midi:hover {
  background-color: #1a2a57;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.playback-controls {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

</style>

//json de muestra
<!-- {
  "activeParams": ["pitch", "volume", "pan"],
  "scale": "minor",
  "instrument": "violin",
  "duration": 6000,
  "mappingOptions": {
    "pitch": {
      "min": "c3",
      "max": "c7"
    },
    "volume": {
      "min": 0.2,
      "max": 1.5
    }
  }
} -->