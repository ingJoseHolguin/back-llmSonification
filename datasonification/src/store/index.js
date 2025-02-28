import { createStore } from 'vuex';
import sonification from './modules/sonification';
import dataStore from './modules/dataStore';

export default createStore({
  modules: {
    sonification,
    dataStore
  }
});