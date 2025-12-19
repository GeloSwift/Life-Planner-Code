"""
SQLAlchemy models for Workout Planner.

Ce module définit toutes les tables liées au workout planner :
- Exercices avec catégorisation et médias
- Templates de séances réutilisables
- Sessions d'entraînement avec timer
- Séries individuelles avec suivi
- Pesées corporelles
- Objectifs sportifs

Architecture:
- Un utilisateur peut créer des exercices personnalisés
- Un template est une séance type réutilisable (ex: "Push Day")
- Une session est une séance effective avec timer
- Chaque session a des exercices, chaque exercice a des séries
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlalchemy import (
    String,
    Text,
    DateTime,
    Boolean,
    Integer,
    Float,
    ForeignKey,
    Enum as SQLEnum,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.db import Base


# =============================================================================
# ENUMS
# =============================================================================

class ActivityType(str, Enum):
    """Types d'activités sportives supportés."""
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


class MuscleGroup(str, Enum):
    """Groupes musculaires pour la musculation."""
    # Haut du corps
    POITRINE = "poitrine"
    DOS = "dos"
    EPAULES = "epaules"
    BICEPS = "biceps"
    TRICEPS = "triceps"
    AVANT_BRAS = "avant_bras"
    
    # Tronc
    ABDOMINAUX = "abdominaux"
    OBLIQUES = "obliques"
    LOMBAIRES = "lombaires"
    
    # Bas du corps
    QUADRICEPS = "quadriceps"
    ISCHIO_JAMBIERS = "ischio_jambiers"
    FESSIERS = "fessiers"
    MOLLETS = "mollets"
    ADDUCTEURS = "adducteurs"
    
    # Complet
    CORPS_COMPLET = "corps_complet"
    CARDIO = "cardio"


class GoalType(str, Enum):
    """Types d'objectifs sportifs."""
    POIDS_CORPOREL = "poids_corporel"           # Poids corporel (ex: 82kg)
    POIDS_EXERCICE = "poids_exercice"           # Poids sur un exercice (ex: Bench 100kg)
    REPETITIONS = "repetitions"                 # Reps sur un exercice (ex: 20 tractions)
    TEMPS_EXERCICE = "temps_exercice"           # Temps (ex: planche 2min)
    DISTANCE = "distance"                       # Distance (ex: 10km course)
    TEMPS = "temps"                             # Temps (ex: 5km en 25min)
    NOMBRE_SEANCES = "nombre_seances"           # Nombre de séances (ex: 4 séances/semaine)
    SERIE_CONSECUTIVE = "serie_consecutive"     # Série consécutive (ex: 30 jours d'affilée)


class CustomFieldType(str, Enum):
    """Types de champs personnalisés pour les exercices."""
    TEXT = "text"                    # Champ de texte simple
    NUMBER = "number"                # Nombre (int ou float)
    SELECT = "select"                # Liste déroulante (une seule valeur)
    MULTI_SELECT = "multi_select"    # Liste déroulante multi-sélection
    CHECKBOX = "checkbox"            # Case à cocher (booléen)
    DATE = "date"                    # Date
    DURATION = "duration"            # Durée (en secondes)


class SessionStatus(str, Enum):
    """Statut d'une session d'entraînement."""
    PLANIFIEE = "planifiee"       # Planifiée (dans le calendrier)
    EN_COURS = "en_cours"         # En cours
    TERMINEE = "terminee"         # Terminée
    ANNULEE = "annulee"           # Annulée


# =============================================================================
# EXERCISE MODEL
# =============================================================================

