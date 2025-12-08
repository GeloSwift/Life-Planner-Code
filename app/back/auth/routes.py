"""
API routes for authentication.

Ce module définit les endpoints REST pour l'authentification:
- POST /auth/register - Inscription
- POST /auth/login - Connexion
- POST /auth/logout - Déconnexion
- POST /auth/refresh - Rafraîchir le token
- GET /auth/me - Obtenir l'utilisateur courant
- GET /auth/google/url - Obtenir l'URL Google OAuth
- POST /auth/google/callback - Callback Google OAuth
- GET /auth/apple/url - Obtenir l'URL Apple OAuth
- POST /auth/apple/callback - Callback Apple OAuth
- GET /auth/providers - Liste des providers OAuth configurés

Documentation:
https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Cookie
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from auth import service, oauth
from auth.models import User, AuthProvider
from auth.schemas import (
    UserCreate,
    UserResponse,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    MessageResponse,
    OAuthLoginRequest,
    OAuthURLResponse,
)
from core.config import settings
from core.db import get_db
from core.security import create_access_token, create_refresh_token, decode_token


# Router avec préfixe /auth et tag pour la documentation
router = APIRouter(prefix="/auth", tags=["Authentication"])

# OAuth2PasswordBearer indique à FastAPI où récupérer le token
# Le client doit envoyer: Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

# Cookie names
ACCESS_TOKEN_COOKIE = "access_token"
REFRESH_TOKEN_COOKIE = "refresh_token"


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """
    Définit les cookies d'authentification httpOnly.
    
    httpOnly empêche JavaScript d'accéder aux cookies (protection XSS).
    secure=True en production (HTTPS uniquement).
    samesite="lax" protège contre CSRF tout en permettant les redirects.
    """
    is_secure = not settings.DEBUG
    
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=access_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    """Supprime les cookies d'authentification."""
    response.delete_cookie(key=ACCESS_TOKEN_COOKIE, path="/")
    response.delete_cookie(key=REFRESH_TOKEN_COOKIE, path="/")


# =============================================================================
# DEPENDENCIES (Dépendances réutilisables)
# =============================================================================

def get_token_from_request(
    token_header: str | None = Depends(oauth2_scheme),
    access_token_cookie: str | None = Cookie(default=None, alias=ACCESS_TOKEN_COOKIE),
) -> str | None:
    """
    Récupère le token depuis le header Authorization ou les cookies.
    
    Priorité: Header > Cookie
    Cela permet de supporter les deux méthodes d'authentification.
    """
    return token_header or access_token_cookie


def get_current_user(
    token: str | None = Depends(get_token_from_request),
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
    
    if not token:
        raise credentials_exception
    
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


def get_current_user_optional(
    token: str | None = Depends(get_token_from_request),
    db: Session = Depends(get_db),
) -> User | None:
    """
    Comme get_current_user mais retourne None si non authentifié.
    
    Utile pour les routes qui fonctionnent avec ou sans authentification.
    """
    if not token:
        return None
    
    try:
        return get_current_user(token, db)
    except HTTPException:
        return None


# =============================================================================
# ROUTES - Basic Auth
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
def login(
    login_data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Connexion d'un utilisateur.
    
    - Vérifie les identifiants (email + mot de passe)
    - Génère un access token (courte durée) et un refresh token (longue durée)
    - Définit les cookies httpOnly ET retourne les tokens dans la réponse
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
    
    # Définit les cookies httpOnly
    set_auth_cookies(response, access_token, refresh_token)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout and clear tokens",
    description="Clear authentication cookies.",
)
def logout(response: Response) -> MessageResponse:
    """
    Déconnexion de l'utilisateur.
    
    Supprime les cookies d'authentification.
    Note: Les tokens JWT restent valides jusqu'à expiration.
    Pour une révocation complète, implémenter une blacklist de tokens.
    """
    clear_auth_cookies(response)
    return MessageResponse(message="Successfully logged out")


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Get a new access token using a valid refresh token.",
)
def refresh(
    response: Response,
    refresh_data: RefreshRequest | None = None,
    refresh_token_cookie: str | None = Cookie(default=None, alias=REFRESH_TOKEN_COOKIE),
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Rafraîchit un access token.
    
    Le refresh token peut être fourni:
    - Dans le body (refresh_data.refresh_token)
    - Dans les cookies (refresh_token_cookie)
    
    Le refresh token a une durée de vie plus longue (7 jours par défaut).
    Il permet d'obtenir un nouveau access token sans redemander le mot de passe.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Récupère le refresh token (body > cookie)
    token = refresh_data.refresh_token if refresh_data else refresh_token_cookie
    if not token:
        raise credentials_exception
    
    # Décode le refresh token
    payload = decode_token(token)
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
    
    # Met à jour les cookies
    set_auth_cookies(response, access_token, new_refresh_token)
    
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


# =============================================================================
# ROUTES - OAuth Providers Info
# =============================================================================

@router.get(
    "/providers",
    summary="Get configured OAuth providers",
    description="Returns which OAuth providers are configured and available.",
)
def get_providers() -> dict:
    """
    Retourne la liste des providers OAuth configurés.
    
    Permet au frontend de savoir quels boutons OAuth afficher.
    """
    return {
        "google": oauth.is_google_configured(),
    }


# =============================================================================
# ROUTES - Google OAuth
# =============================================================================

@router.get(
    "/google/url",
    response_model=OAuthURLResponse,
    summary="Get Google OAuth URL",
    description="Get the authorization URL for Google Sign-In.",
)
def get_google_url(redirect_uri: str) -> OAuthURLResponse:
    """
    Génère l'URL d'autorisation Google OAuth.
    
    Le frontend redirige l'utilisateur vers cette URL.
    Après authentification, Google redirige vers redirect_uri avec un code.
    """
    if not oauth.is_google_configured():
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured",
        )
    
    authorization_url, state = oauth.get_google_auth_url(redirect_uri)
    return OAuthURLResponse(authorization_url=authorization_url, state=state)


@router.post(
    "/google/callback",
    response_model=TokenResponse,
    summary="Google OAuth callback",
    description="Exchange Google authorization code for tokens.",
)
async def google_callback(
    oauth_data: OAuthLoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Callback Google OAuth.
    
    Le frontend envoie le code d'autorisation reçu de Google.
    L'API l'échange contre les infos utilisateur et génère des tokens JWT.
    """
    if not oauth.is_google_configured():
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured",
        )
    
    try:
        # Échange le code contre les infos utilisateur
        user_info = await oauth.exchange_google_code(
            code=oauth_data.code,
            redirect_uri=oauth_data.redirect_uri,
        )
        
        # Crée ou récupère l'utilisateur
        user = service.get_or_create_oauth_user(
            db=db,
            email=user_info.email,
            full_name=user_info.name,
            provider=AuthProvider.GOOGLE,
            provider_user_id=user_info.provider_user_id,
            avatar_url=user_info.picture,
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    
    # Génère les tokens
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    # Définit les cookies
    set_auth_cookies(response, access_token, refresh_token)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )

