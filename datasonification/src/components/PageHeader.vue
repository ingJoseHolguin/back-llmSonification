<template>
  <header class="header">
    <div class="header-content">
      <span class="header-text">Sonificación Estudio</span>
      <button @click="handleFileImport" class="import-button">Importar CSV/Excel</button>
      <input type="file" ref="fileInput" @change="onFileChange" accept=".csv,.txt,.xlsx,.xls" style="display: none;">
    </div>
  </header>
</template>

<script>
import { parse } from 'papaparse'; // Para CSV
import * as XLSX from 'xlsx'; // Para Excel

export default {
  name: 'PageHeaderComponent',
  methods: {
    handleFileImport() {
      this.$refs.fileInput.click();
    },
    onFileChange(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const fileType = file.name.split('.').pop().toLowerCase();
      
      if (fileType === 'csv' || fileType === 'txt') {
        this.processCSV(file);
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        this.processExcel(file);
      } else {
        alert('Formato de archivo no soportado. Por favor, sube un archivo CSV, TXT, XLSX o XLS.');
      }
    },
    processCSV(file) {
      parse(file, {
        complete: (results) => {
          this.handleParsedData(results.data);
        },
        header: true, // Asume que la primera fila contiene los encabezados
        skipEmptyLines: true
      });
    },
    processExcel(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Toma la primera hoja del libro
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convierte la hoja a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        this.handleParsedData(jsonData);
      };
      reader.readAsBinaryString(file);
    },
    handleParsedData(data) {
      if (!data || data.length === 0) {
        alert('El archivo está vacío o no contiene datos válidos.');
        return;
      }
      
      // Obtener todas las columnas disponibles del primer registro
      const columns = Object.keys(data[0]);
      
      if (columns.length === 0) {
        alert('No se encontraron columnas en los datos.');
        return;
      }
      
      // Mostrar un cuadro de diálogo para seleccionar la columna
      this.showColumnSelector(columns, data);
    },
    showColumnSelector(columns, data) {
      // Puedes implementar un diálogo modal aquí o usar un enfoque más simple
      const columnIndex = prompt('Columnas disponibles: ' + columns.join(', ') + '\nIngresa el nombre de la columna que deseas extraer:');
      
      if (!columnIndex || !columns.includes(columnIndex)) {
        alert('Columna no válida o cancelada.');
        return;
      }
      
      // Extraer la columna seleccionada como vector
      const vector = data.map(row => {
        const value = row[columnIndex];
        // Intentar convertir a número si es posible
        return isNaN(Number(value)) ? value : Number(value);
      });
      
      // Aquí emitimos un evento para que MainContent pueda recibir el vector
      this.$emit('data-imported', vector);
      
      console.log('Vector extraído:', vector);
      alert(`Se han extraído ${vector.length} valores de la columna "${columnIndex}".`);
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