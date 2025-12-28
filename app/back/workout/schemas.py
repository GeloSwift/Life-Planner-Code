"""
Pydantic schemas for Workout Planner.

Schemas pour valider les requêtes et sérialiser les réponses.
"""

import json
from datetime import datetime
from enum import Enum
from typing import Optional, Any, Union

from pydantic import BaseModel, Field, ConfigDict, field_validator


# =============================================================================
# ENUMS (mirrors des enums SQLAlchemy pour Pydantic)
# =============================================================================

class ActivityTypeEnum(str, Enum):
    MUSCULATION = "musculation"
    COURSE = "course"
    CYCLISME = "cyclisme"
    NATATION = "natation"
    VOLLEYBALL = "volleyball"
    BOXE = "boxe"
    BASKETBALL = "basketball"
    FOOTBALL = "football"
    TENNIS = "tennis"
    YOGA = "yoga"
    CROSSFIT = "crossfit"
    HIIT = "hiit"
    DANSE = "danse"
    AUTRE = "autre"


class MuscleGroupEnum(str, Enum):
    POITRINE = "poitrine"
    DOS = "dos"
    EPAULES = "epaules"
    BICEPS = "biceps"
    TRICEPS = "triceps"
    AVANT_BRAS = "avant_bras"
    ABDOMINAUX = "abdominaux"
    OBLIQUES = "obliques"
    LOMBAIRES = "lombaires"
    QUADRICEPS = "quadriceps"
    ISCHIO_JAMBIERS = "ischio_jambiers"
    FESSIERS = "fessiers"
    MOLLETS = "mollets"
    ADDUCTEURS = "adducteurs"
    CORPS_COMPLET = "corps_complet"
    CARDIO = "cardio"


class GoalTypeEnum(str, Enum):
    POIDS_CORPOREL = "poids_corporel"
    POIDS_EXERCICE = "poids_exercice"
    REPETITIONS = "repetitions"
    TEMPS_EXERCICE = "temps_exercice"
    DISTANCE = "distance"
    TEMPS = "temps"
    NOMBRE_SEANCES = "nombre_seances"
    SERIE_CONSECUTIVE = "serie_consecutive"


class SessionStatusEnum(str, Enum):
    PLANIFIEE = "planifiee"
    EN_COURS = "en_cours"
    TERMINEE = "terminee"
    ANNULEE = "annulee"


class CustomFieldTypeEnum(str, Enum):
    TEXT = "text"
    NUMBER = "number"
    SELECT = "select"
    MULTI_SELECT = "multi_select"
    CHECKBOX = "checkbox"
    DATE = "date"
    DURATION = "duration"


# =============================================================================
# USER ACTIVITY TYPE SCHEMAS
# =============================================================================

class CustomFieldDefinitionBase(BaseModel):
    """Base schema pour CustomFieldDefinition."""
    name: str = Field(..., min_length=1, max_length=100)
    field_type: CustomFieldTypeEnum = CustomFieldTypeEnum.TEXT
    options: Optional[list[str]] = None  # Pour select/multi_select
    unit: Optional[str] = Field(None, max_length=20)
    placeholder: Optional[str] = Field(None, max_length=100)
    default_value: Optional[str] = Field(None, max_length=255)
    is_required: bool = False
    order: int = 0


class CustomFieldDefinitionCreate(CustomFieldDefinitionBase):
    """Schema pour créer un champ personnalisé."""
    pass


class CustomFieldDefinitionResponse(CustomFieldDefinitionBase):
    """Schema de réponse pour un champ personnalisé."""
    id: int
    activity_type_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_validator('options', mode='before')
    @classmethod
    def parse_options(cls, v: Any) -> Optional[list[str]]:
        """Parse les options depuis une chaîne JSON si nécessaire."""
        if v is None:
            return None
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, list) else None
            except (json.JSONDecodeError, TypeError):
                return None
        return None


class UserActivityTypeBase(BaseModel):
    """Base schema pour UserActivityType."""
    name: str = Field(..., min_length=1, max_length=100)
    icon: Optional[str] = Field(None, max_length=50)  # Nom d'icône React (ex: "Dumbbell", "Run")
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')


class UserActivityTypeCreate(UserActivityTypeBase):
    """Schema pour créer un type d'activité."""
    custom_fields: Optional[list[CustomFieldDefinitionCreate]] = None


class UserActivityTypeUpdate(BaseModel):
    """Schema pour mettre à jour un type d'activité."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    icon: Optional[str] = Field(None, max_length=10)
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')


class UserActivityTypeResponse(UserActivityTypeBase):
    """Schema de réponse pour un type d'activité."""
    id: int
    is_default: bool
    user_id: Optional[int] = None
    custom_fields: list[CustomFieldDefinitionResponse] = []
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# EXERCISE FIELD VALUE SCHEMAS
# =============================================================================

class ExerciseFieldValueBase(BaseModel):
    """Base schema pour ExerciseFieldValue."""
    field_id: int
    value: Optional[str] = None


class ExerciseFieldValueCreate(ExerciseFieldValueBase):
    """Schema pour créer une valeur de champ."""
    pass


class ExerciseFieldValueResponse(ExerciseFieldValueBase):
    """Schema de réponse pour une valeur de champ."""
    id: int
    exercise_id: int
    field: CustomFieldDefinitionResponse
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# EXERCISE SCHEMAS
# =============================================================================

class ExerciseBase(BaseModel):
    """Base schema pour Exercise."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    instructions: Optional[str] = None
    video_url: Optional[str] = Field(None, max_length=1000)
    image_url: Optional[str] = Field(None, max_length=1000)
    activity_type: ActivityTypeEnum = ActivityTypeEnum.MUSCULATION
    custom_activity_type_id: Optional[int] = None
    muscle_group: Optional[MuscleGroupEnum] = None
    secondary_muscles: Optional[list[str]] = None
    equipment: Optional[str] = Field(None, max_length=255)
    is_compound: bool = True


class ExerciseCreate(ExerciseBase):
    """Schema pour créer un exercice."""
    gif_data: Optional[str] = None  # Base64 encoded GIF
    field_values: Optional[list[ExerciseFieldValueCreate]] = None


class ExerciseUpdate(BaseModel):
    """Schema pour mettre à jour un exercice."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    instructions: Optional[str] = None
    video_url: Optional[str] = Field(None, max_length=1000)
    image_url: Optional[str] = Field(None, max_length=1000)
    gif_data: Optional[str] = None  # Base64 encoded GIF
    activity_type: Optional[ActivityTypeEnum] = None
    custom_activity_type_id: Optional[int] = None
    muscle_group: Optional[MuscleGroupEnum] = None
    secondary_muscles: Optional[list[str]] = None
    equipment: Optional[str] = Field(None, max_length=255)
    is_compound: Optional[bool] = None
    field_values: Optional[list[ExerciseFieldValueCreate]] = None


class ExerciseResponse(ExerciseBase):
    """Schema de réponse pour un exercice."""
    id: int
    user_id: Optional[int] = None
    gif_data: Optional[str] = None
    custom_activity_type: Optional[UserActivityTypeResponse] = None
    field_values: list[ExerciseFieldValueResponse] = []
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# WORKOUT TEMPLATE SCHEMAS
# =============================================================================

class TemplateExerciseBase(BaseModel):
    """Base schema pour un exercice dans un template."""
    exercise_id: int
    order: int = 0
    target_sets: int = Field(3, ge=1)
    target_reps: Optional[int] = Field(None, ge=1)
    target_weight: Optional[float] = Field(None, ge=0)
    target_duration: Optional[int] = Field(None, ge=0)  # secondes
    target_distance: Optional[float] = Field(None, ge=0)  # km
    rest_seconds: int = Field(90, ge=0)
    notes: Optional[str] = None


class TemplateExerciseCreate(TemplateExerciseBase):
    """Schema pour ajouter un exercice à un template."""
    pass


class TemplateExerciseUpdate(BaseModel):
    """Schema pour mettre à jour un exercice dans un template."""
    order: Optional[int] = None
    target_sets: Optional[int] = Field(None, ge=1)
    target_reps: Optional[int] = Field(None, ge=1)
    target_weight: Optional[float] = Field(None, ge=0)
    target_duration: Optional[int] = Field(None, ge=0)
    target_distance: Optional[float] = Field(None, ge=0)
    rest_seconds: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None


class TemplateExerciseResponse(TemplateExerciseBase):
    """Schema de réponse pour un exercice dans un template."""
    id: int
    template_id: int
    exercise: ExerciseResponse
    
    model_config = ConfigDict(from_attributes=True)


class WorkoutTemplateBase(BaseModel):
    """Base schema pour WorkoutTemplate."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    activity_type: ActivityTypeEnum = ActivityTypeEnum.MUSCULATION
    custom_activity_type_id: Optional[int] = None
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    estimated_duration: Optional[int] = Field(None, ge=0)  # minutes
    is_public: bool = False


class WorkoutTemplateCreate(WorkoutTemplateBase):
    """Schema pour créer un template."""
    exercises: Optional[list[TemplateExerciseCreate]] = None


class WorkoutTemplateUpdate(BaseModel):
    """Schema pour mettre à jour un template."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    activity_type: Optional[ActivityTypeEnum] = None
    custom_activity_type_id: Optional[int] = None
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    estimated_duration: Optional[int] = Field(None, ge=0)
    is_public: Optional[bool] = None


class WorkoutTemplateResponse(WorkoutTemplateBase):
    """Schema de réponse pour un template."""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    exercises: list[TemplateExerciseResponse] = []
    
    model_config = ConfigDict(from_attributes=True)


class WorkoutTemplateListResponse(WorkoutTemplateBase):
    """Schema de réponse pour la liste des templates (sans exercices)."""
    id: int
    user_id: int
    created_at: datetime
    exercises_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# WORKOUT SESSION SCHEMAS
# =============================================================================

class WorkoutSetBase(BaseModel):
    """Base schema pour une série."""
    set_number: int = Field(..., ge=1)
    weight: Optional[float] = Field(None, ge=0)
    reps: Optional[int] = Field(None, ge=0)
    duration_seconds: Optional[int] = Field(None, ge=0)
    distance: Optional[float] = Field(None, ge=0)
    is_warmup: bool = False
    is_dropset: bool = False
    is_failure: bool = False
    rpe: Optional[int] = Field(None, ge=1, le=10)
    notes: Optional[str] = Field(None, max_length=500)


class WorkoutSetCreate(WorkoutSetBase):
    """Schema pour créer une série."""
    pass


class WorkoutSetUpdate(BaseModel):
    """Schema pour mettre à jour une série."""
    weight: Optional[float] = Field(None, ge=0)
    reps: Optional[int] = Field(None, ge=0)
    duration_seconds: Optional[int] = Field(None, ge=0)
    distance: Optional[float] = Field(None, ge=0)
    is_warmup: Optional[bool] = None
    is_dropset: Optional[bool] = None
    is_failure: Optional[bool] = None
    is_completed: Optional[bool] = None
    rpe: Optional[int] = Field(None, ge=1, le=10)
    notes: Optional[str] = Field(None, max_length=500)


class WorkoutSetResponse(WorkoutSetBase):
    """Schema de réponse pour une série."""
    id: int
    session_exercise_id: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SessionExerciseBase(BaseModel):
    """Base schema pour un exercice dans une session."""
    exercise_id: int
    order: int = 0
    target_sets: int = Field(3, ge=1)
    target_reps: Optional[int] = Field(None, ge=1)
    target_weight: Optional[float] = Field(None, ge=0)
    target_duration: Optional[int] = Field(None, ge=0)
    target_distance: Optional[float] = Field(None, ge=0)
    rest_seconds: int = Field(90, ge=0)
    notes: Optional[str] = None


