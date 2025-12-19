#!/bin/bash
# =============================================================================
# 🚀 LIFE PLANNER - SCRIPT DE DÉVELOPPEMENT LOCAL (Linux/Mac)
# =============================================================================
# Usage:
#   ./dev.sh              # Lance tout (DB + API + Front)
#   ./dev.sh --backend    # Lance seulement DB + API
#   ./dev.sh --stop       # Arrête tous les services
#   ./dev.sh --reset      # Reset la DB et relance
#   ./dev.sh --logs       # Affiche les logs de l'API
# =============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
INFRA_DIR="$PROJECT_ROOT/infra"
FRONT_DIR="$PROJECT_ROOT/app/front"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

success() { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${YELLOW}📌 $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# Aide
show_help() {
    header "Life Planner - Aide"
    cat << EOF
USAGE:
    ./dev.sh               Lance l'environnement complet (DB + API + Front)
    ./dev.sh --backend     Lance seulement DB + API (pour travailler sur le front séparément)
    ./dev.sh --stop        Arrête tous les services Docker
    ./dev.sh --reset       Reset la base de données et relance
    ./dev.sh --logs        Affiche les logs de l'API en temps réel
    ./dev.sh --build       Force le rebuild des images Docker
    ./dev.sh --help        Affiche cette aide

URLS:
    Frontend:     http://localhost:3000
    API:          http://localhost:8000
    API Docs:     http://localhost:8000/docs
    PostgreSQL:   localhost:5433

RACCOURCIS UTILES:
    Ctrl+C                 Arrête les services
    docker compose logs    Voir les logs

EOF
    exit 0
}

# Parser les arguments
BACKEND=false
STOP=false
RESET=false
LOGS=false
BUILD=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --backend|-b)
            BACKEND=true
            shift
            ;;
        --stop|-s)
            STOP=true
            shift
            ;;
        --reset|-r)
            RESET=true
            shift
            ;;
        --logs|-l)
            LOGS=true
            shift
            ;;
        --build)
            BUILD="--build"
            shift
            ;;
        --help|-h)
            show_help
            ;;
        *)
            echo "Option inconnue: $1"
            show_help
            ;;
    esac
done

# Vérifier Docker
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error "Docker n'est pas lancé ! Lance Docker Desktop d'abord."
        exit 1
    fi
}

# Arrêter les services
if $STOP; then
    header "Arrêt des services"
    cd "$INFRA_DIR"
    docker compose down
    success "Services arrêtés"
    exit 0
fi

# Reset la DB
if $RESET; then
    header "Reset de la base de données"
    cd "$INFRA_DIR"
    info "Arrêt des services et suppression des volumes..."
    docker compose down -v
    success "Base de données réinitialisée"
    info "Relance des services..."
fi

# Logs
if $LOGS; then
    cd "$INFRA_DIR"
    docker compose logs -f api
    exit 0
fi

# Démarrage
header "🚀 Démarrage de Life Planner (Dev)"

check_docker
success "Docker est disponible"

# Vérifier les fichiers .env
BACK_ENV="$PROJECT_ROOT/app/back/.env"
FRONT_ENV="$PROJECT_ROOT/app/front/.env.local"

if [ ! -f "$BACK_ENV" ]; then
    info "Création de app/back/.env depuis le template..."
    cp "$PROJECT_ROOT/app/back/env.template" "$BACK_ENV"
    success "Fichier .env backend créé (pense à le configurer !)"
fi

if [ ! -f "$FRONT_ENV" ]; then
    info "Création de app/front/.env.local depuis le template..."
    cp "$PROJECT_ROOT/app/front/env.template" "$FRONT_ENV"
    success "Fichier .env.local frontend créé"
fi

cd "$INFRA_DIR"

# Fonction pour appliquer les migrations
apply_migrations() {
    info "Application des migrations..."
    sleep 5  # Attendre que l'API soit prête
    docker compose exec -T api alembic upgrade head
    if [ $? -eq 0 ]; then
        success "Migrations appliquées"
    fi
}

if $BACKEND; then
    header "Mode Backend (DB + API)"
    info "Lance le frontend manuellement avec: cd app/front && pnpm dev"
    echo ""
    info "URLs:"
    echo "  API:      http://localhost:8000"
    echo "  API Docs: http://localhost:8000/docs"
    echo ""
    
    # Lancer en arrière-plan, appliquer migrations, puis attacher
    docker compose up -d db api $BUILD
    apply_migrations
    docker compose logs -f api
else
    header "Mode Complet (DB + API + Front)"
    echo ""
    info "URLs:"
    echo "  Frontend: http://localhost:3000"
    echo "  API:      http://localhost:8000"
    echo "  API Docs: http://localhost:8000/docs"
    echo ""
    info "Hot-reload activé sur le backend et le frontend"
    echo ""
    
    # Lancer en arrière-plan, appliquer migrations, puis attacher
    docker compose up -d $BUILD
    apply_migrations
    docker compose logs -f
fi
