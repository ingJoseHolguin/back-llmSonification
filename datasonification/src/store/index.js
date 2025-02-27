import { createStore } from 'vuex'
import sonification from './modules/sonification'
import dataStore from './modules/dataStore'
import themeStore from './modules/themeStore'

// Plugin para persistir el estado en localStorage
import persistState from '../plugins/persistState'

export default createStore({
  state: {
    // Estado global compartido
    appConfig: {
      version: '1.0.0',
      language: 'es',
      debug: false
    },
    // Estado para el chatbot
    chatbotConfig: {
      isMinimized: true,
      messages: [],
      voiceEnabled: false
    }
  },
  getters: {
    getAppConfig: state => state.appConfig,
    getChatbotConfig: state => state.chatbotConfig,
    isDebugMode: state => state.appConfig.debug
  },
  mutations: {
    SET_APP_CONFIG(state, config) {
      state.appConfig = {...state.appConfig, ...config}
    },
    UPDATE_CHATBOT_STATE(state, { key, value }) {
      state.chatbotConfig[key] = value
    },
    ADD_CHATBOT_MESSAGE(state, message) {
      state.chatbotConfig.messages.push(message)
    },
    TOGGLE_CHATBOT_MINIMIZED(state) {
      state.chatbotConfig.isMinimized = !state.chatbotConfig.isMinimized
    },
    TOGGLE_VOICE_MODE(state) {
      state.chatbotConfig.voiceEnabled = !state.chatbotConfig.voiceEnabled
    },
    APPLY_JSON_CONFIG(state, jsonConfig) {
      // Método para aplicar una configuración JSON recibida del chatbot
      if (jsonConfig.appConfig) {
        state.appConfig = {...state.appConfig, ...jsonConfig.appConfig}
      }
      
      // También podríamos aplicar configuraciones a otros módulos
      if (jsonConfig.sonification && this.state.sonification) {
        this.commit('sonification/UPDATE_CONFIG', jsonConfig.sonification)
      }
      
      if (jsonConfig.theme && this.state.themeStore) {
        this.commit('themeStore/SET_THEME', jsonConfig.theme)
      }
    }
  },
  actions: {
    updateAppConfig({ commit }, config) {
      commit('SET_APP_CONFIG', config)
    },
    toggleChatbot({ commit }) {
      commit('TOGGLE_CHATBOT_MINIMIZED')
    },
    toggleVoiceMode({ commit }) {
      commit('TOGGLE_VOICE_MODE')
    },
    addChatMessage({ commit }, message) {
      commit('ADD_CHATBOT_MESSAGE', message)
    },
    processChatbotCommand({ commit }, jsonString) {
      try {
        const config = JSON.parse(jsonString)
        commit('APPLY_JSON_CONFIG', config)
        return { success: true, message: 'Configuración aplicada correctamente' }
      } catch (error) {
        console.error('Error al procesar comando JSON:', error)
        return { success: false, message: 'Error al procesar el JSON: ' + error.message }
      }
    }
  },
  modules: {
    sonification,
    dataStore,
    themeStore
  },
  plugins: [persistState(['appConfig', 'themeStore'])]
})