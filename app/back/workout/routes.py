"""
FastAPI routes for Workout Planner.

Endpoints pour :
- /workout/exercises : Gestion des exercices
- /workout/templates : Gestion des templates de séances
- /workout/sessions : Gestion des sessions d'entraînement
- /workout/weight : Gestion des pesées
- /workout/goals : Gestion des objectifs
- /workout/stats : Statistiques et dashboard
- /workout/calendar : Calendrier des séances
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.db import get_db
from auth.routes import get_current_user
from auth.models import User
from workout.models import ActivityType, MuscleGroup, SessionStatus, GoalType
from workout.schemas import (
    # Exercise
    ExerciseCreate,
    ExerciseUpdate,
    ExerciseResponse,
    # Template
    WorkoutTemplateCreate,
    WorkoutTemplateUpdate,
    WorkoutTemplateResponse,
    TemplateExerciseCreate,
    TemplateExerciseResponse,
    # Session
    WorkoutSessionCreate,
    WorkoutSessionUpdate,
    WorkoutSessionResponse,
    WorkoutSessionListResponse,
    WorkoutSetCreate,
    WorkoutSetUpdate,
    WorkoutSetResponse,
    # Weight
    WeightEntryCreate,
    WeightEntryUpdate,
    WeightEntryResponse,
    WeightProgressResponse,
    # Goal
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    # Stats
    WorkoutStatsResponse,
    DashboardResponse,
    CalendarResponse,
    CalendarEventResponse,
    # Activity Types
    UserActivityTypeCreate,
    UserActivityTypeUpdate,
    UserActivityTypeResponse,
    CustomFieldDefinitionCreate,
    CustomFieldDefinitionResponse,
    # Enums
    ActivityTypeEnum,
    MuscleGroupEnum,
    SessionStatusEnum,
    GoalTypeEnum,
)
from workout.service import (
    ExerciseService,
    TemplateService,
    SessionService,
    WeightService,
    GoalService,
    StatsService,
    ActivityTypeService,
)


router = APIRouter(prefix="/workout", tags=["Workout"])


# =============================================================================
# EXERCISE ROUTES
# =============================================================================

@router.get(
    "/exercises",
    response_model=list[ExerciseResponse],
    summary="Liste des exercices",
    description="Récupère les exercices (globaux + personnels de l'utilisateur).",
)
def get_exercises(
    activity_type: Optional[ActivityTypeEnum] = Query(None, description="Filtrer par type d'activité"),
    muscle_group: Optional[MuscleGroupEnum] = Query(None, description="Filtrer par groupe musculaire"),
    search: Optional[str] = Query(None, description="Rechercher par nom"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Liste les exercices disponibles."""
    activity = ActivityType(activity_type.value) if activity_type else None
    muscle = MuscleGroup(muscle_group.value) if muscle_group else None
    
    return ExerciseService.get_exercises(
        db, current_user.id, activity, muscle, search, skip, limit
    )


@router.get(
    "/exercises/{exercise_id}",
    response_model=ExerciseResponse,
    summary="Détail d'un exercice",
)
def get_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Récupère un exercice par son ID."""
    exercise = ExerciseService.get_exercise(db, exercise_id, current_user.id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercice non trouvé")
    return exercise


@router.post(
    "/exercises",
    response_model=ExerciseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un exercice",
)
def create_exercise(
    exercise: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crée un nouvel exercice personnel."""
    return ExerciseService.create_exercise(db, exercise, current_user.id)


@router.put(
    "/exercises/{exercise_id}",
    response_model=ExerciseResponse,
    summary="Modifier un exercice",
)
def update_exercise(
    exercise_id: int,
    exercise: ExerciseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Met à jour un exercice personnel."""
    updated = ExerciseService.update_exercise(db, exercise_id, exercise, current_user.id)
    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Exercice non trouvé ou vous n'avez pas les droits de modification"
        )
    return updated


@router.delete(
    "/exercises/{exercise_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un exercice",
)
def delete_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Supprime un exercice personnel."""
    if not ExerciseService.delete_exercise(db, exercise_id, current_user.id):
        raise HTTPException(
            status_code=404,
            detail="Exercice non trouvé ou vous n'avez pas les droits de suppression"
        )


# =============================================================================
# TEMPLATE ROUTES
# =============================================================================

@router.get(
    "/templates",
    response_model=list[WorkoutTemplateResponse],
    summary="Liste des templates",
)
def get_templates(
    activity_type: Optional[ActivityTypeEnum] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Liste les templates de l'utilisateur."""
    activity = ActivityType(activity_type.value) if activity_type else None
    return TemplateService.get_templates(db, current_user.id, activity, skip, limit)


@router.get(
    "/templates/{template_id}",
    response_model=WorkoutTemplateResponse,
    summary="Détail d'un template",
)
def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Récupère un template par son ID."""
    template = TemplateService.get_template(db, template_id, current_user.id)
    if not template:
        raise HTTPException(status_code=404, detail="Template non trouvé")
    return template


@router.post(
    "/templates",
    response_model=WorkoutTemplateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un template",
)
def create_template(
    template: WorkoutTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crée un nouveau template de séance."""
    return TemplateService.create_template(db, template, current_user.id)


@router.put(
    "/templates/{template_id}",
    response_model=WorkoutTemplateResponse,
    summary="Modifier un template",
)
def update_template(
    template_id: int,
    template: WorkoutTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Met à jour un template."""
    updated = TemplateService.update_template(db, template_id, template, current_user.id)
    if not updated:
        raise HTTPException(status_code=404, detail="Template non trouvé")
    return updated


@router.delete(
    "/templates/{template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un template",
)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Supprime un template."""
    if not TemplateService.delete_template(db, template_id, current_user.id):
        raise HTTPException(status_code=404, detail="Template non trouvé")


@router.post(
    "/templates/{template_id}/exercises",
    response_model=TemplateExerciseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ajouter un exercice au template",
)
def add_exercise_to_template(
    template_id: int,
    exercise: TemplateExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ajoute un exercice à un template."""
    result = TemplateService.add_exercise_to_template(
        db, template_id, exercise, current_user.id
    )
    if not result:
        raise HTTPException(status_code=404, detail="Template non trouvé")
    return result


@router.delete(
    "/templates/{template_id}/exercises/{exercise_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Retirer un exercice du template",
)
def remove_exercise_from_template(
    template_id: int,
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retire un exercice d'un template."""
    if not TemplateService.remove_exercise_from_template(
        db, template_id, exercise_id, current_user.id
    ):
        raise HTTPException(status_code=404, detail="Template ou exercice non trouvé")


# =============================================================================
# SESSION ROUTES
# =============================================================================

@router.get(
    "/sessions",
    response_model=list[WorkoutSessionResponse],
    summary="Liste des sessions",
)
def get_sessions(
    status_filter: Optional[SessionStatusEnum] = Query(None, alias="status"),
    activity_type: Optional[ActivityTypeEnum] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Liste les sessions de l'utilisateur."""
    session_status = SessionStatus(status_filter.value) if status_filter else None
    activity = ActivityType(activity_type.value) if activity_type else None
    
    return SessionService.get_sessions(
        db, current_user.id, session_status, activity, start_date, end_date, skip, limit
    )


@router.get(
    "/sessions/active",
    response_model=Optional[WorkoutSessionResponse],
    summary="Session en cours",
)
def get_active_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Récupère la session actuellement en cours."""
    return SessionService.get_active_session(db, current_user.id)


@router.get(
    "/sessions/{session_id}",
    response_model=WorkoutSessionResponse,
    summary="Détail d'une session",
)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Récupère une session par son ID."""
    session = SessionService.get_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    return session


@router.post(
    "/sessions",
    response_model=WorkoutSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer une session",
)
def create_session(
    session: WorkoutSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crée une nouvelle session d'entraînement."""
    return SessionService.create_session(db, session, current_user.id)


@router.post(
    "/sessions/{session_id}/start",
    response_model=WorkoutSessionResponse,
    summary="Démarrer une session",
)
def start_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Démarre une session (lance le timer)."""
    session = SessionService.start_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session non trouvée ou ne peut pas être démarrée"
        )
    return session


@router.post(
    "/sessions/{session_id}/end",
    response_model=WorkoutSessionResponse,
    summary="Terminer une session",
)
def end_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Termine une session en cours."""
    session = SessionService.end_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session non trouvée ou n'est pas en cours"
        )
    return session


@router.post(
    "/sessions/{session_id}/cancel",
    response_model=WorkoutSessionResponse,
    summary="Annuler une session",
)
def cancel_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Annule une session."""
    session = SessionService.cancel_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    return session


@router.put(
    "/sessions/{session_id}",
    response_model=WorkoutSessionResponse,
    summary="Modifier une session",
)
def update_session(
    session_id: int,
    session: WorkoutSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Met à jour une session."""
    updated = SessionService.update_session(db, session_id, session, current_user.id)
    if not updated:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    return updated


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer une session",
)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Supprime une session."""
    if not SessionService.delete_session(db, session_id, current_user.id):
        raise HTTPException(status_code=404, detail="Session non trouvée")


# =============================================================================
# SET ROUTES (Séries)
# =============================================================================

@router.post(
    "/sessions/{session_id}/exercises/{exercise_id}/sets",
    response_model=WorkoutSetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ajouter une série",
)
def add_set(
    session_id: int,
    exercise_id: int,
    set_data: WorkoutSetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ajoute une série à un exercice de la session."""
    result = SessionService.add_set(db, exercise_id, set_data, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="Exercice non trouvé")
    return result


@router.put(
    "/sets/{set_id}",
    response_model=WorkoutSetResponse,
    summary="Modifier une série",
)
def update_set(
    set_id: int,
    set_data: WorkoutSetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Met à jour une série (poids, reps, complété, etc.)."""
    result = SessionService.complete_set(db, set_id, set_data, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="Série non trouvée")
    return result


@router.post(
    "/sets/{set_id}/complete",
    response_model=WorkoutSetResponse,
    summary="Marquer une série comme complétée",
)
def complete_set(
    set_id: int,
    set_data: Optional[WorkoutSetUpdate] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marque une série comme complétée."""
    update = set_data or WorkoutSetUpdate()
    update.is_completed = True
    
    result = SessionService.complete_set(db, set_id, update, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="Série non trouvée")
    return result


# =============================================================================
# WEIGHT ROUTES
# =============================================================================

@router.get(
    "/weight",
    response_model=list[WeightEntryResponse],
    summary="Historique des pesées",
)
def get_weight_entries(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Récupère l'historique des pesées."""
    return WeightService.get_entries(
        db, current_user.id, start_date, end_date, skip, limit
    )


@router.get(
    "/weight/latest",
    response_model=Optional[WeightEntryResponse],
    summary="Dernière pesée",
)
def get_latest_weight(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Récupère la dernière pesée."""
    return WeightService.get_latest(db, current_user.id)


@router.get(
    "/weight/progress",
    response_model=WeightProgressResponse,
    summary="Évolution du poids",
)
def get_weight_progress(
    days: int = Query(30, ge=7, le=365, description="Nombre de jours d'historique"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Récupère l'évolution du poids avec statistiques."""
    entries = WeightService.get_entries(db, current_user.id, limit=days)
    stats = WeightService.get_stats(db, current_user.id, days)
    
    return WeightProgressResponse(
        entries=entries,
        stats=stats,
    )


@router.post(
    "/weight",
    response_model=WeightEntryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Enregistrer une pesée",
)
def create_weight_entry(
    entry: WeightEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Enregistre une nouvelle pesée."""
    return WeightService.create_entry(db, entry, current_user.id)


@router.put(
    "/weight/{entry_id}",
    response_model=WeightEntryResponse,
    summary="Modifier une pesée",
)
def update_weight_entry(
    entry_id: int,
    entry: WeightEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Met à jour une pesée."""
    updated = WeightService.update_entry(db, entry_id, entry, current_user.id)
    if not updated:
        raise HTTPException(status_code=404, detail="Pesée non trouvée")
    return updated


@router.delete(
    "/weight/{entry_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer une pesée",
)
def delete_weight_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Supprime une pesée."""
    if not WeightService.delete_entry(db, entry_id, current_user.id):
        raise HTTPException(status_code=404, detail="Pesée non trouvée")


# =============================================================================
# GOAL ROUTES
# =============================================================================

@router.get(
    "/goals",
    response_model=list[GoalResponse],
    summary="Liste des objectifs",
)
def get_goals(
    is_active: Optional[bool] = Query(None),
    goal_type: Optional[GoalTypeEnum] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Liste les objectifs de l'utilisateur."""
    g_type = GoalType(goal_type.value) if goal_type else None
    goals = GoalService.get_goals(db, current_user.id, is_active, g_type, skip, limit)
    
    # Ajouter progress_percentage
    result = []
    for g in goals:
        response = GoalResponse.model_validate(g)
        response.progress_percentage = g.progress_percentage
        result.append(response)
    
    return result


@router.get(
    "/goals/{goal_id}",
    response_model=GoalResponse,
    summary="Détail d'un objectif",
)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Récupère un objectif par son ID."""
    goal = GoalService.get_goal(db, goal_id, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Objectif non trouvé")
    
    response = GoalResponse.model_validate(goal)
    response.progress_percentage = goal.progress_percentage
    return response


@router.post(
    "/goals",
    response_model=GoalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un objectif",
)
def create_goal(
    goal: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crée un nouvel objectif."""
    created = GoalService.create_goal(db, goal, current_user.id)
    response = GoalResponse.model_validate(created)
    response.progress_percentage = created.progress_percentage
    return response


@router.put(
    "/goals/{goal_id}",
    response_model=GoalResponse,
    summary="Modifier un objectif",
)
def update_goal(
    goal_id: int,
    goal: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Met à jour un objectif."""
    updated = GoalService.update_goal(db, goal_id, goal, current_user.id)
    if not updated:
        raise HTTPException(status_code=404, detail="Objectif non trouvé")
    
    response = GoalResponse.model_validate(updated)
    response.progress_percentage = updated.progress_percentage
    return response


@router.delete(
    "/goals/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un objectif",
)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Supprime un objectif."""
    if not GoalService.delete_goal(db, goal_id, current_user.id):
        raise HTTPException(status_code=404, detail="Objectif non trouvé")


# =============================================================================
# STATS & DASHBOARD ROUTES
# =============================================================================

@router.get(
    "/stats",
    response_model=WorkoutStatsResponse,
    summary="Statistiques d'entraînement",
)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Récupère les statistiques globales d'entraînement."""
    return StatsService.get_workout_stats(db, current_user.id)


@router.get(
    "/dashboard",
    response_model=DashboardResponse,
    summary="Données du dashboard",
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Récupère toutes les données pour le dashboard workout."""
    stats = StatsService.get_workout_stats(db, current_user.id)
    
    # Sessions récentes (5 dernières complétées)
    recent = SessionService.get_sessions(
        db, current_user.id, SessionStatus.TERMINEE, limit=5
    )
    recent_sessions = [
        WorkoutSessionListResponse(
            id=s.id,
            name=s.name,
            activity_type=ActivityTypeEnum(s.activity_type.value),
            status=SessionStatusEnum(s.status.value),
            template_id=s.template_id,
            scheduled_at=s.scheduled_at,
            started_at=s.started_at,
            ended_at=s.ended_at,
            duration_seconds=s.duration_seconds,
            rating=s.rating,
            exercises_count=len(s.exercises),
            completed_exercises_count=sum(1 for e in s.exercises if e.is_completed),
            created_at=s.created_at,
        )
        for s in recent
    ]
    
    # Sessions à venir (planifiées)
    upcoming = SessionService.get_sessions(
        db, current_user.id, SessionStatus.PLANIFIEE, limit=5
    )
    upcoming_sessions = [
        WorkoutSessionListResponse(
            id=s.id,
            name=s.name,
            activity_type=ActivityTypeEnum(s.activity_type.value),
            status=SessionStatusEnum(s.status.value),
            template_id=s.template_id,
            scheduled_at=s.scheduled_at,
            started_at=s.started_at,
            ended_at=s.ended_at,
            duration_seconds=s.duration_seconds,
            rating=s.rating,
            exercises_count=len(s.exercises),
            completed_exercises_count=sum(1 for e in s.exercises if e.is_completed),
            created_at=s.created_at,
        )
        for s in upcoming
    ]
    
    # Objectifs actifs
    goals = GoalService.get_goals(db, current_user.id, is_active=True, limit=5)
    active_goals = []
    for g in goals:
        response = GoalResponse.model_validate(g)
        response.progress_percentage = g.progress_percentage
        active_goals.append(response)
    
    # Dernière pesée
    latest_weight = WeightService.get_latest(db, current_user.id)
    
    return DashboardResponse(
        stats=stats,
        recent_sessions=recent_sessions,
        active_goals=active_goals,
        upcoming_sessions=upcoming_sessions,
        latest_weight=latest_weight,
    )


@router.get(
    "/calendar",
    response_model=CalendarResponse,
    summary="Calendrier des séances",
)
def get_calendar(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Récupère les événements du calendrier pour un mois donné."""
    # Calculer les dates de début et fin du mois
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)
    
    sessions = SessionService.get_sessions(
        db, current_user.id,
        start_date=start_date,
        end_date=end_date,
        limit=100,
    )
    
    events = []
    for s in sessions:
        # Récupérer la couleur du template si disponible
        color = None
        if s.template:
            color = s.template.color
        
        events.append(CalendarEventResponse(
            id=s.id,
            title=s.name,
            type="session",
            activity_type=ActivityTypeEnum(s.activity_type.value),
            status=SessionStatusEnum(s.status.value),
            scheduled_at=s.scheduled_at,
            started_at=s.started_at,
            ended_at=s.ended_at,
            duration_seconds=s.duration_seconds,
            color=color,
        ))
    
    return CalendarResponse(
        events=events,
        month=month,
        year=year,
    )


# =============================================================================
# ACTIVITY TYPE ROUTES (Activités personnalisées)
# =============================================================================

@router.get(
    "/activity-types",
    response_model=list[UserActivityTypeResponse],
    summary="Liste des types d'activités",
    description="Récupère les types d'activités (par défaut + personnels).",
)
def get_user_activity_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Liste les types d'activités disponibles."""
    return ActivityTypeService.get_activity_types(db, current_user.id)


@router.get(
    "/activity-types/{activity_type_id}",
    response_model=UserActivityTypeResponse,
    summary="Détail d'un type d'activité",
)
def get_user_activity_type(
    activity_type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Récupère un type d'activité par son ID."""
    activity_type = ActivityTypeService.get_activity_type(
        db, activity_type_id, current_user.id
    )
    if not activity_type:
        raise HTTPException(status_code=404, detail="Type d'activité non trouvé")
    return activity_type


@router.post(
    "/activity-types",
    response_model=UserActivityTypeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un type d'activité",
)
def create_user_activity_type(
    activity_type: UserActivityTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crée un nouveau type d'activité personnalisé."""
    return ActivityTypeService.create_activity_type(
        db,
        name=activity_type.name,
        user_id=current_user.id,
        icon=activity_type.icon,
        color=activity_type.color,
    )


@router.put(
    "/activity-types/{activity_type_id}",
    response_model=UserActivityTypeResponse,
    summary="Modifier un type d'activité",
)
def update_user_activity_type(
    activity_type_id: int,
    activity_type: UserActivityTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Met à jour un type d'activité personnalisé."""
    updated = ActivityTypeService.update_activity_type(
        db,
        activity_type_id,
        current_user.id,
        name=activity_type.name,
        icon=activity_type.icon,
        color=activity_type.color,
    )
    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Type d'activité non trouvé ou non modifiable (activité par défaut)"
        )
    return updated


@router.delete(
    "/activity-types/{activity_type_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un type d'activité",
)
def delete_user_activity_type(
    activity_type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Supprime un type d'activité personnalisé (sans confirmation)."""
    if not ActivityTypeService.delete_activity_type(
        db, activity_type_id, current_user.id
    ):
        raise HTTPException(
            status_code=404,
            detail="Type d'activité non trouvé ou non supprimable (activité par défaut)"
        )


# =============================================================================
# CUSTOM FIELD ROUTES (Champs personnalisés)
# =============================================================================

@router.post(
    "/activity-types/{activity_type_id}/fields",
    response_model=CustomFieldDefinitionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ajouter un champ personnalisé",
)
def add_custom_field(
    activity_type_id: int,
    field: CustomFieldDefinitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ajoute un champ personnalisé à un type d'activité."""
    result = ActivityTypeService.add_field(
        db,
        activity_type_id,
        current_user.id,
        name=field.name,
        field_type=field.field_type.value if hasattr(field.field_type, 'value') else field.field_type,
        options=field.options,
        unit=field.unit,
        placeholder=field.placeholder,
        default_value=field.default_value,
        is_required=field.is_required,
        order=field.order,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Type d'activité non trouvé")
    return result


@router.delete(
    "/fields/{field_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un champ personnalisé",
)
def delete_custom_field(
    field_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Supprime un champ personnalisé."""
    if not ActivityTypeService.delete_field(db, field_id, current_user.id):
        raise HTTPException(status_code=404, detail="Champ non trouvé")


# =============================================================================
# ENUM ROUTES (pour le frontend)
# =============================================================================

@router.get(
    "/enums/activity-types",
    summary="Types d'activités disponibles (legacy)",
)
def get_activity_types():
    """Liste des types d'activités (enum legacy)."""
    return [
        {"value": t.value, "label": t.name.replace("_", " ").title()}
        for t in ActivityType
    ]


@router.get(
    "/enums/muscle-groups",
    summary="Groupes musculaires disponibles",
)
def get_muscle_groups():
    """Liste des groupes musculaires."""
    return [
        {"value": m.value, "label": m.name.replace("_", " ").title()}
        for m in MuscleGroup
    ]


@router.get(
    "/enums/goal-types",
    summary="Types d'objectifs disponibles",
)
def get_goal_types():
    """Liste des types d'objectifs."""
    return [
        {"value": g.value, "label": g.name.replace("_", " ").title()}
        for g in GoalType
    ]