class Exercise(Base):
    """
    Exercice sportif.
    
    Un exercice peut être :
    - Global (créé par l'admin, visible par tous) : user_id = None
    - Personnel (créé par un utilisateur) : user_id = id de l'utilisateur
    
    Attributs:
        name: Nom de l'exercice (ex: "Développé couché")
        description: Description détaillée
        instructions: Instructions d'exécution
        video_url: URL vers une vidéo/GIF démonstratif
        gif_data: GIF en base64 (data URL)
        activity_type: Type d'activité (enum legacy)
        custom_activity_type_id: Référence vers UserActivityType (nouveau)
        muscle_group: Groupe musculaire principal (pour musculation)
        secondary_muscles: Groupes musculaires secondaires (JSON array)
        equipment: Équipement nécessaire
        is_compound: Exercice polyarticulaire ou isolation
        user_id: NULL = global, sinon = exercice personnel
    """
    
    __tablename__ = "exercises"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Informations de base
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Media
    video_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    # GIF stocké en base64 (comme l'avatar utilisateur) - max ~2MB
    gif_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Catégorisation - Legacy enum (gardé pour compatibilité)
    activity_type: Mapped[ActivityType] = mapped_column(
        SQLEnum(ActivityType, values_callable=lambda x: [e.value for e in x], name='activitytype'),
        default=ActivityType.MUSCULATION,
        nullable=False,
    )
    # Nouveau: référence vers UserActivityType pour les activités personnalisées
    custom_activity_type_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("user_activity_types.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    
    muscle_group: Mapped[Optional[MuscleGroup]] = mapped_column(
        SQLEnum(MuscleGroup, values_callable=lambda x: [e.value for e in x], name='musclegroup'),
        nullable=True,
    )
    secondary_muscles: Mapped[Optional[str]] = mapped_column(
        String(500),  # JSON array stocké comme string: '["biceps", "forearms"]'
        nullable=True,
    )
    
    # Métadonnées
    equipment: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # difficulty supprimé selon la demande utilisateur
    is_compound: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Propriétaire (NULL = global)
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    
    # Relations
    user = relationship("User", backref="custom_exercises")
    custom_activity_type = relationship("UserActivityType")
    
    __table_args__ = (
        Index('ix_exercises_activity_muscle', 'activity_type', 'muscle_group'),
    )
    
    def __repr__(self) -> str:
        return f"<Exercise(id={self.id}, name={self.name}, type={self.activity_type})>"


# =============================================================================
# WORKOUT TEMPLATE MODEL
# =============================================================================

class WorkoutTemplate(Base):
    """
    Template de séance réutilisable.
    
    Un template est une séance type que l'utilisateur peut réutiliser
    (ex: "Push Day", "Leg Day", "Course 10km").
    
    Attributs:
        name: Nom du template (ex: "Push Day")
        description: Description
        activity_type: Type d'activité principale
        estimated_duration: Durée estimée en minutes
        user_id: Propriétaire du template
        is_public: Visible par tous (pour partage)
    """
    
    __tablename__ = "workout_templates"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    activity_type: Mapped[ActivityType] = mapped_column(
        SQLEnum(ActivityType, values_callable=lambda x: [e.value for e in x], name='activitytype'),
        default=ActivityType.MUSCULATION,
        nullable=False,
    )
    color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)  # Hex color (#FF5733)
    estimated_duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # minutes
    
    # Propriétaire
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    
    # Relations
    user = relationship("User", backref="workout_templates")
    exercises = relationship(
        "WorkoutTemplateExercise",
        back_populates="template",
        cascade="all, delete-orphan",
        order_by="WorkoutTemplateExercise.order",
    )
    sessions = relationship("WorkoutSession", back_populates="template")
    
    def __repr__(self) -> str:
        return f"<WorkoutTemplate(id={self.id}, name={self.name})>"


