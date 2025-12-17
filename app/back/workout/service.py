"""
Service layer for Workout Planner.

Ce module contient la logique métier pour :
- Gestion des exercices
- Gestion des templates de séances
- Gestion des sessions d'entraînement
- Gestion des pesées
- Gestion des objectifs
- Calcul des statistiques
"""

import json
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import func, or_, desc
from sqlalchemy.orm import Session, joinedload

from workout.models import (
    Exercise,
    WorkoutTemplate,
    WorkoutTemplateExercise,
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSet,
    WeightEntry,
    Goal,
    ActivityType,
    MuscleGroup,
    SessionStatus,
    GoalType,
)
from workout.schemas import (
    ExerciseCreate,
    ExerciseUpdate,
    WorkoutTemplateCreate,
    WorkoutTemplateUpdate,
    TemplateExerciseCreate,
    WorkoutSessionCreate,
    WorkoutSessionUpdate,
    WorkoutSetCreate,
    WorkoutSetUpdate,
    WeightEntryCreate,
    WeightEntryUpdate,
    GoalCreate,
    GoalUpdate,
    WorkoutStatsResponse,
)


# =============================================================================
# EXERCISE SERVICE
# =============================================================================

class ExerciseService:
    """Service pour la gestion des exercices."""
    
    @staticmethod
    def get_exercises(
        db: Session,
        user_id: int,
        activity_type: Optional[ActivityType] = None,
        muscle_group: Optional[MuscleGroup] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Exercise]:
        """
        Récupère les exercices (globaux + personnels de l'utilisateur).
        """
        query = db.query(Exercise).filter(
            or_(
                Exercise.user_id.is_(None),  # Exercices globaux
                Exercise.user_id == user_id,  # Exercices personnels
            )
        )
        
        if activity_type:
            query = query.filter(Exercise.activity_type == activity_type)
        
        if muscle_group:
            query = query.filter(Exercise.muscle_group == muscle_group)
        
        if search:
            query = query.filter(
                or_(
                    Exercise.name.ilike(f"%{search}%"),
                    Exercise.description.ilike(f"%{search}%"),
                )
            )
        
        return query.order_by(Exercise.name).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_exercise(db: Session, exercise_id: int, user_id: int) -> Optional[Exercise]:
        """Récupère un exercice par son ID."""
        return db.query(Exercise).filter(
            Exercise.id == exercise_id,
            or_(Exercise.user_id.is_(None), Exercise.user_id == user_id),
        ).first()
    
    @staticmethod
    def create_exercise(db: Session, exercise: ExerciseCreate, user_id: int) -> Exercise:
        """Crée un exercice personnel."""
        secondary_muscles_json = None
        if exercise.secondary_muscles:
            secondary_muscles_json = json.dumps(exercise.secondary_muscles)
        
        db_exercise = Exercise(
            name=exercise.name,
            description=exercise.description,
            instructions=exercise.instructions,
            video_url=exercise.video_url,
            image_url=exercise.image_url,
            activity_type=ActivityType(exercise.activity_type.value),
            muscle_group=MuscleGroup(exercise.muscle_group.value) if exercise.muscle_group else None,
            secondary_muscles=secondary_muscles_json,
            equipment=exercise.equipment,
            difficulty=exercise.difficulty,
            is_compound=exercise.is_compound,
            user_id=user_id,
        )
        db.add(db_exercise)
        db.commit()
        db.refresh(db_exercise)
        return db_exercise
    
    @staticmethod
    def update_exercise(
        db: Session,
        exercise_id: int,
        exercise_update: ExerciseUpdate,
        user_id: int,
    ) -> Optional[Exercise]:
        """Met à jour un exercice personnel."""
        db_exercise = db.query(Exercise).filter(
            Exercise.id == exercise_id,
            Exercise.user_id == user_id,  # Seul le propriétaire peut modifier
        ).first()
        
        if not db_exercise:
            return None
        
        update_data = exercise_update.model_dump(exclude_unset=True)
        
        if "secondary_muscles" in update_data and update_data["secondary_muscles"]:
            update_data["secondary_muscles"] = json.dumps(update_data["secondary_muscles"])
        
        if "activity_type" in update_data and update_data["activity_type"]:
            update_data["activity_type"] = ActivityType(update_data["activity_type"].value)
        
        if "muscle_group" in update_data and update_data["muscle_group"]:
            update_data["muscle_group"] = MuscleGroup(update_data["muscle_group"].value)
        
        for key, value in update_data.items():
            setattr(db_exercise, key, value)
        
        db.commit()
        db.refresh(db_exercise)
        return db_exercise
    
    @staticmethod
    def delete_exercise(db: Session, exercise_id: int, user_id: int) -> bool:
        """Supprime un exercice personnel."""
        db_exercise = db.query(Exercise).filter(
            Exercise.id == exercise_id,
            Exercise.user_id == user_id,
        ).first()
        
        if not db_exercise:
            return False
        
        db.delete(db_exercise)
        db.commit()
        return True


