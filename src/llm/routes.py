from flask import  request, jsonify, Blueprint
from llama_index.core import  SimpleDirectoryReader, VectorStoreIndex, Settings
from sentence_transformers import SentenceTransformer
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.huggingface import HuggingFaceEmbedding



llm = Blueprint('llm', __name__, url_prefix='/llm')

documents = []
embed_model = None
index = None


@llm.route('/', methods=['GET'])  
def home():
    return jsonify(message="llM en linea")

@llm.route('/loadDocuments')
def loadDocuments():
    global documents
    documents = SimpleDirectoryReader("./src/documentsdb").load_data()    
    return jsonify({'Documents': 'Documents load' + str(documents[0], ),
                    'message': 'OK' }), 201

@llm.route('/loadModel')
def loadModel():
    global embed_model, index
    embed_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    Settings.embed_model = HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
    Settings.llm = Ollama(model="llama3.2:1b", request_timeout=360.0)
    return jsonify({'message': 'OK'  }), 201


@llm.route('/promtUser', methods=['POST'])
def promtUser():
    # Comprueba si se están enviando datos en formato JSON
    if request.is_json:
        data = request.get_json()
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

    print(f'userPrompt: {user_prompt}')
    print(f'Speed: {speed}')
    print(f'Detail: {detail}')
    print(f'Play Marker Enabled: {play_marker_enabled}')
    print(f'Tooltip Marker Enabled: {tooltip_marker_enabled}')

    if not documents:  # Verifica si los documentos están cargados
        return jsonify({'message': 'No documents loaded. Please load documents first.'}), 400

    if index is None:  # Verifica si el índice ha sido inicializado
        index = VectorStoreIndex.from_documents(documents)


    # Utiliza el índice para hacer la consulta
    query_engine = index.as_query_engine()
    response = query_engine.query(str(user_prompt))
    return jsonify({
        'message': str(response),
        'speed': str(speed),
        'detail': str(detail),
        'play_marker_enabled': str(play_marker_enabled),
        'tooltip_marker_enabled': str(tooltip_marker_enabled)
    }), 201


""" import logging

# Create a logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create a file handler and a stream handler
file_handler = logging.FileHandler('llm.log')
stream_handler = logging.StreamHandler()

# Create a formatter and add it to the handlers
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
stream_handler.setFormatter(formatter)

# Add the handlers to the logger
logger.addHandler(file_handler)
logger.addHandler(stream_handler)

# Replace the print statements with logger.info
@llm.route('/promtUser', methods=['POST'])
def promtUser():
    # Comprueba si se están enviando datos en formato JSON
    if request.is_json:
        data = request.get_json()
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
        logger.error('No documents loaded. Please load documents first.')
        return jsonify({'message': 'No documents loaded. Please load documents first.'}), 400

    if index is None:  # Verifica si el índice ha sido inicializado
        index = VectorStoreIndex.from_documents(documents)

    # Utiliza el índice para hacer la consulta
    query_engine = index.as_query_engine()
    response = query_engine.query(str(user_prompt))
    logger.info(f'Response: {response}')
    return jsonify({
        'message': str(response),
        'speed': str(speed),
        'detail': str(detail),
        'play_marker_enabled': str(play_marker_enabled),
        'tooltip_marker_enabled': str(tooltip_marker_enabled)
    }), 201 """