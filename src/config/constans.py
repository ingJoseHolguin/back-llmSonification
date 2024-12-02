import os, chromadb
from chromadb.config import Settings


# Define las configuraciones para ChromaDB
CHROMA_SETTINGS = Settings(allow_reset=True, anonymized_telemetry=False)

# Inicializa el cliente de ChromaDB
client = chromadb.Client(CHROMA_SETTINGS)

# Define the folder for storing database
# PERSIST_DIRECTORY = os.environ.get('PERSIST_DIRECTORY', 'db')

# Define the Chroma settings
# CHROMA_SETTINGS = chromadb.HttpClient(host="host.docker.internal", port=8000, settings=Settings(allow_reset=True, anonymized_telemetry=False))
