<template>
  <div class="data-import-container">
    <h3>Importación de Datos</h3>
    
    <div class="import-section">
      <div class="upload-area" 
           @dragover.prevent="onDragOver" 
           @dragleave.prevent="onDragLeave" 
           @drop.prevent="onFileDrop"
           :class="{ 'drag-active': isDragging }">
        <div class="upload-icon">
          <i class="fa fa-upload"></i>
        </div>
        <p>Arrastra y suelta tus archivos CSV o Excel aquí</p>
        <p class="file-types">Formatos soportados: .csv, .xlsx, .xls</p>
        <span>o</span>
        <input
          type="file"
          ref="fileInput"
          @change="onFileChange"
          accept=".csv, .xlsx, .xls"
          class="file-input"
          id="file-input"
        />
        <label for="file-input" class="file-btn">Seleccionar Archivo</label>
      </div>
    </div>

    <div v-if="isProcessing" class="processing-indicator">
      <div class="spinner"></div>
      <p>Procesando archivo...</p>
    </div>

    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
    </div>

    <div v-if="importedData.length > 0" class="preview-section">
      <h4>Vista Previa de Datos</h4>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th v-for="(header, index) in headers" :key="index">{{ header }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in previewData" :key="rowIndex">
              <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mapping-section">
        <h4>Configurar Datos</h4>
        <div class="mapping-controls">
          <div class="select-group">
            <label>Eje X:</label>
            <select v-model="xAxisColumn" @change="updateMapping">
              <option v-for="(header, index) in headers" :key="index" :value="index">
                {{ header }}
              </option>
            </select>
          </div>
          
          <div class="select-group">
            <label>Series:</label>
            <div v-for="(series, index) in seriesMapping" :key="index" class="series-mapping">
              <div class="series-row">
                <input 
                  v-model="series.name" 
                  placeholder="Nombre de serie" 
                  @input="updateMapping"
                />
                <select v-model="series.column" @change="updateMapping">
                  <option v-for="(header, hIndex) in headers" :key="hIndex" :value="hIndex">
                    {{ header }}
                  </option>
                </select>
                <button class="remove-btn" @click="removeSeries(index)" v-if="seriesMapping.length > 1">
                  <i class="fa fa-times"></i>
                </button>
              </div>
            </div>
            <button class="add-series-btn" @click="addSeries">
              <i class="fa fa-plus"></i> Añadir Serie
            </button>
          </div>
        </div>

        <div class="action-buttons">
          <button class="cancel-btn" @click="resetImport">Cancelar</button>
          <button 
            class="apply-btn" 
            @click="applyData" 
            :disabled="!canApplyData"
          >
            Aplicar Datos al Gráfico
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export default {
  name: 'DataImport',
  data() {
    return {
      isProcessing: false,
      isDragging: false,
      importedData: [],
      headers: [],
      error: null,
      xAxisColumn: 0,
      seriesMapping: [
        { name: 'Serie 1', column: 1 }
      ],
      fileName: ''
    };
  },
  computed: {
    previewData() {
      // Mostrar solo las primeras 5 filas para la vista previa
      return this.importedData.slice(0, 5);
    },
    canApplyData() {
      return this.importedData.length > 0 && 
             this.seriesMapping.some(series => series.name && series.column !== null);
    }
  },
  methods: {
    ...mapActions({
      updateChartData: 'dataStore/updateChartData'
    }),
    
    onDragOver() {
      this.isDragging = true;
    },
    
    onDragLeave() {
      this.isDragging = false;
    },
    
    onFileDrop(e) {
      this.isDragging = false;
      const files = e.dataTransfer.files;
      if (files.length) {
        this.processFile(files[0]);
      }
    },
    
    onFileChange(e) {
      const files = e.target.files;
      if (files.length) {
        this.processFile(files[0]);
      }
    },
    
    processFile(file) {
      this.error = null;
      this.isProcessing = true;
      this.fileName = file.name;
      
      const fileType = file.name.split('.').pop().toLowerCase();
      
      if (['csv'].includes(fileType)) {
        this.parseCSV(file);
      } else if (['xlsx', 'xls'].includes(fileType)) {
        this.parseExcel(file);
      } else {
        this.error = 'Formato de archivo no soportado. Por favor, sube un archivo CSV o Excel.';
        this.isProcessing = false;
      }
    },
    
    parseCSV(file) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            this.processImportedData(results.data, results.meta.fields);
          } else {
            this.error = 'No se encontraron datos válidos en el archivo CSV.';
          }
          this.isProcessing = false;
        },
        error: (error) => {
          this.error = `Error al procesar el archivo CSV: ${error.message}`;
          this.isProcessing = false;
        }
      });
    },
    
    parseExcel(file) {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Tomar la primera hoja del archivo Excel
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convertir a JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData && jsonData.length > 1) {
            // Primera fila como encabezados, el resto como datos
            const headers = jsonData[0];
            const rows = jsonData.slice(1);
            
            // Convertir los datos al formato requerido
            const formattedData = rows.map(row => {
              const rowData = {};
              headers.forEach((header, index) => {
                rowData[header] = row[index];
              });
              return rowData;
            });
            
            this.processImportedData(formattedData, headers);
          } else {
            this.error = 'No se encontraron datos válidos en el archivo Excel.';
          }
        } catch (error) {
          this.error = `Error al procesar el archivo Excel: ${error.message}`;
        }
        
        this.isProcessing = false;
      };
      
      reader.onerror = () => {
        this.error = 'Error al leer el archivo.';
        this.isProcessing = false;
      };
      
      reader.readAsArrayBuffer(file);
    },
    
    processImportedData(data, headers) {
      this.importedData = data;
      this.headers = headers;
      
      // Configurar mapeo inicial
      this.xAxisColumn = 0;
      this.seriesMapping = [
        { name: 'Serie 1', column: headers.length > 1 ? 1 : 0 }
      ];
    },
    
    resetImport() {
      this.importedData = [];
      this.headers = [];
      this.error = null;
      this.xAxisColumn = 0;
      this.seriesMapping = [{ name: 'Serie 1', column: 1 }];
      this.fileName = '';
      this.$refs.fileInput.value = '';
    },
    
    addSeries() {
      const nextIndex = this.seriesMapping.length + 1;
      const nextColumn = this.headers.length > nextIndex ? nextIndex : 1;
      
      this.seriesMapping.push({
        name: `Serie ${nextIndex}`,
        column: nextColumn
      });
    },
    
    removeSeries(index) {
      this.seriesMapping.splice(index, 1);
      this.updateMapping();
    },
    
    updateMapping() {
      // Este método puede usarse para mantener una vista previa actualizada
      // o validar el mapeo actual
    },
    
    applyData() {
      if (!this.canApplyData) return;
      
      const xAxisHeader = this.headers[this.xAxisColumn];
      
      // Extraer valores del eje X
      const xAxis = {
        title: xAxisHeader,
        categories: this.importedData.map(row => row[xAxisHeader])
      };
      
      // Preparar series basadas en el mapeo
      const series = this.seriesMapping
        .filter(mapping => mapping.name && mapping.column !== null)
        .map(mapping => {
          const header = this.headers[mapping.column];
          return {
            name: mapping.name,
            data: this.importedData.map(row => 
              // Asegurar que los valores numéricos sean números y no strings
              typeof row[header] === 'string' 
                ? parseFloat(row[header]) || 0 
                : row[header] || 0
            )
          };
        });
      
      // Enviar datos al store
      this.updateChartData({
        xAxis,
        series,
        source: {
          type: this.fileName.split('.').pop().toLowerCase(),
          name: this.fileName
        }
      });
      
      // Emitir evento para informar a componentes padre
      this.$emit('data-applied', { xAxis, series });
    }
  }
};
</script>

