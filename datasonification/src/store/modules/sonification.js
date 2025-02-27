const defaultSonificationConfig = {
    enabled: false,
    volume: 0.5,
    tempo: 1,
    instrument: 'piano',
    mapMode: 'linear', // 'linear', 'logarithmic', 'chromatic'
    duration: 2000, // duración en ms
    scale: 'major', // 'major', 'minor', 'pentatonic', etc.
    minFrequency: 120,
    maxFrequency: 1200,
    autoPlay: false,
    loop: false,
    playOnHover: false
  }
  
  export default {
    namespaced: true,
    state: {
      config: {...defaultSonificationConfig},
      playing: false,
      currentNote: null,
      audioContext: null,
      gainNode: null
    },
    getters: {
      isEnabled: state => state.config.enabled,
      getConfig: state => state.config,
      isPlaying: state => state.playing,
      getVolume: state => state.config.volume,
      getTempo: state => state.config.tempo,
      getInstrument: state => state.config.instrument,
      getPlaybackOptions: state => ({
        autoPlay: state.config.autoPlay,
        loop: state.config.loop,
        playOnHover: state.config.playOnHover
      })
    },
    mutations: {
      UPDATE_CONFIG(state, config) {
        state.config = {...state.config, ...config}
      },
      SET_PLAYING(state, status) {
        state.playing = status
      },
      SET_CURRENT_NOTE(state, note) {
        state.currentNote = note
      },
      INIT_AUDIO_CONTEXT(state) {
        // Inicializar el contexto de audio solo si es necesario
        if (!state.audioContext) {
          try {
            state.audioContext = new (window.AudioContext || window.webkitAudioContext)()
            state.gainNode = state.audioContext.createGain()
            state.gainNode.connect(state.audioContext.destination)
            state.gainNode.gain.value = state.config.volume
          } catch (e) {
            console.error('Web Audio API no está soportada en este navegador', e)
          }
        }
      },
      RESET_AUDIO_CONTEXT(state) {
        if (state.audioContext) {
          state.audioContext.close()
          state.audioContext = null
          state.gainNode = null
        }
      },
      UPDATE_VOLUME(state, volume) {
        state.config.volume = volume
        if (state.gainNode) {
          state.gainNode.gain.value = volume
        }
      }
    },
    actions: {
      updateConfig({ commit }, config) {
        commit('UPDATE_CONFIG', config)
      },
      toggleSonification({ commit, state }) {
        const newConfig = { enabled: !state.config.enabled }
        commit('UPDATE_CONFIG', newConfig)
        
        if (newConfig.enabled) {
          commit('INIT_AUDIO_CONTEXT')
        } else {
          commit('SET_PLAYING', false)
        }
      },
      initAudio({ commit }) {
        commit('INIT_AUDIO_CONTEXT')
      },
      updateVolume({ commit }, volume) {
        commit('UPDATE_VOLUME', volume)
      },
      startPlayback({ commit, state }) {
        if (!state.config.enabled || !state.audioContext) {
          return
        }
        
        commit('SET_PLAYING', true)
        // Aquí se implementaría la lógica real de sonificación
        // utilizando AudioCharts y los datos proporcionados
      },
      stopPlayback({ commit }) {
        commit('SET_PLAYING', false)
      },
      resetAudio({ commit }) {
        commit('RESET_AUDIO_CONTEXT')
        commit('INIT_AUDIO_CONTEXT')
      }
    }
  }