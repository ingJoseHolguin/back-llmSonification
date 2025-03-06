export default {
    state: {
      messages: []
    },
    mutations: {
      addMessage(state, message) {
        state.messages.push(message);
      }
    },
    actions: {
      sendMessage() {
        // Lógica para enviar mensaje al backend y recibir respuesta
        // Aquí puedes usar commit y message si es necesario
      }
    }
  };