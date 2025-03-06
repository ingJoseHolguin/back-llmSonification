<template>
    <div class="bottom-banner">
      <button @click="play">Play</button>
      <button @click="stop">Stop</button>
      <input type="range" v-model="volume" min="0" max="1" step="0.1" />
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        volume: 0.5
      };
    },
    methods: {
      play() {
        // Lógica para reproducir sonido
      },
      stop() {
        // Lógica para detener sonido
      }
    }
  };
  </script>
  