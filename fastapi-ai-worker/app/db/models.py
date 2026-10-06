import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base
import enum
from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(String, default="true")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to documents they upload (future expansion)
    # documents = relationship("Document", back_populates="owner")

class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False)
    device_info = Column(String, nullable=False)
    ip_address = Column(String, nullable=False)
    is_revoked = Column(String, default="false", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ProcessingStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    status = Column(Enum(ProcessingStatus), default=ProcessingStatus.PENDING, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    embedding = Column(Vector(384))