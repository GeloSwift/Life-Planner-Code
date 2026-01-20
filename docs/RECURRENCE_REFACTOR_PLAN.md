# Plan de refactoring : Récurrence des séances

## Problème actuel

1. **Une seule session pour toute la récurrence** : Quand on termine une occurrence, ça termine toutes les occurrences
2. **Pas de tracking individuel** : Impossible de suivre les performances de chaque occurrence séparément
3. **Historique incorrect** : L'historique ne voit qu'une seule séance au lieu de toutes les occurrences

## Architecture cible : Parent/Enfant

### Nouveau modèle de données

```
WorkoutSession (PARENT - Template de récurrence)
├── id, name, activity_type, etc.
├── recurrence_type: "weekly" | "daily" | "monthly" | null
├── recurrence_data: ["monday", "wednesday"] (JSON)
├── recurrence_end_date: Date (optionnel, fin de la récurrence)
├── status: "planifiee" (toujours planifiée, c'est un template)
└── is_recurrence_parent: true

WorkoutSessionOccurrence (ENFANT - Instance réelle)
├── id
├── parent_session_id: FK → WorkoutSession.id
├── occurrence_date: Date (la date spécifique)
├── status: "planifiee" | "en_cours" | "terminee" | "annulee"
├── started_at, ended_at, duration_seconds
├── notes, rating, perceived_difficulty
└── exercises: relation vers les sets réels
```

### Alternative plus simple : Champ parent_id sur WorkoutSession

On peut aussi simplement ajouter un champ `parent_session_id` sur `WorkoutSession` :

```python
class WorkoutSession:
    # ... champs existants ...
    
    # Nouveau : lien vers la session parente (pour les occurrences)
    parent_session_id: Optional[int]  # FK vers WorkoutSession.id
    occurrence_date: Optional[date]   # Date spécifique de cette occurrence
    
    # La session parente a recurrence_type défini
    # Les enfants ont parent_session_id défini + occurrence_date
```

## Comportement cible

### 1. Création d'une séance récurrente
- Crée UNE session parente avec `recurrence_type` défini
- `status = "planifiee"` (template)
- Pas de création automatique des enfants

### 2. Calendrier (affichage)
- Le calendrier "expand" les dates récurrentes comme actuellement
- Quand on clique sur une occurrence, on vérifie si un enfant existe pour cette date

### 3. Lancement d'une occurrence
- SI enfant existe pour cette date → utiliser cet enfant
- SINON → créer un enfant à partir du parent :
  ```python
  def start_occurrence(parent_id: int, occurrence_date: date):
      parent = get_session(parent_id)
      child = WorkoutSession(
          parent_session_id=parent.id,
          occurrence_date=occurrence_date,
          name=parent.name,
          activity_type=parent.activity_type,
          exercises=copy_exercises_from(parent),
          status="en_cours",
          started_at=now()
      )
      return child
  ```

### 4. Terminer une occurrence
- Modifie UNIQUEMENT le statut de l'enfant
- Les autres occurrences restent "planifiee"

### 5. Historique
- Affiche TOUS les enfants terminés
- Chaque enfant a ses propres sets/reps/performances

### 6. Liste des séances
- Affiche UNE carte par session parente (+ séances non récurrentes)
- Comme actuellement

## Migration database

```sql
-- Migration: add parent_session_id and occurrence_date
ALTER TABLE workout_sessions 
ADD COLUMN parent_session_id INTEGER REFERENCES workout_sessions(id) ON DELETE CASCADE;

ALTER TABLE workout_sessions 
ADD COLUMN occurrence_date DATE;

-- Index pour les requêtes
CREATE INDEX ix_workout_sessions_parent ON workout_sessions(parent_session_id);
CREATE INDEX ix_workout_sessions_occurrence ON workout_sessions(occurrence_date);
```

## Tasks d'implémentation

### Backend (Python/SQLAlchemy)

1. [ ] **Migration** : Ajouter `parent_session_id` et `occurrence_date` au modèle
2. [ ] **Service** : `create_occurrence(parent_id, date)` - créer une occurrence depuis un parent
3. [ ] **Service** : Modifier `start_session` pour gérer les occurrences
4. [ ] **Service** : `get_occurrences(parent_id)` - lister les occurrences d'une récurrence
5. [ ] **API** : `POST /sessions/{id}/occurrences/{date}/start` - lancer une occurrence spécifique
6. [ ] **API** : Modifier les routes existantes pour supporter le nouveau modèle

### Frontend (React/Next.js)

1. [ ] **Calendrier** : Passer la `occurrence_date` quand on clique sur un jour
2. [ ] **Session page** : Utiliser l'occurrence au lieu du parent
3. [ ] **Historique** : Afficher les occurrences terminées, pas les parents
4. [ ] **Liste séances** : Filtrer pour n'afficher que les parents + non-récurrentes

## Estimation

- Backend : 4-6 heures
- Frontend : 2-3 heures  
- Tests : 1-2 heures
- **Total : ~8-11 heures**

## Questions ouvertes

1. Que faire si on modifie le parent après avoir créé des enfants ?
2. Comment gérer la suppression d'une récurrence ? (supprimer aussi les enfants ?)
3. Faut-il une date de fin pour les récurrences ?
