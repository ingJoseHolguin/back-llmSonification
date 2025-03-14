<template>
 
    <div class="import-controls">
      <button @click="handleFileImport" class="import-button">Importar CSV/Excel</button>
      <input 
        type="file" 
        ref="fileInput" 
        @change="onFileChange" 
        accept=".csv,.txt,.xlsx,.xls" 
        style="display: none;"
      >
    
    <figure class="highcharts-figure">
    <!-- Área del gráfico ampliada -->
    <div id="container" ref="chartContainer" class="chart-container"></div>
    
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
      
      <button id="sonify" @click="toggleSonify">{{ isPlaying ? 'Detener' : 'Reproducir gráfico' }}</button>
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
  
</template>

<script>
// Import Highcharts as a complete module
import Highcharts from 'highcharts';
// Import necessary modules
import 'highcharts/modules/sonification';
import 'highcharts/modules/accessibility';
//import PageHeader from './PageHeader.vue';
import { parse } from 'papaparse'; // Para CSV
import * as XLSX from 'xlsx'; // Para Excel

export default {
  name: 'EnhancedSonificationComponent',
  components: {
    //PageHeader
  },
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
        { value: 'frequency', label: 'Frecuencia' },
        { value: 'volume', label: 'Volumen' },
        { value: 'pan', label: 'Balance estéreo' },
        { value: 'tremolo', label: 'Trémolo' },
        { value: 'lowpass', label: 'Filtro paso bajo' },
        { value: 'highpass', label: 'Filtro paso alto' },
        { value: 'noteDuration', label: 'Duración de nota' },
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
  methods: {
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
        
        // Apply configuration to the component
        if (config.activeParams && Array.isArray(config.activeParams)) {
          this.activeParams = config.activeParams.filter(param => 
            this.availableParams.some(ap => ap.value === param)
          );
        }
        
        if (config.scale && this.availableScales.includes(config.scale)) {
          this.selectedScale = config.scale;
        }
        
        if (config.instrument && this.availableInstruments.includes(config.instrument)) {
          this.selectedInstrument = config.instrument;
        }
        
        if (config.duration && !isNaN(config.duration)) {
          this.sonificationDuration = Math.max(1000, Math.min(15000, config.duration));
        }
        
        // Apply parameter ranges if provided
        if (config.paramRanges) {
          for (const param in config.paramRanges) {
            if (this.paramRanges[param]) {
              if (config.paramRanges[param].min !== undefined) {
                this.paramRanges[param].min = config.paramRanges[param].min;
              }
              if (config.paramRanges[param].max !== undefined) {
                this.paramRanges[param].max = config.paramRanges[param].max;
              }
            }
          }
        }
        
        // Apply custom mapping options if provided
        if (config.mappingOptions) {
          // Deep merge the custom mapping options with the default ones
          for (const param in config.mappingOptions) {
            if (this.mappingOptionsMapped[param]) {
              if (typeof config.mappingOptions[param] === 'object') {
                // Deep merge for nested objects
                this.mappingOptionsMapped[param] = this.deepMerge(
                  this.mappingOptionsMapped[param],
                  config.mappingOptions[param]
                );
              } else {
                // Direct assignment for primitive values
                this.mappingOptionsMapped[param] = config.mappingOptions[param];
              }
            }
          }
        }
        
        // Apply data if provided
        if (config.data && Array.isArray(config.data) && this.chart) {
          this.chart.series[0].setData(config.data, false);
        }
        
        // Update the mapping and redraw the chart
        this.updateMapping();
        if (this.chart) {
          this.chart.redraw();
        }
        
        // Success message
        this.jsonStatusMessage = 'Configuración aplicada exitosamente';
        
        // Switch to the parameters tab to show applied settings
        this.activeTab = 'params';
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
            text: 'Grafico',
            align: 'center',
            margin: 25
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
    },
    generateJsonConfig() {
      // This will update the JSON config to match the current settings
      // Only call when you want to update the JSON based on UI changes
      const config = {
        activeParams: [...this.activeParams],
        scale: this.selectedScale,
        instrument: this.selectedInstrument,
        duration: this.sonificationDuration,
        mappingOptions: {},
        paramRanges: {}
      };
      
      // Include ranges for all active parameters
      this.activeParams.forEach(param => {
        config.paramRanges[param] = { ...this.paramRanges[param] };
      });
      
      // Only include active parameters' mapping options
      this.activeParams.forEach(param => {
        config.mappingOptions[param] = this.mappingOptionsMapped[param];
      });
      
      // Don't update the textarea to avoid overwriting user input
      // this.jsonConfig = JSON.stringify(config, null, 2);
    },
    exportCurrentConfig() {
      // Generate and return the current configuration as a string
      const config = {
        activeParams: [...this.activeParams],
        scale: this.selectedScale,
        instrument: this.selectedInstrument,
        duration: this.sonificationDuration,
        mappingOptions: {},
        paramRanges: {}
      };
      
      // Include all parameter ranges
      this.activeParams.forEach(param => {
        config.paramRanges[param] = { ...this.paramRanges[param] };
      });
      
      // Include all mapping options
      this.activeParams.forEach(param => {
        config.mappingOptions[param] = this.mappingOptionsMapped[param];
      });
      
      return JSON.stringify(config, null, 2);
    }
  },
  beforeUnmount() {
    // Clean up when component is unmounted
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
</script>

<style scoped>
* {
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    Helvetica,
    Arial,
    "Apple Color Emoji",
    "Segoe UI Emoji",
    "Segoe UI Symbol",
    sans-serif;
}

.highcharts-figure {
  max-width: 900px; /* Increased max-width */
  margin: 0 auto;
  position: relative;
}

/* Chart container with increased height */
.chart-container {
  min-height: 400px; /* Increased height */
  width: 100%;
  margin: 0;
  border: 1px solid #eee;
  border-radius: 5px;
  overflow: hidden;
}

#controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 15px;
  margin-bottom: 15px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 5px;
}

