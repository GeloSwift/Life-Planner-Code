# =============================================================================
# DOCKER BAKE CONFIGURATION
# =============================================================================
# Docker Bake permet des builds plus rapides grâce à:
# - Parallélisation des targets
# - Cache optimisé
# - Meilleure gestion des dépendances
#
# Usage:
#   COMPOSE_BAKE=true docker compose -f infra/docker-compose.yml up --build
#   docker buildx bake                              # Depuis la racine
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
# Groups
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
target "api" {
  context    = "./app/back"
  dockerfile = "Dockerfile"
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
# Target: API Development
# =============================================================================
target "api-dev" {
  context    = "./app/back"
  dockerfile = "Dockerfile"
  target     = "development"
  
  tags = [
    "lifeplanner-api:dev"
  ]
}

