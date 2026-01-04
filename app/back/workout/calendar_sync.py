"""
Synchronisation avec Google Calendar API.

Ce module permet de :
- Connecter un compte Google Calendar via OAuth
- Créer/mettre à jour/supprimer des événements dans Google Calendar
- Synchroniser automatiquement les séances planifiées

Configuration requise dans .env :
    GOOGLE_CALENDAR_CLIENT_ID=xxxxx.apps.googleusercontent.com
    GOOGLE_CALENDAR_CLIENT_SECRET=xxxxx
"""

from typing import Optional
from datetime import datetime, timedelta
import httpx
from urllib.parse import urlencode

from core.config import settings


# =============================================================================
# OAuth Flow
# =============================================================================

def get_google_calendar_auth_url(redirect_uri: str, state: str) -> str:
    """
    Génère l'URL d'autorisation Google Calendar.
    
    Args:
        redirect_uri: URL de callback (ex: https://mylifeplanner.space/auth/callback/google-calendar)
        state: Token anti-CSRF (à stocker en session)
    
    Returns:
        URL vers laquelle rediriger l'utilisateur
    """
    client_id = settings.GOOGLE_CALENDAR_CLIENT_ID or settings.GOOGLE_CLIENT_ID
    
    if not client_id:
        raise ValueError("GOOGLE_CALENDAR_CLIENT_ID or GOOGLE_CLIENT_ID must be set")
    
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/calendar.events",
        "access_type": "offline",
        "prompt": "consent",  # Force refresh token
        "state": state,
    }
    
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"


async def exchange_code_for_tokens(code: str, redirect_uri: str) -> dict:
    """
    Échange le code d'autorisation contre des tokens.
    
    Args:
        code: Code reçu après autorisation
        redirect_uri: Même URL que pour l'autorisation
    
    Returns:
        Dict contenant access_token, refresh_token, expires_in
    """
    client_id = settings.GOOGLE_CALENDAR_CLIENT_ID or settings.GOOGLE_CLIENT_ID
    client_secret = settings.GOOGLE_CALENDAR_CLIENT_SECRET or settings.GOOGLE_CLIENT_SECRET
    
    if not client_id or not client_secret:
        raise ValueError("Google Calendar credentials not configured")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
        )
        
        if response.status_code != 200:
            raise ValueError(f"Failed to exchange code: {response.text}")
        
        return response.json()


async def refresh_access_token(refresh_token: str) -> dict:
    """
    Rafraîchit l'access token avec le refresh token.
    
    Args:
        refresh_token: Token de rafraîchissement stocké en DB
    
    Returns:
        Dict contenant access_token, expires_in
    """
    client_id = settings.GOOGLE_CALENDAR_CLIENT_ID or settings.GOOGLE_CLIENT_ID
    client_secret = settings.GOOGLE_CALENDAR_CLIENT_SECRET or settings.GOOGLE_CLIENT_SECRET
    
    if not client_id or not client_secret:
        raise ValueError("Google Calendar credentials not configured")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
        
        if response.status_code != 200:
            raise ValueError(f"Failed to refresh token: {response.text}")
        
        return response.json()


# =============================================================================
# Calendar Events
# =============================================================================

async def create_calendar_event(
    access_token: str,
    title: str,
    description: str,
    start_time: datetime,
    end_time: Optional[datetime] = None,
    calendar_id: str = "primary",
) -> dict:
    """
    Crée un événement dans Google Calendar.
    
    Args:
        access_token: Token d'accès valide
        title: Titre de l'événement
        description: Description
        start_time: Date/heure de début
        end_time: Date/heure de fin (default: +1h)
        calendar_id: ID du calendrier (default: principal)
    
    Returns:
        Événement créé avec son ID
    """
    if end_time is None:
        end_time = start_time + timedelta(hours=1)
    
    event = {
        "summary": f"🏋️ {title}",
        "description": description,
        "start": {
            "dateTime": start_time.isoformat(),
            "timeZone": "Europe/Paris",
        },
        "end": {
            "dateTime": end_time.isoformat(),
            "timeZone": "Europe/Paris",
        },
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "popup", "minutes": 30},
            ],
        },
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events",
            headers={"Authorization": f"Bearer {access_token}"},
            json=event,
        )
        
        if response.status_code not in (200, 201):
            raise ValueError(f"Failed to create event: {response.text}")
        
        return response.json()


async def update_calendar_event(
    access_token: str,
    event_id: str,
    title: str,
    description: str,
    start_time: datetime,
    end_time: Optional[datetime] = None,
    calendar_id: str = "primary",
) -> dict:
    """
    Met à jour un événement dans Google Calendar.
    """
    if end_time is None:
        end_time = start_time + timedelta(hours=1)
    
    event = {
        "summary": f"🏋️ {title}",
        "description": description,
        "start": {
            "dateTime": start_time.isoformat(),
            "timeZone": "Europe/Paris",
        },
        "end": {
            "dateTime": end_time.isoformat(),
            "timeZone": "Europe/Paris",
        },
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.put(
            f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events/{event_id}",
            headers={"Authorization": f"Bearer {access_token}"},
            json=event,
        )
        
        if response.status_code != 200:
            raise ValueError(f"Failed to update event: {response.text}")
        
        return response.json()


async def delete_calendar_event(
    access_token: str,
    event_id: str,
    calendar_id: str = "primary",
) -> bool:
    """
    Supprime un événement dans Google Calendar.
    """
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events/{event_id}",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        
        return response.status_code == 204


# =============================================================================
# Helper pour synchronisation avec les sessions
# =============================================================================

async def sync_session_to_calendar(
    refresh_token: str,
    session_id: int,
    session_name: str,
    activity_type: str,
    scheduled_at: datetime,
    existing_event_id: Optional[str] = None,
) -> Optional[str]:
    """
    Synchronise une session avec Google Calendar.
    
    Args:
        refresh_token: Token de l'utilisateur
        session_id: ID de la session
        session_name: Nom de la session
        activity_type: Type d'activité
        scheduled_at: Date/heure planifiée
        existing_event_id: ID de l'événement existant (pour mise à jour)
    
    Returns:
        ID de l'événement Google Calendar (à stocker en DB)
    """
    try:
        # Rafraîchir le token
        tokens = await refresh_access_token(refresh_token)
        access_token = tokens.get("access_token")
        
        if not access_token:
            return None
        
        description = f"Séance de {activity_type}\n\nLife Planner - Session #{session_id}"
        
        if existing_event_id:
            # Mise à jour
            result = await update_calendar_event(
                access_token,
                existing_event_id,
                session_name,
                description,
                scheduled_at,
            )
        else:
            # Création
            result = await create_calendar_event(
                access_token,
                session_name,
                description,
                scheduled_at,
            )
        
        return result.get("id")
        
    except Exception as e:
        # Log l'erreur mais ne bloque pas l'opération
        print(f"Google Calendar sync error: {e}")
        return existing_event_id  # Retourne l'ID existant si erreur


async def delete_session_from_calendar(
    refresh_token: str,
    event_id: str,
) -> bool:
    """
    Supprime une session de Google Calendar.
    """
    try:
        tokens = await refresh_access_token(refresh_token)
        access_token = tokens.get("access_token")
        
        if not access_token:
            return False
        
        return await delete_calendar_event(access_token, event_id)
        
    except Exception as e:
        print(f"Google Calendar delete error: {e}")
        return False
