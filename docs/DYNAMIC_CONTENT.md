# � Contenu Dynamique - Guide Développeur

Ce document liste tous les éléments du code qui dépendent de contenus dynamiques créés par les utilisateurs.

**Quand un nouvel élément est créé (sport, exercice, objectif), vérifier ces fichiers pour potentiellement mettre à jour l'affichage.**

---

## 📬 Notifications Admin

Quand un utilisateur crée certains éléments, un email est envoyé à l'admin pour review et mise à jour potentielle des stats dynamiques.

| Création | Notification | Fichier Backend |
|----------|--------------|-----------------|
| Type d'activité (sport) | ✅ | `workout/routes.py` → `create_user_activity_type` |
| Exercice | ✅ | `workout/routes.py` → `create_exercise` |

**Configuration** :
- Variable d'environnement : `ADMIN_EMAIL`
- Service email : `app/back/core/email.py` → `send_admin_notification_email`

---

## 🏃 Types d'Activités (Sports)

### Dashboard Stats (4ème stat dynamique)

**Fichier** : `app/front/src/app/(protected)/workout/page.tsx`

**Logique actuelle** :
- Si `favorite_activity` contient `musculation`, `crossfit`, `hiit`, `fitness` → Affiche **Poids total (kg)** avec icône 🏋️
- Si `favorite_activity` contient `course`, `running`, `jogging`, `marathon`, `trail` → Affiche **Séances course** avec icône 👣
- Sinon → Affiche **Séries complétées** avec icône 📈

**À modifier si nouveau type** :
```typescript
// Ligne ~250-320
const isWeightSport = ["musculation", "crossfit", "hiit", "fitness"].some(s => 
  favActivity.includes(s)
);
const isRunSport = ["course", "running", "jogging", "marathon", "trail"].some(s => 
  favActivity.includes(s)
);
```

**Stats possibles par type de sport** :
| Sport | Stat recommandée | Icône | Couleur |
|-------|-----------------|-------|---------|
| Musculation, CrossFit, HIIT, Fitness | Poids total (kg) | Dumbbell | purple |
| Course, Running, Jogging, Marathon, Trail | Séances course | Footprints | cyan |
| Natation | Longueurs / Distance | Waves | blue |
| Danse, Yoga | Durée totale | Timer | pink |
| Volleyball, Basketball, Football, Tennis | Matchs / Séances | Activity | orange |
| Autre | Séries | TrendingUp | green |

### Système de favoris

**Backend** : `app/back/workout/service.py` (méthode `get_stats`)

Le favori est déterminé par :
1. **En priorité** : Le sport avec `is_favorite = true` dans `user_activity_types`
2. **Fallback** : L'activité la plus utilisée dans les sessions terminées

### Page Activity Types

**Fichier** : `app/front/src/app/(protected)/workout/activity-types/page.tsx`

Cette page permet de :
- Lister tous les sports (par défaut + personnalisés)
- Créer/Modifier/Supprimer des sports personnalisés
- Marquer un sport comme favori (étoile ⭐)
- Ajouter des champs personnalisés aux exercices du sport

---

## 💪 Exercices

### Création et Notification

Quand un utilisateur crée un exercice, l'admin reçoit un email pour :
- Vérifier si l'exercice est pertinent pour d'autres utilisateurs
- Potentiellement l'ajouter aux exercices globaux
- Créer des stats spécifiques si nécessaire

### Lien Exercice ↔ Objectif

**Important** : Quand un exercice est créé/utilisé, il peut être automatiquement lié à un objectif existant.

**Logique de liaison automatique** :
```
Utilisateur valide une série (set) dans une séance →
  1. Récupérer l'exercice de la série
  2. Chercher les objectifs de l'utilisateur qui référencent cet exercice
  3. Si poids validé > progression actuelle de l'objectif :
     → Mettre à jour la progression de l'objectif
  4. Si objectif atteint → Notification 🎉
```

**Exemple concret** :
- Objectif : "Soulever 100kg au développé couché"
- Séance avec l'exercice "Développé couché"
- Série validée : 95kg × 5 reps
- → L'objectif passe de 90kg à 95kg (progression automatique)

### Détails de séance dynamiques (TODO)

**Fichier** : `app/front/src/app/(protected)/workout/sessions/[id]/page.tsx`

**Objectif** : Adapter l'affichage des exercices selon leur type :