class SessionExerciseCreate(SessionExerciseBase):
    """Schema pour ajouter un exercice à une session."""
    sets: Optional[list[WorkoutSetCreate]] = None


class SessionExerciseUpdate(BaseModel):
    """Schema pour mettre à jour un exercice dans une session."""
    order: Optional[int] = None
    target_sets: Optional[int] = Field(None, ge=1)
    target_reps: Optional[int] = Field(None, ge=1)
    target_weight: Optional[float] = Field(None, ge=0)
    target_duration: Optional[int] = Field(None, ge=0)
    target_distance: Optional[float] = Field(None, ge=0)
    rest_seconds: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None
    is_completed: Optional[bool] = None


class SessionExerciseResponse(SessionExerciseBase):
    """Schema de réponse pour un exercice dans une session."""
    id: int
    session_id: int
    is_completed: bool
    exercise: ExerciseResponse
    sets: list[WorkoutSetResponse] = []
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class WorkoutSessionBase(BaseModel):
    """Base schema pour WorkoutSession."""
    name: str = Field(..., min_length=1, max_length=255)
    activity_type: ActivityTypeEnum = ActivityTypeEnum.MUSCULATION
    custom_activity_type_id: Optional[int] = None
    custom_activity_type_ids: Optional[list[int]] = None
    scheduled_at: Optional[datetime] = None
    notes: Optional[str] = None
    recurrence_type: Optional[str] = Field(None, pattern="^(daily|weekly|monthly)$")  # Type de récurrence
    recurrence_data: Optional[list[Union[int, str]]] = None  # Données de récurrence (jours de la semaine pour weekly, jours du mois pour monthly)


class WorkoutSessionCreate(WorkoutSessionBase):
    """Schema pour créer une session."""
    template_id: Optional[int] = None  # Si fourni, copie les exercices du template
    exercises: Optional[list[SessionExerciseCreate]] = None  # Si pas de template


class WorkoutSessionUpdate(BaseModel):
    """Schema pour mettre à jour une session."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    activity_type: Optional[ActivityTypeEnum] = None
    custom_activity_type_id: Optional[int] = None
    custom_activity_type_ids: Optional[list[int]] = None
    status: Optional[SessionStatusEnum] = None
    scheduled_at: Optional[datetime] = None
    notes: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    perceived_difficulty: Optional[int] = Field(None, ge=1, le=10)
    calories_burned: Optional[int] = Field(None, ge=0)
    exercises: Optional[list[SessionExerciseCreate]] = None  # Pour mettre à jour les exercices


class WorkoutSessionResponse(WorkoutSessionBase):
    """Schema de réponse pour une session."""
    id: int
    user_id: int
    template_id: Optional[int] = None
    custom_activity_type: Optional[UserActivityTypeResponse] = None
    status: SessionStatusEnum
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    rating: Optional[int] = None
    perceived_difficulty: Optional[int] = None
    calories_burned: Optional[int] = None
    exercises: list[SessionExerciseResponse] = []
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

    @field_validator("custom_activity_type_ids", mode="before")
    @classmethod
    def parse_custom_activity_type_ids(cls, v):
        """Parse custom_activity_type_ids from JSON string to list[int]."""
        if v is None:
            return []
        if isinstance(v, list):
            return [int(x) for x in v]
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [int(x) for x in parsed]
            except Exception:
                return []
        return []

    @field_validator("recurrence_data", mode="before")
    @classmethod
    def parse_recurrence_data(cls, v):
        """Parse recurrence_data from JSON string to list."""
        if v is None:
            return None
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return None
        return None


class WorkoutSessionListResponse(BaseModel):
    """Schema de réponse pour la liste des sessions (sans exercices détaillés)."""
    id: int
    name: str
    activity_type: ActivityTypeEnum
    status: SessionStatusEnum
    template_id: Optional[int] = None
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    rating: Optional[int] = None
    exercises_count: int = 0
    completed_exercises_count: int = 0
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# WEIGHT ENTRY SCHEMAS
# =============================================================================

class WeightEntryBase(BaseModel):
    """Base schema pour WeightEntry."""
    weight: float = Field(..., gt=0, le=500)  # kg
    body_fat_percentage: Optional[float] = Field(None, ge=0, le=100)
    muscle_mass: Optional[float] = Field(None, ge=0, le=300)
    water_percentage: Optional[float] = Field(None, ge=0, le=100)
    measured_at: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=500)


class WeightEntryCreate(WeightEntryBase):
    """Schema pour créer une pesée."""
    pass


class WeightEntryUpdate(BaseModel):
    """Schema pour mettre à jour une pesée."""
    weight: Optional[float] = Field(None, gt=0, le=500)
    body_fat_percentage: Optional[float] = Field(None, ge=0, le=100)
    muscle_mass: Optional[float] = Field(None, ge=0, le=300)
    water_percentage: Optional[float] = Field(None, ge=0, le=100)
    measured_at: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=500)


class WeightEntryResponse(WeightEntryBase):
    """Schema de réponse pour une pesée."""
    id: int
    user_id: int
    measured_at: datetime
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class WeightProgressResponse(BaseModel):
    """Schema pour l'évolution du poids."""
    entries: list[WeightEntryResponse]
    stats: dict  # min, max, average, trend


