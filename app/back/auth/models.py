"""
SQLAlchemy models for authentication.

Les modèles définissent la structure des tables dans la base de données.
SQLAlchemy 2.0 utilise le style "declarative" avec des annotations de type.

Documentation:
https://fastapi.tiangolo.com/tutorial/sql-databases/#create-the-database-models
"""

from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import String, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from core.db import Base


class AuthProvider(str, Enum):
    """Providers d'authentification supportés."""
    LOCAL = "local"      # Email + mot de passe
    GOOGLE = "google"    # Google OAuth


class User(Base):
    """
    Modèle User - représente la table 'users' dans la base de données.
    
    Attributs:
        id: Identifiant unique (clé primaire)
        email: Email de l'utilisateur (unique, utilisé pour le login)
        hashed_password: Mot de passe haché (None si OAuth)
        full_name: Nom complet (optionnel)
        auth_provider: Provider d'authentification (local, google, apple)
        provider_user_id: ID unique chez le provider OAuth
        avatar_url: URL de l'avatar (souvent fourni par OAuth)
        is_active: Compte actif ou désactivé
        is_superuser: Droits administrateur
        is_email_verified: Email vérifié (auto pour OAuth)
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
    
    # Mot de passe haché - nullable pour les utilisateurs OAuth
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Nom complet (optionnel)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # OAuth fields
    auth_provider: Mapped[AuthProvider] = mapped_column(
        SQLEnum(
            AuthProvider,
            values_callable=lambda x: [e.value for e in x],
            name='authprovider',
        ),
        default=AuthProvider.LOCAL,
        nullable=False,
    )
    provider_user_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Flags de statut
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
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
        return f"<User(id={self.id}, email={self.email}, provider={self.auth_provider})>"

