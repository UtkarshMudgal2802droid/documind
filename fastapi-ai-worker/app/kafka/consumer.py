import json
import os
from sentence_transformers import SentenceTransformer
from app.db.models import Document, ProcessingStatus
from confluent_kafka import Consumer
from dotenv import load_dotenv
from app.db.session import SessionLocal
from app.db.models import Document
import fitz

load_dotenv()

KAFKA_BROKER_URL = os.getenv("KAFKA_BROKER_URL")

print("Initializing AI Embedding Model (all-MiniLM-L6-v2)...")
model = SentenceTransformer('all-MiniLM-L6-v2')

consumer_config = {
    'bootstrap.servers': KAFKA_BROKER_URL,
    'group.id': 'documind-ai-processors',
    'auto.offset.reset': 'earliest' # Reads unread messages from the beginning
}

consumer = Consumer(consumer_config)
consumer.subscribe(['document-uploads'])

def process_document(document_id: str):
    print(f"\n[AI WORKER] Starting heavy processing for document: {document_id}")
    
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if doc:
            doc.status = ProcessingStatus.PROCESSING
            db.commit()
            
            file_location = f"./uploads/{doc.filename}"
            extracted_text = extract_document_text(file_location, doc.filename)

            print(f"\n[DEBUG] Extracted {len(extracted_text)} characters from {doc.filename}")
            print(f"[DEBUG] Text Preview: {extracted_text[:300]}...")
            print(f"--------------------------------------------------\n")

            embedding_vector = model.encode(extracted_text).tolist()

            doc.embedding = embedding_vector
            doc.status = ProcessingStatus.COMPLETED
            db.commit()
            print(f"[AI WORKER] Document {document_id} vectorized and saved to AWS PostgreSQL.\n")
    except Exception as e:
        print(f"[AI WORKER] Processing failed: {e}")
        if doc:
            doc.status = ProcessingStatus.FAILED
            db.commit()
    finally:
        db.close()

def start_consuming():
    print("AI Background Worker is online and listening to AWS Kafka...")
    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                continue
            if msg.error():
                print(f"Consumer error: {msg.error()}")
                continue
            
            payload = json.loads(msg.value().decode('utf-8'))
            doc_id = payload.get("document_id")
            
            if doc_id:
                print(f"[KAFKA EVENT] Received upload notification for: {doc_id}")
                process_document(doc_id)
                
    except KeyboardInterrupt:
        print("Shutting down AI worker.")
    finally:
        consumer.close()

def extract_document_text(file_path: str, filename: str) -> str:
    """Extracts raw text from physical PDFs or TXT files."""
    try:
        # 1. Handle PDF Extraction
        if filename.lower().endswith('.pdf'):
            text = ""
            with fitz.open(file_path) as pdf:
                for page in pdf:
                    text += page.get_text()
            return text.strip()
            
        # 2. Handle standard Text Files
        elif filename.lower().endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read().strip()
                
    except Exception as e:
        print(f"[WARNING] Could not parse {filename}. Error: {e}")
        
    # 3. Graceful Fallback (Your original logic)
    return f"Simulated extracted text content from {filename}."

if __name__ == "__main__":
    start_consuming()