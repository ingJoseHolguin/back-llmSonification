<template>
    <div class="top-bar">
      <h1>Sonificación de Datos</h1>
      <button @click="importData">Importar</button>
      <button @click="exportData">Exportar</button>
    </div>
  </template>
  
  <script>
  export default {
    methods: {
      importData() {
        // Lógica para importar CSV o Excel
      },
      exportData() {
        // Lógica para exportar audio MP3 o MIDI
      }
    }
  };
  </script>