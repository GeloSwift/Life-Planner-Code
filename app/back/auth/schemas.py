"""
Pydantic schemas for authentication.

Les schemas Pydantic servent à:
- Valider les données entrantes (requêtes)
- Sérialiser les données sortantes (réponses)
- Générer automatiquement la documentation OpenAPI

Convention de nommage:
- XxxCreate: pour créer une ressource (POST)
- XxxUpdate: pour modifier une ressource (PUT/PATCH)
- XxxResponse: pour les réponses API
- XxxBase: attributs communs partagés

Documentation:
https://fastapi.tiangolo.com/tutorial/response-model/
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class AuthProviderEnum(str, Enum):
    """Providers d'authentification pour les schemas."""
    LOCAL = "local"
    GOOGLE = "google"


# =============================================================================
# USER SCHEMAS
# =============================================================================

class UserBase(BaseModel):
    """Attributs communs pour User."""
    email: EmailStr = Field(..., description="Email de l'utilisateur")
    full_name: str | None = Field(None, description="Nom complet")


class UserCreate(UserBase):
    """
    Schema pour la création d'un utilisateur (inscription).
    
    Le mot de passe est requis et doit faire au moins 8 caractères.
    """
    password: str = Field(
        ...,
        min_length=8,
        description="Mot de passe (min. 8 caractères)",
    )


class UserUpdate(BaseModel):
    """
    Schema pour la mise à jour d'un utilisateur.
    
    Tous les champs sont optionnels (PATCH).
    """
    email: EmailStr | None = None
    full_name: str | None = None
    password: str | None = Field(None, min_length=8)


class UserResponse(UserBase):
    """
    Schema pour les réponses contenant un utilisateur.
    
    Ne contient JAMAIS le mot de passe!
    
    model_config avec from_attributes=True permet de convertir
    automatiquement un objet SQLAlchemy en schema Pydantic.
    """
    id: int
    is_active: bool
    is_email_verified: bool
    auth_provider: AuthProviderEnum
    avatar_url: str | None = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# AUTH SCHEMAS (Login, Tokens)
# =============================================================================

class LoginRequest(BaseModel):
    """Schema pour la requête de login."""
    email: EmailStr = Field(..., description="Email")
    password: str = Field(..., description="Mot de passe")


class TokenResponse(BaseModel):
    """
    Schema pour la réponse contenant les tokens.
    
    Retourné après login ou refresh.
    """
    access_token: str = Field(..., description="Token d'accès JWT")
    refresh_token: str = Field(..., description="Token de rafraîchissement JWT")
    token_type: str = Field(default="bearer", description="Type de token")


class RefreshRequest(BaseModel):
    """Schema pour rafraîchir un access token."""
    refresh_token: str = Field(..., description="Token de rafraîchissement")


class MessageResponse(BaseModel):
    """Schema générique pour les messages."""
    message: str


# =============================================================================
# OAUTH SCHEMAS
# =============================================================================

class OAuthLoginRequest(BaseModel):
    """
    Schema pour la requête OAuth.
    
    Le frontend envoie le code d'autorisation reçu du provider OAuth.
    Le backend l'échange contre un access token.
    """
    code: str = Field(..., description="Code d'autorisation OAuth")
    redirect_uri: str = Field(..., description="URI de redirection utilisée")


class OAuthURLResponse(BaseModel):
    """Schema pour la réponse contenant l'URL d'autorisation OAuth."""
    authorization_url: str = Field(..., description="URL d'autorisation OAuth")
    state: str = Field(..., description="State pour la validation CSRF")


class AvatarUpdateRequest(BaseModel):
    """Schema pour la mise à jour de l'avatar."""
    avatar_url: str = Field(..., description="URL de l'avatar (peut être une data URL base64)")
