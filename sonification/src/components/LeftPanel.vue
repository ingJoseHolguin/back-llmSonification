<template>
    <div class="left-panel">
      <h2>Parámetros de Sonificación</h2>
      <div v-for="param in parameters" :key="param.name">
        <label :for="param.name">{{ param.label }}</label>
        <input type="range" v-model="param.value" :min="param.min" :max="param.max" :step="param.step" />
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        parameters: [
          { name: 'volume', label: 'Volumen', value: 0.5, min: 0, max: 1, step: 0.1 },
          { name: 'pitch', label: 'Tono', value: 1, min: 0.5, max: 2, step: 0.1 },
          { name: 'speed', label: 'Velocidad', value: 1, min: 0.5, max: 2, step: 0.1 }
        ]
      };
    }
  };
  </script>