# 🚀 Life Planner - Guide de Développement

> **Application de planification de vie complète** : Workout, Recettes, Budget, Habitudes, Révisions, et plus encore !

---

## 📋 Table des matières

1. [Configuration](#-configuration)
2. [Commandes de développement](#-commandes-de-développement)
3. [Roadmap des fonctionnalités](#-roadmap-des-fonctionnalités)
4. [API Reference](#-api-reference)
5. [Architecture du projet](#-architecture-du-projet)

---

# 🔐 Configuration

## Variables d'Environnement

| Fichier | Emplacement | Usage |
|---------|-------------|-------|
| `env.template` | `app/back/` | Template backend - **NE PAS COMMITTER DE SECRETS** |
| `env.template` | `app/front/` | Template frontend |
| `.env` | `app/back/` | Fichier réel backend *(ignoré par git)* |
| `.env.local` | `app/front/` | Fichier réel frontend *(ignoré par git)* |

### Configuration locale

```bash
# Backend
cd app/back && cp env.template .env

# Frontend
cd app/front && cp env.template .env.local
```

### Configuration Railway (Backend)

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | *(fourni automatiquement)* |
| `JWT_SECRET` | Générer avec `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `CORS_ORIGINS` | `["http://localhost:3000","https://www.mylifeplanner.space"]` |
| `FRONTEND_URL` | `https://www.mylifeplanner.space` |
| `GOOGLE_CLIENT_ID` | *(ton ID Google OAuth)* |
| `GOOGLE_CLIENT_SECRET` | *(ton secret Google OAuth)* |
| `MAILERSEND_API_KEY` | *(commence par `mlsn.`)* |
| `MAILERSEND_FROM_EMAIL` | `noreply@mylifeplanner.space` |

### Configuration Vercel (Frontend)

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://life-planner-code-production.up.railway.app` |
| `NEXT_PUBLIC_APP_URL` | `https://life-planner-code.vercel.app` |

---

## 🔗 URLs

### Développement

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| PostgreSQL | localhost:5433 |

### Production

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://life-planner-code.vercel.app |
| Frontend (Domaine) | https://www.mylifeplanner.space |
| API (Railway) | https://life-planner-code-production.up.railway.app |

---

# 💻 Commandes de Développement

## Démarrage rapide

```bash
# Lance tout (DB + API + Frontend)
./dev.sh

# Lance seulement le backend (recommandé)
./dev.sh --backend

# Frontend en local (hot-reload ultra-rapide)
cd app/front && pnpm dev
```

## Options des scripts

| Commande | Description |
|----------|-------------|
| `./dev.sh` | Lance tout (DB + API + Front) |
| `./dev.sh --backend` | Lance seulement DB + API |
| `./dev.sh --stop` | Arrête tous les services |
| `./dev.sh --reset` | Reset la DB et relance |
| `./dev.sh --logs` | Affiche les logs de l'API |
| `./dev.sh --build` | Force rebuild des images Docker |

## Migrations Alembic

```bash
cd infra

# Appliquer les migrations
docker compose exec api alembic upgrade head

# Créer une migration
docker compose exec api alembic revision --autogenerate -m "description"

# Rollback
docker compose exec api alembic downgrade -1
```

## Docker

```bash
cd infra

docker compose up              # Lancer tous les services
docker compose up -d           # En arrière-plan
docker compose up db api       # Seulement DB + API
docker compose down            # Arrêter
docker compose down -v         # Reset la DB (supprime les données!)
docker compose logs -f api     # Voir les logs
```

## Frontend (pnpm)

```bash
cd app/front

pnpm install                   # Installer
pnpm dev                       # Lancer en dev
pnpm build                     # Build production
pnpm dlx shadcn@latest add X   # Ajouter un composant
```

---

# 📝 Roadmap des Fonctionnalités

## ✅ Phase 0 : Configuration

| Fonctionnalité | Statut |
|----------------|--------|
| Architecture monorepo | ✅ |
| Git + GitHub (SSH) | ✅ |
| Next.js + Tailwind + shadcn/ui | ✅ |
| FastAPI (Python) | ✅ |
| Docker Compose (DB + API + Front) | ✅ |
| Alembic (migrations DB) | ✅ |
| CI/CD GitHub Actions | ✅ |
| Déploiement Railway (API + PostgreSQL) | ✅ |
| Déploiement Vercel (Frontend) | ✅ |

---

## 🔐 Phase 1 : Authentification ✅

| Fonctionnalité | Statut |
|----------------|--------|
| Pages Login/Register | ✅ |
| JWT tokens (cookies httpOnly) | ✅ |
| Middleware Next.js | ✅ |
| OAuth Google | ✅ |
| Mode sombre avec toggle | ✅ |
| Profil utilisateur | ✅ |
| Upload photo de profil (base64) | ✅ |
| Vérification email (MailerSend) | ✅ |
| Réinitialisation mot de passe | ✅ |
| Notifications toast | ✅ |
| Domaine personnalisé | ✅ |

---

## 🏋️ Phase 2 : Workout Planner ✅

### 📚 Exercices

| Fonctionnalité | Statut |
|----------------|--------|
| CRUD exercices (personnels + globaux) | ✅ |
| Upload GIF/images (base64) | ✅ |
| Duplication d'exercices | ✅ |
| Filtres par activité, groupe musculaire | ✅ |
| Tri alphabétique (A-Z / Z-A) | ✅ |

### 🏃 Types d'Activités Personnalisés

| Fonctionnalité | Statut |
|----------------|--------|
| Activités par défaut : Musculation, Course, Danse, Volleyball | ✅ |
| Création d'activités avec icônes Lucide | ✅ |
| Champs personnalisés dynamiques | ✅ |
| Types : select, multi-select, text, number, checkbox, date, duration | ✅ |

### 📅 Séances d'Entraînement

| Fonctionnalité | Statut |
|----------------|--------|
| Création de séances avec exercices | ✅ |
| Planification date/heure | ✅ |
| **Séances récurrentes** (quotidienne, hebdomadaire, mensuelle) | ✅ |
| Affichage "Tous les samedis, 09:00" | ✅ |
| Lancement le jour prévu uniquement (check date) | ✅ |
| Timer de séance en temps réel | ✅ |
| Timer de repos (60s avec notification) | ✅ |
| Suivi des séries (cocher, modifier poids/reps) | ✅ |
| Auto-complétion de séance | ✅ |
| Replanification vers prochaine occurrence | ✅ |
| Gestion des occurrences virtuelles vs concrètes | ✅ |
| Notes exercices et séance | ✅ |

### 🗓️ Calendrier

| Fonctionnalité | Statut |
|----------------|--------|
| Vue mensuelle avec indicateurs colorés | ✅ |
| Vue semaine/agenda | ✅ |
| Génération auto des occurrences récurrentes | ✅ |
| Indicateurs : 🟢 terminée, 🔵 en cours, 🟠 planifiée, 🔴 annulée | ✅ |
| Ring coloré autour des jours avec séances | ✅ |
| Tooltips adaptatifs (pas de clipping) | ✅ |
| Menu d'action (voir, modifier, supprimer) | ✅ |
| Auto-refresh après suppression | ✅ |

### 🔄 Synchronisation Calendriers

| Fonctionnalité | Statut |
|----------------|--------|
| Export ICS | ✅ |
| Connexion Google Calendar (OAuth) | ✅ |
| Sync auto vers Google Calendar | 🚧 |
| Connexion Apple Calendar | 📋 |

### 📊 Historique des Séances

| Fonctionnalité | Statut |
|----------------|--------|
| Page `/workout/history` | ✅ |
| Filtrage par mois | ✅ |
| Progression mensuelle | ✅ |
| Détail exercices réalisés | ✅ |
| Notes de séance | ✅ |

### ⚖️ Suivi du Poids

| Fonctionnalité | Statut |
|----------------|--------|
| Graphique d'évolution (Recharts) | ✅ |
| Stats : moyenne, min, max | ✅ |
| Pesée rapide depuis dashboard | ✅ |

### 🎯 Objectifs

| Fonctionnalité | Statut |
|----------------|--------|
| Objectifs personnalisés | ✅ |
| Types : poids, répétitions, distance, temps... | ✅ |
| Barre de progression | ✅ |

### 📱 Pages Frontend

| Page | Route |
|------|-------|
| Dashboard | `/workout` |
| Exercices | `/workout/exercises` |
| Séances | `/workout/sessions` |
| Détail séance | `/workout/sessions/[id]` |
| Historique | `/workout/history` |
| Poids | `/workout/weight` |
| Objectifs | `/workout/goals` |

### ✨ Améliorations UI/UX

| Fonctionnalité | Statut |
|----------------|--------|
| Transitions fluides (Framer Motion) | ✅ |
| Feedback tactile sur mobile (Hover/Active states) | ✅ |
| Suppression des latences clic mobile (touch-manipulation) | ✅ |
| Optimisation Fluidité Menus Déroulants | ✅ |
| Effet Bouncy différencié : fort sur Mobile (95%), subtil sur PC (98%) | ✅ |
| Bounce effect ré-appliqué sur les vignettes interactives | ✅ |

---

## 🧭 Phase 3 : Navigation

| Fonctionnalité | Statut |
|----------------|--------|
| Page d'accueil avec mini-apps | 📋 |
| Navigation mobile (bottom nav) | 📋 |
| Layout commun (header, sidebar) | 📋 |
| PWA (installable sur mobile) | 📋 |

---

## 📖 Phase 4 : Recettes

| Fonctionnalité | Statut |
|----------------|--------|
| API Recipes (CRUD) | 📋 |
| Liste et création de recettes | 📋 |
| Gestion ingrédients et tags | 📋 |
| Génération liste de courses | 📋 |

---

## 💰 Phase 5 : Budget

| Fonctionnalité | Statut |
|----------------|--------|
| API Budget | 📋 |
| Budget mensuel | 📋 |
| Suivi dépenses | 📋 |
| Graphiques et stats | 📋 |

---

## ✅ Phase 6 : Habitudes

| Fonctionnalité | Statut |
|----------------|--------|
| API Habits | 📋 |
| Habitudes quotidiennes | 📋 |
| Todo-list | 📋 |
| Notifications/rappels | 📋 |

---

## 📚 Phase 7 : Révisions

| Fonctionnalité | Statut |
|----------------|--------|
| Upload de cours (PDF) | 📋 |
| Génération fiches de révision | 📋 |
| Quizz interactif | 📋 |
| Intégration IA | 📋 |

---

## 📅 Phase 8 : Planning Global

| Fonctionnalité | Statut |
|----------------|--------|
| Vue calendrier unifiée | 📋 |
| Intégration toutes mini-apps | 📋 |
| Sync calendriers externes | 📋 |

---

## 📱 Phase 9 : Mobile (optionnel)

| Fonctionnalité | Statut |
|----------------|--------|
| PWA complète | 📋 |
| React Native / Capacitor | 📋 |
| Notifications push | 📋 |
| Mode hors-ligne | 📋 |

---

# 📡 API Reference

## Authentification

### Endpoints Publics

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/auth/register` | Inscription |
| `POST` | `/auth/login` | Connexion |
| `POST` | `/auth/refresh` | Rafraîchir token |
| `GET` | `/auth/google/url` | URL OAuth Google |
| `POST` | `/auth/google/callback` | Callback OAuth |
| `GET` | `/auth/verify-email` | Vérifier email |
| `POST` | `/auth/password-reset/request` | Demander reset mdp |
| `POST` | `/auth/password-reset/reset` | Reset mdp |

### Endpoints Protégés

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/auth/me` | Profil utilisateur |
| `PUT` | `/auth/me` | Modifier profil |
| `POST` | `/auth/me/avatar` | Upload avatar |
| `POST` | `/auth/logout` | Déconnexion |

---

## Workout Planner

### Exercices

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/workout/exercises` | Liste exercices |
| `GET` | `/workout/exercises/{id}` | Détail exercice |
| `POST` | `/workout/exercises` | Créer exercice |
| `PUT` | `/workout/exercises/{id}` | Modifier exercice |
| `DELETE` | `/workout/exercises/{id}` | Supprimer exercice |

### Types d'Activités

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/workout/activity-types` | Liste types d'activités |
| `POST` | `/workout/activity-types` | Créer type |
| `DELETE` | `/workout/activity-types/{id}` | Supprimer type |
| `POST` | `/workout/activity-types/{id}/fields` | Ajouter champ perso |

### Séances

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/workout/sessions` | Liste séances |
| `GET` | `/workout/sessions/{id}` | Détail séance |
| `POST` | `/workout/sessions` | Créer séance |
| `POST` | `/workout/sessions/{id}/start` | Démarrer séance |
| `POST` | `/workout/sessions/{id}/end` | Terminer séance |
| `POST` | `/workout/sessions/{id}/cancel` | Annuler séance |
| `DELETE` | `/workout/sessions/{id}` | Supprimer séance |
| `POST` | `/workout/sessions/{id}/exclude-occurrence` | Exclure occurrence |
| `POST` | `/workout/sessions/{id}/occurrences/start` | Démarrer occurrence |
| `GET` | `/workout/sessions/{id}/occurrences` | Liste occurrences |

### Séries

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/workout/sessions/{id}/exercises/{ex}/sets` | Ajouter série |
| `PUT` | `/workout/sets/{id}` | Modifier série |
| `POST` | `/workout/sets/{id}/complete` | Marquer complétée |

### Pesées

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/workout/weight` | Historique pesées |
| `GET` | `/workout/weight/progress` | Évolution + stats |
| `POST` | `/workout/weight` | Nouvelle pesée |

### Objectifs

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/workout/goals` | Liste objectifs |
| `POST` | `/workout/goals` | Créer objectif |
| `PUT` | `/workout/goals/{id}` | Modifier objectif |
| `DELETE` | `/workout/goals/{id}` | Supprimer objectif |

### Dashboard

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/workout/stats` | Statistiques globales |
| `GET` | `/workout/dashboard` | Données dashboard |

---

# 🏗️ Architecture du Projet

```
Life-Planner-Code/
├── app/
│   ├── front/                  # Next.js (Vercel)
│   │   ├── src/
│   │   │   ├── app/            # Pages (App Router)
│   │   │   ├── components/     # Composants React
│   │   │   ├── lib/            # Utilitaires, API client
│   │   │   └── hooks/          # Custom hooks
│   │   └── package.json
│   │
│   └── back/                   # FastAPI (Railway)
│       ├── core/               # Config, DB, Security, Email
│       ├── auth/               # Module authentification
│       ├── workout/            # Module workout ✅
│       ├── recipes/            # Module recettes (TODO)
│       ├── budget/             # Module budget (TODO)
│       ├── habits/             # Module habitudes (TODO)
│       ├── alembic/            # Migrations DB
│       └── requirements.txt
│
├── infra/
│   └── docker-compose.yml
│
└── .github/
    └── workflows/ci.yml
```

---

## 🎨 Stack Technique

| Catégorie | Technologies |
|-----------|--------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | FastAPI, Python 3.11, SQLAlchemy, Alembic |
| **Database** | PostgreSQL |
| **Auth** | JWT, Google OAuth, MailerSend |
| **Déploiement** | Vercel (front), Railway (API + DB) |
| **Dev** | Docker, pnpm, Git |

---

## 📌 Légende des Statuts

| Icône | Signification |
|-------|---------------|
| ✅ | Terminé |
| 🚧 | En cours |
| 📋 | À faire |

---

*Dernière mise à jour : Mars 2026*
