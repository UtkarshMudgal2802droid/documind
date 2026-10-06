import os
import shutil
import uuid

from fastapi import Depends, FastAPI, UploadFile, File, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import text
from sentence_transformers import SentenceTransformer

from app.core.config import settings
from app.core.security import create_access_token, verify_jwt_token, get_password_hash, verify_password
from app.db.session import get_db, engine, Base
from app.db.models import Document, User, UserRole, UserSession
from app.kafka.producer import publish_document_event

# --- Constants ---
ALLOWED_EXTENSIONS = {".pdf", ".txt"}
MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
MAX_QUERY_LENGTH = 500

# --- Pydantic Schemas ---
# Schemas define the exact structure of data we expect from the frontend (Client)
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    username: str
    new_password: str
    confirm_password: str

os.makedirs("./uploads", exist_ok=True)

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Security: Rate Limiting ---
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

print("Loading AI Model for Semantic Search...")
search_model = SentenceTransformer('all-MiniLM-L6-v2')

@app.on_event("startup")
async def startup_event():
    """Ensure database tables and extensions are created on startup."""
    try:
        with engine.connect() as conn:
            conn.execute(text('CREATE EXTENSION IF NOT EXISTS vector'))
            conn.commit()
        Base.metadata.create_all(bind=engine)
        
        # Auto-seed the initial admin user if the database is empty
        from app.db.session import SessionLocal
        db = SessionLocal()
        if not db.query(User).first():
            print("No users found. Creating initial admin user...")
            admin_user = User(
                username=settings.ADMIN_USERNAME,
                email="admin@documind.ai",
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                role=UserRole.ADMIN
            )
            db.add(admin_user)
            db.commit()
        db.close()
        
        print("Database tables initialized successfully.")
    except Exception as e:
        print(f"Error initializing database: {e}")

# --- Validation Helpers ---
def validate_file(file: UploadFile) -> None:
    """Validates file extension and size before processing."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' is not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

def sanitize_filename(filename: str) -> str:
    """Generates a safe, unique filename to prevent path traversal attacks."""
    ext = os.path.splitext(filename)[1].lower()
    return f"{uuid.uuid4().hex}{ext}"


# --- Routes ---
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


@app.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_jwt_token)
):
    """Receives physical files from the frontend and queues them for AI processing."""

    # 1. Validate the file type
    validate_file(file)

    # 2. Read file content and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the {MAX_FILE_SIZE_MB}MB size limit."
        )
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Cannot upload an empty file.")

    # 3. Save with a sanitized filename to prevent path traversal
    safe_name = sanitize_filename(file.filename)
    file_location = os.path.join("./uploads", safe_name)
    with open(file_location, "wb") as file_object:
        file_object.write(content)

    # 4. Create the database record with the safe physical filename
    new_doc = Document(filename=safe_name, content_type=file.content_type)
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    # 5. Publish the event to Kafka
    publish_document_event(new_doc.id)

    return {
        "message": "File securely received and queued for AI vectorization",
        "document_id": str(new_doc.id),
        "filename": file.filename,
        "status": new_doc.status
    }


@app.get("/documents/search")
def search_documents(
    query: str = Query(..., min_length=1, max_length=MAX_QUERY_LENGTH),
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_jwt_token)
):
    """Searches documents using AI vector similarity."""

    query = query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")

    # 1. Convert the user's text query into a 384-dimension vector
    query_vector = search_model.encode(query).tolist()

    # 2. Calculate the mathematical distance
    distance_metric = Document.embedding.cosine_distance(query_vector)

    # 3. Find the closest vectors, strictly filtering out bad matches (> 0.7)
    similar_docs = db.query(Document).filter(
        Document.embedding.is_not(None),
        distance_metric < 0.7
    ).order_by(
        distance_metric
    ).limit(5).all()

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
            {"document_id": str(doc.id), "filename": doc.filename}
            for doc in similar_docs
        ]
    }


@app.post("/token")
@limiter.limit("5/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticates a user against the database and returns a JWT token."""
    if not form_data.username or not form_data.password:
        raise HTTPException(status_code=400, detail="Username and password are required.")

    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username. No such user exists.")
        
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid password.")
        
    if user.is_active != "true":
        raise HTTPException(status_code=403, detail="Account is disabled")

    device_info = request.headers.get("user-agent", "Unknown Device")
    ip_address = request.client.host if request.client else "0.0.0.0"
    
    new_session = UserSession(user_id=user.id, device_info=device_info, ip_address=ip_address)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    access_token = create_access_token(data={"sub": user.username, "sid": str(new_session.id)})
    return {"access_token": access_token, "token_type": "bearer"}



@app.post("/users/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Registers a new user in the database."""
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully", "username": new_user.username}

@app.post("/users/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Directly resets the user's password using username and new password."""
    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid username")
        
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password reset successfully. You can now log in."}

@app.post("/users/logout-all")
def logout_all_devices(token_data: dict = Depends(verify_jwt_token), db: Session = Depends(get_db)):
    """Logs the user out of all devices by revoking all their sessions globally."""
    user = db.query(User).filter(User.username == token_data["username"]).first()
    if user:
        db.query(UserSession).filter(UserSession.user_id == user.id, UserSession.is_revoked == "false").update({"is_revoked": "true"})
        db.commit()
    return {"message": "Successfully logged out from all devices."}

@app.get("/users/sessions")
def get_sessions(token_data: dict = Depends(verify_jwt_token), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == token_data["username"]).first()
    sessions = db.query(UserSession).filter(UserSession.user_id == user.id, UserSession.is_revoked == "false").order_by(UserSession.created_at.desc()).all()
    
    return [
        {
            "id": str(s.id),
            "device_info": s.device_info,
            "ip_address": s.ip_address,
            "created_at": s.created_at.isoformat(),
            "is_current": str(s.id) == token_data["session_id"]
        } for s in sessions
    ]

@app.delete("/users/sessions/{session_id}")
def revoke_session(session_id: str, token_data: dict = Depends(verify_jwt_token), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == token_data["username"]).first()
    session_to_revoke = db.query(UserSession).filter(UserSession.id == session_id, UserSession.user_id == user.id).first()
    if not session_to_revoke:
        raise HTTPException(status_code=404, detail="Session not found")
    session_to_revoke.is_revoked = "true"
    db.commit()
    return {"message": "Session revoked successfully"}