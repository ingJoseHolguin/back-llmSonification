<template>
  <div class="sidebar-container" :class="{ minimized: isMinimized }">
    <div class="chat-section">
      <div class="chat-header">
        <h3>Expert Assistant Bot</h3>
        <div
          class="server-status"
          :class="{ online: serverOnline, offline: !serverOnline }"
        >
          {{ serverOnline ? "Online" : "Offline" }}
        </div>
        <button
          class="toggle-button"
          @click="toggleVisibility"
          v-if="!isMinimized"
        >
          «
        </button>
      </div>

      <div v-if="!isMinimized" class="messages" ref="messageContainer">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="[
            'message',
            {
              'message-sender': message.sender === 'Usuario',
              'message-emitter': message.sender === 'Bot',
            },
          ]"
        >
          <strong>{{ message.sender }}:</strong> {{ message.text }}
        </div>

        <!-- Improved Loading Animation -->
        <div v-if="isLoading" class="loading-message">
          <div class="bot-avatar">
            <div class="bot-icon">🤖</div>
          </div>
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <div v-if="!isMinimized" class="input-group">
        <input
          v-model="newMessage"
          type="text"
          placeholder="Escribe tu mensaje..."
          class="chat-input"
          @keyup.enter="sendMessage"
          :disabled="isLoading || !serverOnline"
        />
        <button
          class="send-button"
          @click="sendMessage"
          :disabled="isLoading || !serverOnline"
        >
          Enviar
        </button>
      </div>
    </div>

    <button
      class="toggle-button expand-button"
      @click="toggleVisibility"
      v-if="isMinimized"
    >
      »
    </button>

    <!-- Manejador para redimensionar el chat -->
    <div
      class="resize-handle"
      @mousedown="startResize"
      v-if="!isMinimized"
    ></div>
  </div>
</template>

<script>
import { emitter } from "../eventBus";
import axios from "axios";

const URLBackend = "http://100.90.193.113:5000"
// const URLBackend = "http://127.0.0.1:5000:8080"; // Cambia esto según tu entorno

