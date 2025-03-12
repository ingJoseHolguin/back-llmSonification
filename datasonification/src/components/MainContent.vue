<template>
  <figure class="highcharts-figure">
    <div id="controls">
      <label for="scale">Scale:</label>
      <select id="scale" v-model="selectedScale" @change="updateScale">
        <option v-for="scale in availableScales" :key="scale" :value="scale">
          {{ scale }}
        </option>
      </select>
      
      <label for="instrument">Instrument:</label>
      <select id="instrument" v-model="selectedInstrument" @change="updateInstrument">
        <option v-for="instrument in availableInstruments" :key="instrument" :value="instrument">
          {{ instrument }}
        </option>
      </select>
      
      <button id="sonify" @click="toggleSonify">Play chart</button>
    </div>
    <div id="container" ref="chartContainer"></div>
    <p class="highcharts-description">
      Here we are demonstrating using musical scales and instrument selection when mapping.
      Select between the scales and instruments in the dropdowns before playing the chart, and hear the difference.
    </p>
  </figure>
</template>

<script>
// Importar Highcharts como módulo completo
import Highcharts from 'highcharts';
// Importar módulos necesarios
import 'highcharts/modules/sonification';
import 'highcharts/modules/accessibility';

export default {
  name: 'MusicalScaleSonification',
  data() {
    return {
      chart: null,
      selectedScale: 'major',
      selectedInstrument: 'piano',
      availableScales: [],
      availableInstruments: []
    };
  },
  mounted() {
    // Asegurarse de que el DOM está listo
    this.$nextTick(() => {
      // Configurar opciones globales de Highcharts para evitar problemas de locale
      Highcharts.setOptions({
        lang: {
          decimalPoint: '.',
          thousandsSep: ','
        }
      });
      
      // Verificar si los módulos están correctamente cargados
      if (!Highcharts.sonification) {
        console.error('El módulo de sonificación no está cargado correctamente');
        this.loadHighchartsModules();
      } else {
        this.initializeChart();
      }
    });
  },
  methods: {
    loadHighchartsModules() {
      // Cargar los scripts directamente desde CDN
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
        // Configurar opciones globales después de cargar los scripts
        Highcharts.setOptions({
          lang: {
            decimalPoint: '.',
            thousandsSep: ','
          }
        });
        this.initializeChart();
      }).catch(error => {
        console.error('Error al cargar los scripts de Highcharts:', error);
      });
    },
    initializeChart() {
      try {
        // Verificar que la referencia al contenedor existe
        if (!this.$refs.chartContainer) {
          console.error('El contenedor del gráfico no está disponible');
          return;
        }

        // Verificar que Highcharts y sus módulos están disponibles
        if (!Highcharts || !Highcharts.sonification || !Highcharts.sonification.Scales) {
          console.error('Highcharts o sus módulos no están disponibles');
          return;
        }

        // Agregar una escala personalizada a los presets
        Highcharts.sonification.Scales.custom = [0, 1, 5, 7, 8, 10, 11];
        
        // Obtener todas las escalas disponibles
        this.availableScales = Object.keys(Highcharts.sonification.Scales);
        
        // Obtener todos los instrumentos disponibles
        this.availableInstruments = Object.keys(Highcharts.sonification.InstrumentPresets);
        
        // Crear el gráfico
        this.chart = Highcharts.chart(this.$refs.chartContainer, {
          chart: {
            type: 'line',
            height: 300
          },
          title: {
            text: 'Musical scales and instruments',
            align: 'left',
            margin: 25
          },
          legend: {
            enabled: false
          },
          // Deshabilitar las etiquetas de los ejes para evitar problemas de formato
          xAxis: {
            labels: {
              enabled: true,
              formatter: function() {
                return this.value; // Formato simple sin locale
              }
            }
          },
          yAxis: {
            labels: {
              enabled: true,
              formatter: function() {
                return this.value; // Formato simple sin locale
              }
            }
          },
          accessibility: {
            landmarkVerbosity: 'one'
          },
          sonification: {
            duration: 3500,
            defaultInstrumentOptions: {
              instrument: this.selectedInstrument,
              mapping: {
                noteDuration: 300,
                pitch: {
                  min: 'c4',
                  max: 'c6',
                  // Así es como se establece una escala al mapear a tono
                  scale: Highcharts.sonification.Scales[this.selectedScale]
                }
              }
            }
          },
          series: [{
            data: [
              1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
              14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1
            ]
          }]
        });

        console.log('Gráfico inicializado correctamente');
      } catch (error) {
        console.error('Error al inicializar el gráfico:', error);
      }
    },
    toggleSonify() {
      if (this.chart) {
        try {
          this.chart.toggleSonify();
          console.log('Sonificación activada');
        } catch (error) {
          console.error('Error al activar la sonificación:', error);
        }
      } else {
        console.error('El gráfico no está inicializado');
      }
    },
    updateScale() {
      if (this.chart && Highcharts.sonification && Highcharts.sonification.Scales) {
        try {
          this.chart.update({
            sonification: {
              defaultInstrumentOptions: {
                mapping: {
                  pitch: {
                    scale: Highcharts.sonification.Scales[this.selectedScale]
                  }
                }
              }
            }
          }, false);
          console.log('Escala actualizada a:', this.selectedScale);
        } catch (error) {
          console.error('Error al actualizar la escala:', error);
        }
      }
    },
    updateInstrument() {
      if (this.chart && Highcharts.sonification && Highcharts.sonification.InstrumentPresets) {
        try {
          this.chart.update({
            sonification: {
              defaultInstrumentOptions: {
                instrument: this.selectedInstrument
              }
            }
          }, false);
          console.log('Instrumento actualizado a:', this.selectedInstrument);
        } catch (error) {
          console.error('Error al actualizar el instrumento:', error);
        }
      }
    }
  },
  beforeUnmount() {
    // Limpiar al desmontar el componente
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
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

select {
  margin-right: 10px;
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
  margin-bottom: 0.25rem;
  margin-top: 0.25rem;
  text-align: center;
  cursor: pointer;
}

#sonify:hover {
  background-color: #25386f;
  color: #fff;
}

.highcharts-description {
  margin: 0.3rem 10px;
}

/* Asegurar que el contenedor del gráfico tenga altura */
#container {
  min-height: 300px;
}
</style>