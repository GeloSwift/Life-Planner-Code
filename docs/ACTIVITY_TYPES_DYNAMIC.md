# 🏃 Types d'Activités - Éléments Dynamiques à Mettre à Jour

Ce document liste tous les éléments du code qui dépendent des types d'activités personnalisés.

**Quand un nouveau type d'activité est ajouté à la table `user_activity_types`, il faut potentiellement mettre à jour ces fichiers.**

---

## 📊 Dashboard Stats (4ème stat dynamique)

**Fichier** : `app/front/src/app/(protected)/workout/page.tsx`

**Logique actuelle** :
- Si `favorite_activity` est `musculation`, `crossfit`, ou `hiit` → Affiche **Poids total (kg)**
- Sinon → Affiche **Séries complétées**

**À modifier si nouveau type** :
```typescript
// Ligne ~240-270
{stats?.favorite_activity && ["musculation", "crossfit", "hiit"].includes(stats.favorite_activity) ? (
  // Affiche les kg
) : (
  // Affiche les séries
)}
```

**Stats possibles par type d'activité** :
| Type d'activité | Stat recommandée |
|-----------------|------------------|
| Musculation, CrossFit, HIIT | Poids total (kg) |
| Course à pied, Cyclisme | Distance (km) |
| Natation | Longueurs / Distance |
| Danse, Yoga | Durée totale |
| Volleyball, Basketball, Football, Tennis | Matchs / Séances |
| Autre | Séries ou durée |

---

## 📋 Session Detail - Champs d'exercice dynamiques

**Fichier** : `app/front/src/app/(protected)/workout/sessions/[id]/page.tsx`

**Éléments dynamiques** :
1. **Icône d'activité** - Basée sur le type d'activité
2. **Champs de saisie des séries** - Varient selon le type :
   - Musculation : poids, reps, temps de repos
   - Course : distance, durée, allure
   - Autres : adapté aux champs personnalisés

**Fonctions à vérifier** :
- `extractExerciseDetails()` - Extrait les détails selon le type
- `getSetInputFields()` - Définit les champs de saisie
- `formatSecondaryDetails()` - Formate l'affichage

---

## 🏋️ Exercise Detail - Affichage des paramètres

**Fichier** : `app/front/src/app/(protected)/workout/exercises/[id]/page.tsx`

**Éléments dynamiques** :
1. **Icône d'activité** - Correspond au type d'activité de l'exercice
2. **Champs personnalisés** - Affichés dynamiquement selon les `CustomFieldDefinition` liées au type d'activité
3. **Labels et unités** - Adaptés au contexte (kg pour muscu, km pour course, etc.)

---

## 🔧 Fichiers de configuration des types

### Types TypeScript

**Fichier** : `app/front/src/lib/workout-types.ts`

```typescript
// Ligne ~11-25
export type ActivityType =
  | "musculation"
  | "course"
  | "cyclisme"
  | "natation"
  | "volleyball"
  | "boxe"
  | "basketball"
  | "football"
  | "tennis"
  | "yoga"
  | "crossfit"
  | "hiit"
  | "danse"
  | "autre";

// Ligne ~65-80
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  musculation: "Musculation",
  course: "Course à pied",
  // ... etc
};
```

### Icônes par type (Lucide)

**Fichier** : `app/front/src/components/workout/activity-icon.tsx` (si existe)

| Type | Icône Lucide |
|------|--------------|
| Musculation | `Dumbbell` |
| Course à pied | `Footprints` |
| Danse | `Music` |
| Volleyball | `Volleyball` |
| Cyclisme | `Bike` |
| Natation | `Waves` |
| Yoga | `PersonStanding` |
| CrossFit | `Flame` |
| HIIT | `Timer` |

---

## 📝 Checklist de mise à jour

Quand un nouveau type d'activité est ajouté :

- [ ] **Backend** : Ajouter dans la table `user_activity_types`
- [ ] **Types TS** : Mettre à jour `ActivityType` dans `workout-types.ts`
- [ ] **Labels** : Ajouter le label français dans `ACTIVITY_TYPE_LABELS`
- [ ] **Icône** : Associer une icône Lucide au nouveau type
- [ ] **Dashboard Stats** : Décider quelle stat afficher (kg, km, séries, etc.)
- [ ] **Champs personnalisés** : Créer les `CustomFieldDefinition` appropriés dans le backend
- [ ] **Session Detail** : Vérifier que les champs de saisie sont adaptés
- [ ] **Exercise Detail** : Vérifier l'affichage des paramètres

---

## 🔔 Alerte automatique (TODO)

Pour être alerté automatiquement quand un nouveau type est ajouté :

1. **Option 1** : Trigger PostgreSQL + Webhook
   - Créer un trigger sur `INSERT` dans `user_activity_types`
   - Appeler un webhook qui envoie un email

2. **Option 2** : Cron job de vérification
   - Script qui vérifie périodiquement le nombre de types
   - Alerte si le count change

3. **Option 3** : Validation CI/CD
   - Test automatisé qui vérifie que tous les types de la BD sont définis dans le frontend

---

*Dernière mise à jour : Janvier 2026*
