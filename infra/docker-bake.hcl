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
# Note: Exécuter depuis la racine du repo: docker buildx bake -f infra/docker-bake.hcl
# Pour docker compose local, utiliser: COMPOSE_BAKE=true docker compose up --build
target "api" {
  # Context = racine du repo, le Dockerfile utilise COPY depuis app/back
  context    = "."
  dockerfile = "infra/Dockerfile.api"
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
  context    = "."
  dockerfile = "infra/Dockerfile.api"
  target     = "development"
  
  tags = [
    "lifeplanner-api:dev"
  ]
}

