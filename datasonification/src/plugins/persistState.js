export default function persistState(keys) {
    return (store) => {
      // Suscribirse a las mutaciones de Vuex
      store.subscribe((mutation, state) => {
        keys.forEach((key) => {
          // Verificar si el estado contiene la clave y guardarla en localStorage
          if (state[key]) {
            localStorage.setItem(key, JSON.stringify(state[key]))
          }
        })
      })
  
      // Cargar los datos de localStorage cuando la aplicación se inicie
      keys.forEach((key) => {
        const savedState = localStorage.getItem(key)
        if (savedState) {
          try {
            // Reemplazar el estado del store con los datos guardados
            store.replaceState({
              ...store.state,
              [key]: JSON.parse(savedState)
            })
          } catch (error) {
            console.error(`Error al cargar el estado de ${key} desde localStorage`, error)
          }
        }
      })
    }
  }