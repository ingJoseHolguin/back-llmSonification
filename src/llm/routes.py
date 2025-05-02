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
        Settings.llm = Ollama(model="qwen3:14b", request_timeout=360.0) #llama3.2:1b #deepseek-r1:7b #deepseek-r1:1.5b #deepseek-coder:6.7b llama3.2:1b
        logger.info("Model loaded successfully")
        return jsonify({'message': 'OK'}), 201
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

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
                    parsed_config = json.loads(json_str)
                    # Si parece una configuración válida, devolver
                    if isinstance(parsed_config, dict) and any(key in parsed_config for key in ['activeParams', 'scale', 'instrument', 'duration']):
                        return parsed_config
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
        params_to_remove = []
        
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
            
            # Buscar patrones para añadir parámetros
            if f"añadir {param_es}" in response_text.lower() or f"agregar {param_es}" in response_text.lower() or f"incluir {param_es}" in response_text.lower():
                active_params.append(param)
            
            # Buscar patrones para quitar parámetros
            if f"quitar {param_es}" in response_text.lower() or f"eliminar {param_es}" in response_text.lower() or f"remover {param_es}" in response_text.lower() or f"desactivar {param_es}" in response_text.lower():
                params_to_remove.append(param)
        
        # Solo actualizar activeParams si se encontraron sugerencias para añadir
        if active_params:
            # Combinar los parámetros activos actuales con los nuevos sugeridos
            combined_params = list(set(current_config.get("activeParams", []) + active_params))
            suggested_config["activeParams"] = combined_params
            
        # Eliminar parámetros si se encontraron sugerencias para quitar
        if params_to_remove and "activeParams" in current_config:
            # Crear una nueva lista sin los parámetros a eliminar
            filtered_params = [param for param in current_config.get("activeParams", []) if param not in params_to_remove]
            suggested_config["activeParams"] = filtered_params
        
        # Si la configuración sugerida es diferente de la actual, devolverla
        if suggested_config != current_config:
            return suggested_config
        
        # Si no se encontraron sugerencias claras
        return None
    
    except Exception as e:
        logger.error(f"Error al extraer sugerencias de configuración: {str(e)}")
        return None

# Nueva ruta para manejar mensajes del chatbot Vue.js
@llm.route('/chat', methods=['POST'])
def chat():           
    try:
        print(f"chat <<<<<<<{request}>>>>>>>")
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
        global documents, index, embed_model
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
                if embed_model is None:
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
        
        # Crear el prompt para el LLM con la información de configuración utilizando literales de string
        # para evitar problemas con las llaves en formato JSON
        formatted_prompt = f"""
        Eres un asistente experto en sonificación de datos. Recibirás dos variables:
        - "user_message": la petición actual del usuario esta es: {user_message}
        - "current_config": un objeto JSON con la configuración actual de la sonificación. Esta es la configuracion predeterminada: '{{\"activeParams\": [\"pitch\", \"frequency\", \"lowpass\", \"highpass\", \"volume\", \"noteDuration\", \"pan\", \"gapBetweenNotes\", \"tremolo\"], \"scale\": \"major\", \"instrument\": \"piano\", \"duration\": 5000, \"paramRanges\": {{\"pitch\": {{\"min\": \"c2\", \"max\": \"c6\"}}, \"frequency\": {{\"min\": 65.41, \"max\": 1046.5}}, \"lowpass\": {{\"min\": 100, \"max\": 4000}}, \"highpass\": {{\"min\": 1, \"max\": 4000}}, \"volume\": {{\"min\": 0.1, \"max\": 1.2}}, \"noteDuration\": {{\"min\": 30, \"max\": 1000}}, \"pan\": {{\"min\": -1, \"max\": 1}}, \"gapBetweenNotes\": {{\"min\": 40, \"max\": 250}}, \"tremolo\": {{\"min\": 0, \"max\": 1}}}}, \"data\": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]}}' esta es {current_config}

        Tu tarea es interpretar lo que el usuario quiere lograr, evaluar la configuración actual y sugerir una nueva configuración que se ajuste mejor a los objetivos del usuario, respetando los principios de sonificación efectiva.

        Reglas que debes seguir:
        1. si pide una explicacion de definicion de sonificacion o de un concepto relacionado, debes de responder con la definicion y no hacer cambios en la configuracion actual.
        2. Si la solicitud es una consulta de información sobre sonificación de datos, responde de manera informativa y no hagas cambios en la configuración actual.
        3. Solo puedes resolver problemas relacionados con la sonificación de datos.
        4. Puedes modificar o proponer nuevos valores para los parámetros en "current_config" si mejora la calidad de la sonificación.
        5. Si necesitas más información para dar una recomendación adecuada, formula una pregunta clara y específica al usuario.
        6. si hiciste cambios en la sugerencias explica por que las hiciste
        7. La respuesta debe estar en el siguiente formato JSON, sin ninguna explicación adicional:

        {{
            "botResponse": "Texto explicativo para el usuario en lenguaje natural, breve y directo puedes mensionar los cambios pero no puedes incluir el json de las configuracion",
            "suggestedConfig": configuración_sugerida (puede ser igual a current_config si no hay cambios)
        }}

        """
        
        
        # Utilizar el índice para hacer la consulta
        query_engine = index.as_query_engine()
        print('query_engine_' + str(query_engine) )
        response = query_engine.query(formatted_prompt)
        
        # Convertir la respuesta a string
        response_str = str(response)

        print("Resouesta del LLM: >>>>>>>>>>>>>>>>>>>>>>>", response_str)
        
        # Intentar extraer sugerencias de configuración de la respuesta
        suggested_config = extract_config_suggestions(response_str, current_config)
        
        

        # Preparar la respuesta para el frontend
        return jsonify({
            'botResponse': response_str,
            'suggestedConfig': suggested_config or current_config
        })
        
    except Exception as e:
        logger.error(f"Error en chat: {str(e)}")
        return jsonify({
            'botResponse': f'Ha ocurrido un error: {str(e)}',
            'suggestedConfig': None
        }), 500
    