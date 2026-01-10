# 🏃 Sports - Éléments Dynamiques à Mettre à Jour

Ce document liste tous les éléments du code qui dépendent des types de sports.

**Quand un nouveau sport est ajouté à la table `user_activity_types`, il faut potentiellement mettre à jour ces fichiers.**

---

## 📊 Dashboard Stats (4ème stat dynamique)

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

---

## ⭐ Système de favoris

**Backend** : `app/back/workout/service.py` (méthode `get_stats`)

Le favori est déterminé par :
1. **En priorité** : Le sport avec `is_favorite = true` dans `user_activity_types`
2. **Fallback** : L'activité la plus utilisée dans les sessions terminées

**Endpoints** :
- `POST /workout/activity-types/{id}/favorite` - Toggle le statut favori
- `GET /workout/activity-types/favorite` - Récupère le sport favori

---

## 📋 Page Sports

**Fichier** : `app/front/src/app/(protected)/workout/activity-types/page.tsx`

Cette page permet de :
- Lister tous les sports (par défaut + personnalisés)
- Créer/Modifier/Supprimer des sports personnalisés
- Marquer un sport comme favori (étoile ⭐)

**Icônes disponibles** :
| Icône | Nom | Sports suggérés |
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
| 🎯 | Target | Tir, Fléchettes |
| ⚡ | Zap | Intensif |
| 🏆 | Trophy | Compétition |
| 🏐 | Volleyball | Volleyball |
| 📊 | Activity | Autre |

---

## 📝 Checklist de mise à jour

Quand un nouveau sport est ajouté et que vous voulez une stat personnalisée :

- [ ] **Dashboard Stats** : Ajouter le pattern de nom dans la liste correspondante
  - `isWeightSport` pour afficher les kg
  - `isRunSport` pour afficher les séances course
  - Ou créer un nouveau cas (ex: `isSwimSport` pour la distance en m)
- [ ] **Frontend** : Ajouter l'icône et la couleur correspondantes
- [ ] **Backend** : Vérifier que les champs personnalisés sont bien créés

---

## 🔔 Notification automatique par email

**Implémenté** : Quand un utilisateur crée un nouveau sport, un email est envoyé à l'admin.

**Fichiers concernés** :
- `app/back/core/email.py` - méthode `send_admin_notification_email`
- `app/back/workout/routes.py` - endpoint `create_user_activity_type`
- Variable d'environnement : `ADMIN_EMAIL`

---

*Dernière mise à jour : 10 Janvier 2026*
