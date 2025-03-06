<template>
    <div class="data-visualization">
      <div ref="chart" style="width: 100%; height: 400px;"></div>
    </div>
  </template>
  
  <script>
  import Highcharts from 'highcharts';
  
  export default {
    mounted() {
      this.renderChart();
    },
    methods: {
      renderChart() {
        Highcharts.chart(this.$refs.chart, {
          title: {
            text: 'Gráfico de Datos'
          },
          series: [{
            data: [1, 2, 3, 4, 5]
          }]
        });
      }
    }
  };
  </script>