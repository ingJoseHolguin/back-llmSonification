export default {
    state: {
      volume: 0.5,
      pitch: 1,
      speed: 1
    },
    mutations: {
      updateSonificationParameters(state, payload) {
        state.volume = payload.volume;
        state.pitch = payload.pitch;
        state.speed = payload.speed;
      }
    },
    actions: {
      fetchParameters() {
        // Lógica para obtener parámetros desde el backend
      }
    }
  };