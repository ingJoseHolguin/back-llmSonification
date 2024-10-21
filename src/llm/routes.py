from flask import Flask, request, jsonify, Blueprint
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
    user_prompt = request.form.get('userPrompt')
    global index, documents

    if not documents:  # Verifica si los documentos están cargados
        return jsonify({'message': 'No documents loaded. Please load documents first.'}), 400
    
    if index is None:  # Verifica si el índice ha sido inicializado
        index = VectorStoreIndex.from_documents( 
            documents,
        )

    # Utiliza el índice para hacer la consulta
    query_engine = index.as_query_engine()
    response = query_engine.query(str(user_prompt))
    return jsonify({'message': str(response)}), 201



    


