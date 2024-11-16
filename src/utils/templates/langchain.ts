import { FileType, FolderType } from '../../types';

export async function createLangChainProject(): Promise<(FileType | FolderType)[]> {
  return [
    {
      id: 'requirements.txt',
      name: 'requirements.txt',
      content: `fastapi==0.104.1
uvicorn==0.24.0
langchain==0.0.339
openai==1.3.5
python-dotenv==1.0.0
pydantic==2.5.2
pytest==7.4.3
httpx==0.25.2
python-multipart==0.0.6
tiktoken==0.5.1
chromadb==0.4.18`,
      language: 'plaintext'
    },
    {
      id: 'app',
      name: 'app',
      items: [
        {
          id: 'app/__init__.py',
          name: '__init__.py',
          content: '',
          language: 'python'
        },
        {
          id: 'app/main.py',
          name: 'main.py',
          content: `from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.routes import chat, documents
from app.core.config import settings

app = FastAPI(
    title="LangChain API",
    description="AI-powered API built with LangChain and FastAPI",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to LangChain API",
        "docs": "/docs",
        "openapi": "/openapi.json"
    }`,
          language: 'python'
        },
        {
          id: 'app/core',
          name: 'core',
          items: [
            {
              id: 'app/core/__init__.py',
              name: '__init__.py',
              content: '',
              language: 'python'
            },
            {
              id: 'app/core/config.py',
              name: 'config.py',
              content: `from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "LangChain API"
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Vector Store
    VECTORSTORE_PATH: str = "vectorstore"
    
    # Model Configuration
    DEFAULT_MODEL: str = "gpt-3.5-turbo"
    MAX_TOKENS: int = 500
    TEMPERATURE: float = 0.7

settings = Settings()`,
              language: 'python'
            },
            {
              id: 'app/core/chains.py',
              name: 'chains.py',
              content: `from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from app.core.config import settings
from app.core.embeddings import get_embeddings
from app.core.vectorstore import get_vectorstore

def get_conversation_chain(chat_history=None):
    """Create a conversation chain with memory and document retrieval."""
    
    # Initialize the language model
    llm = ChatOpenAI(
        temperature=settings.TEMPERATURE,
        model_name=settings.DEFAULT_MODEL,
        max_tokens=settings.MAX_TOKENS
    )
    
    # Initialize memory
    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True
    )
    
    if chat_history:
        for message in chat_history:
            memory.chat_memory.add_message(message)
    
    # Get vector store for document retrieval
    vectorstore = get_vectorstore()
    
    # Create the conversation chain
    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=vectorstore.as_retriever(),
        memory=memory,
        return_source_documents=True
    )
    
    return chain`,
              language: 'python'
            },
            {
              id: 'app/core/embeddings.py',
              name: 'embeddings.py',
              content: `from langchain.embeddings import OpenAIEmbeddings
from app.core.config import settings

_embeddings = None

def get_embeddings():
    """Get or create OpenAI embeddings instance."""
    global _embeddings
    
    if _embeddings is None:
        _embeddings = OpenAIEmbeddings(
            openai_api_key=settings.OPENAI_API_KEY
        )
    
    return _embeddings`,
              language: 'python'
            },
            {
              id: 'app/core/vectorstore.py',
              name: 'vectorstore.py',
              content: `import chromadb
from langchain.vectorstores import Chroma
from app.core.config import settings
from app.core.embeddings import get_embeddings

_vectorstore = None

def get_vectorstore():
    """Get or create Chroma vector store instance."""
    global _vectorstore
    
    if _vectorstore is None:
        _vectorstore = Chroma(
            persist_directory=settings.VECTORSTORE_PATH,
            embedding_function=get_embeddings()
        )
    
    return _vectorstore

def add_documents(documents):
    """Add documents to the vector store."""
    vectorstore = get_vectorstore()
    vectorstore.add_documents(documents)
    vectorstore.persist()
    
def search_documents(query: str, k: int = 4):
    """Search for relevant documents."""
    vectorstore = get_vectorstore()
    return vectorstore.similarity_search(query, k=k)`,
              language: 'python'
            }
          ]
        },
        {
          id: 'app/routes',
          name: 'routes',
          items: [
            {
              id: 'app/routes/__init__.py',
              name: '__init__.py',
              content: '',
              language: 'python'
            },
            {
              id: 'app/routes/chat.py',
              name: 'chat.py',
              content: `from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.core.chains import get_conversation_chain

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    chat_history: Optional[List[ChatMessage]] = None

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[str]] = None

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Create conversation chain
        chain = get_conversation_chain(request.chat_history)
        
        # Get response from chain
        result = chain({"question": request.message})
        
        # Extract sources from documents
        sources = []
        if result.get("source_documents"):
            sources = [doc.metadata.get("source", "") for doc in result["source_documents"]]
        
        return ChatResponse(
            response=result["answer"],
            sources=sources
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))`,
              language: 'python'
            },
            {
              id: 'app/routes/documents.py',
              name: 'documents.py',
              content: `from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from langchain.document_loaders import TextLoader, PyPDFLoader
from app.core.vectorstore import add_documents, search_documents
import tempfile
import os

router = APIRouter()

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        # Create temporary file
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file.flush()
            
            # Load documents based on file type
            if suffix.lower() == '.pdf':
                loader = PyPDFLoader(temp_file.name)
            else:
                loader = TextLoader(temp_file.name)
            
            documents = loader.load()
            
            # Add documents to vector store
            add_documents(documents)
            
            # Clean up
            os.unlink(temp_file.name)
            
            return {"message": f"Successfully processed {file.filename}"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search(query: str, limit: int = 4):
    try:
        documents = search_documents(query, k=limit)
        results = []
        
        for doc in documents:
            results.append({
                "content": doc.page_content,
                "metadata": doc.metadata
            })
        
        return {"results": results}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))`,
              language: 'python'
            }
          ]
        }
      ]
    },
    {
      id: '.env',
      name: '.env',
      content: `OPENAI_API_KEY=your-openai-api-key-here`,
      language: 'plaintext'
    },
    {
      id: '.gitignore',
      name: '.gitignore',
      content: `__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.env
.venv
vectorstore/
.DS_Store
.coverage
coverage.xml
htmlcov/
.pytest_cache/
.idea/
.vscode/`,
      language: 'plaintext'
    },
    {
      id: 'README.md',
      name: 'README.md',
      content: `# LangChain FastAPI Project

An AI-powered API built with LangChain and FastAPI, featuring document processing and conversational AI capabilities.

## Features

- 🤖 Conversational AI with ChatGPT
- 📚 Document processing and embedding
- 🔍 Semantic search
- 🗄️ Vector store for document retrieval
- 🚀 Fast and scalable API with FastAPI

## Setup

1. Create a virtual environment:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

3. Set up environment variables:
   - Copy \`.env.example\` to \`.env\`
   - Add your OpenAI API key

4. Run the development server:
   \`\`\`bash
   uvicorn app.main:app --reload
   \`\`\`

## API Endpoints

### Chat

- POST /api/chat
  - Send messages to the AI assistant
  - Includes document context in responses

### Documents

- POST /api/documents/upload
  - Upload documents (PDF, TXT)
  - Automatically processes and embeds content

- GET /api/documents/search
  - Search through uploaded documents
  - Returns relevant document chunks

## Project Structure

\`\`\`
├── app/
│   ├── core/
│   │   ├── chains.py
│   │   ├── config.py
│   │   ├── embeddings.py
│   │   └── vectorstore.py
│   ├── routes/
│   │   ├── chat.py
│   │   └── documents.py
│   └── main.py
├── requirements.txt
└── README.md
\`\`\`

## Testing

Run tests with pytest:
\`\`\`bash
pytest
\`\`\`

## Environment Variables

- \`OPENAI_API_KEY\`: Your OpenAI API key
- \`DEFAULT_MODEL\`: GPT model to use (default: gpt-3.5-turbo)
- \`MAX_TOKENS\`: Maximum tokens per response
- \`TEMPERATURE\`: Model temperature (0-1)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Open a pull request`,
      language: 'markdown'
    },
    {
      id: 'tests',
      name: 'tests',
      items: [
        {
          id: 'tests/__init__.py',
          name: '__init__.py',
          content: '',
          language: 'python'
        },
        {
          id: 'tests/conftest.py',
          name: 'conftest.py',
          content: `import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)`,
          language: 'python'
        },
        {
          id: 'tests/test_chat.py',
          name: 'test_chat.py',
          content: `from fastapi.testclient import TestClient
import pytest
from unittest.mock import patch

def test_chat_endpoint(client):
    with patch('app.routes.chat.get_conversation_chain') as mock_chain:
        # Mock chain response
        mock_chain.return_value.return_value = {
            "answer": "Test response",
            "source_documents": []
        }
        
        response = client.post(
            "/api/chat",
            json={
                "message": "Hello",
                "chat_history": []
            }
        )
        
        assert response.status_code == 200
        assert response.json() == {
            "response": "Test response",
            "sources": []
        }`,
          language: 'python'
        },
        {
          id: 'tests/test_documents.py',
          name: 'test_documents.py',
          content: `from fastapi.testclient import TestClient
import pytest
from unittest.mock import patch
import io

def test_upload_document(client):
    with patch('app.routes.documents.add_documents') as mock_add:
        # Create fake file
        file_content = b"Test document content"
        file = io.BytesIO(file_content)
        
        response = client.post(
            "/api/documents/upload",
            files={"file": ("test.txt", file, "text/plain")}
        )
        
        assert response.status_code == 200
        assert "Successfully processed" in response.json()["message"]

def test_search_documents(client):
    with patch('app.routes.documents.search_documents') as mock_search:
        # Mock search results
        mock_search.return_value = []
        
        response = client.get("/api/documents/search?query=test")
        
        assert response.status_code == 200
        assert "results" in response.json()`,
          language: 'python'
        }
      ]
    }
  ];
}