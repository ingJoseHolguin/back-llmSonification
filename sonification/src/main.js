import { createApp } from 'vue';
import App from './App.vue';
import store from './store'; // Importar la store

const app = createApp(App);

app.use(store); // Registrar la store en la aplicación

app.mount('#app');