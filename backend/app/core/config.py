import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Vertical RevOps AI"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "vertical_revops_ai_secret_key_super_secure_987654321")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # SQLite default for local zero-config, PostgreSQL supported via env var
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./revops.db")

    class Config:
        case_sensitive = True

settings = Settings()
