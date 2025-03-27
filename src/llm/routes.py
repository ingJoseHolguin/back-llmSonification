from flask import request, jsonify, Blueprint
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, Settings
from sentence_transformers import SentenceTransformer
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
import json
import logging
import os
import re

# Configurar logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Crear un manejador de archivo y un manejador de consola
file_handler = logging.FileHandler('llm.log')
stream_handler = logging.StreamHandler()

# Crear un formateador y añadirlo a los manejadores
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
stream_handler.setFormatter(formatter)

# Añadir los manejadores al logger
logger.addHandler(file_handler)
logger.addHandler(stream_handler)

# Crear el blueprint - IMPORTANTE: Esta línea debe estar presente y ser exportada
llm = Blueprint('llm', __name__, url_prefix='/llm')

# Variables globales
documents = []
embed_model = None
index = None

# Ruta principal para el chatbot
@llm.route('/', methods=['GET'])  
def home():
    print("llM en linea")
    return jsonify(message="llM en linea")

@llm.route('/loadDocuments')
def loadDocuments():
    global documents
    try:
        # Ajustar la ruta a la ubicación correcta de tus documentos
        doc_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "documentsdb")
        if not os.path.exists(doc_path):
            os.makedirs(doc_path, exist_ok=True)
            logger.warning(f"Created documents directory at {doc_path}")
        
        documents = SimpleDirectoryReader(doc_path).load_data()
        logger.info(f"Loaded {len(documents)} documents")
        return jsonify({'Documents': f'Documents loaded: {len(documents)}',
                       'message': 'OK'}), 201
    except Exception as e:
        logger.error(f"Error loading documents: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

@llm.route('/loadModel')
def loadModel():
    global embed_model, index
    try:
        embed_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        Settings.embed_model = HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
        Settings.llm = Ollama(model="deepseek-r1:1.5b", request_timeout=360.0) #llama3.2:1b #deepseek-r1:7b #deepseek-r1:1.5b #deepseek-coder:6.7b
        logger.info("Model loaded successfully")
        return jsonify({'message': 'OK'}), 201
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

@llm.route('/promtUser', methods=['POST'])
def promtUser():
    print("prontUSer <<<<<<" + request + ">>>>>>")
    # Comprueba si se están enviando datos en formato JSON
    if request.is_json:
        print("prontUSer <<<<<<" + str(request) + ">>>>>>")
        user_prompt = data.get('userPrompt')
        speed = data.get('speed')
        detail = data.get('detail')
        play_marker_enabled = data.get('playMarkerEnabled')
        tooltip_marker_enabled = data.get('tooltipMarkerEnabled')
    else:
        # Si no es JSON, intenta obtener los datos del formulario
        user_prompt = request.form.get('userPrompt')
        speed = request.form.get('speed')
        detail = request.form.get('detail')
        play_marker_enabled = request.form.get('playMarkerEnabled')
        tooltip_marker_enabled = request.form.get('tooltipMarkerEnabled')

    global index, documents

    logger.info(f'userPrompt: {user_prompt}')
    logger.info(f'Speed: {speed}')
    logger.info(f'Detail: {detail}')
    logger.info(f'Play Marker Enabled: {play_marker_enabled}')
    logger.info(f'Tooltip Marker Enabled: {tooltip_marker_enabled}')

    if not documents:  # Verifica si los documentos están cargados
        return jsonify({'message': 'No documents loaded. Please load documents first.'}), 400

    if index is None:  # Verifica si el índice ha sido inicializado
        index = VectorStoreIndex.from_documents(documents)

    formatted_prompt = f"""
    Eres un experto en **Highcharts Sonification Studio** y en **sonificación de datos**. Responde de manera clara y natural, como si estuvieras conversando con alguien que busca asistencia sobre estos temas. No utilices subtítulos, títulos ni formatos adicionales. La respuesta debe ser fluida, directa y sin divisiones.

    Considera lo siguiente:

    - Si la solicitud es una **consulta de información** sobre sonificación de datos o el uso de **Highcharts Sonification Studio**, responde de manera informativa.
    - Si la solicitud implica **ajustar parámetros** (como cambiar la velocidad o modificar configuraciones), responde indicando que es un **ajuste de parámetros**.
    - Si la solicitud implica **realizar una acción** (como generar un gráfico o ejecutar un proceso de sonificación), responde indicando que es una **acción**.
    - Si la solicitud está fuera del contexto de sonificación de datos o **Highcharts Sonification Studio**, indica que solo puedes ayudar con esos temas.

    Tu respuesta debe estar en formato JSON con estos campos:
    {{
    "type of request": "Indica si fue **consulta de información**, **ajuste de parámetros**, **acción** o **fuera de contexto**.",
    "guide": "Responde con una explicación clara, detallada y los pasos a seguir para cumplir con la solicitud.",
    "suggestions": {{
        "type_of_request": "Identifica el tipo de solicitud del usuario",
        "speed": "valor sugerido basado en la configuración actual",
        "detail": "valor sugerido basado en la configuración actual",
        "play_marker_enabled": "valor sugerido basado en la configuración actual",
        "tooltip_marker_enabled": "valor sugerido basado en la configuración actual"
    }}
    }}

    Prompt del usuario: {user_prompt}
    Configuración actual:
    - Speed: {speed}
    - Detail: {detail}
    - Play Marker Enabled: {play_marker_enabled}
    - Tooltip Marker Enabled: {tooltip_marker_enabled}
    """

    # Utiliza el índice para hacer la consulta
    query_engine = index.as_query_engine()
    response = query_engine.query(str(formatted_prompt))
    return jsonify({
        'message': str(response),
        'speed': str(speed),
        'detail': str(detail),
        'play_marker_enabled': str(play_marker_enabled),
        'tooltip_marker_enabled': str(tooltip_marker_enabled)
    }), 201

# Nueva ruta para manejar mensajes del chatbot Vue.js
@llm.route('/chat', methods=['POST'])
def chat():
    try:
        print("chat <<<<<<" + str(request) + ">>>>>>")
        # Obtener datos del request
        data = request.get_json()
        
        
        if not data:
            return jsonify({
                'botResponse': 'Error: No se recibieron datos.',
                'suggestedConfig': None
            }), 400
        
        # Extraer mensaje y configuración
        user_message = data.get('message', '')
        current_config = data.get('config', {})
        
        logger.info(f"Mensaje recibido: {user_message}")
        logger.info(f"Configuración actual: {json.dumps(current_config, ensure_ascii=False)}")
        
        # Verificar si se han cargado los documentos y el modelo
        global documents, index
        if not documents:
            try:
                # Llamar a loadDocuments para cargar los documentos
                loadDocuments()
            except Exception as e:
                logger.error(f"Error al cargar documentos: {str(e)}")
                return jsonify({
                    'botResponse': 'Error al cargar documentos. Por favor contacta al administrador.',
                    'suggestedConfig': None
                }), 500
        
        if index is None:
            try:
                # Llamar a loadModel para inicializar el modelo
                loadModel()
                
                # Crear el índice
                index = VectorStoreIndex.from_documents(documents)
                logger.info("Índice creado con éxito")
            except Exception as e:
                logger.error(f"Error al inicializar el modelo o crear el índice: {str(e)}")
                return jsonify({
                    'botResponse': 'Error al inicializar el modelo de IA. Por favor contacta al administrador.',
                    'suggestedConfig': None
                }), 500
        
        # Crear el prompt para el LLM con la información de configuración
        formatted_prompt = f"""
        Eres un experto en sonificación de datos usando Highcharts. Responde de manera clara y conversacional.

        El usuario está utilizando un componente de sonificación con la siguiente configuración:
        ```json
        {json.dumps(current_config, indent=2, ensure_ascii=False)}
        ```

        Para cada mensaje del usuario, debes:
        1. Responder su pregunta o solicitud de manera informativa y útil
        2. Si es apropiado, sugerir ajustes a la configuración actual de sonificación

        Si sugieres cambios en la configuración, explica por qué consideras que esos cambios mejorarían la experiencia auditiva 
        e incluye un bloque JSON con la configuración sugerida, usando el siguiente formato:

        ```json
        {{
        "activeParams": [...],
        "scale": "...",
        "instrument": "...",
        "duration": 5000
        }}
        ```

        La pregunta o solicitud del usuario es: {user_message}
        """
        
        # Utilizar el índice para hacer la consulta
        query_engine = index.as_query_engine()
        response = query_engine.query(formatted_prompt)
        
        # Intentar extraer sugerencias de configuración de la respuesta
        suggested_config = extract_config_suggestions(str(response), current_config)
        
        # Preparar la respuesta para el frontend
        return jsonify({
            'botResponse': str(response),
            'suggestedConfig': suggested_config
        })
        
    except Exception as e:
        logger.error(f"Error en chat: {str(e)}")
        return jsonify({
            'botResponse': f'Ha ocurrido un error: {str(e)}',
            'suggestedConfig': None
        }), 500

def extract_config_suggestions(response_text, current_config):
    """
    Analiza la respuesta del LLM para extraer sugerencias de configuración.
    Si no hay sugerencias claras, devuelve None.
    """
    try:
        # Intentar encontrar un objeto JSON en la respuesta
        json_pattern = r'```json\s*([\s\S]*?)\s*```'
        json_matches = re.findall(json_pattern, response_text)
        
        if json_matches:
            for json_str in json_matches:
                try:
                    # Intentar parsear el JSON encontrado
                    print("config Data <<<<<"+ config_data + ">>>>>>>")
                    config_data = json.loads(json_str)
                    # Si parece una configuración válida, devolver
                    if isinstance(config_data, dict) and any(key in config_data for key in ['activeParams', 'scale', 'instrument', 'duration']):
                        return config_data
                except json.JSONDecodeError as e:
                    logger.warning(f"Error decodificando JSON: {str(e)} - JSON: {json_str}")
                    continue
        
        # Si no se encontró un JSON válido, hacer un análisis heurístico del texto
        # para identificar posibles cambios sugeridos
        suggested_config = current_config.copy()
        
        # Ejemplos de patrones para buscar:
        if "escala menor" in response_text.lower() or "minor scale" in response_text.lower():
            suggested_config["scale"] = "minor"
        elif "escala mayor" in response_text.lower() or "major scale" in response_text.lower():
            suggested_config["scale"] = "major"
        
        # Buscar sugerencias de instrumentos
        instruments = ["piano", "violin", "guitar", "flute", "marimba", "xylophone", "synth"]
        for instrument in instruments:
            if f"cambiar a {instrument}" in response_text.lower() or f"usar {instrument}" in response_text.lower():
                suggested_config["instrument"] = instrument
        
        # Buscar sugerencias de parámetros
        params = ["pitch", "volume", "pan", "frequency", "tremolo", "lowpass", "highpass", "noteDuration", "gapBetweenNotes"]
        active_params = []
        
        for param in params:
            param_es = {
                "pitch": "tono",
                "volume": "volumen",
                "pan": "balance",
                "frequency": "frecuencia",
                "tremolo": "trémolo",
                "lowpass": "filtro paso bajo",
                "highpass": "filtro paso alto",
                "noteDuration": "duración de nota",
                "gapBetweenNotes": "espacio entre notas"
            }.get(param, param)
            
            if f"añadir {param_es}" in response_text.lower() or f"agregar {param_es}" in response_text.lower() or f"incluir {param_es}" in response_text.lower():
                active_params.append(param)
        
        # Solo actualizar activeParams si se encontraron sugerencias
        if active_params:
            # Combinar los parámetros activos actuales con los nuevos sugeridos
            combined_params = list(set(current_config.get("activeParams", []) + active_params))
            suggested_config["activeParams"] = combined_params
        
        # Si la configuración sugerida es diferente de la actual, devolverla
        if suggested_config != current_config:
            return suggested_config
        
        # Si no se encontraron sugerencias claras
        return None
    
    except Exception as e:
        logger.error(f"Error al extraer sugerencias de configuración: {str(e)}")
        return None