export default {
  name: "LeftSidebar",
  data() {
    return {
      newMessage: '',
      messages: [],
      isMinimized: false,
      isLoading: false,
      currentConfig: null,
      pendingMessage: null,
      sidebarWidth: 250, // Ancho inicial
      isResizing: false,
      serverOnline: false, // Estado del servidor
      serverCheckInterval: null, // Para el intervalo de verificación
      waitingForConfigConfirmation: false, // Para controlar si esperamos confirmación de cambios
      suggestedConfig: null // Para almacenar la configuración sugerida
    };
  },
  created() {
    emitter.on("provide-config", (config) => {
      this.currentConfig = config;
      console.log("Configuración recibida en LeftSidebar:", config);
      this.processPendingMessage();
    });
  },
  async mounted() {
    // Verificar estado del servidor al iniciar
    await this.checkServerStatus();

    // Si el servidor está online, cargar documentos
    if (this.serverOnline) {
      await this.loadDocuments();
    }

    // Configurar verificación periódica del estado del servidor
    this.serverCheckInterval = setInterval(this.checkServerStatus, 60000); // Verificar cada minuto

    // Agregar eventos para manejar el redimensionamiento
    document.addEventListener("mousemove", this.handleResize);
    document.addEventListener("mouseup", this.stopResize);
  },
  beforeUnmount() {
    emitter.off("provide-config");

    // Limpiar el intervalo de verificación
    if (this.serverCheckInterval) {
      clearInterval(this.serverCheckInterval);
    }

    // Eliminar eventos al desmontar
    document.removeEventListener("mousemove", this.handleResize);
    document.removeEventListener("mouseup", this.stopResize);
  },
  methods: {
    async checkServerStatus() {
      try {
        const testResponse = await axios.get(URLBackend+"/llm/", {
          timeout: 10000,
        });
        console.log("Estado del servidor LLM:", testResponse.data);

        // Verificar si el servidor estaba offline antes
        const wasOffline = !this.serverOnline;

        // Actualizar estado según la respuesta
        if (testResponse.data.message === "llM en linea") {
          this.serverOnline = true;

          // Si el servidor estaba offline y ahora está online, o si es la primera verificación (mounted)
          if (wasOffline || this.messages.length === 0) {
            this.messages.push(
              this.createMessage("Bot", "Hola, ¿En qué puedo ayudarte hoy?")
            );
            this.scrollToBottom();
          }
        } else {
          this.serverOnline = false;
        }
      } catch (error) {
        console.error("Error al verificar el estado del servidor:", error);
        this.serverOnline = false;
      }
    },

    async loadDocuments() {
      try {
        const response = await axios.get(
          URLBackend+"/llm/loadDocuments",
          { timeout: 15000 }
        );
        console.log("Documentos cargados:", response.data);

        // Agregar mensaje informativo si la carga fue exitosa
        if (response.status === 200) {
          this.messages.push(
            this.createMessage("Bot", "Documentos cargados correctamente.")
          );
        }
      } catch (error) {
        console.error("Error al cargar documentos:", error);
        this.messages.push(
          this.createMessage(
            "Bot",
            "Error al cargar documentos. Por favor, verifica la conexión con el servidor."
          )
        );
      }
    },

    toggleVisibility() {
      this.isMinimized = !this.isMinimized;
    },
    createMessage(sender, text) {
      return { id: Date.now(), sender, text };
    },

    async sendMessage() {
      if (this.newMessage.trim() === "" || !this.serverOnline) return;

      const messageText = this.newMessage.trim();

      // Verificar si estamos esperando confirmación de cambios de configuración
      if (this.waitingForConfigConfirmation) {
        // Agregar el mensaje del usuario
        const userMessage = this.createMessage("Usuario", messageText);
        this.messages.push(userMessage);
        this.newMessage = "";
        this.scrollToBottom();

        // Procesar la respuesta de confirmación
        if (
          messageText.toLowerCase() === "si" ||
          messageText.toLowerCase() === "sí" ||
          messageText.toLowerCase() === "Si" ||
          messageText.toLowerCase() === "Sí" ||
          messageText.toLowerCase() === "" 
        ) {
          // Aplicar la configuración sugerida
          this.messages.push(
            this.createMessage("Bot", "Cambios de configuración aplicados.")
          );

          // Informar al componente principal que hay una nueva configuración
          emitter.emit("update-config", this.suggestedConfig);

          // Actualizar nuestra copia local
          this.currentConfig = this.suggestedConfig;
        } else if (messageText.toLowerCase() === "no") {
          // No aplicar cambios
          this.messages.push(
            this.createMessage(
              "Bot",
              "No se han aplicado cambios de configuración."
            )
          );
        } else {
          // Respuesta no reconocida
          this.messages.push(
            this.createMessage(
              "Bot",
              'No entendí su respuesta. Por favor, responda "si" o "no".'
            )
          );
          // Seguir esperando confirmación
          return;
        }

        // Resetear estado de espera y sugerencia
        this.waitingForConfigConfirmation = false;
        this.suggestedConfig = null;
        this.scrollToBottom();
        return;
      }

      // Comportamiento normal para mensajes que no son confirmaciones
      const userMessage = this.createMessage("Usuario", messageText);
      this.messages.push(userMessage);
      this.newMessage = "";
      this.scrollToBottom();

      // Activar animación de carga justo antes de iniciar la comunicación
      this.isLoading = true;
      this.scrollToBottom(); // Asegurar que la animación sea visible
      this.pendingMessage = messageText;

      // Solicitar la configuración para procesar el mensaje
      emitter.emit("request-config");
    },

    async processPendingMessage() {
      if (!this.currentConfig) return;

      const messageText = this.pendingMessage || "";
      this.pendingMessage = null;

      try {
        // Verificar la conexión con el servidor antes de enviar el mensaje
        await this.checkServerStatus();

        if (!this.serverOnline) {
          throw new Error("El servidor LLM no está disponible");
        }

        // Verificar que messageText no sea nulo o indefinido
        if (!messageText) {
          console.error("No hay mensaje para enviar");
          return;
        }

        // IMPORTANTE: Asegurarse de que isLoading sigue siendo true
        this.isLoading = true;

        console.log("Enviando mensaje al servidor...");
        // Enviar mensaje y configuración actual al backend
        const response = await axios.post(URLBackend+"/llm/chat", {
          message: messageText,
          config: this.currentConfig,
        });

        console.log("Respuesta recibida:", response.data);

        // Revisar si botResponse es un string que contiene JSON
        let botResponseText = response.data.botResponse;
        let suggestedConfig = null;
        try {
          // Intentar parsear por si es un string JSON
          const parsedResponse = JSON.parse(botResponseText);
          if (
            parsedResponse &&
            typeof parsedResponse.botResponse === "string"
          ) {
            botResponseText = parsedResponse.botResponse;
            suggestedConfig = parsedResponse.suggestedConfig || null;
          }
        } catch (e) {
          // Si falla el parsing, usar el string original
          console.log("botResponse no es JSON o no se pudo parsear:", e);
        }

        // Añadir el mensaje de respuesta del bot
        this.messages.push(this.createMessage("Bot", botResponseText));

        // Si hay una configuración sugerida y es diferente de la actual, preguntar al usuario
        if (
          suggestedConfig &&
          !this.isConfigEqual(this.currentConfig, suggestedConfig)
        ) {
          console.log("Configuración sugerida recibida:", suggestedConfig);

          // Almacenar la configuración sugerida para usarla después
          this.suggestedConfig = suggestedConfig;

          // Añadir mensaje preguntando si desea aplicar los cambios
          this.messages.push(
            this.createMessage(
              "Bot",
              '¿Desea aplicar los cambios de configuración sugeridos? Responda "si" o "no".'
            )
          );

          // Marcar que estamos esperando confirmación
          this.waitingForConfigConfirmation = true;
        }

        // Esperar a que Vue actualice el DOM con el nuevo mensaj
        await this.$nextTick();
        this.isLoading = false;

        // Hacer scroll para mostrar el nuevo mensaje
        this.scrollToBottom();
      } catch (error) {
        console.error("Error al comunicarse con el backend:", error);

        // Mensaje de error más detallado para ayudar en la depuración
        let errorMessage = "Error al procesar tu solicitud.";

        if (error.response) {
          // Error de respuesta del servidor
          errorMessage += ` El servidor respondió con código ${error.response.status}.`;

          // Si el servidor responde con código 400, actualizar el estado a offline
          if (error.response.status === 400) {
            this.serverOnline = false;
            errorMessage += " El servidor está offline.";
          }
        } else if (error.request) {
          // No se recibió respuesta
          errorMessage += " No se recibió respuesta del servidor.";
          this.serverOnline = false;
        } else {
          // Error al configurar la solicitud
          errorMessage += ` Error: ${error.message}`;
        }

        this.messages.push(this.createMessage("Bot", errorMessage));
        await this.$nextTick(); // Esperar a que Vue actualice el DOM con el mensaje de error
        this.scrollToBottom();

        // Desactivar la animación de carga
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
      if (!config1 || !config2) return false;
      return JSON.stringify(config1) === JSON.stringify(config2);
    },

    // Métodos para manejar el redimensionamiento
    startResize(e) {
      this.isResizing = true;
      e.preventDefault();
    },

    handleResize(e) {
      if (!this.isResizing) return;

      // Calcular el nuevo ancho basado en la posición del cursor
      const newWidth = e.clientX;

      // Establecer límites mínimo y máximo
      if (newWidth >= 200 && newWidth <= window.innerWidth / 2) {
        this.sidebarWidth = newWidth;
        document.documentElement.style.setProperty(
          "--sidebar-width",
          `${newWidth}px`
        );
      }
    },

    stopResize() {
      this.isResizing = false;
    },
  },
};
</script>

<style>
/* Variable CSS para el ancho del sidebar */
:root {
  --sidebar-width: 250px;
  --sidebar-min-width: 40px;
  --header-height: 50px;
}
</style>

<style scoped>
.sidebar-container {
  position: relative;
  width: var(--sidebar-width);
  height: 100%;
  transition: width 0.3s ease;
  background-color: #f5f5f5;
  border-right: 1px solid #ddd;
  z-index: 100;
}

.sidebar-container.minimized {
  width: var(--sidebar-min-width);
  overflow: visible; /* Cambiado a visible para que el botón sea accesible */
}

.chat-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #f9f9f9;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #2c3e50ec;
  color: white;
  height: var(--header-height);
  position: relative;
  z-index: 15;
}

