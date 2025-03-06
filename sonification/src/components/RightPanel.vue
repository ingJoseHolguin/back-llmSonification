<template>
    <div class="right-panel">
      <h2>Chatbot</h2>
      <div class="chat-window">
        <div v-for="(msg, index) in messages" :key="index">{{ msg }}</div>
      </div>
      <input v-model="userInput" @keyup.enter="sendMessage" placeholder="Escribe tu mensaje..." />
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        userInput: '',
        messages: []
      };
    },
    methods: {
      sendMessage() {
        this.messages.push(this.userInput);
        this.userInput = '';
        // Lógica para enviar mensaje al backend y recibir respuesta
      }
    }
  };
  </script>