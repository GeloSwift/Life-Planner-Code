"""
OAuth services for Google authentication.

Ce module gère l'authentification OAuth2 avec Google Sign-In.

Documentation:
- Google: https://developers.google.com/identity/protocols/oauth2
"""

import secrets
from dataclasses import dataclass
from urllib.parse import urlencode

import httpx

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
# HELPER FUNCTIONS
# =============================================================================

def is_google_configured() -> bool:
    """Vérifie si Google OAuth est configuré."""
    return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)