.chat-header h3 {
  margin: 0;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Nuevo estilo para el indicador de estado del servidor */
.server-status {
  font-size: 12px;
  padding: 3px 6px;
  border-radius: 4px;
  margin-left: 10px;
  font-weight: bold;
}

.server-status.online {
  background-color: #28a745;
  color: white;
}

.server-status.offline {
  background-color: #dc3545;
  color: white;
}

.toggle-button {
  background-color: #3070d0; /* Color distintivo */
  border: none;
  color: white;
  cursor: pointer;
  padding: 5px 8px;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.2s ease;
}

.toggle-button:hover {
  background-color: #0056b3;
}

/* Modificamos el estilo cuando está minimizado */
.sidebar-container.minimized .toggle-button {
  position: absolute;
  right: -30px; /* Ajustar para que salga del contenedor minimizado */
  top: 10px;
  z-index: 20;
}

.sidebar-container.minimized .chat-header {
  visibility: hidden;
  height: 0;
  padding: 0;
}
.sidebar-container.minimized .chat-header h3 {
  display: none; /* Ocultamos el título cuando está minimizado */
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background-color: white;
  display: flex;
  flex-direction: column;
}

.message {
  margin-bottom: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  max-width: 85%;
  word-wrap: break-word;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

/* Estilos para la animación de carga mejorada */
.loading-message {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  padding: 10px 14px;
  max-width: 85%;
  align-self: flex-start;
  background-color: #f0f9eb;
  border-left: 3px solid #28a745;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.bot-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #28a745;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.bot-icon {
  font-size: 16px;
  color: white;
}

.typing-indicator {
  display: flex;
  align-items: center;
}

.typing-indicator span {
  height: 8px;
  width: 8px;
  margin: 0 2px;
  background-color: #28a745;
  border-radius: 50%;
  display: inline-block;
  opacity: 0.4;
}

.typing-indicator span:nth-child(1) {
  animation: pulse 1s infinite 0s;
}

.typing-indicator span:nth-child(2) {
  animation: pulse 1s infinite 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation: pulse 1s infinite 0.4s;
}

@keyframes pulse {
  0% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    opacity: 0.4;
    transform: scale(1);
  }
}

.input-group {
  display: flex;
  padding: 12px;
  background-color: #fff;
  border-top: 1px solid #eaeaea;
}

.chat-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.chat-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.chat-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.send-button {
  margin-left: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.send-button:hover {
  background-color: #0056b3;
}

.send-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* Eliminamos el antiguo estilo del loading indicator ya que ahora usamos uno nuevo */
/* .loading-indicator {
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
} */

/* Manejador de redimensionamiento */
.resize-handle {
  position: absolute;
  top: 0;
  right: -5px;
  width: 10px;
  height: 100%;
  cursor: ew-resize;
  z-index: 10;
}

.resize-handle:hover {
  background-color: rgba(0, 123, 255, 0.1);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Estilos responsivos */
@media (max-width: 768px) {
  .sidebar-container {
    width: 100%;
    max-width: none;
  }

  .message {
    max-width: 90%;
  }

  .sidebar-container.minimized {
    width: 10px; /* Reducir el ancho a una pequeña solapa visible */
    overflow: visible; /* Importante para que el botón sea visible fuera del contenedor */
    background-color: #2c3e50; /* Color oscuro para la solapa, igual que el header */
  }

  .sidebar-container.minimized .chat-section {
    visibility: hidden; /* Oculta el contenido pero mantiene el espacio */
    width: 0;
  }

  .sidebar-container.minimized .toggle-button {
    position: absolute;
    right: -30px;
    top: 10px;
    visibility: visible; /* Asegura que el botón sea visible */
    z-index: 1000; /* Asegura que esté por encima de todo */
    background-color: #2c3e50; /* Color que coincide con el tema */
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0 4px 4px 0; /* Redondea solo los bordes derechos */
    border: 1px solid #3070d0; /* Borde para mejor visibilidad */
    border-left: none; /* Sin borde a la izquierda para que se conecte con la solapa */
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2); /* Sombra para destacarlo */
  }
}
</style>
