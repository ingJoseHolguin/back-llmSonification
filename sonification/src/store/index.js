import { createStore } from 'vuex'; // Importar createStore desde Vuex
import sonification from './sonification';
import chat from './chat';

export default createStore({
  modules: {
    sonification,
    chat
  }
});