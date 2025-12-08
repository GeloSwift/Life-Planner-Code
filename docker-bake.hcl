# =============================================================================
# DOCKER BAKE CONFIGURATION
# =============================================================================
# Docker Bake permet des builds plus rapides grâce à:
# - Parallélisation des targets
# - Cache optimisé
# - Meilleure gestion des dépendances
#
# Usage:
#   docker buildx bake                    # Build all default targets
#   docker buildx bake api                # Build API only
#   docker buildx bake front              # Build front only
#   docker buildx bake --push             # Build and push to registry
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
  targets = ["api", "front"]
}

group "all" {
  targets = ["api", "api-dev", "front", "front-dev"]
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

# =============================================================================
# Target: Front Production
# =============================================================================
target "front" {
  context    = "./app/front"
  dockerfile = "Dockerfile"
  target     = "production"
  
  tags = [
    "${REGISTRY}/${REPOSITORY}/front:${TAG}",
    "${REGISTRY}/${REPOSITORY}/front:latest"
  ]
  
  platforms = ["linux/amd64"]
  
  labels = {
    "org.opencontainers.image.source" = "https://github.com/${REPOSITORY}"
    "org.opencontainers.image.description" = "Life Planner Frontend"
  }
}

# =============================================================================
# Target: Front Development
# =============================================================================
target "front-dev" {
  context    = "./app/front"
  dockerfile = "Dockerfile"
  target     = "development"
  
  tags = [
    "lifeplanner-front:dev"
  ]
}

