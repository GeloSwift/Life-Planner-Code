# 🎯 Prompt : Implémentation des Objectifs Dynamiques

Utilise ce prompt quand tu es prêt à implémenter la fonctionnalité "Objectifs".

---

## Contexte

L'application Life Planner possède un module Workout avec :
- **Séances récurrentes** (parent/child pattern avec occurrences)
- **Exercices** avec séries (sets) validées individuellement
- **Stats dynamiques** sur le dashboard basées sur l'activité favorite

Actuellement, il existe déjà une API Goals basique (`/workout/goals`) mais elle n'est pas liée aux exercices des séances.

---

## Objectif

Implémenter un système d'objectifs intelligents qui :

1. **Se lient à des exercices spécifiques** (ex: "Développé couché", "Course")
2. **Se mettent à jour automatiquement** quand des séries sont validées dans une séance
3. **Supportent la modification manuelle** de la progression (augmenter ou diminuer)
4. **Supportent différents types de métriques** :
   - Poids max (kg) - "Soulever 100kg au développé couché"
   - Répétitions totales - "Faire 1000 tractions ce mois"  
   - Volume (poids × reps) - "Soulever 50 000 kg cette semaine"
   - Distance - "Courir 100km ce mois"
   - Durée - "30 min de gainage cette semaine"
   - Fréquence - "4 séances de musculation cette semaine"
5. **Affichent la progression** avec barres et pourcentages
6. **Notifient l'utilisateur** quand un objectif est atteint

---

## Fichiers existants à consulter

### Backend
- `app/back/workout/models.py` - Modèle `Goal` existant
- `app/back/workout/service.py` - `GoalService` existant  
- `app/back/workout/routes.py` - Routes `/workout/goals`
- `app/back/workout/schemas.py` - Schemas `GoalCreate`, `GoalResponse`

### Frontend
- `app/front/src/app/(protected)/workout/goals/page.tsx` - Page existante (basique)
- `app/front/src/lib/workout-api.ts` - `goalsApi` existant

### Documentation
- `docs/DYNAMIC_CONTENT.md` - Section "Objectifs (FUTUR)"

---

## Tâches à réaliser

### 1. Backend - Modèle enrichi

Modifier le modèle `Goal` pour ajouter :
```python
exercise_id: Optional[int]  # Lié à un exercice spécifique
metric_type: str  # "max_weight", "total_reps", "volume", "distance", "duration", "frequency"
period: str  # "week", "month", "year", "lifetime"
period_start: Optional[datetime]  # Début de la période
auto_update: bool = True  # Mise à jour auto via sets validés
```

### 2. Backend - Mise à jour automatique

Dans `SessionService.complete_set()` ou `SessionService.end_session()` :
```python
# Après validation d'un set/séance
GoalService.update_progress_from_set(db, user_id, set_data)
GoalService.update_progress_from_session(db, user_id, session)
```

### 3. Backend - Calcul de progression

```python
def calculate_goal_progress(goal: Goal, db: Session) -> float:
    """Calcule la progression actuelle basée sur les données."""
    if goal.metric_type == "max_weight":
        # Chercher le max weight dans les sets de l'exercice
        return SessionService.get_max_weight(db, goal.user_id, goal.exercise_id, goal.period)
    elif goal.metric_type == "total_reps":
        return SessionService.get_total_reps(db, goal.user_id, goal.exercise_id, goal.period)
    # etc...
```

### 4. Frontend - Page Goals enrichie

Page `/workout/goals` avec :
- **Liste des objectifs** avec carte pour chaque
- **Barre de progression** colorée (rouge → orange → vert)
- **Création** avec sélection d'exercice et type de métrique
- **Modification manuelle** de la progression (boutons +/- ou input direct)
- **Historique des modifications** (auto vs manuel)
- **Filtres** par statut (en cours, atteint, expiré)
- **Badges** pour les objectifs atteints

### 5. Frontend - Widget Dashboard

Sur le dashboard `/workout`, afficher :
- Objectif principal ou le plus proche d'être atteint
- Mini barre de progression
- Lien vers la page Goals

---

## Logique de mise à jour automatique (détaillée)

```
Utilisateur valide un set →
  1. Récupérer l'exercice du set
  2. Récupérer tous les objectifs de l'utilisateur liés à cet exercice
  3. Pour chaque objectif avec auto_update=True :
     a. Calculer la nouvelle valeur (selon metric_type)
     b. Mettre à jour current_value
     c. Si current_value >= target_value :
        - Marquer is_achieved = True
        - Déclencher notification (toast + optionnel email)
        - Créer un badge/achievement
```

---

## Exemple de flux utilisateur

1. User crée objectif "Soulever 100kg au développé couché"
2. User fait une séance avec développé couché
3. User valide un set : 80kg × 8 reps
4. Système met à jour : current_value = 80 (max)
5. User continue, fait 95kg × 3 reps
6. Système met à jour : current_value = 95
7. Prochaine séance : 100kg × 1 rep
8. Système : is_achieved = True, notification 🎉

---

## Points d'attention

- **Performance** : Ne pas recalculer tout l'historique à chaque set
- **Périodes** : Calculer correctement les bornes (début de semaine, mois...)  
- **Cohérence** : Si un set est supprimé, la progression doit se recalculer
- **UX** : Notifications non intrusives, célébration quand atteint
- **Modification manuelle** : Permettre d'ajuster dans les deux sens (+ et -)

---

## Modification manuelle de la progression

### Fonctionnalité

L'utilisateur peut modifier manuellement la progression de n'importe quel objectif :
- **Augmenter** : Si la mise à jour auto n'a pas capté une performance (ex: salle extérieure)
- **Diminuer** : Correction d'erreur ou réinitialisation après blessure

### Interface

```
[ Objectif : Développé couché 100kg ]
[==============>      ] 85kg / 100kg (85%)

[ - ]  [ 85 kg ]  [ + ]   [ Modifier ]
```

### Backend

```python
# Route existante à enrichir ou nouvelle route
@router.put("/goals/{goal_id}/progress")
def update_goal_progress(
    goal_id: int,
    progress_update: GoalProgressUpdate,  # { current_value: float, reason?: string }
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Met à jour manuellement la progression d'un objectif."""
    return GoalService.update_progress(
        db, goal_id, progress_update.current_value, 
        is_manual=True, 
        reason=progress_update.reason
    )
```

### Historique des modifications

Optional : Garder un log des modifications pour traçabilité :
```python
class GoalProgressLog(Base):
    goal_id: int
    old_value: float
    new_value: float
    is_manual: bool  # True si modifié manuellement, False si auto via set
    reason: Optional[str]  # "Performance hors app", "Correction erreur", etc.
    created_at: datetime
```

---

## Fichiers à créer/modifier

| Action | Fichier |
|--------|---------|
| Modifier | `app/back/workout/models.py` - Enrichir Goal |
| Modifier | `app/back/workout/schemas.py` - Nouveaux champs |
| Modifier | `app/back/workout/service.py` - GoalService amélioré |
| Modifier | `app/back/workout/routes.py` - Nouvelles routes si besoin |
| Refaire | `app/front/src/app/(protected)/workout/goals/page.tsx` |
| Créer | `app/front/src/components/workout/goal-card.tsx` |
| Créer | `app/front/src/components/workout/goal-form.tsx` |
| Modifier | `app/front/src/app/(protected)/workout/page.tsx` - Widget goals |

---

*Créé le 21 Janvier 2026*
