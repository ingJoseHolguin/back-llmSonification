<template>
  <figure class="highcharts-figure">
    <div id="controls">
      <div class="control-group">
        <label for="mapping-param">Mapping Parameter:</label>
        <select id="mapping-param" v-model="selectedMappingParam" @change="updateMappingParam">
          <option value="pitch">Pitch</option>
          <option value="frequency">Frequency</option>
          <option value="volume">Volume</option>
          <option value="pan">Stereo pan</option>
          <option value="tremolo">Tremolo</option>
          <option value="lowpass">Lowpass</option>
          <option value="highpass">Highpass</option>
          <option value="noteDuration">Note duration</option>
          <option value="gapBetweenNotes">Note gap</option>
        </select>
      </div>

      <div class="control-group">
        <label for="scale">Scale:</label>
        <select id="scale" v-model="selectedScale" @change="updateScale">
          <option v-for="scale in availableScales" :key="scale" :value="scale">
            {{ scale }}
          </option>
        </select>
      </div>
      
      <div class="control-group">
        <label for="instrument">Instrument:</label>
        <select id="instrument" v-model="selectedInstrument" @change="updateInstrument">
          <option v-for="instrument in availableInstruments" :key="instrument" :value="instrument">
            {{ instrument }}
          </option>
        </select>
      </div>
      
      <button id="sonify" @click="toggleSonify">Play chart</button>
    </div>
    
    <div id="container" ref="chartContainer"></div>
    
    <div class="help-container">
      <p id="helptext" class="helptext">{{ helpTexts[selectedMappingParam] }}</p>
    </div>
    
    <p class="highcharts-description">
      This chart demonstrates different sonification mapping parameters. Select a mapping parameter, 
      scale, and instrument from the dropdowns before playing the chart and hear how the data is represented with sound.
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
      selectedScale: 'major',
      selectedInstrument: 'piano',
      selectedMappingParam: 'pitch',
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
      defaultMappingOptionsMapped: {
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
        pitch: 'With this pitch mapping, higher notes will be played when the Y-value goes higher. You can picture a piano, where the Y-axis is laid out across the keys. For low Y-values, the low piano keys are played, and for high Y-values, the higher keys are played.',
        frequency: 'Frequency is similar to pitch mapping, but instead of mapping to notes on a piano, we are mapping to wave frequency in Hertz. The wave frequency doubles for each octave, so mapping higher in frequency will very quickly cause high musical notes. For this reason you would usually use pitch mapping instead.',
        volume: 'With this volume mapping the pitch is always the same, but low Y-values are played at low volume, while high values are played at high volume. Noticing subtle differences in volume can be hard, and also hardware dependent, so this should usually be combined with other mappings.',
        pan: 'Stereo panning refers to where in a stereo field a sound is placed. If you are wearing headphones, you will hear low Y-values in the left ear, and high ones in the right ear. Normally we map this to the X-value instead, so that we get a feeling of playing the chart from left to right.',
        tremolo: 'Tremolo refers to periodical changes in volume. You can map to both the speed and intensity of the volume changes. In this case we are mapping to both, where a higher Y-value causes both faster and more dramatic volume changes.',
        lowpass: 'Lowpass filters filter out high frequencies, making the sound more dull. You can map to both the dropoff frequency of the filter as well as a resonance. The resonance adds emphasis to the frequencies around the dropoff frequency. In this case we are making low Y-values more dull, and higher ones more natural.',
        highpass: 'Highpass filters filter out low frequencies, making the sound thinner. Similarly to the lowpass filter, you can map to both dropoff frequency and resonance. In this case we are making low Y-values more thin, and higher ones more natural.',
        noteDuration: 'Note duration refers to how long each note plays for. It only has an effect with continuous instruments that can hold notes indefinitely, in this case a flute. Here we are making low Y-values play short notes, and high values play long notes.',
        gapBetweenNotes: 'Here we are mapping pitch to an array of notes. When pitch is an array, multiple notes are played for each point. Note gap refers to how long to wait between each of these notes. In this demo, low Y-values have more space between the notes, and high Y-values play the notes faster.'
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
            text: 'Sonification with Multiple Mapping Options',
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
            duration: 4500,
            updateInterval: 0, // Allow chart updates without delay
            defaultInstrumentOptions: {
              instrument: this.selectedInstrument,
              mapping: this.getDefaultMapping()
            }
          },
          series: [{
            data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
              14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
            color: '#3070d0'
          }]
        });

        // Initialize with pitch mapping
        this.updateMappingParam();
        
        console.log('Chart initialized successfully');
      } catch (error) {
        console.error('Error initializing chart:', error);
      }
    },
    getDefaultMapping() {
      // Create a copy of the default unmapped options
      const defaultMapping = { ...this.defaultMappingOptionsUnmapped };
      
      // Update the scale for pitch if pitch is the selected parameter
      if (this.selectedMappingParam === 'pitch') {
        this.defaultMappingOptionsMapped.pitch.scale = 
          Highcharts.sonification.Scales[this.selectedScale];
      }
      
      // Add the selected parameter mapping
      defaultMapping[this.selectedMappingParam] = 
        this.defaultMappingOptionsMapped[this.selectedMappingParam];
      
      return defaultMapping;
    },
    toggleSonify() {
      if (this.chart) {
        try {
          this.chart.toggleSonify();
          console.log('Sonification toggled');
        } catch (error) {
          console.error('Error toggling sonification:', error);
        }
      } else {
        console.error('Chart is not initialized');
      }
    },
    updateMappingParam() {
      if (!this.chart || !Highcharts.sonification) {
        console.error('Chart or sonification is not available');
        return;
      }
      
      try {
        // Create special adjustments for certain parameters
        const pitchOverride = {};
        let duration = 4500;
        let instrument = this.selectedInstrument;
        
        // Special handling for different mapping parameters
        if (this.selectedMappingParam === 'gapBetweenNotes') {
          // Gap between notes works with pitch arrays only
          pitchOverride.pitch = ['g3', 'g3', 'g3'];
        } else if (this.selectedMappingParam === 'noteDuration') {
          // Use a higher pitch and flute for note duration
          pitchOverride.pitch = 'b4';
          instrument = 'flute';
          duration = 8500;
        } else if (this.selectedMappingParam === 'pitch') {
          // If last selected param was gapBetweenNotes we need to avoid just
          // updating the array, so update it to a primitive first
          if (this.chart.sonification.options.defaultInstrumentOptions.mapping.pitch instanceof Array) {
            this.chart.update({
              sonification: {
                defaultInstrumentOptions: { mapping: { pitch: 0 } }
              }
            }, false);
          }
          
          // Make sure the scale is applied to pitch mapping
          this.defaultMappingOptionsMapped.pitch.scale = 
            Highcharts.sonification.Scales[this.selectedScale];
        }
        
        // Build the final mapping options
        const selectedOpts = {};
        selectedOpts[this.selectedMappingParam] = 
          this.defaultMappingOptionsMapped[this.selectedMappingParam];
        
        // Update the chart
        this.chart.update({
          sonification: {
            duration: duration,
            defaultInstrumentOptions: {
              instrument: instrument,
              mapping: Highcharts.merge(
                this.defaultMappingOptionsUnmapped,
                pitchOverride,
                selectedOpts
              )
            }
          }
        });
        
        console.log('Mapping parameter updated to:', this.selectedMappingParam);
      } catch (error) {
        console.error('Error updating mapping parameter:', error);
      }
    },
    updateScale() {
      if (this.chart && Highcharts.sonification && Highcharts.sonification.Scales) {
        try {
          // Update the scale in the options
          this.defaultMappingOptionsMapped.pitch.scale = 
            Highcharts.sonification.Scales[this.selectedScale];
          
          // Only update the chart if pitch is the current mapping parameter
          if (this.selectedMappingParam === 'pitch') {
            this.updateMappingParam();
          }
          
          console.log('Scale updated to:', this.selectedScale);
        } catch (error) {
          console.error('Error updating scale:', error);
        }
      }
    },
    updateInstrument() {
      if (this.chart && Highcharts.sonification) {
        try {
          // Don't change instrument for noteDuration mapping which requires flute
          if (this.selectedMappingParam !== 'noteDuration') {
            this.chart.update({
              sonification: {
                defaultInstrumentOptions: {
                  instrument: this.selectedInstrument
                }
              }
            }, false);
            console.log('Instrument updated to:', this.selectedInstrument);
          } else {
            console.log('Note duration mapping requires flute instrument. Ignoring instrument change.');
          }
        } catch (error) {
          console.error('Error updating instrument:', error);
        }
      }
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
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 5px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 5px;
}

select {
  min-height: 30px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

label {
  font-size: 0.9rem;
  font-weight: 500;
}

#sonify {
  background-color: #fff;
  border: 1px solid #25386f;
  color: #25386f;
  font-size: 0.9rem;
  min-height: 30px;
  font-weight: 500;
  border-radius: 4px;
  padding: 0.375rem 0;
  width: 7rem;
  margin-left: auto;
  text-align: center;
  cursor: pointer;
}

#sonify:hover {
  background-color: #25386f;
  color: #fff;
}

.help-container {
  margin: 10px 0;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 5px;
  border-left: 4px solid #3070d0;
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
  #controls {
    flex-direction: column;
    align-items: flex-start;
  }
  
  #sonify {
    margin-left: 0;
    width: 100%;
  }
  
  .control-group {
    width: 100%;
  }
  
  select {
    flex-grow: 1;
  }
}
</style>