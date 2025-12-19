# 🚀 Life Planner - Guide de Développement

## 🔐 Configuration des Variables d'Environnement

### Comprendre les fichiers

| Fichier | Emplacement | Usage |
|---------|-------------|-------|
| `env.template` | `app/back/` | Template backend - **NE PAS COMMITTER DE SECRETS** |
| `env.template` | `app/front/` | Template frontend |
| `.env` | `app/back/` | **Fichier réel backend (ignoré par git)** |
| `.env.local` | `app/front/` | **Fichier réel frontend (ignoré par git)** |

### Configuration locale (dev)

```bash
# 1. Backend - copie le template
cd app/back
cp env.template .env
# Édite .env avec tes valeurs

# 2. Frontend - copie le template  
cd app/front
cp env.template .env.local
# Édite .env.local avec tes valeurs
```

### Configuration production (Railway + Vercel)

#### Railway (Backend API)

Va dans Railway Dashboard → ton projet → Variables et ajoute :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | *(fourni automatiquement par Railway)* |
| `JWT_SECRET` | `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `CORS_ORIGINS` | `["http://localhost:3000","https://life-planner-code.vercel.app","https://www.mylifeplanner.space","https://mylifeplanner.space"]` |
| `FRONTEND_URL` | `https://www.mylifeplanner.space` *(ou ton domaine principal)* |
| `GOOGLE_CLIENT_ID` | *(ton ID Google OAuth)* |
| `GOOGLE_CLIENT_SECRET` | *(ton secret Google OAuth)* |
| `MAILERSEND_API_KEY` | *(ton API key MailerSend - commence par `mlsn.`)* |
| `MAILERSEND_FROM_EMAIL` | `noreply@mylifeplanner.space` *(email du domaine vérifié dans MailerSend)* |
| `MAILERSEND_FROM_NAME` | `Life Planner` |

#### Vercel (Frontend)

Va dans Vercel Dashboard → ton projet → Settings → Environment Variables :

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://life-planner-code-production.up.railway.app` |
| `NEXT_PUBLIC_APP_URL` | `https://life-planner-code.vercel.app` |

### Configuration Google OAuth

