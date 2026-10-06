import jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.db.models import UserSession

# Enterprise password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def verify_jwt_token(request: Request, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Dependency to lock down FastAPI endpoints."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    final_token = request.cookies.get("app_token") or token
    if not final_token:
        raise credentials_exception

    try:
        payload = jwt.decode(final_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        username: str = payload.get("sub")
        session_id: str = payload.get("sid")
        if username is None or session_id is None:
            raise credentials_exception
            
        user_session = db.query(UserSession).filter(UserSession.id == session_id).first()
        if not user_session or user_session.is_revoked == "true":
            raise HTTPException(status_code=401, detail="Session expired or revoked.")
            
        return {"username": username, "session_id": session_id}
    except jwt.PyJWTError:
        raise credentials_exception