class WorkoutTemplateExercise(Base):
    """
    Exercice dans un template de séance.
    
    Définit les paramètres par défaut pour un exercice dans un template :
    - Nombre de séries
    - Nombre de reps cible
    - Poids cible (optionnel)
    - Temps de repos entre les séries
    """
    
    __tablename__ = "workout_template_exercises"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    template_id: Mapped[int] = mapped_column(
        ForeignKey("workout_templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Ordre dans le template
    order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Paramètres par défaut
    target_sets: Mapped[int] = mapped_column(Integer, default=3)
    target_reps: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # NULL pour cardio
    target_weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # kg
    target_duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # secondes (pour planche, etc.)
    target_distance: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # km (pour course, vélo)
    rest_seconds: Mapped[int] = mapped_column(Integer, default=90)  # repos entre séries
    
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relations
    template = relationship("WorkoutTemplate", back_populates="exercises")
    exercise = relationship("Exercise")
    
    def __repr__(self) -> str:
        return f"<WorkoutTemplateExercise(template_id={self.template_id}, exercise_id={self.exercise_id})>"


# =============================================================================
# WORKOUT SESSION MODEL
# =============================================================================

class WorkoutSession(Base):
    """
    Session d'entraînement effective.
    
    Une session est créée quand l'utilisateur "lance" une séance.
    Elle peut être basée sur un template ou créée from scratch.
    
    Attributs:
        name: Nom de la séance
        status: Statut (planned, in_progress, completed, cancelled)
        template_id: Template source (optionnel)
        scheduled_at: Date/heure planifiée
        started_at: Date/heure de début effectif
        ended_at: Date/heure de fin
        duration_seconds: Durée totale en secondes
        notes: Notes de l'utilisateur
        rating: Note de la séance (1-5)
        calories_burned: Calories brûlées (estimées)
    """
    
    __tablename__ = "workout_sessions"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    activity_type: Mapped[ActivityType] = mapped_column(
        SQLEnum(ActivityType, values_callable=lambda x: [e.value for e in x], name='activitytype'),
        default=ActivityType.MUSCULATION,
        nullable=False,
    )
    status: Mapped[SessionStatus] = mapped_column(
        SQLEnum(SessionStatus, values_callable=lambda x: [e.value for e in x], name='sessionstatus'),
        default=SessionStatus.PLANIFIEE,
        nullable=False,
    )
    
    # Relations
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    template_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("workout_templates.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    
    # Timing
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Feedback
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1-5
    perceived_difficulty: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1-10 RPE
    calories_burned: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    
    # Relations
    user = relationship("User", backref="workout_sessions")
    template = relationship("WorkoutTemplate", back_populates="sessions")
    exercises = relationship(
        "WorkoutSessionExercise",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="WorkoutSessionExercise.order",
    )
    
    __table_args__ = (
        Index('ix_workout_sessions_user_status', 'user_id', 'status'),
        Index('ix_workout_sessions_user_scheduled', 'user_id', 'scheduled_at'),
    )
    
    def __repr__(self) -> str:
        return f"<WorkoutSession(id={self.id}, name={self.name}, status={self.status})>"


class WorkoutSessionExercise(Base):
    """
    Exercice dans une session d'entraînement.
    
    Copie les paramètres du template mais permet de les modifier
    pendant la séance.
    """
    
    __tablename__ = "workout_session_exercises"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    session_id: Mapped[int] = mapped_column(
        ForeignKey("workout_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Ordre dans la session
    order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Cibles pour cet exercice dans cette session
    target_sets: Mapped[int] = mapped_column(Integer, default=3)
    target_reps: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    target_weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    target_duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    target_distance: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rest_seconds: Mapped[int] = mapped_column(Integer, default=90)
    
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    
    # Relations
    session = relationship("WorkoutSession", back_populates="exercises")
    exercise = relationship("Exercise")
    sets = relationship(
        "WorkoutSet",
        back_populates="session_exercise",
        cascade="all, delete-orphan",
        order_by="WorkoutSet.set_number",
    )
    
    def __repr__(self) -> str:
        return f"<WorkoutSessionExercise(session_id={self.session_id}, exercise_id={self.exercise_id})>"


class WorkoutSet(Base):
    """
    Série individuelle dans un exercice de session.
    
    Chaque série track :
    - Numéro de série
    - Poids/reps/durée/distance effectués
    - Si la série est complétée
    - Temps de repos avant la série suivante
    """
    
    __tablename__ = "workout_sets"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    session_exercise_id: Mapped[int] = mapped_column(
        ForeignKey("workout_session_exercises.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    set_number: Mapped[int] = mapped_column(Integer, nullable=False)  # 1, 2, 3...
    
    # Valeurs effectuées
    weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # kg
    reps: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    distance: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # km
    
    # Type de série
    is_warmup: Mapped[bool] = mapped_column(Boolean, default=False)
    is_dropset: Mapped[bool] = mapped_column(Boolean, default=False)
    is_failure: Mapped[bool] = mapped_column(Boolean, default=False)  # Allé à l'échec
    
    # Statut
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # RPE (Rate of Perceived Exertion) - difficulté ressentie 1-10
    rpe: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    
    # Relations
    session_exercise = relationship("WorkoutSessionExercise", back_populates="sets")
    
    def __repr__(self) -> str:
        return f"<WorkoutSet(id={self.id}, set={self.set_number}, reps={self.reps}, weight={self.weight})>"


# =============================================================================
# WEIGHT ENTRY MODEL
# =============================================================================

class WeightEntry(Base):
    """
    Pesée corporelle.
    
    Permet de suivre l'évolution du poids de l'utilisateur.
    
    Attributs:
        weight: Poids en kg
        body_fat_percentage: % de masse grasse (optionnel)
        muscle_mass: Masse musculaire en kg (optionnel)
        measured_at: Date/heure de la mesure
        notes: Notes (ex: "après le sport", "à jeun")
    """
    
    __tablename__ = "weight_entries"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    weight: Mapped[float] = mapped_column(Float, nullable=False)  # kg
    body_fat_percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    muscle_mass: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # kg
    water_percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    measured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    
    # Relations
    user = relationship("User", backref="weight_entries")
    
    __table_args__ = (
        Index('ix_weight_entries_user_date', 'user_id', 'measured_at'),
    )
    
    def __repr__(self) -> str:
        return f"<WeightEntry(id={self.id}, weight={self.weight}kg, date={self.measured_at})>"


# =============================================================================
# GOAL MODEL
# =============================================================================

class Goal(Base):
    """
    Objectif sportif.
    
    Types d'objectifs :
    - Poids corporel (ex: atteindre 82kg)
    - Performance exercice (ex: Bench 100kg, 20 tractions)
    - Distance (ex: courir 10km)
    - Temps (ex: 5km en 25min)
    - Régularité (ex: 4 séances/semaine, 30 jours consécutifs)
    
    Attributs:
        name: Nom de l'objectif
        goal_type: Type d'objectif
        target_value: Valeur cible
        current_value: Valeur actuelle
        unit: Unité (kg, reps, km, min, etc.)
        exercise_id: Exercice lié (pour objectifs de performance)
        deadline: Date limite (optionnel)
        is_achieved: Objectif atteint
    """
    
    __tablename__ = "goals"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    goal_type: Mapped[GoalType] = mapped_column(
        SQLEnum(GoalType, values_callable=lambda x: [e.value for e in x], name='goaltype'),
        nullable=False,
    )
    
    # Valeurs
    target_value: Mapped[float] = mapped_column(Float, nullable=False)
    current_value: Mapped[float] = mapped_column(Float, default=0)
    initial_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Valeur de départ
    unit: Mapped[str] = mapped_column(String(50), nullable=False)  # kg, reps, km, min, sessions, days
    
    # Exercice lié (pour objectifs de performance)
    exercise_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("exercises.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    
    # Timing
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    achieved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Statut
    is_achieved: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    
    # Relations
    user = relationship("User", backref="goals")
    exercise = relationship("Exercise")
    
    __table_args__ = (
        Index('ix_goals_user_active', 'user_id', 'is_active'),
    )
    
    def __repr__(self) -> str:
        return f"<Goal(id={self.id}, name={self.name}, target={self.target_value}{self.unit})>"
    
    @property
    def progress_percentage(self) -> float:
        """Calcule le pourcentage de progression vers l'objectif."""
        if self.target_value == 0:
            return 0
        
        initial = self.initial_value or 0
        
        # Si l'objectif est de diminuer (ex: poids corporel)
        if self.target_value < initial:
            if initial == self.target_value:
                return 100
            return min(100, ((initial - self.current_value) / (initial - self.target_value)) * 100)
        
        # Si l'objectif est d'augmenter
        return min(100, (self.current_value / self.target_value) * 100)


# =============================================================================
# USER ACTIVITY TYPE MODEL (Activités personnalisées)
# =============================================================================

class UserActivityType(Base):
    """
    Type d'activité personnalisé par utilisateur.
    
    Permet à chaque utilisateur de définir ses propres types d'activités
    en plus des activités par défaut (musculation, course, danse, volleyball).
    
    Attributs:
        name: Nom de l'activité (ex: "Escalade", "Ski")
        icon: Emoji ou icône (optionnel)
        color: Couleur hex (optionnel)
        is_default: True si c'est une activité par défaut du système
        user_id: NULL = activité par défaut, sinon = activité personnelle
    """
    
    __tablename__ = "user_activity_types"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Nom d'icône React (ex: "Dumbbell")
    color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)  # #FF5733
    
    # Activité par défaut ou personnalisée
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    
    # Relations
    user = relationship("User", backref="custom_activity_types")
    custom_fields = relationship(
        "CustomFieldDefinition",
        back_populates="activity_type",
        cascade="all, delete-orphan",
    )
    
    __table_args__ = (
        Index('ix_user_activity_types_user', 'user_id'),
    )
    
    def __repr__(self) -> str:
        return f"<UserActivityType(id={self.id}, name={self.name})>"


# =============================================================================
# CUSTOM FIELD DEFINITION MODEL (Définition des champs personnalisés)
# =============================================================================

class CustomFieldDefinition(Base):
    """
    Définition d'un champ personnalisé pour un type d'activité.
    
    Permet de définir les champs spécifiques à chaque type d'activité
    (ex: pour "Course" -> distance, temps, vitesse).
    
    Attributs:
        name: Nom du champ (ex: "Distance", "Temps")
        field_type: Type de champ (text, number, select, multi_select, etc.)
        options: Options pour les champs select/multi_select (JSON array)
        unit: Unité de mesure (km, min, kg, etc.)
        is_required: Champ obligatoire ou non
        order: Ordre d'affichage
    """
    
    __tablename__ = "custom_field_definitions"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    activity_type_id: Mapped[int] = mapped_column(
        ForeignKey("user_activity_types.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    # Utilise String au lieu d'Enum pour éviter les problèmes de migration
    # Valeurs valides: text, number, select, multi_select, checkbox, date, duration
    field_type: Mapped[str] = mapped_column(String(50), default="text", nullable=False)
    
    # Options pour select/multi_select (JSON array: '["Option 1", "Option 2"]')
    options: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Métadonnées
    unit: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # kg, km, min, etc.
    placeholder: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    default_value: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)
    order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    
    # Relations
    activity_type = relationship("UserActivityType", back_populates="custom_fields")
    
    def __repr__(self) -> str:
        return f"<CustomFieldDefinition(id={self.id}, name={self.name}, type={self.field_type})>"


# =============================================================================
# EXERCISE FIELD VALUE MODEL (Valeurs des champs personnalisés)
# =============================================================================

class ExerciseFieldValue(Base):
    """
    Valeur d'un champ personnalisé pour un exercice.
    
    Stocke les valeurs des champs personnalisés définis pour chaque exercice.
    
    Attributs:
        exercise_id: Exercice concerné
        field_id: Définition du champ
        value: Valeur du champ (stockée en string, convertie selon le type)
    """
    
    __tablename__ = "exercise_field_values"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    field_id: Mapped[int] = mapped_column(
        ForeignKey("custom_field_definitions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Valeur stockée en string (convertie selon field_type)
    value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    
    # Relations
    exercise = relationship("Exercise", backref="field_values")
    field = relationship("CustomFieldDefinition")
    
    __table_args__ = (
        Index('ix_exercise_field_values_exercise_field', 'exercise_id', 'field_id', unique=True),
    )
    
    def __repr__(self) -> str:
        return f"<ExerciseFieldValue(exercise_id={self.exercise_id}, field_id={self.field_id})>"