# =============================================================================
# GOAL SCHEMAS
# =============================================================================

class GoalBase(BaseModel):
    """Base schema pour Goal."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    goal_type: GoalTypeEnum
    target_value: float = Field(..., gt=0)
    current_value: float = Field(0, ge=0)
    initial_value: Optional[float] = Field(None, ge=0)
    unit: str = Field(..., min_length=1, max_length=50)
    exercise_id: Optional[int] = None
    deadline: Optional[datetime] = None


class GoalCreate(GoalBase):
    """Schema pour créer un objectif."""
    pass


class GoalUpdate(BaseModel):
    """Schema pour mettre à jour un objectif."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    target_value: Optional[float] = Field(None, gt=0)
    current_value: Optional[float] = Field(None, ge=0)
    deadline: Optional[datetime] = None
    is_active: Optional[bool] = None


class GoalResponse(GoalBase):
    """Schema de réponse pour un objectif."""
    id: int
    user_id: int
    is_achieved: bool
    is_active: bool
    achieved_at: Optional[datetime] = None
    progress_percentage: float
    exercise: Optional[ExerciseResponse] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# DASHBOARD / STATS SCHEMAS
# =============================================================================

class WorkoutStatsResponse(BaseModel):
    """Statistiques globales des entraînements."""
    total_sessions: int
    completed_sessions: int
    total_duration_minutes: int
    sessions_this_week: int
    sessions_this_month: int
    current_streak: int  # jours consécutifs
    longest_streak: int
    favorite_activity: Optional[ActivityTypeEnum] = None
    favorite_muscle_group: Optional[MuscleGroupEnum] = None


class DashboardResponse(BaseModel):
    """Données pour le dashboard workout."""
    stats: WorkoutStatsResponse
    recent_sessions: list[WorkoutSessionListResponse]
    active_goals: list[GoalResponse]
    upcoming_sessions: list[WorkoutSessionListResponse]
    latest_weight: Optional[WeightEntryResponse] = None


# =============================================================================
# CALENDAR SCHEMAS
# =============================================================================

class CalendarEventResponse(BaseModel):
    """Événement pour le calendrier."""
    id: int
    title: str
    type: str  # "session" ou "planned"
    activity_type: ActivityTypeEnum
    status: SessionStatusEnum
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    color: Optional[str] = None


class CalendarResponse(BaseModel):
    """Réponse pour le calendrier."""
    events: list[CalendarEventResponse]
    month: int
    year: int
