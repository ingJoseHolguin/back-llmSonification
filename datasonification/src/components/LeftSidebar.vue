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
    };
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

      const userMessage = this.createMessage('Usuario', this.newMessage);
      this.messages.push(userMessage);
      const messageText = this.newMessage;
      this.newMessage = '';
      this.scrollToBottom();

      this.isLoading = true;
      this.$emit('request-config'); // Solicitar configuración

      // Usar una promesa para esperar la configuración
      const currentConfig = await new Promise(resolve => {
        emitter.on('provide-config', config => {
          resolve(config);
          emitter.off('provide-config'); // Limpiar el listener después de usarlo
        });
      });

      try {
        const response = await axios.post('http://your-backend-url/api/chat', {
          message: messageText,
          config: currentConfig,
        });

        const { botResponse, suggestedConfig } = response.data;
        const botMessage = this.createMessage('Bot', botResponse);
        this.messages.push(botMessage);
        this.scrollToBottom();

        if (suggestedConfig && !this.isConfigEqual(currentConfig, suggestedConfig)) {
          this.$emit('update-config', suggestedConfig);
        }
      } catch (error) {
        console.error('Error al comunicarse con el backend:', error);
        const errorMessage = this.createMessage('Bot', 'Error al procesar tu solicitud.');
        this.messages.push(errorMessage);
        this.scrollToBottom();
      } finally {
        this.isLoading = false;
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
      return JSON.stringify(config1) === JSON.stringify(config2);
    },
  },
  watch: {
    messages() {
      this.scrollToBottom();
    },
  },
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
}

.message {
  margin-bottom: 10px;
  word-wrap: break-word;
  max-width: 100%;
}

.message-sender {
  color: #007bff;
}

.message-emitter {
  color: #28a745;
}

.input-group {
  display: flex;
  padding: 10px;
  background-color: #fff;
  border-top: 1px solid #ccc;
}

.chat-input {
  flex: 1;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.send-button {
  margin-left: 10px;
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
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
  padding: 10px;
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
  margin-right: 5px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>