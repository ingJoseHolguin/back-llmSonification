<template>
  <div class="chart-view">
    <div class="chart-header">
      <h2>{{ chartTitle }}</h2>
      <div class="chart-actions">
        <button @click="toggleSonification" :class="{ active: sonificationEnabled }">
          <span v-if="sonificationEnabled">🔊</span>
          <span v-else>🔇</span>
          Sonificación
        </button>
        <button @click="exportChart">
          📊 Exportar
        </button>
      </div>
    </div>
    
    <div class="highcharts-container" ref="chartContainer">
      <highcharts
        :options="chartOptions"
        :constructor-type="'chart'"
        ref="highcharts"
      ></highcharts>
    </div>
    
    <div v-if="!hasData" class="no-data-message">
      <p>No hay datos para mostrar. Por favor, importe datos usando el componente de importación.</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'ChartView',
  
  setup() {
    const store = useStore()
    const chartContainer = ref(null)
    const highcharts = ref(null)
    
    // Obtener datos y opciones del store
    const chartOptions = computed(() => {
      const baseOptions = store.getters['dataStore/getChartOptions']
      return {
        chart: {
          type: baseOptions.type || 'line',
          events: {
            load: function() {
              chartInstance.value = this
            }
          }
        },
        title: {
          text: baseOptions.title || 'Visualización de Datos'
        },
        xAxis: {
          title: {
            text: baseOptions.xAxis?.title || ''
          },
          categories: baseOptions.xAxis?.categories || []
        },
        yAxis: {
          title: {
            text: baseOptions.yAxis?.title || ''
          },
          min: baseOptions.yAxis?.min,
          max: baseOptions.yAxis?.max
        },
        tooltip: {
          formatter: function() {
            if (sonificationEnabled.value && sonificationConfig.value.playOnHover) {
              // Sonificar el punto al pasar el ratón por encima
              playSingleDataPoint(this.y)
            }
            return `<b>${this.series.name}</b><br>${this.x}: <b>${this.y}</b>`
          }
        },
        plotOptions: {
          series: {
            point: {
              events: {
                click: function() {
                  if (sonificationEnabled.value) {
                    // Sonificar al hacer clic en un punto
                    playSingleDataPoint(this.y)
                  }
                }
              }
            }
          }
        },
        series: baseOptions.series || [],
        // Agregar esta configuración para exportación manual
        exporting: {
          enabled: false // Desactivamos la exportación nativa para manejarla nosotros
        }
      }
    })
    
    // Título del gráfico
    const chartTitle = computed(() => {
      return store.getters['dataStore/getChartOptions'].title || 'Visualización de Datos'
    })
    
    // Comprobar si hay datos
    const hasData = computed(() => {
      return store.getters['dataStore/hasData']
    })
    
    // Sonificación
    const sonificationEnabled = computed(() => store.getters['sonification/isEnabled'])
    const sonificationConfig = computed(() => store.getters['sonification/getConfig'])
    const chartInstance = ref(null)
    
    // Función para reproducir un único punto de datos
    const playSingleDataPoint = (value) => {
      if (!sonificationEnabled.value) return
      
      // Acciones de sonificación
      store.dispatch('sonification/initAudio')
      
      // Aquí iría la lógica de AudioCharts para sonificar un punto
      // Por simplicidad, solo registramos el valor
      console.log('Sonificando valor:', value)
    }
    
    // Función para reproducir todos los datos
    const playSeries = (seriesIndex = 0) => {
      if (!sonificationEnabled.value || !chartInstance.value) return
      
      // Obtener la serie actual
      const series = chartInstance.value.series[seriesIndex]
      if (!series) return
      
      // Obtener los datos de la serie
      const data = series.data.map(point => point.y)
      
      // Iniciar reproducción con AudioCharts
      store.dispatch('sonification/startPlayback', data)
    }
    
    // Función para alternar la sonificación
    const toggleSonification = () => {
      store.dispatch('sonification/toggleSonification')
    }
    
    // Función para exportar el gráfico manualmente
    const exportChart = () => {
      if (highcharts.value && highcharts.value.chart) {
        // Crear un enlace para descargar la imagen
        const svg = highcharts.value.chart.getSVG()
        const blob = new Blob([svg], { type: 'image/svg+xml' })
        const url = window.URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = 'chart-export.svg'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }
    
    // Inicializar o actualizar componentes
    onMounted(() => {
      console.log('ChartView montado')
      
      // Si hay datos y sonificación automática habilitada, reproducir datos
      if (hasData.value && sonificationEnabled.value && sonificationConfig.value.autoPlay) {
        playSeries()
      }
    })
    
    // Observar cambios en la configuración
    watch(sonificationEnabled, (newValue) => {
      console.log('Sonificación:', newValue ? 'activada' : 'desactivada')
    })
    
    watch(chartOptions, () => {
      console.log('Opciones del gráfico actualizadas')
    })
    
    return {
      chartContainer,
      highcharts,
      chartOptions,
      chartTitle,
      hasData,
      sonificationEnabled,
      toggleSonification,
      exportChart,
      playSeries
    }
  }
}
</script>

<style lang="scss" scoped>
.chart-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 400px;
  border-radius: 8px;
  background-color: var(--component-bg);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  
  h2 {
    margin: 0;
    font-size: 1.25rem;
  }
}

.chart-actions {
  display: flex;
  gap: 0.5rem;
  
  button {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--button-bg);
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background-color: var(--button-hover-bg);
    }
    
    &.active {
      background-color: var(--primary-color);
      color: white;
    }
  }
}

.highcharts-container {
  flex: 1;
  min-height: 350px;
}

.no-data-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  text-align: center;
  color: var(--text-light);
  padding: 1rem;
}
</style>