| Type d'exercice | Affichage recommandé |
|-----------------|---------------------|
| Musculation classique | Séries × Reps @ kg |
| Course/Cardio | Distance + Durée + Pace |
| Gainage/Planche | Durée (secondes) |
| Exercice au poids de corps | Séries × Reps |
| Exercice avec élastique | Séries × Reps + Résistance |

**Champs personnalisés possibles** (via activity type fields) :
- `weight` (kg) - Poids utilisé
- `reps` - Répétitions
- `duration` (secondes) - Durée
- `distance` (m/km) - Distance
- `rest` (secondes) - Temps de repos

### Stats "Cette semaine" dynamiques (TODO)

**Fichier** : `app/front/src/app/(protected)/workout/page.tsx`

Les stats "Cette semaine" devraient s'adapter aux exercices effectués :

| Si exercices contiennent | Stat affichée |
|-------------------------|---------------|
| Exercices de musculation | Poids total soulevé |
| Exercices de course | Distance totale |
| Exercices de gainage | Temps total de gainage |
| Exercices cardio | Calories brûlées (estimé) |

---

## 🎯 Objectifs (FUTUR)

### Concept

Les objectifs seront liés aux exercices et se mettront à jour automatiquement quand des séries sont validées.

### Types d'objectifs prévus

| Type | Exemple | Mise à jour auto |
|------|---------|------------------|
| Poids soulevé | "Soulever 100kg au développé couché" | ✅ Via max des sets validés |
| Répétitions | "Faire 50 tractions en une séance" | ✅ Via somme des reps validées |
| Volume | "Soulever 10 000 kg cette semaine" | ✅ Via (poids × reps) cumulé |
| Fréquence | "Faire 4 séances cette semaine" | ✅ Via count sessions |
| Distance | "Courir 50km ce mois" | ✅ Via somme distance |
| Durée | "15 min de gainage cette semaine" | ✅ Via somme durée |

### Logique de mise à jour automatique

```
Séance terminée → Pour chaque set validé :
  1. Identifier l'exercice
  2. Trouver les objectifs liés à cet exercice
  3. Calculer la nouvelle progression
  4. Mettre à jour l'objectif
  5. Si objectif atteint → Notification + badge
```

### Fichiers à créer

| Élément | Fichier |
|---------|---------|
| API Goals | `app/back/workout/goals/` (déjà existant, à enrichir) |
| Page Goals | `app/front/src/app/(protected)/workout/goals/page.tsx` |
| CRUD Goals | Create/Edit/Delete modals |
| Composant Progress | `app/front/src/components/workout/goal-progress.tsx` |

---

## 📝 Checklist de mise à jour

### Quand un nouveau sport est ajouté :
- [ ] Vérifier si une stat personnalisée est pertinente
- [ ] Ajouter le pattern dans `isWeightSport` / `isRunSport` / créer nouveau
- [ ] Choisir icône et couleur appropriées

### Quand un nouvel exercice est créé :
- [ ] Vérifier s'il nécessite un affichage particulier
- [ ] S'assurer que les champs personnalisés sont bien configurés
- [ ] Tester l'affichage dans le détail de séance
- [ ] Vérifier s'il peut être lié à un objectif existant (même nom/type)
- [ ] S'assurer que les sets validés mettront à jour les objectifs liés

### Quand les objectifs sont implémentés :
- [ ] Vérifier la mise à jour auto après validation de set
- [ ] Tester les différents types d'objectifs
- [ ] Configurer les notifications de complétion

---

## 🔖 Icônes disponibles

| Icône | Nom | Usages suggérés |
|-------|-----|-----------------|
| 🏋️ | Dumbbell | Musculation, Fitness |
| 👣 | Footprints | Course, Running |
| 🚴 | Bike | Cyclisme, VTT |
| 🌊 | Waves | Natation |
| 🎵 | Music | Danse |
| 🔥 | Flame | CrossFit |
| ⏱️ | Timer | HIIT |
| ❤️ | Heart | Cardio |
| ⛰️ | Mountain | Randonnée, Trail |
| 🧘 | PersonStanding | Yoga, Pilates |
| 🏅 | Medal | Compétition |
| ⚔️ | Swords | Boxe, MMA |
| 🎯 | Target | Tir, Fléchettes, Objectifs |
| ⚡ | Zap | Intensif |
| 🏆 | Trophy | Compétition, Accomplissement |
| 🏐 | Volleyball | Volleyball |
| 📊 | Activity | Autre |

---

*Dernière mise à jour : 21 Janvier 2026*
