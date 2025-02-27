export default {
  namespaced: true,
  state: {
    currentData: [],
    metadata: {
      title: '',
      description: '',
      source: '',
      lastUpdated: null,
      columns: []
    },
    chartOptions: {
      type: 'line',
      title: '',
      xAxis: {
        title: '',
        categories: []
      },
      yAxis: {
        title: '',
        min: null,
        max: null
      },
      series: []
    },
    isLoading: false,
    error: null
  },
  getters: {
    getData: state => state.currentData,
    getMetadata: state => state.metadata,
    getChartOptions: state => state.chartOptions,
    getSeriesData: state => state.chartOptions.series,
    hasData: state => state.currentData.length > 0,
    isLoading: state => state.isLoading,
    getError: state => state.error
  },
  mutations: {
    SET_DATA(state, data) {
      state.currentData = data
    },
    SET_METADATA(state, metadata) {
      state.metadata = {...state.metadata, ...metadata}
    },
    UPDATE_CHART_OPTIONS(state, options) {
      state.chartOptions = {...state.chartOptions, ...options}
    },
    SET_CHART_SERIES(state, series) {
      state.chartOptions.series = series
    },
    SET_LOADING(state, status) {
      state.isLoading = status
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    SET_AXIS_CATEGORIES(state, { axis, categories }) {
      if (axis === 'x') {
        state.chartOptions.xAxis.categories = categories
      }
    }
  },
  actions: {
    async loadData({ commit, dispatch }, { data, source }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        commit('SET_DATA', data)
        
        // Actualizar metadatos
        commit('SET_METADATA', {
          source,
          lastUpdated: new Date().toISOString()
        })
        
        // Procesar datos para el gráfico
        await dispatch('processDataForChart', data)
        
        return { success: true }
      } catch (error) {
        commit('SET_ERROR', error.message)
        return { success: false, error: error.message }
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async processDataForChart({ commit }, data) {
      // Detectar columnas y procesar datos para Highcharts
      const columns = Object.keys(data[0] || {})
      
      // Actualizar metadatos
      commit('SET_METADATA', { columns })
      
      // Configurar ejes
      const xField = columns[0] // Asumimos que la primera columna es el eje X
      const categories = data.map(item => item[xField])
      commit('SET_AXIS_CATEGORIES', { axis: 'x', categories })
      
      // Crear series para cada columna numérica
      const seriesData = columns.slice(1).map(field => {
        return {
          name: field,
          data: data.map(item => parseFloat(item[field]) || 0)
        }
      })
      
      commit('SET_CHART_SERIES', seriesData)
    },
    
    updateChartType({ commit }, chartType) {
      commit('UPDATE_CHART_OPTIONS', { type: chartType })
    },
    
    updateChartTitle({ commit }, title) {
      commit('UPDATE_CHART_OPTIONS', { title })
    },
    
    clearData({ commit }) {
      commit('SET_DATA', [])
      commit('SET_CHART_SERIES', [])
      commit('SET_METADATA', {
        title: '',
        description: '',
        source: '',
        lastUpdated: null,
        columns: []
      })
    }
  }
}