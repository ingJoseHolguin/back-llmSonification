<template>
    <div class="chat-container">
      <div class="chat-section" :class="{ 'minimized': isMinimized }">
        <!-- Encabezado del Chatbot -->
        <div class="chat-header">
          <h3>Chatbot</h3>
          <button @click="toggleVisibility">
            {{ isMinimized ? 'Expandir' : 'Minimizar' }}
          </button>
        </div>
  
        <!-- Área de Mensajes -->
        <div v-if="!isMinimized" class="messages" ref="messageContainer">
          <div
            v-for="message in messages"
            :key="message.id"
            :class="['message', { 'message-sender': message.sender === 'Usuario', 'message-emitter': message.sender === 'Bot' }]"
          >
            <strong>{{ message.sender }}:</strong> {{ message.text }}
          </div>
        </div>
  
        <!-- Entrada de Mensajes -->
        <div v-if="!isMinimized" class="input-group">
          <input
            v-model="newMessage"
            type="text"
            placeholder="Escribe tu mensaje..."
            class="chat-input"
            @keyup.enter="sendMessage"
          />
          <button class="send-button" @click="sendMessage">Enviar</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        newMessage: '', // Mensaje actual del usuario
        messages: [], // Historial de mensajes
        isMinimized: false, // Estado de minimización del chatbot
      };
    },
    methods: {
      toggleVisibility() {
        this.isMinimized = !this.isMinimized;
      },
      createMessage(sender, text) {
        return { id: Date.now(), sender, text };
      },
      sendMessage() {
        if (this.newMessage.trim() === '') return;
  
        // Añadir el mensaje del usuario al historial
        const userMessage = this.createMessage('Usuario', this.newMessage);
        this.messages.push(userMessage);
  
        // Simular una respuesta del bot
        const botResponseText = "Respuesta del bot: " + this.newMessage;
        const botMessage = this.createMessage('Bot', botResponseText);
        this.messages.push(botMessage);
  
        // Limpiar el campo de entrada
        this.newMessage = '';
  
        // Desplazar el scroll hacia el último mensaje
        this.scrollToBottom();
      },
      scrollToBottom() {
        const messageContainer = this.$refs.messageContainer;
        if (messageContainer) {
          messageContainer.scrollTop = messageContainer.scrollHeight;
        }
      },
    },
    watch: {
      // Observar cambios en los mensajes y ajustar el scroll automáticamente
      messages() {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      },
    },
  };
  </script>
  
  <style scoped>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100%; /* Altura total del contenedor */
  }
  
  .chat-section {
    display: flex;
    flex-direction: column;
    max-width: calc(100vw / 3); /* Limita el ancho a un tercio de la pantalla */
    width: 100%; /* Ocupa todo el espacio disponible dentro del límite */
    border: 1px solid #ccc;
    border-radius: 5px;
    background-color: #f9f9f9;
    overflow: hidden; /* Evita desbordamientos */
  }
  
  .chat-section.minimized {
    height: 40px; /* Altura mínima cuando está minimizado */
    padding: 10px;
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
    flex: 1; /* Ocupa todo el espacio restante */
    overflow-y: auto; /* Permite desplazamiento vertical */
    padding: 10px;
    border-bottom: 1px solid #ccc;
  }
  
  .message {
    margin-bottom: 10px;
    word-wrap: break-word; /* Divide palabras largas para evitar desbordamiento horizontal */
    max-width: 100%; /* Limita el ancho de los mensajes */
  }
  
  .message-sender {
    color: #007bff; /* Azul para mensajes del usuario */
  }
  
  .message-emitter {
    color: #28a745; /* Verde para mensajes del bot */
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
  </style>