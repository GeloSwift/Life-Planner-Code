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
import pytz
import json

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
# Recurrence Helpers
# =============================================================================

def build_google_calendar_recurrence(
    recurrence_type: Optional[str],
    recurrence_data: Optional[str],
) -> Optional[list[str]]:
    """
    Construit la règle de récurrence pour Google Calendar.
    
    Args:
        recurrence_type: "daily", "weekly", "monthly"
        recurrence_data: JSON string avec les données (jours de la semaine pour weekly, jours du mois pour monthly)
    
    Returns:
        Liste de strings RRULE pour Google Calendar, ou None si pas de récurrence
    """
    if not recurrence_type:
        return None
    
    # Mapping des jours de la semaine (français -> iCalendar)
    day_mapping = {
        "monday": "MO",
        "tuesday": "TU",
        "wednesday": "WE",
        "thursday": "TH",
        "friday": "FR",
        "saturday": "SA",
        "sunday": "SU",
        "lundi": "MO",
        "mardi": "TU",
        "mercredi": "WE",
        "jeudi": "TH",
        "vendredi": "FR",
        "samedi": "SA",
        "dimanche": "SU",
    }
    
    if recurrence_type == "daily":
        return ["RRULE:FREQ=DAILY"]
    
    elif recurrence_type == "weekly":
        if not recurrence_data:
            return ["RRULE:FREQ=WEEKLY"]
        
        try:
            days = json.loads(recurrence_data) if isinstance(recurrence_data, str) else recurrence_data
            if not isinstance(days, list) or len(days) == 0:
                return ["RRULE:FREQ=WEEKLY"]
            
            # Convertir les jours en format iCalendar
            byday = []
            for day in days:
                day_str = str(day).lower()
                if day_str in day_mapping:
                    byday.append(day_mapping[day_str])
            
            if byday:
                return [f"RRULE:FREQ=WEEKLY;BYDAY={','.join(byday)}"]
            else:
                return ["RRULE:FREQ=WEEKLY"]
        except Exception:
            return ["RRULE:FREQ=WEEKLY"]
    
    elif recurrence_type == "monthly":
        if not recurrence_data:
            return ["RRULE:FREQ=MONTHLY"]
        
        try:
            days = json.loads(recurrence_data) if isinstance(recurrence_data, str) else recurrence_data
            if not isinstance(days, list) or len(days) == 0:
                return ["RRULE:FREQ=MONTHLY"]
            
            # Filtrer et convertir en entiers (jours du mois)
            monthdays = []
            for day in days:
                try:
                    day_int = int(day)
                    if 1 <= day_int <= 31:
                        monthdays.append(str(day_int))
                except (ValueError, TypeError):
                    continue
            
            if monthdays:
                return [f"RRULE:FREQ=MONTHLY;BYMONTHDAY={','.join(monthdays)}"]
            else:
                return ["RRULE:FREQ=MONTHLY"]
        except Exception:
            return ["RRULE:FREQ=MONTHLY"]
    
    return None


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
    recurrence: Optional[list[str]] = None,
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
        end_time = start_time + timedelta(hours=1, minutes=30)  # 1h30 par défaut
    
    event = {
        "summary": title,
        "description": description,
        "colorId": "11",  # Tomato (Rouge)
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
    
    # Ajouter la récurrence si fournie
    if recurrence:
        event["recurrence"] = recurrence
    
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
    recurrence: Optional[list[str]] = None,
) -> dict:
    """
    Met à jour un événement dans Google Calendar.
    """
    if end_time is None:
        end_time = start_time + timedelta(hours=1, minutes=30)  # 1h30 par défaut
    
    # Convertir en Europe/Paris si le datetime a un timezone (UTC -> Europe/Paris)
    paris_tz = pytz.timezone("Europe/Paris")
    if start_time.tzinfo is None:
        start_time_paris = paris_tz.localize(start_time)
    else:
        start_time_paris = start_time.astimezone(paris_tz)
    
    if end_time.tzinfo is None:
        end_time_paris = paris_tz.localize(end_time)
    else:
        end_time_paris = end_time.astimezone(paris_tz)
    
    event = {
        "summary": title,
        "description": description,
        "colorId": "11",  # Tomato (Rouge)
        "start": {
            "dateTime": start_time_paris.isoformat(),
            "timeZone": "Europe/Paris",
        },
        "end": {
            "dateTime": end_time_paris.isoformat(),
            "timeZone": "Europe/Paris",
        },
    }
    
    # Ajouter la récurrence si fournie
    if recurrence:
        event["recurrence"] = recurrence
    
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

