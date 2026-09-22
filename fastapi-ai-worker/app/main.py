from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.db.session import get_db

app = FastAPI(title=settings.PROJECT_NAME)

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