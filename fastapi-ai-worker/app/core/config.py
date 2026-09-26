from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str
    DATABASE_URL: str
    KAFKA_BROKER_URL: str
    
    # --- ADD THESE 3 NEW VARIABLES ---
    JWT_SECRET_KEY: str
    ADMIN_USERNAME: str
    ADMIN_PASSWORD: str

    class Config:
        env_file = ".env"
        extra = "ignore" 

settings = Settings()