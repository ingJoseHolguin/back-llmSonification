export default {
    state: {
      volume: 0.5,
      pitch: 1,
      pan: 0,
      tremolo: 0,
      highpass: 0,
      lowpass: 0
    },
    mutations: {
      updateConfig(state, config) {
        state.volume = config.volume
        state.pitch = config.pitch
        state.pan = config.pan
        state.tremolo = config.tremolo
        state.highpass = config.highpass
        state.lowpass = config.lowpass
      }
    },
    actions: {
      setSonificationConfig({ commit }, config) {
        commit('updateConfig', config)
      }
    }
  }