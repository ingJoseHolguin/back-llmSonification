<template>
  <div class="chatbot-container" :class="{ 'minimized': isMinimized }">
    <div class="chatbot-header" @click="toggleChatbot">
      <h3>Chatbot de Configuración</h3>
      <button class="minimize-button">
        {{ isMinimized ? '↑' : '↓' }}
      </button>
    </div>
    
    <div class="chatbot-content" v-if="!isMinimized">
      <div class="messages-container" ref="messagesContainer">
        <div 
          v-for="(message, index) in messages" 
          :key="index" 
          class="message" 
          :class="message.sender"
        >
          <div class="message-content">
            <p v-if="message.text">{{ message.text }}</p>
            <pre v-if="message.json" class="json-content">{{ formatJson(message.json) }}</pre>
          </div>
          <div class="message-time">{{ message.time }}</div>
        </div>
      </div>
      
      <div class="chatbot-controls">
        <div class="input-container">
          <textarea 
            v-model="currentMessage" 
            placeholder="Enviar mensaje o configuración JSON..."
            @keydown.enter.prevent="sendMessage"
            rows="3"
          ></textarea>
          <button class="voice-button" @click="toggleVoiceMode">
            {{ voiceEnabled ? '🎤 Detener' : '🎤 Hablar' }}
          </button>
        </div>
        
        <div class="action-buttons">
          <button class="send-button" @click="sendMessage">
            Enviar
          </button>
          <button class="json-button" @click="sendCurrentConfig">
            Enviar Configuración Actual
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'ChatbotWidget',
  
  setup() {
    const store = useStore()
    const messagesContainer = ref(null)
    const currentMessage = ref('')
    
    // Estados desde Vuex
    const isMinimized = computed(() => store.state.chatbotConfig.isMinimized)
    const messages = computed(() => store.state.chatbotConfig.messages)
    const voiceEnabled = computed(() => store.state.chatbotConfig.voiceEnabled)
    
    // Funciones
    const toggleChatbot = () => {
      store.dispatch('toggleChatbot')
    }
    
    const toggleVoiceMode = () => {
      store.dispatch('toggleVoiceMode')
      
      if (!voiceEnabled.value) {
        // Si ahora está habilitado, iniciar el reconocimiento
        initSpeechRecognition()
      } else {
        // Si ahora está deshabilitado, detener el reconocimiento
        stopSpeechRecognition()
      }
    }
    
    // Estado interno para reconocimiento de voz
    const recognition = ref(null)
    
    // Inicializar reconocimiento de voz
    const initSpeechRecognition = () => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        addBotMessage('Tu navegador no soporta reconocimiento de voz.')
        return
      }
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognition.value = new SpeechRecognition()
      recognition.value.lang = 'es-ES'
      recognition.value.continuous = true
      recognition.value.interimResults = false
      
      recognition.value.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript
        currentMessage.value = transcript
        // No enviamos automáticamente para dar tiempo a revisar
      }
      
      recognition.value.onerror = (event) => {
        console.error('Error en reconocimiento de voz:', event.error)
        addBotMessage(`Error en reconocimiento de voz: ${event.error}`)
      }
      
      recognition.value.start()
    }
    
    // Detener reconocimiento de voz
    const stopSpeechRecognition = () => {
      if (recognition.value) {
        recognition.value.stop()
        recognition.value = null
      }
    }
    
    // Sintetizar voz para respuestas del bot
    const speakText = (text) => {
      if (!voiceEnabled.value || !('speechSynthesis' in window)) return
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'es-ES'
      window.speechSynthesis.speak(utterance)
    }
    
    // Formatear JSON para mostrar
    const formatJson = (json) => {
      try {
        if (typeof json === 'string') {
          return JSON.stringify(JSON.parse(json), null, 2)
        } else {
          return JSON.stringify(json, null, 2)
        }
      } catch (e) {
        return json
      }
    }
    
    // Enviar mensaje
    const sendMessage = async () => {
      if (!currentMessage.value.trim()) return
      
      // Añadir mensaje del usuario
      const userMessage = {
        sender: 'user',
        text: currentMessage.value,
        time: new Date().toLocaleTimeString()
      }
      
      store.dispatch('addChatMessage', userMessage)
      
      // Analizar si es JSON
      let jsonCommand = null
      let response = null
      
      try {
        jsonCommand = JSON.parse(currentMessage.value)
        // Si llega aquí, es un JSON válido
        response = await store.dispatch('processChatbotCommand', currentMessage.value)
        
        // Añadir respuesta del bot
        addBotMessage(response.message, jsonCommand)
      } catch (e) {
        // No es JSON, procesar como texto normal
        const reply = await processTextCommand(currentMessage.value)
        addBotMessage(reply.text, reply.config)
      }
      
      // Limpiar mensaje actual
      currentMessage.value = ''
      
      // Bajar scroll al último mensaje
      await nextTick()
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }
    
    // Añadir mensaje del bot
    const addBotMessage = (text, json = null) => {
      const botMessage = {
        sender: 'bot',
        text: text,
        json: json,
        time: new Date().toLocaleTimeString()
      }
      
      store.dispatch('addChatMessage', botMessage)
      
      // Si el modo de voz está activado, leer el mensaje
      speakText(text)
    }
    
    // Procesar comandos de texto
    const processTextCommand = (text) => {
      const lowerText = text.toLowerCase()
      
      // Comandos básicos
      if (lowerText.includes('mostrar configuración') || lowerText.includes('muestra configuración')) {
        const currentConfig = {
          appConfig: store.state.appConfig,
          sonification: store.state.sonification.config,
          theme: store.state.themeStore.currentTheme
        }
        
        return {
          text: 'Aquí tienes la configuración actual:',
          config: currentConfig
        }
      }
      
      if (lowerText.includes('cambiar tema') || lowerText.includes('cambia tema')) {
        const currentTheme = store.state.themeStore.currentTheme
        const newTheme = currentTheme === 'light-theme' ? 'dark-theme' : 'light-theme'
        
        store.dispatch('themeStore/changeTheme', newTheme)
        
        return {
          text: `Tema cambiado a ${newTheme}`,
          config: null
        }
      }
      
      if (lowerText.includes('activar sonificación') || lowerText.includes('activa sonificación')) {
        store.dispatch('sonification/updateConfig', { enabled: true })
        
        return {
          text: 'Sonificación activada',
          config: null
        }
      }
      
      if (lowerText.includes('desactivar sonificación') || lowerText.includes('desactiva sonificación')) {
        store.dispatch('sonification/updateConfig', { enabled: false })
        
        return {
          text: 'Sonificación desactivada',
          config: null
        }
      }
      
      // Respuesta por defecto
      return {
        text: 'Puedes enviar comandos como "mostrar configuración", "cambiar tema", "activar sonificación" o enviar un objeto JSON para actualizar la configuración.',
        config: null
      }
    }
    
    // Obtener y enviar la configuración actual
    const sendCurrentConfig = () => {
      const currentConfig = {
        appConfig: store.state.appConfig,
        sonification: store.state.sonification.config,
        theme: store.state.themeStore.currentTheme
      }
      
      // Añadir mensaje del usuario
      const userMessage = {
        sender: 'user',
        text: 'Obtener configuración actual',
        time: new Date().toLocaleTimeString()
      }
      
      store.dispatch('addChatMessage', userMessage)
      
      // Añadir respuesta del bot
      addBotMessage('Aquí tienes la configuración actual:', currentConfig)
    }
    
    // Scroll al último mensaje cuando se añade uno nuevo
    watch(messages, () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      })
    })
    
    // Limpiar recursos al desmontar
    onMounted(() => {
      // Añadir mensaje de bienvenida
      if (messages.value.length === 0) {
        addBotMessage('¡Hola! Puedes enviar comandos o configuraciones JSON para actualizar la visualización.')
      }
    })
    
    return {
      messagesContainer,
      currentMessage,
      isMinimized,
      messages,
      voiceEnabled,
      toggleChatbot,
      sendMessage,
      toggleVoiceMode,
      formatJson,
      sendCurrentConfig
    }
  }
}
</script>