<style scoped>
.data-import-container {
  background-color: var(--background-color-secondary);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h3 {
  color: var(--text-color-primary);
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.4rem;
}

h4 {
  color: var(--text-color-primary);
  margin: 16px 0;
  font-size: 1.2rem;
}

.import-section {
  margin-bottom: 20px;
}

.upload-area {
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 30px 20px;
  text-align: center;
  transition: all 0.3s ease;
  background-color: var(--background-color-tertiary);
}

.upload-area.drag-active {
  border-color: var(--primary-color);
  background-color: var(--background-color-hover);
}

.upload-icon {
  margin-bottom: 15px;
  font-size: 2rem;
  color: var(--text-color-secondary);
}

.file-types {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  margin: 10px 0;
}

.file-input {
  display: none;
}

.file-btn {
  display: inline-block;
  background-color: var(--primary-color);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  margin-top: 15px;
  transition: background-color 0.2s;
}

.file-btn:hover {
  background-color: var(--primary-color-hover);
}

.processing-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;
}

.spinner {
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background-color: var(--error-color-bg);
  color: var(--error-color);
  padding: 12px;
  border-radius: 4px;
  margin: 15px 0;
}

.preview-section {
  margin-top: 25px;
}

.table-container {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 20px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-color-light);
}

th {
  background-color: var(--background-color-tertiary);
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 1;
}

tr:nth-child(even) {
  background-color: var(--background-color-tertiary);
}

.mapping-section {
  margin-top: 25px;
  padding: 20px;
  background-color: var(--background-color-tertiary);
  border-radius: 8px;
}

.mapping-controls {
  display: grid;
  gap: 20px;
  margin-bottom: 20px;
}

.select-group {
  margin-bottom: 15px;
}

.select-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-color-primary);
}

.series-mapping {
  margin-bottom: 10px;
}

.series-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

select, input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--input-bg-color);
  color: var(--text-color-primary);
  width: 100%;
}

.remove-btn {
  padding: 8px;
  background-color: var(--error-color-bg);
  color: var(--error-color);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.add-series-btn {
  padding: 8px 16px;
  background-color: var(--background-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 0.9rem;
  color: var(--text-color-primary);
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
}

.cancel-btn {
  padding: 10px 20px;
  background-color: var(--background-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-color-primary);
}

.apply-btn {
  padding: 10px 20px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.apply-btn:hover:not(:disabled) {
  background-color: var(--primary-color-hover);
}

.apply-btn:disabled {
  background-color: var(--disabled-color);
  cursor: not-allowed;
}
</style>