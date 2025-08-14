# SonifyData
SonifyData es una herramienta de autoría de sonificación de datos asistida por un chatbot conversacional, desarrollada como parte de una tesis de maestría. Su objetivo principal es mejorar la experiencia de uso, particularmente entre personas sin experiencia técnica previa en sonificación.

Este proyecto combina un backend en Python un frontend en Vue.js para crear una aplicación completa de sonificación de datos. La aplicación utiliza modelos de lenguaje avanzados para procesar y transformar datos en experiencias sonoras mediante interacción conversacional.

### Características Principales

- **Interfaz conversacional**: Chatbot integrado que permite configurar sonificaciones mediante lenguaje natural
- **Sonificación por parámetros**: Mapeo de variables numéricas a parámetros auditivos (tono, volumen, panorámica, etc.)
- **Interacción guiada**: Asistencia paso a paso para usuarios no expertos
- **Visualización sincronizada**: Gráficos interactivos que se sincronizan con la reproducción sonora
- **Exportación MIDI**: Capacidad de exportar las sonificaciones creadas

## Componentes del Proyecto

- **Backend**: API desarrollada en Python que utiliza el modelo de lenguaje Qwen2.5:14b a través de Ollama
- **Frontend**: Interfaz de usuario desarrollada en Vue.js para interactuar con los datos sonificados

## Autores

- Dr. Edgard Iván Benítez Guerrero
- Mtro. José Pablo Rueda Holguín 

# Backend

Este es el backend del proyecto, desarrollado en Python con Flask.

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

## Instalación

1. Instalar dependencias de Python
    ```bash
    pip install -r requirements.txt

 2. Verificar instalación de Ollama
Asegúrate de que Ollama esté ejecutándose y el modelo esté disponible:
    ```bash
    ollama list

Deberías ver qwen2.5:14b en la lista.

## Ejecución

Para iniciar el backend, ejecuta:
    ```bash
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


## Frontend

Este proyecto también incluye un frontend desarrollado en Vue.js ubicado en la carpeta datasonification.

### Requisitos del Frontend

#### Node.js y npm
- Versión requerida: Node.js 14 o superior
- Descarga desde: https://nodejs.org/

### Instalación del Frontend

1. Navegar a la carpeta del frontend:
    ```bash
    cd datasonification

2. Instalar dependencias:
     ```bash
    npm install

### Ejecución del Frontend

1. Para iniciar el frontend, ejecuta:
    ```bash
    npm run serve

El frontend estará disponible en: http://localhost:8080

## Estructura Completa del Proyecto
├── src/
│   └── main.py          # Backend - Punto de entrada
├── datasonification/    # Frontend Vue.js
├── requirements.txt     # Dependencias de Python
└── README.md           # Este archivo

## Ejecución Completa del Proyecto

Para ejecutar tanto el backend como el frontend:

1. Terminal 1 - Backend:
py .\src\main.py

2. Terminal 2 - Frontend:
cd datasonification
npm run serve

Asegúrate de tener ambos servicios ejecutándose simultáneamente para el funcionamiento completo de la aplicación.