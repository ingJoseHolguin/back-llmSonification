from flask import Flask
from flask import Flask, request, jsonify, Blueprint
from transformers import LlamaForCausalLM, LlamaTokenizer
from llama_index.core import Document, SimpleDirectoryReader, VectorStoreIndex, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.ollama import Ollama
from llm.routes import llm 

def create_app():
    app = Flask(__name__)

    app.register_blueprint(llm)

    return app

