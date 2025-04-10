from flask import Flask, request, jsonify, Blueprint
from transformers import LlamaForCausalLM, LlamaTokenizer
from llama_index.core import Document, SimpleDirectoryReader, VectorStoreIndex, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.ollama import Ollama
from flask_cors import CORS
import os
import sys

# Asegurarse de que el directorio src esté en el path
src_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

def create_app():
    app = Flask(__name__)
    
    # Configurar CORS para manejar preflight correctamente
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
    
    # Importar blueprint de manera dinámica para evitar problemas de importación
    import importlib.util
    
    # Construir la ruta completa al archivo routes.py
    routes_path = os.path.join(src_dir, "llm", "routes.py")
    
    if not os.path.exists(routes_path):
        raise ImportError(f"No se puede encontrar {routes_path}")
    
    # Cargar el módulo dinámicamente
    spec = importlib.util.spec_from_file_location("llm.routes", routes_path)
    routes_module = importlib.util.module_from_spec(spec)
    sys.modules["llm.routes"] = routes_module
    spec.loader.exec_module(routes_module)
    
    # Obtener el blueprint del módulo cargado
    llm_blueprint = routes_module.llm
    
    # Agregar manejo de OPTIONS para todas las rutas del blueprint
    @llm_blueprint.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    # Registrar blueprint
    app.register_blueprint(llm_blueprint)
    
    # Ruta principal para manejar las solicitudes del chatbot
    @app.route('/', methods=['POST', 'OPTIONS'])
    def process_chat():
        # Manejar peticiones OPTIONS para CORS
        if request.method == 'OPTIONS':
            response = jsonify({})
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        try:
            # Redirigir la solicitud al endpoint de chat
            from llm.routes import chat
            return chat()
        except Exception as e:
            return jsonify({
                'botResponse': f'Error inesperado: {str(e)}',
                'suggestedConfig': None
            }), 500

    return app