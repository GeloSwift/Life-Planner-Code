# =============================================================================
# DOCKER BAKE CONFIGURATION
# =============================================================================
# Docker Bake permet des builds plus rapides grâce à:
# - Parallélisation des targets
# - Cache optimisé
# - Meilleure gestion des dépendances
#
# Usage:
#   COMPOSE_BAKE=true docker compose up --build   # Via Compose
#   docker buildx bake -f infra/docker-bake.hcl   # Directement
#
# Documentation: https://docs.docker.com/build/bake/
# =============================================================================

# Variables depuis l'environnement ou valeurs par défaut
variable "REGISTRY" {
  default = "ghcr.io"
}

variable "REPOSITORY" {
  default = "geloswift/life-planner-code"
}

variable "TAG" {
  default = "latest"
}

# =============================================================================
# Groups - permet de builder plusieurs targets en une commande
# =============================================================================
group "default" {
  targets = ["api"]
}

group "all" {
  targets = ["api", "api-dev"]
}

# =============================================================================
# Target: API Production
# =============================================================================
# Note: Les chemins sont relatifs à la racine du repo (pour GitHub Actions)
# Pour un usage local avec docker compose, utiliser COMPOSE_BAKE=true qui génère
# automatiquement la config bake depuis docker-compose.yml
target "api" {
  context    = "./app/back"
  dockerfile = "../../infra/Dockerfile.api"
  target     = "production"
  
  tags = [
    "${REGISTRY}/${REPOSITORY}/api:${TAG}",
    "${REGISTRY}/${REPOSITORY}/api:latest"
  ]
  
  platforms = ["linux/amd64"]
  
  labels = {
    "org.opencontainers.image.source" = "https://github.com/${REPOSITORY}"
    "org.opencontainers.image.description" = "Life Planner API"
  }
}

# =============================================================================
# Target: API Development (avec hot-reload)
# =============================================================================
target "api-dev" {
  context    = "./app/back"
  dockerfile = "../../infra/Dockerfile.api"
  target     = "development"
  
  tags = [
    "lifeplanner-api:dev"
  ]
}

