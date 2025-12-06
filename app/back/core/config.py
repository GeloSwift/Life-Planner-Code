"""
Configuration settings using pydantic-settings.

Pydantic Settings permet de charger automatiquement les variables d'environnement
depuis un fichier .env ou les variables système.

Documentation: https://fastapi.tiangolo.com/advanced/settings/
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Pydantic va automatiquement:
    - Charger les valeurs depuis .env
    - Convertir les types (str -> int, etc.)
    - Valider les valeurs
    """
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = True
    
    # Database Configuration
    # Format: postgresql+psycopg2://user:password@host:port/dbname
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/lifeplanner"
    
    # JWT Configuration
    JWT_SECRET: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS Configuration (frontend URL)
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    
    model_config = SettingsConfigDict(
        # Charge les variables depuis le fichier .env à la racine du projet
        env_file=".env",
        env_file_encoding="utf-8",
        # Ignore les variables non définies dans la classe
        extra="ignore",
    )


# Singleton: une seule instance de Settings partagée dans toute l'app
settings = Settings()

