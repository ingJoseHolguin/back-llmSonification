<template>
  <figure class="highcharts-figure">
    <div id="controls">
      <div class="json-config-container">
        <h4>JSON Configuration:</h4>
        <textarea 
          v-model="jsonConfig" 
          placeholder="Paste your JSON configuration here..." 
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
          Apply Configuration
        </button>
      </div>
      
      <div class="parameters-container">
        <h4>Mapping Parameters:</h4>
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

      <div class="control-row">
        <div class="control-group">
          <label for="scale">Scale:</label>
          <select id="scale" v-model="selectedScale" @change="updateMapping">
            <option v-for="scale in availableScales" :key="scale" :value="scale">
              {{ scale }}
            </option>
          </select>
        </div>
        
        <div class="control-group">
          <label for="instrument">Instrument:</label>
          <select id="instrument" v-model="selectedInstrument" @change="updateMapping">
            <option v-for="instrument in availableInstruments" :key="instrument" :value="instrument">
              {{ instrument }}
            </option>
          </select>
        </div>
        
        <div class="control-group">
          <label for="duration">Duration (ms):</label>
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
      
      <button id="sonify" @click="toggleSonify">{{ isPlaying ? 'Stop' : 'Play chart' }}</button>
    </div>
    
    <div id="container" ref="chartContainer"></div>
    
    <div class="help-container" v-if="activeParams.length > 0">
      <h4>Active Parameters:</h4>
      <div v-for="param in activeParams" :key="param" class="active-param">
        <strong>{{ getParamLabel(param) }}:</strong> {{ helpTexts[param] }}
      </div>
    </div>
    
    <p class="highcharts-description">
      This chart demonstrates multi-parameter sonification mapping. Select multiple mapping parameters using the checkboxes, 
      then choose a scale and instrument before playing the chart to hear how the data is represented with multiple sound dimensions.
      You can also paste a JSON configuration to quickly apply complex settings.
    </p>
  </figure>
</template>

<script>
// Import Highcharts as a complete module
import Highcharts from 'highcharts';
// Import necessary modules
import 'highcharts/modules/sonification';
import 'highcharts/modules/accessibility';

export default {
  name: 'EnhancedSonificationComponent',
  data() {
    return {
      chart: null,
      isPlaying: false,
      jsonConfig: '',
      isJsonValid: false,
      jsonStatusMessage: '',
      selectedScale: 'major',
      selectedInstrument: 'piano',
      sonificationDuration: 4500,
      activeParams: ['pitch'], // Default to pitch mapping
      availableParams: [
        { value: 'pitch', label: 'Pitch' },
        { value: 'frequency', label: 'Frequency' },
        { value: 'volume', label: 'Volume' },
        { value: 'pan', label: 'Stereo pan' },
        { value: 'tremolo', label: 'Tremolo' },
        { value: 'lowpass', label: 'Lowpass' },
        { value: 'highpass', label: 'Highpass' },
        { value: 'noteDuration', label: 'Note duration' },
        { value: 'gapBetweenNotes', label: 'Note gap' }
      ],
      availableScales: [],
      availableInstruments: [],
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
        pitch: 'Higher notes will be played when the Y-value goes higher, like playing piano keys from low to high.',
        frequency: 'Similar to pitch mapping but uses Hertz frequencies which double for each octave, creating a different sonic effect.',
        volume: 'Low Y-values play at low volume while high values play at high volume.',
        pan: 'Low Y-values are heard in the left ear, high ones in the right ear.',
        tremolo: 'Higher Y-values cause both faster and more dramatic volume changes.',
        lowpass: 'Low Y-values sound more dull (filtered), higher ones more natural.',
        highpass: 'Low Y-values sound thinner, higher ones more natural.',
        noteDuration: 'Low Y-values play short notes, high values play long notes.',
        gapBetweenNotes: 'Low Y-values have more space between notes, high Y-values play notes faster.'
      }
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
    getParamLabel(paramValue) {
      const param = this.availableParams.find(p => p.value === paramValue);
      return param ? param.label : paramValue;
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
          this.jsonStatusMessage = 'Valid JSON configuration';
        } else {
          this.isJsonValid = false;
          this.jsonStatusMessage = 'Invalid configuration format';
        }
      } catch (e) {
        this.isJsonValid = false;
        this.jsonStatusMessage = 'Invalid JSON: ' + e.message;
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
        this.jsonStatusMessage = 'Configuration applied successfully';
      } catch (e) {
        console.error('Error applying JSON configuration:', e);
        this.jsonStatusMessage = 'Error applying configuration: ' + e.message;
      }
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
        
        // Create the chart
        this.chart = Highcharts.chart(this.$refs.chartContainer, {
          chart: {
            type: 'line',
            height: 300
          },
          title: {
            text: 'Multi-Parameter Sonification',
            align: 'left',
            margin: 25
          },
          legend: {
            enabled: false
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
            data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
              14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
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
        mappingOptions: {}
      };
      
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
        mappingOptions: {}
      };
      
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
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

#controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 15px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 5px;
}

.json-config-container {
  margin-bottom: 15px;
  width: 100%;
}

.json-config-container h4 {
  margin: 0 0 10px 0;
}

.json-textarea {
  width: 100%;
  min-height: 120px;
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
}
</style>