/* Tabs styling */
.tabs-container {
  width: 100%;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 15px;
}

.tabs button {
  padding: 10px 15px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  position: relative;
}

.tabs button:hover {
  background-color: #f9f9f9;
}

.active-tab {
  color: #3070d0 !important;
  border-bottom: 2px solid #3070d0 !important;
}

.tab-content {
  width: 100%;
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
  min-height: 150px;
  font-family: monospace;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
  margin-bottom: 5px;
}

.json-status {
  font-size: 0.8rem;
  margin-bottom: 10px;
  min-height: 20px;
}

.json-valid {
  color: #2e7d32;
}

.json-invalid {
  color: #d32f2f;
}

.parameters-container {
  width: 100%;
}

.parameters-container h4 {
  margin: 0 0 10px 0;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.parameter-checkbox {
  display: flex;
  align-items: center;
  gap: 5px;
}

.parameter-checkbox input {
  margin: 0;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-grow: 1;
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

#apply-config, #sonify {
  background-color: #fff;
  border: 1px solid #25386f;
  color: #25386f;
  font-size: 0.9rem;
  min-height: 40px;
  font-weight: 500;
  border-radius: 4px;
  padding: 0.375rem 0;
  width: 100%;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

#apply-config:hover, #sonify:hover {
  background-color: #25386f;
  color: #fff;
}

.button-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.min-max-container {
  width: 100%;
  border-top: 1px solid #ddd;
  padding-top: 15px;
}

.min-max-container h4 {
  margin: 0 0 10px 0;
}

.param-range-controls {
  margin-bottom: 15px;
  border-bottom: 1px dashed #ddd;
  padding-bottom: 10px;
}

.param-range-controls h5 {
  margin: 0 0 8px 0;
  font-size: 0.9rem;
}

.min-max-controls {
  display: flex;
  gap: 15px;
}

.help-container {
  margin: 15px 0;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 5px;
  border-left: 4px solid #3070d0;
}

.help-container h4 {
  margin-top: 0;
  margin-bottom: 10px;
}

.active-param {
  margin-bottom: 8px;
  font-size: 0.9rem;
  line-height: 1.4;
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
  }
  
  .control-group {
    width: 100%;
  }
  
  .min-max-controls {
    flex-direction: column;
  }
}

.import-controls {
margin: 10px 0;
  text-align: left; /* O donde prefieras ubicar el botón */
}


.import-button {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.import-button:hover {
  background-color: #0056b3;
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