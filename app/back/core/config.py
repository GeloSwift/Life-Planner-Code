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
    # Railway/Render utilisent postgresql://, SQLAlchemy a besoin de postgresql+psycopg2://
    # La propriété database_url_sync gère la conversion automatiquement
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/lifeplanner"
    
    # JWT Configuration
    JWT_SECRET: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 240  # 4 heures (augmenté de 30 min pour rester connecté plus longtemps)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # 30 jours (augmenté de 7 jours)
    
    # CORS Configuration (frontend URLs - dev and production)
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://life-planner-code.vercel.app",
        "https://www.mylifeplanner.space",
        "https://mylifeplanner.space"
    ]
    
    # Frontend URL (for OAuth redirects)
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Google OAuth Configuration
    # Get credentials from: https://console.cloud.google.com/apis/credentials
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    
    # MailerSend Configuration
    # Get API key from: https://app.mailersend.com/api
    MAILERSEND_API_KEY: str | None = None
    # Email sender (must be verified in MailerSend)
    MAILERSEND_FROM_EMAIL: str = "noreply@lifeplanner.app"
    MAILERSEND_FROM_NAME: str = "Life Planner"
    
    @property
    def database_url_sync(self) -> str:
        """
        Retourne l'URL de la base de données compatible avec psycopg2.
        
        Convertit automatiquement:
        - postgresql:// → postgresql+psycopg2://
        - postgres:// → postgresql+psycopg2:// (format legacy)
        
        Cela permet d'utiliser la variable DATABASE_URL native de Railway/Render
        sans modification manuelle.
        """
        url = self.DATABASE_URL
        
        # Convertit postgres:// en postgresql:// (format legacy utilisé par certains providers)
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        
        # Ajoute +psycopg2 si pas déjà présent
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        
        return url
    
    model_config = SettingsConfigDict(
        # Charge les variables depuis le fichier .env à la racine du projet
        env_file=".env",
        env_file_encoding="utf-8",
        # Ignore les variables non définies dans la classe
        extra="ignore",
    )


# Singleton: une seule instance de Settings partagée dans toute l'app
settings = Settings()

