"""
Routes pour la synchronisation Google Calendar.

Endpoints:
- GET /workout/calendar/connect - Initie la connexion OAuth
- GET /workout/calendar/callback - Callback OAuth
- GET /workout/calendar/status - Statut de la connexion
- DELETE /workout/calendar/disconnect - Déconnexion
"""

import secrets

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from core.db import get_db
from core.config import settings
from auth.models import User
from auth.routes import get_current_user
from workout.calendar_sync import (
    get_google_calendar_auth_url,
    exchange_code_for_tokens,
)


router = APIRouter(prefix="/workout/calendar", tags=["Calendar Sync"])


class CalendarStatusResponse(BaseModel):
    """Statut de la connexion Google Calendar."""
    connected: bool
    message: str


@router.get("/connect", summary="Initier la connexion Google Calendar")
async def connect_google_calendar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Génère l'URL d'autorisation et redirige vers Google.
    
    L'utilisateur sera redirigé vers /auth/callback/google-calendar après autorisation.
    """
    # Vérifier que les credentials sont configurés
    client_id = settings.GOOGLE_CALENDAR_CLIENT_ID or settings.GOOGLE_CLIENT_ID
    if not client_id:
        raise HTTPException(
            status_code=500,
            detail="Google Calendar n'est pas configuré sur ce serveur"
        )
    
    # Générer un state pour la sécurité
    state = f"{current_user.id}:{secrets.token_urlsafe(16)}"
    
    # Construire l'URL de redirection
    redirect_uri = f"{settings.FRONTEND_URL}/auth/callback/google-calendar"
    
    auth_url = get_google_calendar_auth_url(redirect_uri, state)
    
    return {"auth_url": auth_url, "state": state}


@router.get("/callback", summary="Callback OAuth Google Calendar")
async def google_calendar_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    Callback après autorisation Google.
    
    Échange le code contre des tokens et stocke le refresh_token.
    """
    try:
        # Extraire l'user_id du state
        user_id_str = state.split(":")[0]
        user_id = int(user_id_str)
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="State invalide")
    
    # Récupérer l'utilisateur
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Échanger le code contre des tokens
    redirect_uri = f"{settings.FRONTEND_URL}/auth/callback/google-calendar"
    
    try:
        tokens = await exchange_code_for_tokens(code, redirect_uri)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Stocker le refresh token
    refresh_token = tokens.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=400,
            detail="Impossible d'obtenir le refresh token. Veuillez réessayer."
        )
    
    user.google_calendar_refresh_token = refresh_token
    user.google_calendar_connected = True
    db.commit()
    
    return {
        "success": True,
        "message": "Google Calendar connecté avec succès"
    }


@router.get("/status", response_model=CalendarStatusResponse, summary="Statut de connexion")
async def get_calendar_status(
    current_user: User = Depends(get_current_user),
):
    """Vérifie si Google Calendar est connecté."""
    if current_user.google_calendar_connected and current_user.google_calendar_refresh_token:
        return CalendarStatusResponse(
            connected=True,
            message="Google Calendar est connecté"
        )
    
    return CalendarStatusResponse(
        connected=False,
        message="Google Calendar n'est pas connecté"
    )


@router.delete("/disconnect", summary="Déconnecter Google Calendar")
async def disconnect_google_calendar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Déconnecte Google Calendar de l'utilisateur."""
    current_user.google_calendar_refresh_token = None
    current_user.google_calendar_connected = False
    db.commit()
    
    return {"success": True, "message": "Google Calendar déconnecté"}


@router.post("/sync", summary="Synchroniser toutes les séances planifiées")
async def sync_all_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Synchronise toutes les séances planifiées avec Google Calendar.
    
    Crée des événements pour les séances qui n'en ont pas encore.
    """
    from workout.models import WorkoutSession, SessionStatus
    from workout.calendar_sync import sync_session_to_calendar
    
    if not current_user.google_calendar_connected or not current_user.google_calendar_refresh_token:
        raise HTTPException(
            status_code=400,
            detail="Google Calendar n'est pas connecté"
        )
    
    # Récupérer les séances planifiées sans event_id
    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.status == SessionStatus.PLANIFIEE,
        WorkoutSession.scheduled_at.isnot(None),
    ).all()
    
    synced_count = 0
    errors = []
    
    for session in sessions:
        try:
            event_id = await sync_session_to_calendar(
                current_user.google_calendar_refresh_token,
                session.id,
                session.name,
                session.activity_type.value,
                session.scheduled_at,
                session.google_calendar_event_id,
            )
            
            if event_id and event_id != session.google_calendar_event_id:
                session.google_calendar_event_id = event_id
                synced_count += 1
                
        except Exception as e:
            errors.append(f"Session {session.id}: {str(e)}")
    
    db.commit()
    
    return {
        "success": True,
        "synced": synced_count,
        "total": len(sessions),
        "errors": errors if errors else None,
    }
