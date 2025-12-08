"""
Database configuration with SQLAlchemy 2.0.

Ce module configure:
- Le moteur de connexion (Engine)
- La session de base de données (SessionLocal)
- La classe de base pour les modèles (Base)
- Une dépendance FastAPI pour injecter la session dans les routes

Documentation SQLAlchemy + FastAPI:
https://fastapi.tiangolo.com/tutorial/sql-databases/
"""

from collections.abc import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session

from core.config import settings


# Engine: gère le pool de connexions à la base de données
# - echo=True: affiche les requêtes SQL dans les logs (utile en dev)
# - pool_pre_ping=True: vérifie que la connexion est valide avant de l'utiliser
# Note: database_url_sync convertit automatiquement postgresql:// en postgresql+psycopg2://
engine = create_engine(
    settings.database_url_sync,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

# SessionLocal: factory pour créer des sessions de base de données
# - autocommit=False: les transactions doivent être commitées manuellement
# - autoflush=False: les changements ne sont pas envoyés automatiquement à la DB
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)

# Base: classe parente pour tous les modèles SQLAlchemy
# Tous les modèles (User, WorkoutSession, etc.) héritent de cette classe
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency injection pour obtenir une session de base de données.
    
    Utilisation dans une route FastAPI:
    ```python
    @router.get("/items")
    def get_items(db: Session = Depends(get_db)):
        return db.query(Item).all()
    ```
    
    Le `yield` permet de:
    1. Créer la session avant l'exécution de la route
    2. Fournir la session à la route
    3. Fermer la session après l'exécution (même en cas d'erreur)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

