"""
Module Workout Planner.

Ce module gère tout ce qui concerne les entraînements sportifs :
- Exercices (avec vidéos/GIFs)
- Templates de séances
- Sessions d'entraînement en cours
- Pesées et suivi du poids
- Objectifs sportifs
"""

from workout.models import (
    ActivityType,
    MuscleGroup,
    Exercise,
    WorkoutTemplate,
    WorkoutTemplateExercise,
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSet,
    WeightEntry,
    Goal,
    GoalType,
)
from workout.routes import router

__all__ = [
    "ActivityType",
    "MuscleGroup",
    "Exercise",
    "WorkoutTemplate",
    "WorkoutTemplateExercise",
    "WorkoutSession",
    "WorkoutSessionExercise",
    "WorkoutSet",
    "WeightEntry",
    "Goal",
    "GoalType",
    "router",
]
