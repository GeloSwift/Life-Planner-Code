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
    
    from workout.models import UserActivityType, WorkoutSessionExercise
    from sqlalchemy.orm import joinedload
    
    # Récupérer les séances planifiées avec leurs exercices et les détails de chaque exercice
    sessions = db.query(WorkoutSession).options(
        joinedload(WorkoutSession.exercises).joinedload(WorkoutSessionExercise.exercise)
    ).filter(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.status == SessionStatus.PLANIFIEE,
        WorkoutSession.scheduled_at.isnot(None),
    ).all()
    
    # Récupérer les types d'activités pour les noms
    activity_types_map = {
        at.id: at.name 
        for at in db.query(UserActivityType).filter(
            UserActivityType.user_id == current_user.id
        ).all()
    }
    
    synced_count = 0
    errors = []
    
    for session in sessions:
        try:
            # Construire la liste des types d'activités
            activity_names = []
            
            # 1) Essayer depuis custom_activity_type_ids
            if session.custom_activity_type_ids:
                import json
                try:
                    ids = json.loads(session.custom_activity_type_ids) if isinstance(session.custom_activity_type_ids, str) else session.custom_activity_type_ids
                    for aid in ids:
                        if aid in activity_types_map:
                            activity_names.append(activity_types_map[aid])
                except Exception:
                    pass
            
            # 2) Essayer depuis custom_activity_type_id (singulier)
            if not activity_names and session.custom_activity_type_id:
                if session.custom_activity_type_id in activity_types_map:
                    activity_names.append(activity_types_map[session.custom_activity_type_id])
            
            # 3) Fallback: récupérer depuis les exercices de la séance
            if not activity_names and session.exercises:
                seen_ids = set()
                for ex in session.exercises:
                    if ex.exercise and ex.exercise.custom_activity_type_id:
                        aid = ex.exercise.custom_activity_type_id
                        if aid not in seen_ids and aid in activity_types_map:
                            activity_names.append(activity_types_map[aid])
                            seen_ids.add(aid)
            
            # 4) Fallback ultime: type d'activité de base
            if not activity_names:
                activity_names = [session.activity_type.value.capitalize()]
            
            # Construire la liste des exercices
            exercises_data = []
            for ex in (session.exercises or []):
                exercises_data.append({
                    "name": ex.exercise.name if ex.exercise else f"Exercice {ex.exercise_id}",
                    "sets": ex.target_sets,
                    "reps": ex.target_reps,
                    "weight": ex.target_weight,
                })
            
            event_id = await sync_session_to_calendar(
                current_user.google_calendar_refresh_token,
                session.id,
                session.name,
                activity_names,
                session.scheduled_at,
                exercises_data,
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


@router.post("/sync/{session_id}", summary="Synchroniser une séance spécifique")
async def sync_single_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Synchronise une séance spécifique avec Google Calendar.
    """
    from workout.models import WorkoutSession, UserActivityType, WorkoutSessionExercise
    from workout.calendar_sync import sync_session_to_calendar
    from sqlalchemy.orm import joinedload
    import json
    
    if not current_user.google_calendar_connected or not current_user.google_calendar_refresh_token:
        raise HTTPException(
            status_code=400,
            detail="Google Calendar n'est pas connecté"
        )
    
    # Récupérer la séance avec ses exercices et les détails de chaque exercice
    session = db.query(WorkoutSession).options(
        joinedload(WorkoutSession.exercises).joinedload(WorkoutSessionExercise.exercise)
    ).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.id,
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Séance non trouvée")
    
    if not session.scheduled_at:
        raise HTTPException(status_code=400, detail="Cette séance n'a pas de date planifiée")
    
    # Récupérer les types d'activités
    activity_types_map = {
        at.id: at.name 
        for at in db.query(UserActivityType).filter(
            UserActivityType.user_id == current_user.id
        ).all()
    }
    
    # Construire la liste des types d'activités
    activity_names = []
    
    # 1) Essayer depuis custom_activity_type_ids
    if session.custom_activity_type_ids:
        try:
            ids = json.loads(session.custom_activity_type_ids) if isinstance(session.custom_activity_type_ids, str) else session.custom_activity_type_ids
            for aid in ids:
                if aid in activity_types_map:
                    activity_names.append(activity_types_map[aid])
        except Exception:
            pass
    
    # 2) Essayer depuis custom_activity_type_id (singulier)
    if not activity_names and session.custom_activity_type_id:
        if session.custom_activity_type_id in activity_types_map:
            activity_names.append(activity_types_map[session.custom_activity_type_id])
    
    # 3) Fallback: récupérer depuis les exercices de la séance
    if not activity_names and session.exercises:
        seen_ids = set()
        for ex in session.exercises:
            if ex.exercise and ex.exercise.custom_activity_type_id:
                aid = ex.exercise.custom_activity_type_id
                if aid not in seen_ids and aid in activity_types_map:
                    activity_names.append(activity_types_map[aid])
                    seen_ids.add(aid)
    
    # 4) Fallback ultime: type d'activité de base
    if not activity_names:
        activity_names = [session.activity_type.value.capitalize()]
    
    # Construire la liste des exercices
    exercises_data = []
    for ex in (session.exercises or []):
        exercises_data.append({
            "name": ex.exercise.name if ex.exercise else f"Exercice {ex.exercise_id}",
            "sets": ex.target_sets,
            "reps": ex.target_reps,
            "weight": ex.target_weight,
        })
    
    event_id = await sync_session_to_calendar(
        current_user.google_calendar_refresh_token,
        session.id,
        session.name,
        activity_names,
        session.scheduled_at,
        exercises_data,
        session.google_calendar_event_id,
    )
    
    if event_id:
        session.google_calendar_event_id = event_id
        db.commit()
        return {"success": True, "event_id": event_id}
    
    raise HTTPException(status_code=500, detail="Erreur lors de la synchronisation")
