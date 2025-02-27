import { createRouter, createWebHistory } from 'vue-router'

// Importa los componentes que servirán como páginas principales
import ChartView from './components/ChartView.vue'
import ConfigPanel from './components/ConfigPanel.vue'
//import SonificationControl from './components/SonificationControl.vue'
import ChatbotWidget from "./components/ChatbotWidget.vue";
import DataImport from './components/DataImport.vue'
import VoiceChat from './modules/voiceMode/VoiceChat.vue'

const routes = [
  { path: '/', component: ChartView },
  { path: '/config', component: ConfigPanel },
  { path: '/ChatbotWidget', component: ChatbotWidget },
  { path: '/import', component: DataImport },
  { path: '/voice', component: VoiceChat }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
