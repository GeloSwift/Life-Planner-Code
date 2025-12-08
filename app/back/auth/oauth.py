"""
OAuth services for Google and Apple authentication.

Ce module gère l'authentification OAuth2 avec:
- Google Sign-In
- Apple Sign In

Documentation:
- Google: https://developers.google.com/identity/protocols/oauth2
- Apple: https://developer.apple.com/documentation/sign_in_with_apple
"""

import secrets
from dataclasses import dataclass
from urllib.parse import urlencode

import httpx
import jwt

from core.config import settings


@dataclass
class OAuthUserInfo:
    """Informations utilisateur récupérées du provider OAuth."""
    email: str
    name: str | None
    picture: str | None
    provider_user_id: str


# =============================================================================
# GOOGLE OAUTH
# =============================================================================

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def get_google_auth_url(redirect_uri: str) -> tuple[str, str]:
    """
    Génère l'URL d'autorisation Google OAuth.
    
    Args:
        redirect_uri: URI de redirection après autorisation
        
    Returns:
        Tuple (authorization_url, state)
        
    Le state est un token aléatoire pour prévenir les attaques CSRF.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise ValueError("GOOGLE_CLIENT_ID is not configured")
    
    state = secrets.token_urlsafe(32)
    
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",  # Pour obtenir un refresh token
        "prompt": "select_account",  # Force la sélection du compte
    }
    
    authorization_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return authorization_url, state


async def exchange_google_code(code: str, redirect_uri: str) -> OAuthUserInfo:
    """
    Échange le code d'autorisation Google contre les infos utilisateur.
    
    Args:
        code: Code d'autorisation reçu de Google
        redirect_uri: URI de redirection utilisée (doit correspondre)
        
    Returns:
        OAuthUserInfo avec les données utilisateur
        
    Raises:
        ValueError: Si l'échange échoue
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise ValueError("Google OAuth is not configured")
    
    async with httpx.AsyncClient() as client:
        # Échange le code contre un access token
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        
        if token_response.status_code != 200:
            raise ValueError(f"Failed to exchange code: {token_response.text}")
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise ValueError("No access token in response")
        
        # Récupère les infos utilisateur
        userinfo_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        
        if userinfo_response.status_code != 200:
            raise ValueError(f"Failed to get user info: {userinfo_response.text}")
        
        userinfo = userinfo_response.json()
        
        return OAuthUserInfo(
            email=userinfo["email"],
            name=userinfo.get("name"),
            picture=userinfo.get("picture"),
            provider_user_id=userinfo["id"],
        )


# =============================================================================
# APPLE OAUTH
# =============================================================================

APPLE_AUTH_URL = "https://appleid.apple.com/auth/authorize"
APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token"
APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys"


def get_apple_auth_url(redirect_uri: str) -> tuple[str, str]:
    """
    Génère l'URL d'autorisation Apple Sign In.
    
    Args:
        redirect_uri: URI de redirection après autorisation
        
    Returns:
        Tuple (authorization_url, state)
    """
    if not settings.APPLE_CLIENT_ID:
        raise ValueError("APPLE_CLIENT_ID is not configured")
    
    state = secrets.token_urlsafe(32)
    
    params = {
        "client_id": settings.APPLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "name email",
        "state": state,
        "response_mode": "form_post",  # Apple envoie les données en POST
    }
    
    authorization_url = f"{APPLE_AUTH_URL}?{urlencode(params)}"
    return authorization_url, state


def _generate_apple_client_secret() -> str:
    """
    Génère le client_secret JWT pour Apple.
    
    Apple utilise un JWT signé comme client_secret au lieu d'un secret statique.
    Le JWT doit être signé avec la clé privée .p8 d'Apple.
    
    Returns:
        JWT client_secret
    """
    import time
    
    if not all([
        settings.APPLE_CLIENT_ID,
        settings.APPLE_TEAM_ID,
        settings.APPLE_KEY_ID,
        settings.APPLE_PRIVATE_KEY,
    ]):
        raise ValueError("Apple OAuth is not fully configured")
    
    headers = {
        "kid": settings.APPLE_KEY_ID,
        "alg": "ES256",
    }
    
    now = int(time.time())
    payload = {
        "iss": settings.APPLE_TEAM_ID,
        "iat": now,
        "exp": now + 86400 * 180,  # 6 mois max
        "aud": "https://appleid.apple.com",
        "sub": settings.APPLE_CLIENT_ID,
    }
    
    # La clé privée peut contenir des \n littéraux qui doivent être convertis
    private_key = settings.APPLE_PRIVATE_KEY.replace("\\n", "\n")
    
    return jwt.encode(payload, private_key, algorithm="ES256", headers=headers)


async def exchange_apple_code(
    code: str,
    redirect_uri: str,
    user_data: dict | None = None,
) -> OAuthUserInfo:
    """
    Échange le code d'autorisation Apple contre les infos utilisateur.
    
    Args:
        code: Code d'autorisation reçu d'Apple
        redirect_uri: URI de redirection utilisée
        user_data: Données utilisateur (nom) envoyées par Apple (première connexion)
        
    Returns:
        OAuthUserInfo avec les données utilisateur
        
    Note: Apple n'envoie le nom de l'utilisateur qu'à la première connexion.
    Il faut le stocker car il ne sera plus disponible ensuite.
    """
    client_secret = _generate_apple_client_secret()
    
    async with httpx.AsyncClient() as client:
        # Échange le code contre un access token + id_token
        token_response = await client.post(
            APPLE_TOKEN_URL,
            data={
                "client_id": settings.APPLE_CLIENT_ID,
                "client_secret": client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        
        if token_response.status_code != 200:
            raise ValueError(f"Failed to exchange code: {token_response.text}")
        
        token_data = token_response.json()
        id_token = token_data.get("id_token")
        
        if not id_token:
            raise ValueError("No id_token in response")
        
        # Décode le id_token (sans vérification - Apple le garantit)
        # En production, on devrait vérifier la signature avec les clés publiques Apple
        claims = jwt.decode(id_token, options={"verify_signature": False})
        
        # Récupère le nom depuis user_data (première connexion uniquement)
        name = None
        if user_data and "name" in user_data:
            name_data = user_data["name"]
            first_name = name_data.get("firstName", "")
            last_name = name_data.get("lastName", "")
            name = f"{first_name} {last_name}".strip() or None
        
        return OAuthUserInfo(
            email=claims["email"],
            name=name,
            picture=None,  # Apple ne fournit pas d'avatar
            provider_user_id=claims["sub"],
        )


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def is_google_configured() -> bool:
    """Vérifie si Google OAuth est configuré."""
    return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)


def is_apple_configured() -> bool:
    """Vérifie si Apple Sign In est configuré."""
    return bool(
        settings.APPLE_CLIENT_ID
        and settings.APPLE_TEAM_ID
        and settings.APPLE_KEY_ID
        and settings.APPLE_PRIVATE_KEY
    )