# =============================================================================
# WORKOUT TEMPLATE SERVICE
# =============================================================================

class TemplateService:
    """Service pour la gestion des templates de séances."""
    
    @staticmethod
    def get_templates(
        db: Session,
        user_id: int,
        activity_type: Optional[ActivityType] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[WorkoutTemplate]:
        """Récupère les templates de l'utilisateur."""
        query = db.query(WorkoutTemplate).filter(
            or_(
                WorkoutTemplate.user_id == user_id,
                WorkoutTemplate.is_public == True,  # noqa: E712
            )
        )
        
        if activity_type:
            query = query.filter(WorkoutTemplate.activity_type == activity_type)
        
        return query.options(
            joinedload(WorkoutTemplate.exercises).joinedload(WorkoutTemplateExercise.exercise)
        ).order_by(WorkoutTemplate.name).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_template(db: Session, template_id: int, user_id: int) -> Optional[WorkoutTemplate]:
        """Récupère un template par son ID."""
        return db.query(WorkoutTemplate).filter(
            WorkoutTemplate.id == template_id,
            or_(WorkoutTemplate.user_id == user_id, WorkoutTemplate.is_public == True),  # noqa: E712
        ).options(
            joinedload(WorkoutTemplate.exercises).joinedload(WorkoutTemplateExercise.exercise)
        ).first()
    
    @staticmethod
    def create_template(
        db: Session,
        template: WorkoutTemplateCreate,
        user_id: int,
    ) -> WorkoutTemplate:
        """Crée un template de séance."""
        db_template = WorkoutTemplate(
            name=template.name,
            description=template.description,
            activity_type=ActivityType(template.activity_type.value),
            color=template.color,
            estimated_duration=template.estimated_duration,
            is_public=template.is_public,
            user_id=user_id,
        )
        db.add(db_template)
        db.flush()  # Pour obtenir l'ID
        
        # Ajouter les exercices si fournis
        if template.exercises:
            for order, ex in enumerate(template.exercises):
                db_template_ex = WorkoutTemplateExercise(
                    template_id=db_template.id,
                    exercise_id=ex.exercise_id,
                    order=ex.order if ex.order else order,
                    target_sets=ex.target_sets,
                    target_reps=ex.target_reps,
                    target_weight=ex.target_weight,
                    target_duration=ex.target_duration,
                    target_distance=ex.target_distance,
                    rest_seconds=ex.rest_seconds,
                    notes=ex.notes,
                )
                db.add(db_template_ex)
        
        db.commit()
        db.refresh(db_template)
        return db_template
    
    @staticmethod
    def update_template(
        db: Session,
        template_id: int,
        template_update: WorkoutTemplateUpdate,
        user_id: int,
    ) -> Optional[WorkoutTemplate]:
        """Met à jour un template."""
        db_template = db.query(WorkoutTemplate).filter(
            WorkoutTemplate.id == template_id,
            WorkoutTemplate.user_id == user_id,
        ).first()
        
        if not db_template:
            return None
        
        update_data = template_update.model_dump(exclude_unset=True)
        
        if "activity_type" in update_data and update_data["activity_type"]:
            update_data["activity_type"] = ActivityType(update_data["activity_type"].value)
        
        for key, value in update_data.items():
            setattr(db_template, key, value)
        
        db.commit()
        db.refresh(db_template)
        return db_template
    
    @staticmethod
    def delete_template(db: Session, template_id: int, user_id: int) -> bool:
        """Supprime un template."""
        db_template = db.query(WorkoutTemplate).filter(
            WorkoutTemplate.id == template_id,
            WorkoutTemplate.user_id == user_id,
        ).first()
        
        if not db_template:
            return False
        
        db.delete(db_template)
        db.commit()
        return True
    
    @staticmethod
    def add_exercise_to_template(
        db: Session,
        template_id: int,
        exercise: TemplateExerciseCreate,
        user_id: int,
    ) -> Optional[WorkoutTemplateExercise]:
        """Ajoute un exercice à un template."""
        # Vérifier que le template appartient à l'utilisateur
        db_template = db.query(WorkoutTemplate).filter(
            WorkoutTemplate.id == template_id,
            WorkoutTemplate.user_id == user_id,
        ).first()
        
        if not db_template:
            return None
        
        # Déterminer l'ordre si non fourni
        if not exercise.order:
            max_order = db.query(func.max(WorkoutTemplateExercise.order)).filter(
                WorkoutTemplateExercise.template_id == template_id
            ).scalar()
            exercise.order = (max_order or 0) + 1
        
        db_template_ex = WorkoutTemplateExercise(
            template_id=template_id,
            exercise_id=exercise.exercise_id,
            order=exercise.order,
            target_sets=exercise.target_sets,
            target_reps=exercise.target_reps,
            target_weight=exercise.target_weight,
            target_duration=exercise.target_duration,
            target_distance=exercise.target_distance,
            rest_seconds=exercise.rest_seconds,
            notes=exercise.notes,
        )
        db.add(db_template_ex)
        db.commit()
        db.refresh(db_template_ex)
        return db_template_ex
    
    @staticmethod
    def remove_exercise_from_template(
        db: Session,
        template_id: int,
        template_exercise_id: int,
        user_id: int,
    ) -> bool:
        """Supprime un exercice d'un template."""
        # Vérifier que le template appartient à l'utilisateur
        db_template = db.query(WorkoutTemplate).filter(
            WorkoutTemplate.id == template_id,
            WorkoutTemplate.user_id == user_id,
        ).first()
        
        if not db_template:
            return False
        
        db_template_ex = db.query(WorkoutTemplateExercise).filter(
            WorkoutTemplateExercise.id == template_exercise_id,
            WorkoutTemplateExercise.template_id == template_id,
        ).first()
        
        if not db_template_ex:
            return False
        
        db.delete(db_template_ex)
        db.commit()
        return True


# =============================================================================
# WORKOUT SESSION SERVICE
# =============================================================================

class SessionService:
    """Service pour la gestion des sessions d'entraînement."""
    
    @staticmethod
    def get_sessions(
        db: Session,
        user_id: int,
        status: Optional[SessionStatus] = None,
        activity_type: Optional[ActivityType] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[WorkoutSession]:
        """Récupère les sessions de l'utilisateur."""
        query = db.query(WorkoutSession).filter(WorkoutSession.user_id == user_id)
        
        if status:
            query = query.filter(WorkoutSession.status == status)
        
        if activity_type:
            query = query.filter(WorkoutSession.activity_type == activity_type)
        
        if start_date:
            query = query.filter(
                or_(
                    WorkoutSession.scheduled_at >= start_date,
                    WorkoutSession.started_at >= start_date,
                )
            )
        
        if end_date:
            query = query.filter(
                or_(
                    WorkoutSession.scheduled_at <= end_date,
                    WorkoutSession.started_at <= end_date,
                )
            )
        
        return query.options(
            joinedload(WorkoutSession.exercises).joinedload(WorkoutSessionExercise.exercise),
            joinedload(WorkoutSession.exercises).joinedload(WorkoutSessionExercise.sets),
        ).order_by(desc(WorkoutSession.created_at)).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_session(db: Session, session_id: int, user_id: int) -> Optional[WorkoutSession]:
        """Récupère une session par son ID."""
        return db.query(WorkoutSession).filter(
            WorkoutSession.id == session_id,
            WorkoutSession.user_id == user_id,
        ).options(
            joinedload(WorkoutSession.exercises).joinedload(WorkoutSessionExercise.exercise),
            joinedload(WorkoutSession.exercises).joinedload(WorkoutSessionExercise.sets),
        ).first()
    
    @staticmethod
    def get_active_session(db: Session, user_id: int) -> Optional[WorkoutSession]:
        """Récupère la session en cours de l'utilisateur."""
        return db.query(WorkoutSession).filter(
            WorkoutSession.user_id == user_id,
            WorkoutSession.status == SessionStatus.EN_COURS,
        ).options(
            joinedload(WorkoutSession.exercises).joinedload(WorkoutSessionExercise.exercise),
            joinedload(WorkoutSession.exercises).joinedload(WorkoutSessionExercise.sets),
        ).first()
    
    @staticmethod
    def create_session(
        db: Session,
        session: WorkoutSessionCreate,
        user_id: int,
    ) -> WorkoutSession:
        """Crée une nouvelle session."""
        db_session = WorkoutSession(
            name=session.name,
            activity_type=ActivityType(session.activity_type.value),
            status=SessionStatus.PLANIFIEE,
            user_id=user_id,
            template_id=session.template_id,
            scheduled_at=session.scheduled_at,
            notes=session.notes,
        )
        db.add(db_session)
        db.flush()
        
        # Si un template est fourni, copier les exercices
        if session.template_id:
            template_exercises = db.query(WorkoutTemplateExercise).filter(
                WorkoutTemplateExercise.template_id == session.template_id
            ).order_by(WorkoutTemplateExercise.order).all()
            
            for tex in template_exercises:
                session_ex = WorkoutSessionExercise(
                    session_id=db_session.id,
                    exercise_id=tex.exercise_id,
                    order=tex.order,
                    target_sets=tex.target_sets,
                    target_reps=tex.target_reps,
                    target_weight=tex.target_weight,
                    target_duration=tex.target_duration,
                    target_distance=tex.target_distance,
                    rest_seconds=tex.rest_seconds,
                    notes=tex.notes,
                )
                db.add(session_ex)
                db.flush()
                
                # Créer les séries vides
                for i in range(1, tex.target_sets + 1):
                    db_set = WorkoutSet(
                        session_exercise_id=session_ex.id,
                        set_number=i,
                        weight=tex.target_weight,
                        reps=tex.target_reps,
                        duration_seconds=tex.target_duration,
                        distance=tex.target_distance,
                    )
                    db.add(db_set)
        
        # Sinon, utiliser les exercices fournis
        elif session.exercises:
            for order, ex in enumerate(session.exercises):
                session_ex = WorkoutSessionExercise(
                    session_id=db_session.id,
                    exercise_id=ex.exercise_id,
                    order=ex.order if ex.order else order,
                    target_sets=ex.target_sets,
                    target_reps=ex.target_reps,
                    target_weight=ex.target_weight,
                    target_duration=ex.target_duration,
                    target_distance=ex.target_distance,
                    rest_seconds=ex.rest_seconds,
                    notes=ex.notes,
                )
                db.add(session_ex)
                db.flush()
                
                # Créer les séries
                if ex.sets:
                    for s in ex.sets:
                        db_set = WorkoutSet(
                            session_exercise_id=session_ex.id,
                            set_number=s.set_number,
                            weight=s.weight,
                            reps=s.reps,
                            duration_seconds=s.duration_seconds,
                            distance=s.distance,
                            is_warmup=s.is_warmup,
                            is_dropset=s.is_dropset,
                            is_failure=s.is_failure,
                            rpe=s.rpe,
                            notes=s.notes,
                        )
                        db.add(db_set)
                else:
                    # Créer des séries vides par défaut
                    for i in range(1, ex.target_sets + 1):
                        db_set = WorkoutSet(
                            session_exercise_id=session_ex.id,
                            set_number=i,
                            weight=ex.target_weight,
                            reps=ex.target_reps,
                            duration_seconds=ex.target_duration,
                            distance=ex.target_distance,
                        )
                        db.add(db_set)
        
        db.commit()
        db.refresh(db_session)
        return db_session
    
    @staticmethod
    def start_session(db: Session, session_id: int, user_id: int) -> Optional[WorkoutSession]:
        """Lance une session (démarre le timer)."""
        db_session = db.query(WorkoutSession).filter(
            WorkoutSession.id == session_id,
            WorkoutSession.user_id == user_id,
        ).first()
        
        if not db_session:
            return None
        
        if db_session.status not in [SessionStatus.PLANIFIEE, SessionStatus.EN_COURS]:
            return None
        
        db_session.status = SessionStatus.EN_COURS
        db_session.started_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(db_session)
        return db_session
    
    @staticmethod
    def end_session(db: Session, session_id: int, user_id: int) -> Optional[WorkoutSession]:
        """Termine une session."""
        db_session = db.query(WorkoutSession).filter(
            WorkoutSession.id == session_id,
            WorkoutSession.user_id == user_id,
            WorkoutSession.status == SessionStatus.EN_COURS,
        ).first()
        
        if not db_session:
            return None
        
        db_session.status = SessionStatus.TERMINEE
        db_session.ended_at = datetime.now(timezone.utc)
        
        if db_session.started_at:
            db_session.duration_seconds = int(
                (db_session.ended_at - db_session.started_at).total_seconds()
            )
        
        db.commit()
        db.refresh(db_session)
        return db_session
    
    @staticmethod
    def cancel_session(db: Session, session_id: int, user_id: int) -> Optional[WorkoutSession]:
        """Annule une session."""
        db_session = db.query(WorkoutSession).filter(
            WorkoutSession.id == session_id,
            WorkoutSession.user_id == user_id,
        ).first()
        
        if not db_session:
            return None
        
        db_session.status = SessionStatus.ANNULEE
        db_session.ended_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(db_session)
        return db_session
    
    @staticmethod
    def update_session(
        db: Session,
        session_id: int,
        session_update: WorkoutSessionUpdate,
        user_id: int,
    ) -> Optional[WorkoutSession]:
        """Met à jour une session."""
        db_session = db.query(WorkoutSession).filter(
            WorkoutSession.id == session_id,
            WorkoutSession.user_id == user_id,
        ).first()
        
        if not db_session:
            return None
        
        update_data = session_update.model_dump(exclude_unset=True)
        
        if "activity_type" in update_data and update_data["activity_type"]:
            update_data["activity_type"] = ActivityType(update_data["activity_type"].value)
        
        if "status" in update_data and update_data["status"]:
            update_data["status"] = SessionStatus(update_data["status"].value)
        
        for key, value in update_data.items():
            setattr(db_session, key, value)
        
        db.commit()
        db.refresh(db_session)
        return db_session
    
    @staticmethod
    def delete_session(db: Session, session_id: int, user_id: int) -> bool:
        """Supprime une session."""
        db_session = db.query(WorkoutSession).filter(
            WorkoutSession.id == session_id,
            WorkoutSession.user_id == user_id,
        ).first()
        
        if not db_session:
            return False
        
        db.delete(db_session)
        db.commit()
        return True
    
    @staticmethod
    def complete_set(
        db: Session,
        set_id: int,
        set_update: WorkoutSetUpdate,
        user_id: int,
    ) -> Optional[WorkoutSet]:
        """Marque une série comme complétée et met à jour les valeurs."""
        # Vérifier que la série appartient à l'utilisateur
        db_set = db.query(WorkoutSet).join(
            WorkoutSessionExercise
        ).join(
            WorkoutSession
        ).filter(
            WorkoutSet.id == set_id,
            WorkoutSession.user_id == user_id,
        ).first()
        
        if not db_set:
            return None
        
        update_data = set_update.model_dump(exclude_unset=True)
        
        for key, value in update_data.items():
            setattr(db_set, key, value)
        
        if set_update.is_completed and not db_set.completed_at:
            db_set.completed_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(db_set)
        return db_set
    
    @staticmethod
    def add_set(
        db: Session,
        session_exercise_id: int,
        set_data: WorkoutSetCreate,
        user_id: int,
    ) -> Optional[WorkoutSet]:
        """Ajoute une série à un exercice de session."""
        # Vérifier que l'exercice appartient à l'utilisateur
        session_ex = db.query(WorkoutSessionExercise).join(
            WorkoutSession
        ).filter(
            WorkoutSessionExercise.id == session_exercise_id,
            WorkoutSession.user_id == user_id,
        ).first()
        
        if not session_ex:
            return None
        
        db_set = WorkoutSet(
            session_exercise_id=session_exercise_id,
            set_number=set_data.set_number,
            weight=set_data.weight,
            reps=set_data.reps,
            duration_seconds=set_data.duration_seconds,
            distance=set_data.distance,
            is_warmup=set_data.is_warmup,
            is_dropset=set_data.is_dropset,
            is_failure=set_data.is_failure,
            rpe=set_data.rpe,
            notes=set_data.notes,
        )
        db.add(db_set)
        db.commit()
        db.refresh(db_set)
        return db_set


# =============================================================================
# WEIGHT ENTRY SERVICE
# =============================================================================

class WeightService:
    """Service pour la gestion des pesées."""
    
    @staticmethod
    def get_entries(
        db: Session,
        user_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[WeightEntry]:
        """Récupère les pesées de l'utilisateur."""
        query = db.query(WeightEntry).filter(WeightEntry.user_id == user_id)
        
        if start_date:
            query = query.filter(WeightEntry.measured_at >= start_date)
        
        if end_date:
            query = query.filter(WeightEntry.measured_at <= end_date)
        
        return query.order_by(desc(WeightEntry.measured_at)).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_latest(db: Session, user_id: int) -> Optional[WeightEntry]:
        """Récupère la dernière pesée."""
        return db.query(WeightEntry).filter(
            WeightEntry.user_id == user_id
        ).order_by(desc(WeightEntry.measured_at)).first()
    
    @staticmethod
    def create_entry(
        db: Session,
        entry: WeightEntryCreate,
        user_id: int,
    ) -> WeightEntry:
        """Crée une pesée."""
        db_entry = WeightEntry(
            user_id=user_id,
            weight=entry.weight,
            body_fat_percentage=entry.body_fat_percentage,
            muscle_mass=entry.muscle_mass,
            water_percentage=entry.water_percentage,
            measured_at=entry.measured_at or datetime.now(timezone.utc),
            notes=entry.notes,
        )
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry
    
    @staticmethod
    def update_entry(
        db: Session,
        entry_id: int,
        entry_update: WeightEntryUpdate,
        user_id: int,
    ) -> Optional[WeightEntry]:
        """Met à jour une pesée."""
        db_entry = db.query(WeightEntry).filter(
            WeightEntry.id == entry_id,
            WeightEntry.user_id == user_id,
        ).first()
        
        if not db_entry:
            return None
        
        update_data = entry_update.model_dump(exclude_unset=True)
        
        for key, value in update_data.items():
            setattr(db_entry, key, value)
        
        db.commit()
        db.refresh(db_entry)
        return db_entry
    
    @staticmethod
    def delete_entry(db: Session, entry_id: int, user_id: int) -> bool:
        """Supprime une pesée."""
        db_entry = db.query(WeightEntry).filter(
            WeightEntry.id == entry_id,
            WeightEntry.user_id == user_id,
        ).first()
        
        if not db_entry:
            return False
        
        db.delete(db_entry)
        db.commit()
        return True
    
    @staticmethod
    def get_stats(db: Session, user_id: int, days: int = 30) -> dict:
        """Calcule les statistiques de poids."""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        entries = db.query(WeightEntry).filter(
            WeightEntry.user_id == user_id,
            WeightEntry.measured_at >= start_date,
        ).order_by(WeightEntry.measured_at).all()
        
        if not entries:
            return {
                "min": None,
                "max": None,
                "average": None,
                "trend": None,
                "first": None,
                "last": None,
                "change": None,
            }
        
        weights = [e.weight for e in entries]
        
        return {
            "min": min(weights),
            "max": max(weights),
            "average": sum(weights) / len(weights),
            "first": entries[0].weight,
            "last": entries[-1].weight,
            "change": entries[-1].weight - entries[0].weight if len(entries) > 1 else 0,
            "trend": "up" if len(entries) > 1 and entries[-1].weight > entries[0].weight else "down" if len(entries) > 1 and entries[-1].weight < entries[0].weight else "stable",
        }


# =============================================================================
# GOAL SERVICE
# =============================================================================

class GoalService:
    """Service pour la gestion des objectifs."""
    
    @staticmethod
    def get_goals(
        db: Session,
        user_id: int,
        is_active: Optional[bool] = None,
        goal_type: Optional[GoalType] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Goal]:
        """Récupère les objectifs de l'utilisateur."""
        query = db.query(Goal).filter(Goal.user_id == user_id)
        
        if is_active is not None:
            query = query.filter(Goal.is_active == is_active)
        
        if goal_type:
            query = query.filter(Goal.goal_type == goal_type)
        
        return query.options(
            joinedload(Goal.exercise)
        ).order_by(desc(Goal.created_at)).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_goal(db: Session, goal_id: int, user_id: int) -> Optional[Goal]:
        """Récupère un objectif par son ID."""
        return db.query(Goal).filter(
            Goal.id == goal_id,
            Goal.user_id == user_id,
        ).options(joinedload(Goal.exercise)).first()
    
    @staticmethod
    def create_goal(db: Session, goal: GoalCreate, user_id: int) -> Goal:
        """Crée un objectif."""
        db_goal = Goal(
            user_id=user_id,
            name=goal.name,
            description=goal.description,
            goal_type=GoalType(goal.goal_type.value),
            target_value=goal.target_value,
            current_value=goal.current_value,
            initial_value=goal.initial_value or goal.current_value,
            unit=goal.unit,
            exercise_id=goal.exercise_id,
            deadline=goal.deadline,
        )
        db.add(db_goal)
        db.commit()
        db.refresh(db_goal)
        return db_goal
    
    @staticmethod
    def update_goal(
        db: Session,
        goal_id: int,
        goal_update: GoalUpdate,
        user_id: int,
    ) -> Optional[Goal]:
        """Met à jour un objectif."""
        db_goal = db.query(Goal).filter(
            Goal.id == goal_id,
            Goal.user_id == user_id,
        ).first()
        
        if not db_goal:
            return None
        
        update_data = goal_update.model_dump(exclude_unset=True)
        
        for key, value in update_data.items():
            setattr(db_goal, key, value)
        
        # Vérifier si l'objectif est atteint
        if db_goal.current_value >= db_goal.target_value and not db_goal.is_achieved:
            db_goal.is_achieved = True
            db_goal.achieved_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(db_goal)
        return db_goal
    
    @staticmethod
    def delete_goal(db: Session, goal_id: int, user_id: int) -> bool:
        """Supprime un objectif."""
        db_goal = db.query(Goal).filter(
            Goal.id == goal_id,
            Goal.user_id == user_id,
        ).first()
        
        if not db_goal:
            return False
        
        db.delete(db_goal)
        db.commit()
        return True


# =============================================================================
# STATS SERVICE
# =============================================================================

class StatsService:
    """Service pour les statistiques globales."""
    
    @staticmethod
    def get_workout_stats(db: Session, user_id: int) -> WorkoutStatsResponse:
        """Calcule les statistiques d'entraînement."""
        # Total des sessions
        total_sessions = db.query(func.count(WorkoutSession.id)).filter(
            WorkoutSession.user_id == user_id
        ).scalar() or 0
        
        # Sessions complétées
        completed_sessions = db.query(func.count(WorkoutSession.id)).filter(
            WorkoutSession.user_id == user_id,
            WorkoutSession.status == SessionStatus.TERMINEE,
        ).scalar() or 0
        
        # Durée totale
        total_duration = db.query(func.sum(WorkoutSession.duration_seconds)).filter(
            WorkoutSession.user_id == user_id,
            WorkoutSession.status == SessionStatus.TERMINEE,
        ).scalar() or 0
        
        # Sessions cette semaine
        week_start = datetime.now(timezone.utc) - timedelta(days=7)
        sessions_this_week = db.query(func.count(WorkoutSession.id)).filter(
            WorkoutSession.user_id == user_id,
            WorkoutSession.status == SessionStatus.TERMINEE,
            WorkoutSession.started_at >= week_start,
        ).scalar() or 0
        
        # Sessions ce mois
        month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        sessions_this_month = db.query(func.count(WorkoutSession.id)).filter(
            WorkoutSession.user_id == user_id,
            WorkoutSession.status == SessionStatus.TERMINEE,
            WorkoutSession.started_at >= month_start,
        ).scalar() or 0
        
        # Activité favorite
        favorite_activity_result = db.query(
            WorkoutSession.activity_type,
            func.count(WorkoutSession.id).label('count')
        ).filter(
            WorkoutSession.user_id == user_id,
            WorkoutSession.status == SessionStatus.TERMINEE,
        ).group_by(WorkoutSession.activity_type).order_by(
            desc('count')
        ).first()
        
        favorite_activity = favorite_activity_result[0] if favorite_activity_result else None
        
        # Calcul des streaks (simplifié)
        # TODO: Implémenter le calcul réel des streaks
        current_streak = 0
        longest_streak = 0
        
        return WorkoutStatsResponse(
            total_sessions=total_sessions,
            completed_sessions=completed_sessions,
            total_duration_minutes=total_duration // 60 if total_duration else 0,
            sessions_this_week=sessions_this_week,
            sessions_this_month=sessions_this_month,
            current_streak=current_streak,
            longest_streak=longest_streak,
            favorite_activity=favorite_activity,
            favorite_muscle_group=None,  # TODO: Implémenter
        )
