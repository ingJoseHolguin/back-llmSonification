import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './styles/global.css'

// Importar Highcharts correctamente
import Highcharts from 'highcharts'
import HighchartsVue from 'highcharts-vue'

// Importar módulos de Highcharts correctamente
import exportingModule from 'highcharts/modules/exporting'
import accessibilityModule from 'highcharts/modules/accessibility'

// Inicializar módulos de Highcharts (la manera correcta)
exportingModule(Highcharts)
accessibilityModule(Highcharts)

// Crear la aplicación
const app = createApp(App)

// Registrar plugins
app.use(router)
app.use(store)
app.use(HighchartsVue)

// Montar la aplicación
app.mount('#app')