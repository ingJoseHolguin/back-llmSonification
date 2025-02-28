<template>
  <header class="header">
    <div class="header-content">
      <span class="header-text">Sonificación Estudio</span>
      <button @click="handleFileImport" class="import-button">Importar CSV/TXT</button>
      <input type="file" ref="fileInput" @change="onFileChange" accept=".csv,.txt" style="display: none;">
    </div>
  </header>
</template>
  
<script>
export default {
  name: 'PageHeaderComponent',
  methods: {
    handleFileImport() {
      this.$refs.fileInput.click();
    },
    onFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        // Aquí puedes manejar el archivo cargado, por ejemplo, leer su contenido
        console.log('Archivo seleccionado:', file);
        // Puedes usar FileReader para leer el contenido del archivo si es necesario
      }
    }
  }
}
</script>

<style scoped>


@import '../styles/global.css';

.header {
  background-color: #2c3e50; /* Color de fondo */
  padding: 10px 20px; /* Espaciado interno */
  display: flex; /* Usamos Flexbox */
  justify-content: space-between; /* Distribuye el espacio entre el texto y el botón */
  align-items: center; /* Alinea verticalmente los elementos */
}

.header-content {
  display: flex;
  justify-content: space-between; /* Separa el contenido a ambos extremos */
  align-items: center;
  width: 100%; /* Ocupa todo el ancho disponible */
}

.header-text {
  font-size: 18px;
  font-weight: bold;
  color: white; /* Color del texto */
}

.import-button {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  background-color: #007bff; /* Color de fondo del botón */
  color: white; /* Color del texto del botón */
  cursor: pointer;
  transition: background-color 0.3s ease; /* Efecto hover suave */
}

.import-button:hover {
  background-color: #0056b3; /* Cambia el color al pasar el mouse */
}
</style>

