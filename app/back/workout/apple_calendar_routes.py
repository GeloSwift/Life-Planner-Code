"""
Routes API pour l'intégration Apple Calendar via CalDAV.

Endpoints :
- POST /workout/apple-calendar/connect : Connecter avec Apple ID et mot de passe d'app
- GET /workout/apple-calendar/status : Vérifier le statut de connexion
- DELETE /workout/apple-calendar/disconnect : Déconnecter
- GET /workout/apple-calendar/calendars : Lister les calendriers disponibles
- POST /workout/apple-calendar/sync : Synchroniser toutes les séances
- POST /workout/apple-calendar/sync/{session_id} : Synchroniser une séance spécifique
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from core.db import get_db
from auth.routes import get_current_user
from auth.models import User


router = APIRouter(prefix="/apple-calendar", tags=["Apple Calendar"])


# =============================================================================
# Schemas
# =============================================================================

class AppleCalendarConnectRequest(BaseModel):
    apple_id: str
    app_password: str
    calendar_url: str | None = None  # Si non fourni, on utilisera le premier calendrier


class AppleCalendarStatusResponse(BaseModel):
    connected: bool
    apple_id: str | None = None
    calendar_url: str | None = None
    message: str


class AppleCalendarListResponse(BaseModel):
    calendars: list[dict]


# =============================================================================
# Routes
# =============================================================================

@router.post("/connect", summary="Connecter Apple Calendar")
async def connect_apple_calendar(
    request: AppleCalendarConnectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Connecte Apple Calendar avec les identifiants iCloud.
    
    L'utilisateur doit créer un mot de passe d'application sur appleid.apple.com
    pour pouvoir se connecter.
    """
    from workout.caldav_sync import discover_caldav_server
    
    # Vérifier les identifiants
    try:
        discovery = await discover_caldav_server(request.apple_id, request.app_password)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Impossible de se connecter à iCloud: {str(e)}"
        )
    
    # Déterminer l'URL du calendrier à utiliser
    calendar_url = request.calendar_url
    if not calendar_url and discovery.get("calendars"):
        # Utiliser le premier calendrier disponible
        calendar_url = discovery["calendars"][0]["href"]
    
    if not calendar_url:
        raise HTTPException(
            status_code=400,
            detail="Aucun calendrier trouvé dans votre compte iCloud"
        )
    
    # Stocker les informations
    current_user.apple_calendar_apple_id = request.apple_id
    current_user.apple_calendar_app_password = request.app_password
    current_user.apple_calendar_url = calendar_url
    current_user.apple_calendar_connected = True
    db.commit()
    
    return {
        "success": True,
        "message": "Apple Calendar connecté avec succès",
        "calendar_url": calendar_url,
        "calendars": discovery.get("calendars", []),
    }


@router.get("/status", response_model=AppleCalendarStatusResponse, summary="Statut de connexion")
async def get_apple_calendar_status(
    current_user: User = Depends(get_current_user),
):
    """Vérifie si Apple Calendar est connecté."""
    if current_user.apple_calendar_connected and current_user.apple_calendar_apple_id:
        return AppleCalendarStatusResponse(
            connected=True,
            apple_id=current_user.apple_calendar_apple_id,
            calendar_url=current_user.apple_calendar_url,
            message="Apple Calendar est connecté"
        )
    
    return AppleCalendarStatusResponse(
        connected=False,
        message="Apple Calendar n'est pas connecté"
    )


@router.delete("/disconnect", summary="Déconnecter Apple Calendar")
async def disconnect_apple_calendar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Déconnecte Apple Calendar de l'utilisateur."""
    current_user.apple_calendar_apple_id = None
    current_user.apple_calendar_app_password = None
    current_user.apple_calendar_url = None
    current_user.apple_calendar_connected = False
    db.commit()
    
    return {"success": True, "message": "Apple Calendar déconnecté"}


@router.get("/calendars", response_model=AppleCalendarListResponse, summary="Lister les calendriers")
async def list_apple_calendars(
    current_user: User = Depends(get_current_user),
):
    """Liste les calendriers disponibles dans le compte iCloud."""
    from workout.caldav_sync import discover_caldav_server
    
    if not current_user.apple_calendar_connected or not current_user.apple_calendar_apple_id:
        raise HTTPException(
            status_code=400,
            detail="Apple Calendar n'est pas connecté"
        )
    
    try:
        discovery = await discover_caldav_server(
            current_user.apple_calendar_apple_id,
            current_user.apple_calendar_app_password,
        )
        return AppleCalendarListResponse(calendars=discovery.get("calendars", []))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des calendriers: {str(e)}"
        )


@router.post("/sync", summary="Synchroniser toutes les séances planifiées")
async def sync_all_sessions_apple(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Synchronise toutes les séances planifiées avec Apple Calendar.
    """
    from workout.models import WorkoutSession, SessionStatus, UserActivityType, WorkoutSessionExercise
    from workout.caldav_sync import sync_session_to_apple_calendar
    from sqlalchemy.orm import joinedload
    import json
    
    if not current_user.apple_calendar_connected:
        raise HTTPException(
            status_code=400,
            detail="Apple Calendar n'est pas connecté"
        )
    
    # Récupérer les séances planifiées avec leurs exercices
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
            if session.custom_activity_type_ids:
                try:
                    ids = json.loads(session.custom_activity_type_ids) if isinstance(session.custom_activity_type_ids, str) else session.custom_activity_type_ids
                    for aid in ids:
                        if aid in activity_types_map:
                            activity_names.append(activity_types_map[aid])
                except Exception:
                    pass
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
            
            event_uid = await sync_session_to_apple_calendar(
                current_user.apple_calendar_apple_id,
                current_user.apple_calendar_app_password,
                current_user.apple_calendar_url,
                session.id,
                session.name,
                activity_names,
                session.scheduled_at,
                exercises_data,
                session.apple_calendar_event_uid,
            )
            
            if event_uid and event_uid != session.apple_calendar_event_uid:
                session.apple_calendar_event_uid = event_uid
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
async def sync_single_session_apple(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Synchronise une séance spécifique avec Apple Calendar.
    """
    from workout.models import WorkoutSession, UserActivityType, WorkoutSessionExercise
    from workout.caldav_sync import sync_session_to_apple_calendar
    from sqlalchemy.orm import joinedload
    import json
    
    if not current_user.apple_calendar_connected:
        raise HTTPException(
            status_code=400,
            detail="Apple Calendar n'est pas connecté"
        )
    
    # Récupérer la séance avec ses exercices
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
    if session.custom_activity_type_ids:
        try:
            ids = json.loads(session.custom_activity_type_ids) if isinstance(session.custom_activity_type_ids, str) else session.custom_activity_type_ids
            for aid in ids:
                if aid in activity_types_map:
                    activity_names.append(activity_types_map[aid])
        except Exception:
            pass
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
    
    event_uid = await sync_session_to_apple_calendar(
        current_user.apple_calendar_apple_id,
        current_user.apple_calendar_app_password,
        current_user.apple_calendar_url,
        session.id,
        session.name,
        activity_names,
        session.scheduled_at,
        exercises_data,
        session.apple_calendar_event_uid,
    )
    
    if event_uid:
        session.apple_calendar_event_uid = event_uid
        db.commit()
        return {"success": True, "event_uid": event_uid}
    
    raise HTTPException(status_code=500, detail="Erreur lors de la synchronisation")
