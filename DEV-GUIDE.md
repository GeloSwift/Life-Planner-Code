# 🚀 Life Planner - Guide de Développement

## 📋 Commandes de développement

### Démarrage rapide (Windows)

```bash
# 1. Ouvre VS Code / Cursor

# 2. Lance Docker Desktop

# 3. Terminal 1 : Base de données + API
cd infra && docker compose up db api

# 4. Terminal 2 : Frontend (hot-reload rapide)
cd app/front && pnpm dev

# 5. Code ! (hot-reload automatique)

# 6. Quand c'est prêt :
git add . && git commit -m "message" && git push

# 7. Vérifie sur Vercel/Railway que le déploiement est OK
```

### URLs en développement

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| PostgreSQL | localhost:5433 |

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

- [ ] **1.1** Pages Login/Register (Next.js)
- [ ] **1.2** Connexion Front ↔ API (fetch, tokens JWT)
- [ ] **1.3** Middleware d'authentification Next.js
- [ ] **1.4** Page Dashboard (après login)
- [ ] **1.5** OAuth Google/Apple (optionnel, plus tard)

---

## 🏋️ Phase 2 : Workout Planner (MVP)

- [ ] **2.1** API Workout (models, routes, CRUD)
- [ ] **2.2** Pages Workout (liste, création, détail)
- [ ] **2.3** Interface mobile-first (cards, navigation)
- [ ] **2.4** Historique des séances
- [ ] **2.5** Programmes par jour/semaine

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

## 📚 Phase 7 : Fiches de cours

- [ ] **7.1** API Courses (models, routes)
- [ ] **7.2** Upload de cours (texte, PDF)
- [ ] **7.3** Génération automatique de fiches de révision
- [ ] **7.4** Vue carte mentale
- [ ] **7.5** Intégration IA pour synthèse

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

# 🏗️ Architecture du projet

```
Life-Planner-Code/
├── app/
│   ├── front/              # Next.js (Vercel)
│   │   ├── src/
│   │   │   ├── app/        # Pages (App Router)
│   │   │   ├── components/ # Composants React
│   │   │   ├── lib/        # Utilitaires, API client
│   │   │   └── hooks/      # Custom hooks
│   │   ├── Dockerfile
│   │   └── package.json
│   └── back/               # FastAPI (Railway)
│       ├── core/           # Config, DB, Security
│       ├── auth/           # Module authentification
│       ├── workout/        # Module workout (à créer)
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

