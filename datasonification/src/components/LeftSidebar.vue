<template>
  <div class="sidebar-container">
    <div class="chat-section" :class="{ 'minimized': isMinimized }">
      <div class="chat-header">
        <h3>Chatbot</h3>
        <button @click="toggleVisibility">
          {{ isMinimized ? 'Expandir' : 'Minimizar' }}
        </button>
      </div>

      <div v-if="!isMinimized" class="messages" ref="messageContainer">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="['message', { 'message-sender': message.sender === 'Usuario', 'message-emitter': message.sender === 'Bot' }]"
        >
          <strong>{{ message.sender }}:</strong> {{ message.text }}
        </div>
        <div v-if="isLoading" class="loading-indicator">
          <span>Cargando...</span>
        </div>
      </div>

      <div v-if="!isMinimized" class="input-group">
        <input
          v-model="newMessage"
          type="text"
          placeholder="Escribe tu mensaje..."
          class="chat-input"
          @keyup.enter="sendMessage"
          :disabled="isLoading"
        />
        <button class="send-button" @click="sendMessage" :disabled="isLoading">
          Enviar
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { emitter } from '../eventBus'; // Importar el emisor de eventos

export default {
  name: 'LeftSidebar',
  data() {
    return {
      newMessage: '',
      messages: [],
      isMinimized: false,
      isLoading: false,
      currentConfig: null
    };
  },
  created() {
    // Escuchar el evento que proporciona la configuración
    emitter.on('provide-config', (config) => {
      this.currentConfig = config;
      console.log('Configuración recibida en LeftSidebar:', config);
      this.processPendingMessage();
    });
  },
  beforeUnmount() {
    // Limpiar el listener al desmontar
    emitter.off('provide-config');
  },
  methods: {
    toggleVisibility() {
      this.isMinimized = !this.isMinimized;
    },
    createMessage(sender, text) {
      return { id: Date.now(), sender, text };
    },
    async sendMessage() {
      if (this.newMessage.trim() === '' || this.isLoading) return;

      // Guardar el mensaje del usuario y limpiar el input
      const userMessage = this.createMessage('Usuario', this.newMessage);
      this.messages.push(userMessage);
      const messageText = this.newMessage;
      this.newMessage = '';
      this.scrollToBottom();

      // Activar indicador de carga
      this.isLoading = true;
      
      // Solicitar la configuración actual al componente principal
      emitter.emit('request-config');
      
      // Esta función será llamada cuando se reciba la configuración
      this.pendingMessage = messageText;
    },
    
    async processPendingMessage() {
  if (!this.currentConfig) return;
  
  const messageText = this.pendingMessage || "";
  this.pendingMessage = null;
  
  try {
    // Primero verificar la conexión con el servidor
    try {
      const testResponse = await axios.get('http://127.0.0.1:5000/llm/', { timeout: 10000 });
      console.log('Estado del servidor LLM:', testResponse.data);
      
      if (testResponse.data.message !== 'llM en linea') {
        throw new Error('El servidor LLM no está disponible');
      }
    } catch (connectionError) {
      console.error('Error al conectar con el servidor:', connectionError);
      this.messages.push(this.createMessage('Bot', 'No se pudo establecer conexión con el servidor. Por favor, verifica que el backend esté en ejecución.'));
      this.isLoading = false;
      return;
    }
    
    // Verificar que messageText no sea nulo o indefinido
    if (!messageText) {
      console.error('No hay mensaje para enviar');
      this.isLoading = false;
      return;
    }
    
    // Enviar mensaje y configuración actual al backend
    const response = await axios.post('http://127.0.0.1:5000/llm/chat', {
      message: messageText,
      config: this.currentConfig
    });

    console.log('Respuesta recibida:', response.data);

    // Revisar si botResponse es un string que contiene JSON
    let botResponseText = response.data.botResponse;
    let suggestedConfig = null;
    try {
      // Intentar parsear por si es un string JSON
      const parsedResponse = JSON.parse(botResponseText);
      if (parsedResponse && typeof parsedResponse.botResponse === 'string') {
        botResponseText = parsedResponse.botResponse;
        suggestedConfig = parsedResponse.suggestedConfig || null;
      }
    } catch (e) {
      // Si falla el parsing, usar el string original
      console.log('botResponse no es JSON o no se pudo parsear:', e);
    }



    
    
    // Mostrar la respuesta del bot
    this.messages.push(this.createMessage('Bot', botResponseText));
    
    // Si hay una configuración sugerida y es diferente de la actual, aplicarla
    if (suggestedConfig) {
      console.log('Configuración sugerida recibida:', suggestedConfig);
      
      if (!this.isConfigEqual(this.currentConfig, suggestedConfig)) {
        // Informar al componente principal que hay una nueva configuración
        emitter.emit('update-config', suggestedConfig);
        
        // También actualizar nuestra copia local
        this.currentConfig = suggestedConfig;1
        
        // Notificar al usuario que la configuración ha sido actualizada
        //this.messages.push(this.createMessage('Bot', 'He actualizado la configuración del gráfico según tu solicitud.'));
      }
    }
  } catch (error) {
    console.error('Error al comunicarse con el backend:', error);
    
    // Mensaje de error más detallado para ayudar en la depuración
    let errorMessage = 'Error al procesar tu solicitud.';
    
    if (error.response) {
      // Error de respuesta del servidor
      errorMessage += ` El servidor respondió con código ${error.response.status}.`;
    } else if (error.request) {
      // No se recibió respuesta
      errorMessage += ' No se recibió respuesta del servidor.';
    } else {
      // Error al configurar la solicitud
      errorMessage += ` Error: ${error.message}`;
    }
    
    this.messages.push(this.createMessage('Bot', errorMessage));
  } finally {
    // Desactivar indicador de carga
    this.isLoading = false;
    this.scrollToBottom();
  }
},
    
    scrollToBottom() {
      this.$nextTick(() => {
        const messageContainer = this.$refs.messageContainer;
        if (messageContainer) {
          messageContainer.scrollTop = messageContainer.scrollHeight;
        }
      });
    },
    
    isConfigEqual(config1, config2) {
      if (!config1 || !config2) return false;
      return JSON.stringify(config1) === JSON.stringify(config2);
    }
  }
};
</script>

<style scoped>
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-section {
  display: flex;
  flex-direction: column;
  max-width: calc(100vw / 3);
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
  overflow: hidden;
}

.chat-section.minimized {
  height: 40px;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #2c3e50;
  color: white;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  border-bottom: 1px solid #ccc;
  max-height: 400px; /* Altura máxima para evitar que ocupe toda la pantalla */
}

.message {
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  word-wrap: break-word;
  max-width: 100%;
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.message-sender {
  background-color: #e6f7ff;
  border-left: 3px solid #007bff;
  align-self: flex-end;
}

.message-emitter {
  background-color: #f0f9eb;
  border-left: 3px solid #28a745;
  align-self: flex-start;
}

.input-group {
  display: flex;
  padding: 10px;
  background-color: #fff;
  border-top: 1px solid #ccc;
}

.chat-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 14px;
}

.send-button {
  margin-left: 10px;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.send-button:hover {
  background-color: #0056b3;
}

.send-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.loading-indicator {
  text-align: center;
  color: #666;
  padding: 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-indicator::before {
  content: '';
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #666;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>