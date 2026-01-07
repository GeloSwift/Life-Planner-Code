"""
FastAPI application entry point.

Ce fichier est le point d'entrée de l'API. Il:
- Crée l'instance FastAPI
- Configure CORS (Cross-Origin Resource Sharing)
- Inclut les routers des différents modules
- Définit un endpoint de health check

Pour lancer l'API:
    uvicorn app:app --reload --host 0.0.0.0 --port 8000

Documentation:
https://fastapi.tiangolo.com/tutorial/first-steps/
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from auth.routes import router as auth_router
from workout.routes import router as workout_router
from workout.calendar_routes import router as calendar_router
from workout.apple_calendar_routes import router as apple_calendar_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events: startup and shutdown.
    
    Documentation:
    https://fastapi.tiangolo.com/advanced/events/
    """
    # Startup
    # Les migrations sont gérées par Alembic:
    #   alembic upgrade head
    # Ne PAS utiliser create_all() ici pour garder le contrôle sur les migrations
    
    # Vérifie que les dépendances critiques sont installées
    try:
        import mailersend  # noqa: F401
        print("✅ mailersend package is installed")
    except ImportError:
        print("⚠️  WARNING: mailersend package is not installed. Email verification will not work.")
        print("   Install it with: pip install mailersend==2.0.0")
    
    yield
    
    # Shutdown
    # Rien à nettoyer pour l'instant


# =============================================================================
# APPLICATION INSTANCE
# =============================================================================

app = FastAPI(
    title="Life Planner API",
    description="""
    API pour l'application Life Planner.
    
    ## Features
    - 🔐 **Auth**: Inscription, connexion, JWT tokens
    - 🏋️ **Workout**: Gestion des séances de sport
    - 🍳 **Recipes**: Recettes et liste de courses (à venir)
    - 💰 **Budget**: Suivi des dépenses (à venir)
    - ✅ **Habits**: Suivi d'habitudes (à venir)
    """,
    version="0.1.0",
    lifespan=lifespan,
    # Documentation disponible sur /docs (Swagger) et /redoc
    docs_url="/docs",
    redoc_url="/redoc",
)


# =============================================================================
# CORS MIDDLEWARE
# =============================================================================

# CORS permet au frontend (localhost:3000) d'appeler l'API (localhost:8000)
# Sans CORS, le navigateur bloquerait les requêtes cross-origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # ["http://localhost:3000"]
    allow_credentials=True,  # Permet l'envoi de cookies
    allow_methods=["*"],     # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],     # Authorization, Content-Type, etc.
    expose_headers=["*"],    # Expose tous les headers pour le debugging
    max_age=3600,           # Cache les preflight requests pendant 1h
)


# =============================================================================
# ROUTERS
# =============================================================================

# Inclut les routers des différents modules
# Chaque router ajoute son préfixe (ex: /auth, /workout)
app.include_router(auth_router)
app.include_router(workout_router)
app.include_router(calendar_router)
app.include_router(apple_calendar_router)


# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get(
    "/health",
    tags=["Health"],
    summary="Health check",
    description="Check if the API is running.",
)
def health_check() -> dict:
    """
    Endpoint de health check.
    
    Utilisé par:
    - Docker pour vérifier que le container est healthy
    - Les load balancers pour vérifier que l'instance est up
    - Les systèmes de monitoring
    """
    return {
        "status": "healthy",
        "version": "0.1.0",
    }


@app.get(
    "/",
    tags=["Root"],
    summary="Root endpoint",
    description="Welcome message and API info.",
)
def root() -> dict:
    """Endpoint racine avec message de bienvenue."""
    return {
        "message": "Welcome to Life Planner API",
        "docs": "/docs",
        "health": "/health",
    }