1. Va sur [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crée un projet ou sélectionne "Life Planner"
3. Crée un "ID client OAuth 2.0" de type "Application Web"
4. Ajoute les **Origines JavaScript autorisées** :
   - `http://localhost:3000`
   - `https://life-planner-code.vercel.app`
   - `https://www.mylifeplanner.space`
   - `https://mylifeplanner.space` *(sans www)*
5. Ajoute les **URI de redirection autorisés** :
   - `http://localhost:3000/auth/callback/google`
   - `https://life-planner-code.vercel.app/auth/callback/google`
   - `https://www.mylifeplanner.space/auth/callback/google`
   - `https://mylifeplanner.space/auth/callback/google` *(sans www)*
6. Copie le Client ID et le Client Secret dans Railway

**⚠️ Important** : `FRONTEND_URL` doit être une **string** (pas un tableau JSON). Utilise ton domaine principal.

### Configuration MailerSend (Vérification d'email)

1. **Crée un compte** sur [MailerSend](https://www.mailersend.com/)
2. **Vérifie un domaine** :
   - Va dans **Domains** → **Add Domain**
   - Entre ton domaine (ex: `mylifeplanner.space`)
   - Configure les enregistrements DNS (SPF, DKIM, DMARC) dans Cloudflare ou ton registrar
   - Attends la vérification (5-15 minutes)
3. **Génère un token API** :
   - Va dans **Domains** → ton domaine → **API token**
   - Clique sur **"Generate new token"** ou utilise un token existant
   - Copie le token (commence par `mlsn.`)
4. **Configure dans Railway** :
   - `MAILERSEND_API_KEY` : ton token API
   - `MAILERSEND_FROM_EMAIL` : `noreply@mylifeplanner.space` *(utilise ton domaine vérifié)*
   - `MAILERSEND_FROM_NAME` : `Life Planner`

**Note** : Limite gratuite de 100 emails/jour avec le plan gratuit MailerSend.

---

## 📋 Commandes de développement

### 🚀 Démarrage rapide - UNE SEULE COMMANDE !

```powershell
# Windows (PowerShell) - Lance tout l'environnement
.\dev.ps1

# Linux/Mac - Lance tout l'environnement
./dev.sh
```

**C'est tout !** Le script :
- ✅ Vérifie que Docker est lancé
- ✅ Crée les fichiers `.env` automatiquement si absents
- ✅ Lance la DB + API + Frontend
- ✅ Active le hot-reload sur tout

### Options des scripts de développement

| Commande | Description |
|----------|-------------|
| `.\dev.ps1` ou `./dev.sh` | Lance tout (DB + API + Front) |
| `.\dev.ps1 -Backend` ou `./dev.sh --backend` | Lance seulement DB + API |
| `.\dev.ps1 -Stop` ou `./dev.sh --stop` | Arrête tous les services |
| `.\dev.ps1 -Reset` ou `./dev.sh --reset` | Reset la DB et relance |
| `.\dev.ps1 -Logs` ou `./dev.sh --logs` | Affiche les logs de l'API |
| `.\dev.ps1 -Build` ou `./dev.sh --build` | Force rebuild des images |
| `.\dev.ps1 -Help` ou `./dev.sh --help` | Affiche l'aide |

### Mode recommandé (Frontend en local = hot-reload plus rapide)

```powershell
# Terminal 1 : Backend Docker
.\dev.ps1 -Backend

# Terminal 2 : Frontend local (hot-reload ultra-rapide)
cd app/front && pnpm dev
```

### URLs en développement

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| PostgreSQL | localhost:5433 |

### Workflow de test local avant push

```powershell
# 1. Lance l'environnement
.\dev.ps1

# 2. Teste tes fonctionnalités sur http://localhost:3000

# 3. Quand tout est OK :
git add . && git commit -m "message" && git push

# 4. Le déploiement se fait automatiquement sur Vercel/Railway
```

---

## 🗄️ Commandes Alembic (Migrations DB)

```bash
# Depuis le container Docker
cd infra

# Appliquer toutes les migrations
docker compose exec api alembic upgrade head

# Voir l'historique des migrations
docker compose exec api alembic history

# Voir la version actuelle
docker compose exec api alembic current

# Créer une nouvelle migration (après modification d'un modèle)
docker compose exec api alembic revision --autogenerate -m "description du changement"

# Rollback d'une migration
docker compose exec api alembic downgrade -1

# Rollback de toutes les migrations
docker compose exec api alembic downgrade base
```

---

## 🐳 Commandes Docker

```bash
cd infra

# Lancer tous les services
docker compose up

# Lancer en arrière-plan
docker compose up -d

# Lancer seulement DB + API (recommandé pour dev)
docker compose up db api

# Rebuild les images
docker compose up --build

# Arrêter tous les services
docker compose down

# Reset la base de données (supprime les données!)
docker compose down -v

# Voir les logs
docker compose logs -f api
docker compose logs -f front

# Accéder à PostgreSQL
docker compose exec db psql -U postgres -d lifeplanner

# Exécuter une commande dans le container API
docker compose exec api <commande>
```

---

## 🌐 URLs de Production

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://life-planner-code.vercel.app |
| Frontend (Domaine) | https://www.mylifeplanner.space |
| API (Railway) | https://life-planner-code-production.up.railway.app |
| API Docs | https://life-planner-code-production.up.railway.app/docs |

---

## 📦 Commandes pnpm (Frontend)

```bash
cd app/front

# Installer les dépendances
pnpm install

# Lancer en dev
pnpm dev

# Build production
pnpm build

# Linter
pnpm lint

# Ajouter un composant shadcn/ui
pnpm dlx shadcn@latest add <composant>
```

---

## 🐍 Commandes Python (Backend)

```bash
cd app/back

# Activer l'environnement virtuel (si dev local sans Docker)
source .venv/Scripts/activate  # Windows Git Bash
source .venv/bin/activate      # Linux/Mac

# Installer les dépendances
pip install -r requirements.txt

# Lancer l'API
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

---

# 📝 Roadmap - Fonctionnalités à développer

## ✅ Phase 0 : Configuration (FAIT)

- [x] Architecture globale (monorepo)
- [x] Git + GitHub (SSH)
- [x] Next.js + Tailwind + shadcn/ui
- [x] FastAPI (module auth)
- [x] Docker Compose (DB + API + Front)
- [x] Alembic (migrations DB)
- [x] GitHub Actions CI/CD
- [x] Déploiement Railway (API + PostgreSQL)
- [x] Déploiement Vercel (Frontend)

---

## 🔐 Phase 1 : Authentification complète

- [x] **1.1** Pages Login/Register (Next.js)
- [x] **1.2** Connexion Front ↔ API (fetch, tokens JWT, cookies httpOnly)
- [x] **1.3** Middleware d'authentification Next.js
- [x] **1.4** Page Dashboard (après login)
- [x] **1.5** OAuth Google (configuration complète)
- [x] **1.6** Mode sombre avec toggle
- [x] **1.7** Animations de transition
- [x] **1.8** Page de profil utilisateur
- [x] **1.9** Upload de photo de profil (stockée en base64 dans la BD)
- [x] **1.10** Modification du nom complet
- [x] **1.11** Modification du mot de passe via email (réinitialisation par lien)
- [x] **1.12** Système de vérification d'email (MailerSend)
- [x] **1.13** Affichage de l'avatar dans le header
- [x] **1.14** Notifications toast (remplacement des alert())
- [x] **1.15** Configuration domaine personnalisé (OAuth + MailerSend)
- [x] **1.16** Système de réinitialisation de mot de passe par email (forgot/reset password)

---

## 🎯 Fonctionnalités Récentes (Décembre 2025)

### 🏋️ Système d'Exercices Personnalisés Avancé

**Backend :**
- ✅ Modèles `UserActivityType` et `CustomFieldDefinition` pour la personnalisation
- ✅ Support de champs personnalisés dynamiques (select, multi-select, text, number, checkbox, date, duration)
- ✅ Upload de GIF/images en Base64 pour illustrer les exercices
- ✅ API complète pour la gestion des types d'activités et champs personnalisés
- ✅ Migration Alembic pour la nouvelle structure

**Frontend :**
- ✅ Interface de création d'exercices avec sélection d'activité personnalisée
- ✅ Création/suppression d'activités personnalisées avec sélection d'icônes React
- ✅ Gestion des champs personnalisés liés aux activités
- ✅ Upload de GIF avec aperçu
- ✅ Duplication d'exercices avec redirection vers l'édition
- ✅ Liste d'exercices avec filtres personnalisés dynamiques
- ✅ Tri alphabétique (A-Z / Z-A)
- ✅ Affichage amélioré : tous les paramètres personnalisés visibles
- ✅ Design responsive et alignement uniforme des cartes

### 📊 Suivi du Poids

- ✅ Graphique d'évolution du poids avec Recharts
- ✅ Page dédiée `/workout/weight` avec historique
- ✅ Statistiques (moyenne, min, max) sur la période sélectionnée
- ✅ Formulaire de pesée rapide depuis le dashboard

---

## 🏋️ Phase 2 : Workout Planner (MVP)

- [x] **2.1** API Workout (models, routes, CRUD) ✅
  - [x] Modèles SQLAlchemy (Exercise, Template, Session, Set, WeightEntry, Goal)
  - [x] Schemas Pydantic pour validation
  - [x] Service layer avec logique métier
  - [x] Routes API complètes
  - [x] Migration Alembic
- [x] **2.2** Pages Workout Frontend ✅
  - [x] Dashboard workout avec statistiques (`/workout`)
  - [x] Actions rapides (nouvelle séance, exercice, pesée)
  - [x] Liste des exercices avec filtres (`/workout/exercises`)
  - [x] Page objectifs avec progression (`/workout/goals`)
  - [x] Graphique d'évolution du poids (`/workout/weight`)
- [x] **2.3** Interface de séance en cours ✅
  - [x] Timer de séance en temps réel
  - [x] Suivi des séries (cocher, modifier poids/reps)
  - [x] Timer de repos entre séries (avec notification)
  - [x] Terminer/annuler la séance
- [x] **2.4** Calendrier des séances ✅
  - [x] Vue calendrier mensuel avec indicateurs de couleur
  - [ ] Planification de séances
  - [ ] Historique visuel
- [x] **2.5** Pesées et objectifs ✅
  - [x] Formulaire de pesée rapide
  - [x] Courbe d'évolution du poids (graphique avec Recharts)
  - [x] Liste et suivi des objectifs
  - [x] Barre de progression
- [x] **2.6** Système d'exercices personnalisés avancé ✅
  - [x] Types d'activités personnalisables (`UserActivityType`) avec icônes React (Lucide)
  - [x] Activités par défaut : Musculation, Course à pied, Danse, Volleyball
  - [x] Création/suppression d'activités personnalisées par l'utilisateur
  - [x] Champs personnalisés dynamiques (`CustomFieldDefinition`) liés aux types d'activités
  - [x] Types de champs supportés : select, multi-select, text, number, checkbox, date, duration
  - [x] Upload de GIF pour illustrer les exercices (stockage Base64)
  - [x] Suppression du champ "difficulty" (niveau de difficulté)
  - [x] Système de duplication d'exercices avec redirection vers l'édition
  - [x] Filtres personnalisés dynamiques sur la page de liste
  - [x] Tri alphabétique (A-Z / Z-A)
  - [x] Affichage amélioré : tous les paramètres personnalisés visibles (plus de "+n autres")
  - [x] Masquage conditionnel de la section "Informations" si vide
  - [x] Design responsive et alignement uniforme des cartes d'exercices

---

## 🧭 Phase 3 : Navigation et structure globale

- [ ] **3.1** Page d'accueil avec liste des mini-apps
- [ ] **3.2** Navigation mobile (bottom nav / menu burger)
- [ ] **3.3** Layout commun (header, sidebar)
- [ ] **3.4** Thème clair/sombre
- [ ] **3.5** PWA (Progressive Web App - installable sur mobile)

---

## 📖 Phase 4 : Livre de recettes + Liste de courses

- [ ] **4.1** API Recipes (models, routes, CRUD)
- [ ] **4.2** Pages Recettes (liste, création, détail)
- [ ] **4.3** Gestion des ingrédients et tags
- [ ] **4.4** Génération automatique de liste de courses
- [ ] **4.5** Liste de courses (ajout manuel, cochage)

---

## 💰 Phase 5 : Budget / Suivi de dépenses

- [ ] **5.1** API Budget (models, routes)
- [ ] **5.2** Budget mensuel
- [ ] **5.3** Suivi des dépenses quotidiennes
- [ ] **5.4** Graphiques et statistiques
- [ ] **5.5** Catégories de dépenses

---

## ✅ Phase 6 : Habitudes / Todo list

- [ ] **6.1** API Habits (models, routes)
- [ ] **6.2** Habitudes quotidiennes
- [ ] **6.3** Todo-list dynamique
- [ ] **6.4** Graphique du pourcentage d'accomplissement
- [ ] **6.5** Notifications / rappels

---

## 📚 Phase 7 : Système de révision de cours

- [ ] **7.1** API Courses (models, routes)
- [ ] **7.2** Upload de cours (texte, PDF)
- [ ] **7.3** Génération automatique de fiches de révision (résumé style carte mentale)
- [ ] **7.4** Quizz interactif sur le cours
- [ ] **7.5** Vue carte mentale
- [ ] **7.6** Intégration IA pour synthèse

---

## 📅 Phase 8 : Planning global

- [ ] **8.1** Vue calendrier
- [ ] **8.2** Vue semaine
- [ ] **8.3** Intégration de toutes les mini-apps
- [ ] **8.4** Synchronisation avec calendriers externes

---

## 📱 Phase 9 : Mobile natif (optionnel)

- [ ] **9.1** PWA complète
- [ ] **9.2** ou React Native / Capacitor
- [ ] **9.3** Notifications push
- [ ] **9.4** Mode hors-ligne

---

## 📡 API Routes - Authentification

### Endpoints publics

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/auth/register` | Inscription d'un nouvel utilisateur |
| `POST` | `/auth/login` | Connexion (email/password) |
| `POST` | `/auth/refresh` | Rafraîchir le token d'accès |
| `GET` | `/auth/google/url` | Obtenir l'URL d'autorisation Google OAuth |
| `POST` | `/auth/google/callback` | Callback Google OAuth |
| `GET` | `/auth/providers` | Liste des providers OAuth configurés |
| `GET` | `/auth/verify-email` | Vérifier l'email avec un token |
| `POST` | `/auth/password-reset/request` | Demander un email de réinitialisation de mot de passe |
| `POST` | `/auth/password-reset/reset` | Réinitialiser le mot de passe avec un token |

### Endpoints protégés (nécessitent authentification)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/auth/me` | Obtenir les informations de l'utilisateur connecté |
| `PUT` | `/auth/me` | Mettre à jour le profil (nom, mot de passe) |
| `POST` | `/auth/me/avatar` | Upload/modifier la photo de profil |
| `POST` | `/auth/verify-email/send` | Envoyer un email de vérification |
| `POST` | `/auth/logout` | Déconnexion |

### Modèle User

```python
class User:
    id: int
    email: str
    full_name: str | None
    avatar_url: str | None  # Base64 data URL (max 500KB)
    auth_provider: AuthProvider  # "local" | "google"
    provider_user_id: str | None
    is_email_verified: bool
    created_at: datetime
    updated_at: datetime
```

---

## 📡 API Routes - Workout Planner

### Exercices

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/workout/exercises` | Liste des exercices (globaux + personnels) |
| `GET` | `/workout/exercises/{id}` | Détail d'un exercice |
| `POST` | `/workout/exercises` | Créer un exercice personnel |
| `PUT` | `/workout/exercises/{id}` | Modifier un exercice |
| `DELETE` | `/workout/exercises/{id}` | Supprimer un exercice |

### Types d'activités personnalisés

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/workout/activity-types` | Liste des types d'activités (défaut + personnels) |
| `GET` | `/workout/activity-types/{id}` | Détail d'un type d'activité |
| `POST` | `/workout/activity-types` | Créer un type d'activité personnalisé |
| `PUT` | `/workout/activity-types/{id}` | Modifier un type d'activité |
| `DELETE` | `/workout/activity-types/{id}` | Supprimer un type d'activité |

### Champs personnalisés

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/workout/activity-types/{activity_type_id}/fields` | Ajouter un champ personnalisé à un type d'activité |
| `DELETE` | `/workout/fields/{field_id}` | Supprimer un champ personnalisé |

### Templates de séances

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/workout/templates` | Liste des templates |
| `GET` | `/workout/templates/{id}` | Détail d'un template |
| `POST` | `/workout/templates` | Créer un template |
| `PUT` | `/workout/templates/{id}` | Modifier un template |
| `DELETE` | `/workout/templates/{id}` | Supprimer un template |
| `POST` | `/workout/templates/{id}/exercises` | Ajouter un exercice au template |
| `DELETE` | `/workout/templates/{id}/exercises/{ex_id}` | Retirer un exercice |

### Sessions d'entraînement

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/workout/sessions` | Liste des sessions |
| `GET` | `/workout/sessions/active` | Session en cours |
| `GET` | `/workout/sessions/{id}` | Détail d'une session |
| `POST` | `/workout/sessions` | Créer une session |
| `POST` | `/workout/sessions/{id}/start` | Démarrer une session |
| `POST` | `/workout/sessions/{id}/end` | Terminer une session |
| `POST` | `/workout/sessions/{id}/cancel` | Annuler une session |
| `PUT` | `/workout/sessions/{id}` | Modifier une session |
| `DELETE` | `/workout/sessions/{id}` | Supprimer une session |

### Séries

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/workout/sessions/{id}/exercises/{ex_id}/sets` | Ajouter une série |
| `PUT` | `/workout/sets/{id}` | Modifier une série |
| `POST` | `/workout/sets/{id}/complete` | Marquer comme complétée |

### Pesées

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/workout/weight` | Historique des pesées (avec filtres date) |
| `GET` | `/workout/weight/latest` | Dernière pesée |
| `GET` | `/workout/weight/progress` | Évolution avec stats (moyenne, min, max) |
| `POST` | `/workout/weight` | Enregistrer une pesée |
| `PUT` | `/workout/weight/{id}` | Modifier une pesée |
| `DELETE` | `/workout/weight/{id}` | Supprimer une pesée |

### Objectifs

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/workout/goals` | Liste des objectifs |
| `GET` | `/workout/goals/{id}` | Détail d'un objectif |
| `POST` | `/workout/goals` | Créer un objectif |
| `PUT` | `/workout/goals/{id}` | Modifier un objectif |
| `DELETE` | `/workout/goals/{id}` | Supprimer un objectif |

### Stats & Dashboard

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/workout/stats` | Statistiques globales |
| `GET` | `/workout/dashboard` | Données du dashboard |
| `GET` | `/workout/calendar` | Calendrier des séances |

### Enums (Legacy - pour compatibilité)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/workout/enums/activity-types` | Types d'activités (legacy, utilisez `/workout/activity-types`) |
| `GET` | `/workout/enums/muscle-groups` | Groupes musculaires |
| `GET` | `/workout/enums/goal-types` | Types d'objectifs |

### Modèles principaux

```python
class UserActivityType:
    id: int
    name: str  # "Musculation", "Course à pied", "Danse", etc.
    icon: str | None  # Nom de l'icône Lucide React (ex: "Dumbbell", "Footprints")
    color: str | None  # Code couleur hexadécimal
    is_default: bool  # True pour les activités par défaut
    user_id: int | None  # None pour les activités par défaut
    custom_fields: list[CustomFieldDefinition]  # Champs personnalisés liés

class CustomFieldDefinition:
    id: int
    activity_type_id: int  # Lié à UserActivityType
    name: str  # "Poids", "Nombre de séries", "Muscles travaillés", etc.
    field_type: str  # "select", "multi_select", "text", "number", "checkbox", "date", "duration"
    options: str | None  # JSON array pour select/multi_select (ex: ["Pectoraux", "Dos", "Biceps"])
    unit: str | None  # "kg", "reps", "min", etc.
    placeholder: str | None
    default_value: str | None
    is_required: bool
    order: int  # Ordre d'affichage

class ExerciseFieldValue:
    id: int
    exercise_id: int  # Lié à Exercise
    field_id: int  # Lié à CustomFieldDefinition
    value: str  # Valeur du champ (JSON string pour multi_select)

class Exercise:
    id: int
    name: str
    description: str | None
    instructions: str | None
    video_url: str | None
    image_url: str | None
    gif_data: str | None  # Base64 data URL pour GIF/image uploadée
    activity_type: ActivityType  # Legacy enum (pour compatibilité)
    custom_activity_type_id: int | None  # Lié à UserActivityType (nouveau système)
    custom_activity_type: UserActivityType | None
    muscle_group: MuscleGroup | None  # Legacy, peut être un champ personnalisé
    equipment: str | None  # Peut être un champ personnalisé
    user_id: int | None  # None = global
    field_values: list[ExerciseFieldValue]  # Valeurs des champs personnalisés

class WorkoutTemplate:
    id: int
    name: str  # "Push Day", "Leg Day"
    description: str | None
    activity_type: ActivityType
    color: str | None  # #FF5733
    user_id: int
    exercises: list[WorkoutTemplateExercise]

class WorkoutSession:
    id: int
    name: str
    status: SessionStatus  # planifiee, en_cours, terminee, annulee
    started_at: datetime | None
    ended_at: datetime | None
    duration_seconds: int | None
    exercises: list[WorkoutSessionExercise]

class WorkoutSet:
    id: int
    set_number: int
    weight: float | None  # kg
    reps: int | None
    is_completed: bool
    is_warmup: bool
    is_dropset: bool
    rpe: int | None  # 1-10

class WeightEntry:
    id: int
    weight: float  # kg
    body_fat_percentage: float | None
    measured_at: datetime

class Goal:
    id: int
    name: str  # "Bench 100kg"
    goal_type: GoalType  # poids_corporel, poids_exercice, distance...
    target_value: float
    current_value: float
    unit: str  # kg, reps, km
    is_achieved: bool

# Enums disponibles (en français)
ActivityType: musculation, course, cyclisme, natation, volleyball, boxe, 
              basketball, football, tennis, yoga, crossfit, hiit, danse, autre

MuscleGroup: poitrine, dos, epaules, biceps, triceps, avant_bras, 
             abdominaux, obliques, lombaires, quadriceps, ischio_jambiers,
             fessiers, mollets, adducteurs, corps_complet, cardio

GoalType: poids_corporel, poids_exercice, repetitions, temps_exercice,
          distance, temps, nombre_seances, serie_consecutive

SessionStatus: planifiee, en_cours, terminee, annulee
```

---

## 🎨 Composants Frontend

### Pages

- `/` - Page d'accueil (landing page)
- `/login` - Connexion
- `/register` - Inscription
- `/forgot-password` - Demande de réinitialisation de mot de passe
- `/reset-password` - Réinitialisation de mot de passe (avec token)
- `/dashboard` - Tableau de bord (protégé)
- `/profile` - Profil utilisateur (protégé)
- `/auth/callback/google` - Callback OAuth Google
- `/auth/verify-email` - Vérification d'email

### Composants UI

- `Header` - En-tête avec navigation et avatar utilisateur
- `Footer` - Pied de page
- `Toast` - Notifications toast (success, error, info, warning)
- `Card`, `Button`, `Input`, `Label`, `Select`, `Dialog`, `Badge`, `Popover`, `MultiSelect` - Composants shadcn/ui
- `ActivityIcon` - Composant pour afficher les icônes d'activités (Lucide React)
- `WeightChart` - Graphique d'évolution du poids (Recharts)
- `SessionCalendar` - Calendrier des séances avec indicateurs
- `GoalsProgress` - Affichage de la progression des objectifs
- `ActiveSession` - Interface de séance en cours avec timer
- `QuickActions` - Actions rapides du dashboard workout

### Contextes

- `AuthProvider` - Gestion de l'état d'authentification global
- `ThemeProvider` - Gestion du thème clair/sombre

---

# 🏗️ Architecture du projet

```
Life-Planner-Code/
├── app/
│   ├── front/              # Next.js (Vercel)
│   │   ├── src/
│   │   │   ├── app/        # Pages (App Router)
│   │   │   ├── components/ # Composants React
│   │   │   ├── lib/        # Utilitaires, API client, auth-context
│   │   │   ├── components/ # Composants React (ui, layout)
│   │   │   └── hooks/      # Custom hooks
│   │   ├── Dockerfile
│   │   └── package.json
│   └── back/               # FastAPI (Railway)
│       ├── core/           # Config, DB, Security, Email (MailerSend)
│       ├── auth/           # Module authentification (routes, models, schemas, service, oauth)
│       ├── workout/        # Module workout ✅
│       │   ├── __init__.py
│       │   ├── models.py   # Exercise, Template, Session, Set, WeightEntry, Goal
│       │   ├── schemas.py  # Pydantic schemas
│       │   ├── service.py  # Logique métier
│       │   └── routes.py   # Endpoints API
│       ├── recipes/        # Module recettes (à créer)
│       ├── budget/         # Module budget (à créer)
│       ├── habits/         # Module habitudes (à créer)
│       ├── courses/        # Module fiches (à créer)
│       ├── alembic/        # Migrations DB
│       ├── Dockerfile
│       └── requirements.txt
├── infra/
│   └── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml
└── docker-bake.hcl
```

