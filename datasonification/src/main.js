import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
//import { Chart } from "highcharts-vue";
import Highcharts from "highcharts";
import sonificationModule from "highcharts/modules/sonification";

sonificationModule(Highcharts);

const app = createApp(App);

app.use(router);
app.use(store);
//app.component("highchartsVue", Chart);

app.mount('#app');