import { createApp } from 'vue';  // Usamos 'createApp' en lugar de 'Vue'
import App from './App.vue';


// Crear la instancia de la aplicación Vue
const app = createApp(App);
app.config.devtools = true

// Usar HighchartsVue en la aplicación


// Montar la aplicación
app.mount('#app');