<style lang="scss" scoped>
.chatbot-container {
  position: fixed;
  bottom: 0;
  right: 20px;
  width: 380px;
  background-color: var(--component-bg);
  border-radius: 8px 8px 0 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  z-index: 1000;
  max-height: 500px;
  
  &.minimized {
    max-height: 50px;
    box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.1);
  }
}

.chatbot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  
  h3 {
    margin: 0;
    font-size: 16px;
  }
  
  .minimize-button {
    background: transparent;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
  }
}

.chatbot-content {
  display: flex;
  flex-direction: column;
  height: 450px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message {
  max-width: 80%;
  padding: 10px 12px;
  border-radius: 8px;
  
  &.user {
    align-self: flex-end;
    background-color: var(--primary-light);
    
    .message-time {
      text-align: right;
    }
  }
  
  &.bot {
    align-self: flex-start;
    background-color: var(--secondary-light);
  }
  
  .message-content {
    margin: 0;
    
    p {
      margin: 0 0 5px 0;
    }
    
    .json-content {
      background-color: rgba(0, 0, 0, 0.05);
      padding: 8px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      overflow-x: auto;
      white-space: pre-wrap;
      margin: 5px 0;
    }
  }
  
  .message-time {
    font-size: 11px;
    color: var(--text-light);
    margin-top: 5px;
  }
}

.chatbot-controls {
  padding: 10px 15px;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-container {
  display: flex;
  gap: 8px;
  
  textarea {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    resize: none;
    font-family: inherit;
  }
  
  .voice-button {
    background-color: var(--secondary-color);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0 12px;
    cursor: pointer;
    
    &:hover {
      background-color: var(--secondary-dark);
    }
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
  
  button {
    flex: 1;
    padding: 8px 0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }
  
  .send-button {
    background-color: var(--primary-color);
    color: white;
    
    &:hover {
      background-color: var(--primary-dark);
    }
  }
  
  .json-button {
    background-color: var(--accent-color);
    color: white;
    
    &:hover {
      background-color: var(--accent-dark);
    }
  }
}
</style>