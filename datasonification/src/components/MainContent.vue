<template>
  <div>
    <canvas ref="chart"></canvas>
    <button @click="sonifyData">Sonificar Datos</button>
  </div>
</template>

<script>
import { Chart } from 'chart.js';
import * as Tone from 'tone';

export default {
  data() {
    return {
      dataVector: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100], // Ejemplo de vector de datos
      chart: null,
    };
  },
  mounted() {
    this.renderChart();
  },
  methods: {
    renderChart() {
      const ctx = this.$refs.chart.getContext('2d');
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.dataVector.map((_, i) => `Punto ${i + 1}`),
          datasets: [{
            label: 'Datos',
            data: this.dataVector,
            borderColor: 'blue',
            fill: false,
          }],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    },
    sonifyData() {
      const synth = new Tone.Synth().toDestination();
      const now = Tone.now();

      this.dataVector.forEach((value, index) => {
        const frequency = this.mapValueToFrequency(value);
        synth.triggerAttackRelease(frequency, '8n', now + index * 0.5);
      });
    },
    mapValueToFrequency(value) {
      // Mapea el valor a una frecuencia en Hz
      const minFreq = 100; // Frecuencia mínima
      const maxFreq = 1000; // Frecuencia máxima
      return minFreq + (value / 100) * (maxFreq - minFreq);
    },
  },
};
</script>

<style scoped>
canvas {
  max-width: 600px;
  margin: 20px auto;
}
button {
  display: block;
  margin: 20px auto;
  padding: 10px 20px;
  font-size: 16px;
}
</style>