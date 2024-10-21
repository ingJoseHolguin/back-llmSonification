from flask import Flask
from flask import Flask, request, jsonify, Blueprint
from transformers import LlamaForCausalLM, LlamaTokenizer
from llama_index.core import Document, SimpleDirectoryReader, VectorStoreIndex, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.ollama import Ollama
from llm.routes import llm 
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)  

    app.register_blueprint(llm)

    return app

