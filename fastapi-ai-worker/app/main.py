from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.db.session import get_db
from app.db.models import Document
from app.kafka.producer import publish_document_event
from sentence_transformers import SentenceTransformer
from fastapi import FastAPI, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from fastapi.security import OAuth2PasswordRequestForm
from .core.security import create_access_token, verify_jwt_token
from fastapi import HTTPException


os.makedirs("./uploads", exist_ok=True)

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading AI Model for Semantic Search...")
search_model = SentenceTransformer('all-MiniLM-L6-v2')

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Validates API health and database connectivity."""
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {str(e)}"
    return {
        "service": settings.PROJECT_NAME,
        "status": "active",
        "database": db_status
    }


@app.post("/documents/test-upload")
def test_upload(filename: str, content_type: str, db: Session = Depends(get_db)):
    """Simulates a document upload by creating a database record"""
    new_doc = Document(filename=filename, content_type=content_type)
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    publish_document_event(new_doc.id)

    return {
        "message": "Document securely logged in AWS database",
        "document_id": new_doc.id,
        "status": new_doc.status
    }

@app.get("/documents/search")
def search_documents(query: str, db: Session = Depends(get_db), current_user: str = Depends(verify_jwt_token)):
    """Searches documents using AI vector similarity."""
    
    # 1. Convert the user's text query into a 384-dimension vector
    query_vector = search_model.encode(query).tolist()
    
    # 2. Calculate the mathematical distance
    distance_metric = Document.embedding.cosine_distance(query_vector)
    
    # 3. Ask AWS PostgreSQL to find the closest vectors, strictly filtering out bad matches (> 0.7)
    similar_docs = db.query(Document).filter(
        Document.embedding.is_not(None),
        distance_metric < 0.7
    ).order_by(
        distance_metric
    ).limit(3).all()
    
    # 4. Gracefully handle empty results
    if not similar_docs:
        return {
            "query": query, 
            "matches": [], 
            "message": "No highly relevant documents found."
        }
    
    return {
        "query": query,
        "matches": [
            {"document_id": doc.id, "filename": doc.filename}
            for doc in similar_docs
        ]
    }


@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: str = Depends(verify_jwt_token)):
    """Receives physical files from the React frontend and queues them for AI processing."""
    
    # 1. Create the database record
    new_doc = Document(filename=file.filename, content_type=file.content_type)
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    # 2. Save the physical file to the disk so PyMuPDF can read it
    file_location = f"./uploads/{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    
    # 3. Publish the event to Kafka
    publish_document_event(new_doc.id)
    
    return {
        "message": "File securely received and queued for AI vectorization",
        "document_id": new_doc.id,
        "filename": file.filename,
        "status": new_doc.status
    }

@app.get("/documents/clear")
def clear_database(db: Session = Depends(get_db)):
    """Temporarily added to wipe old unchunked data during debugging."""
    db.query(Document).delete()
    db.commit()
    return {"message": "AWS Vector Database wiped clean!"}

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # --- ADD THESE 2 DEBUG PRINTS ---
    print(f"\n[DEBUG] Frontend sent : '{form_data.username}' | '{form_data.password}'")
    print(f"[DEBUG] Backend loaded: '{settings.ADMIN_USERNAME}' | '{settings.ADMIN_PASSWORD}'\n")

    if form_data.username == settings.ADMIN_USERNAME and form_data.password == settings.ADMIN_PASSWORD:
        access_token = create_access_token(data={"sub": form_data.username})
        return {"access_token": access_token, "token_type": "bearer"}
    
    raise HTTPException(status_code=401, detail="Invalid credentials")