"""
API routes for authentication.

Ce module définit les endpoints REST pour l'authentification:
- POST /auth/register - Inscription
- POST /auth/login - Connexion
- POST /auth/refresh - Rafraîchir le token
- GET /auth/me - Obtenir l'utilisateur courant

Documentation:
https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from auth import service
from auth.models import User
from auth.schemas import (
    UserCreate,
    UserResponse,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    MessageResponse,
)
from core.db import get_db
from core.security import create_access_token, create_refresh_token, decode_token


# Router avec préfixe /auth et tag pour la documentation
router = APIRouter(prefix="/auth", tags=["Authentication"])

# OAuth2PasswordBearer indique à FastAPI où récupérer le token
# Le client doit envoyer: Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# =============================================================================
# DEPENDENCIES (Dépendances réutilisables)
# =============================================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dépendance pour obtenir l'utilisateur courant depuis le token JWT.
    
    Utilisation dans une route:
    ```python
    @router.get("/protected")
    def protected_route(current_user: User = Depends(get_current_user)):
        return {"user": current_user.email}
    ```
    
    Raises:
        HTTPException 401: Token invalide ou expiré
        HTTPException 401: Utilisateur non trouvé
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Décode le token
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    # Vérifie que c'est un access token (pas un refresh token)
    if payload.get("type") != "access":
        raise credentials_exception
    
    # Récupère l'ID utilisateur du token
    user_id: int | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # Charge l'utilisateur depuis la base de données
    user = service.get_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    
    return user


# =============================================================================
# ROUTES
# =============================================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account with email and password.",
)
def register(user_data: UserCreate, db: Session = Depends(get_db)) -> User:
    """
    Inscription d'un nouvel utilisateur.
    
    - Vérifie que l'email n'est pas déjà utilisé
    - Crée l'utilisateur avec le mot de passe haché
    - Retourne les informations de l'utilisateur (sans le mot de passe)
    """
    # Vérifie si l'email existe déjà
    existing_user = service.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Crée l'utilisateur
    user = service.create_user(db, user_data)
    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and get tokens",
    description="Authenticate with email and password to receive JWT tokens.",
)
def login(login_data: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Connexion d'un utilisateur.
    
    - Vérifie les identifiants (email + mot de passe)
    - Génère un access token (courte durée) et un refresh token (longue durée)
    - Retourne les deux tokens
    """
    user = service.authenticate_user(db, login_data.email, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crée les tokens avec l'ID utilisateur dans le payload
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Get a new access token using a valid refresh token.",
)
def refresh(refresh_data: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Rafraîchit un access token.
    
    Le refresh token a une durée de vie plus longue (7 jours par défaut).
    Il permet d'obtenir un nouveau access token sans redemander le mot de passe.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Décode le refresh token
    payload = decode_token(refresh_data.refresh_token)
    if payload is None:
        raise credentials_exception
    
    # Vérifie que c'est bien un refresh token
    if payload.get("type") != "refresh":
        raise credentials_exception
    
    user_id: int | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # Vérifie que l'utilisateur existe toujours et est actif
    user = service.get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        raise credentials_exception
    
    # Génère de nouveaux tokens
    access_token = create_access_token(data={"sub": user.id})
    new_refresh_token = create_refresh_token(data={"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get the currently authenticated user's information.",
)
def get_me(current_user: User = Depends(get_current_user)) -> User:
    """
    Retourne les informations de l'utilisateur connecté.
    
    Cette route est protégée: elle nécessite un access token valide.
    La dépendance `get_current_user` extrait automatiquement l'utilisateur du token.
    """
    return current_user

