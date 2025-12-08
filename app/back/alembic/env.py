"""
Alembic environment configuration.

Ce fichier configure Alembic pour:
- Charger la DATABASE_URL depuis les variables d'environnement
- Importer tous les modèles SQLAlchemy pour l'autogenerate
- Gérer les migrations online (connexion DB) et offline (SQL script)
"""

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Import de la configuration et des modèles
from core.config import settings
from core.db import Base

# Import de TOUS les modèles pour que l'autogenerate les détecte
# Ajouter ici chaque nouveau modèle créé
from auth.models import User  # noqa: F401
# from workout.models import WorkoutSession  # noqa: F401 (à décommenter plus tard)

# =============================================================================
# ALEMBIC CONFIG
# =============================================================================

# This is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# MetaData object for 'autogenerate' support
target_metadata = Base.metadata

# =============================================================================
# DATABASE URL FROM ENVIRONMENT
# =============================================================================

def get_url() -> str:
    """
    Récupère l'URL de la base de données depuis les variables d'environnement.
    
    Utilise database_url_sync qui convertit automatiquement:
    - postgresql:// → postgresql+psycopg2://
    - postgres:// → postgresql+psycopg2://
    """
    return settings.database_url_sync


# =============================================================================
# OFFLINE MODE (génère un script SQL sans connexion DB)
# =============================================================================

def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine.
    Calls to context.execute() emit the given string to the script output.
    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # Compare types pour détecter les changements de type de colonne
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


# =============================================================================
# ONLINE MODE (connexion à la DB réelle)
# =============================================================================

def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode.

    In this scenario we need to create an Engine and associate a connection
    with the context.
    """
    # Override sqlalchemy.url with our dynamic URL
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = get_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # Compare types pour détecter les changements de type de colonne
            compare_type=True,
            # Compare server defaults
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


# =============================================================================
# MAIN
# =============================================================================

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