def build_session_description(
    session_id: int,
    activity_types: list[str],
    exercises: list[dict],
    frontend_url: str,
) -> str:
    """
    Construit une description claire et organisée pour l'événement Google Calendar.
    Hiérarchie visuelle optimisée pour une lecture rapide.
    """
    lines = []
    
    # === INFORMATIONS ESSENTIELLES ===
    if activity_types:
        lines.append("════════════════════")
        lines.append("📋 ACTIVITÉS")
        lines.append("════════════════════")
        for activity in activity_types:
            lines.append(f"- {activity}")
        lines.append("")
    
    # === EXERCICES (Informations détaillées) ===
    if exercises:
        lines.append("════════════════════")
        lines.append("💪 EXERCICES PLANIFIÉS")
        lines.append("════════════════════")
        for idx, ex in enumerate(exercises[:10], 1):  # Max 10 exercices
            name = ex.get("name", "Exercice")
            sets = ex.get("sets", "")
            reps = ex.get("reps", "")
            weight = ex.get("weight", "")
            
            details = []
            if sets:
                details.append(f"{sets} séries")
            if reps:
                details.append(f"{reps} reps")
            if weight:
                details.append(f"{weight}kg")
            
            detail_str = f" → {', '.join(details)}" if details else ""
            lines.append(f"{idx}. {name}{detail_str}")
        
        if len(exercises) > 10:
            lines.append(f"... et {len(exercises) - 10} exercice(s) supplémentaire(s)")
        
        lines.append("")
    
    # === ACTION RAPIDE ===
    lines.append("════════════════════")
    lines.append("🚀 LANCER LA SÉANCE")
    lines.append("════════════════════")
    session_url = f"{frontend_url}/workout/sessions/{session_id}"
    # S'assurer que le lien est sur une ligne séparée et bien formaté
    lines.append(session_url)
    lines.append("")  # Ligne vide pour séparer le lien
    
    return "\n".join(lines)


async def sync_session_to_calendar(
    refresh_token: str,
    session_id: int,
    session_name: str,
    activity_types: list[str],
    scheduled_at: datetime,
    exercises: Optional[list[dict]] = None,
    existing_event_id: Optional[str] = None,
    recurrence_type: Optional[str] = None,
    recurrence_data: Optional[str] = None,
) -> Optional[str]:
    """
    Synchronise une session avec Google Calendar.
    
    Args:
        refresh_token: Token de l'utilisateur
        session_id: ID de la session
        session_name: Nom de la session
        activity_types: Liste des types d'activités
        scheduled_at: Date/heure planifiée
        exercises: Liste des exercices avec leurs détails
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
        
        # Construire la description avec les détails
        frontend_url = settings.FRONTEND_URL or "https://mylifeplanner.space"
        description = build_session_description(
            session_id,
            activity_types,
            exercises or [],
            frontend_url,
        )
        
        # Construire la récurrence si nécessaire
        recurrence = build_google_calendar_recurrence(recurrence_type, recurrence_data)
        
        if existing_event_id:
            # Mise à jour
            result = await update_calendar_event(
                access_token,
                existing_event_id,
                session_name,
                description,
                scheduled_at,
                recurrence=recurrence,
            )
        else:
            # Création
            result = await create_calendar_event(
                access_token,
                session_name,
                description,
                scheduled_at,
                recurrence=recurrence,
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
