/**
 * Utilidad para sonificación básica de datos
 * Esta implementación simple sustituye a AudioCharts para evitar dependencias externas
 */

// Clase base para sonificación
export class AudioSonifier {
    constructor(config = {}) {
      // Configurar contexto de audio
      this.audioContext = null;
      this.gainNode = null;
      this.oscillator = null;
      this.isPlaying = false;
      
      // Configuración predeterminada
      this.config = {
        volume: config.volume || 0.5,
        minFrequency: config.minFrequency || 120,
        maxFrequency: config.maxFrequency || 1200,
        duration: config.duration || 2000, // duración total en ms
        tempo: config.tempo || 1,
        instrument: config.instrument || 'sine' // sine, square, sawtooth, triangle
      };
    }
    
    // Inicializar audio context
    init() {
      if (!this.audioContext) {
        try {
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          this.gainNode = this.audioContext.createGain();
          this.gainNode.connect(this.audioContext.destination);
          this.gainNode.gain.value = this.config.volume;
        } catch (e) {
          console.error('Web Audio API no está soportada en este navegador', e);
          return false;
        }
      }
      return true;
    }
    
    // Actualizar la configuración
    updateConfig(config) {
      this.config = { ...this.config, ...config };
      if (this.gainNode) {
        this.gainNode.gain.value = this.config.volume;
      }
    }
    
    // Mapear un valor a una frecuencia
    mapValueToFrequency(value, min, max) {
      // Normalizar valor entre 0 y 1
      const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
      
      // Mapear a una frecuencia en escala logarítmica para que suene más natural
      return this.config.minFrequency * Math.pow(this.config.maxFrequency / this.config.minFrequency, normalized);
    }
    
    // Reproducir un valor único
    playValue(value, min, max, duration = 500) {
      if (!this.init()) return;
      
      const frequency = this.mapValueToFrequency(value, min, max);
      
      // Crear y configurar oscilador
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = this.config.instrument;
      oscillator.frequency.value = frequency;
      
      // Conectar al nodo de ganancia
      oscillator.connect(this.gainNode);
      
      // Reproducir
      oscillator.start();
      
      // Detener después de la duración especificada
      setTimeout(() => {
        oscillator.stop();
        oscillator.disconnect();
      }, duration);
    }
    
    // Reproducir un array de valores
    playDataArray(data, duration = null) {
      if (!this.init() || this.isPlaying) return;
      
      // Marcar como reproduciendo
      this.isPlaying = true;
      
      // Calcular el mínimo y máximo
      const min = Math.min(...data);
      const max = Math.max(...data);
      
      // Calcular la duración por nota
      const totalDuration = duration || this.config.duration;
      const noteDuration = totalDuration / data.length * this.config.tempo;
      
      // Reproducir cada valor con un retraso
      data.forEach((value, index) => {
        setTimeout(() => {
          this.playValue(value, min, max, noteDuration * 0.9); // 90% de la duración para dejar espacio
          
          // Detectar final de reproducción
          if (index === data.length - 1) {
            setTimeout(() => {
              this.isPlaying = false;
            }, noteDuration);
          }
        }, index * noteDuration);
      });
    }
    
    // Detener toda reproducción
    stop() {
      if (this.oscillator) {
        try {
          this.oscillator.stop();
          this.oscillator.disconnect();
        } catch (e) {
          console.warn('Error al detener el oscilador', e);
        }
      }
      this.isPlaying = false;
    }
    
    // Limpiar recursos
    dispose() {
      this.stop();
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
        this.gainNode = null;
      }
    }
  }
  
  // Exportamos la instancia principal
  export default {
    createSonifier(config) {
      return new AudioSonifier(config);
    }
  };