"""
SQLAlchemy models for authentication.

Les modèles définissent la structure des tables dans la base de données.
SQLAlchemy 2.0 utilise le style "declarative" avec des annotations de type.

Documentation:
https://fastapi.tiangolo.com/tutorial/sql-databases/#create-the-database-models
"""

from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from core.db import Base


class User(Base):
    """
    Modèle User - représente la table 'users' dans la base de données.
    
    Attributs:
        id: Identifiant unique (clé primaire)
        email: Email de l'utilisateur (unique, utilisé pour le login)
        hashed_password: Mot de passe haché (jamais stocker en clair!)
        full_name: Nom complet (optionnel)
        is_active: Compte actif ou désactivé
        is_superuser: Droits administrateur
        created_at: Date de création du compte
        updated_at: Date de dernière modification
    """
    
    __tablename__ = "users"
    
    # Clé primaire auto-incrémentée
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Email unique et indexé pour des recherches rapides
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    
    # Mot de passe haché (bcrypt génère des hashes de ~60 caractères)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Nom complet (optionnel)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Flags de statut
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps automatiques
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    
    def __repr__(self) -> str:
        """Représentation pour le debug."""
        return f"<User(id={self.id}, email={self.email})>"

