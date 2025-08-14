# Backend

Este es el backend del proyecto, desarrollado en Python.

## Requisitos del Sistema

### Python
- **Versión requerida:** Python 3.8 o superior
- Descarga desde: https://www.python.org/downloads/

### Ollama
El backend requiere **Ollama** instalado con el modelo de lenguaje **qwen2.5:14b**.

#### Instalación de Ollama:
1. Descarga Ollama desde: https://ollama.ai/
2. Instala siguiendo las instrucciones de tu sistema operativo
3. Descarga el modelo requerido:
   ```bash
   ollama pull qwen2.5:14b

# Backend

Este es el backend del proyecto, desarrollado en Python.

## Requisitos del Sistema

### Python
- **Versión requerida:** Python 3.8 o superior
- Descarga desde: https://www.python.org/downloads/

### Ollama
El backend requiere **Ollama** instalado con el modelo de lenguaje **qwen2.5:14b**.

#### Instalación de Ollama:
1. Descarga Ollama desde: https://ollama.ai/
2. Instala siguiendo las instrucciones de tu sistema operativo
3. Descarga el modelo requerido:
  ```bash
  ollama pull qwen2.5:14b


Luego continúa con esto:

## Instalación

### 1. Instalar dependencias de Python
pip install -r requirements.txt

### 2. Verificar instalación de Ollama
Asegúrate de que Ollama esté ejecutándose y el modelo esté disponible:
ollama list

Deberías ver qwen2.5:14b en la lista.

## Ejecución

Para iniciar el backend, ejecuta:
py .\src\main.py

## Estructura del Proyecto
├── src/
│   └── main.py          # Punto de entrada del backend
├── requirements.txt     # Dependencias de Python
└── README.md           # Este archivo

## Notas Importantes
- Asegúrate de que Ollama esté ejecutándose antes de iniciar el backend
- El modelo qwen2.5:14b debe estar descargado y disponible
- Verifica que tengas la versión correcta de Python instalada

## Solución de Problemas
Si encuentras problemas:
1. Verifica que Python esté correctamente instalado: python --version
2. Confirma que Ollama esté ejecutándose: ollama list
3. Asegúrate de que todas las dependencias estén instaladas: pip list