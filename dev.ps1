# =============================================================================
# 🚀 LIFE PLANNER - SCRIPT DE DÉVELOPPEMENT LOCAL (Windows)
# =============================================================================
# Usage:
#   .\dev.ps1           # Lance tout (DB + API + Front)
#   .\dev.ps1 -Backend  # Lance seulement DB + API
#   .\dev.ps1 -Stop     # Arrête tous les services
#   .\dev.ps1 -Reset    # Reset la DB et relance
#   .\dev.ps1 -Logs     # Affiche les logs de l'API
# =============================================================================

param(
    [switch]$Backend,    # Lance seulement le backend (DB + API)
    [switch]$Stop,       # Arrête tous les services
    [switch]$Reset,      # Reset la DB (supprime les données)
    [switch]$Logs,       # Affiche les logs
    [switch]$Build,      # Force rebuild des images
    [switch]$Help        # Affiche l'aide
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
$InfraDir = Join-Path $ProjectRoot "infra"
$FrontDir = Join-Path $ProjectRoot "app\front"

# Couleurs
function Write-Color($text, $color) {
    Write-Host $text -ForegroundColor $color
}

function Write-Header($text) {
    Write-Host ""
    Write-Color "═══════════════════════════════════════════════════════════════" Cyan
    Write-Color "  $text" Cyan
    Write-Color "═══════════════════════════════════════════════════════════════" Cyan
    Write-Host ""
}

function Write-Success($text) { Write-Color "✅ $text" Green }
function Write-Info($text) { Write-Color "📌 $text" Yellow }
function Write-Error($text) { Write-Color "❌ $text" Red }

# Aide
if ($Help) {
    Write-Header "Life Planner - Aide"
    Write-Host @"
USAGE:
    .\dev.ps1              Lance l'environnement complet (DB + API + Front)
    .\dev.ps1 -Backend     Lance seulement DB + API (pour travailler sur le front séparément)
    .\dev.ps1 -Stop        Arrête tous les services Docker
    .\dev.ps1 -Reset       Reset la base de données et relance
    .\dev.ps1 -Logs        Affiche les logs de l'API en temps réel
    .\dev.ps1 -Build       Force le rebuild des images Docker
    .\dev.ps1 -Help        Affiche cette aide

URLS:
    Frontend:     http://localhost:3000
    API:          http://localhost:8000
    API Docs:     http://localhost:8000/docs
    PostgreSQL:   localhost:5433

RACCOURCIS UTILES:
    Ctrl+C                 Arrête les services
    docker compose logs    Voir les logs

"@
    exit 0
}

# Vérifier Docker
function Test-Docker {
    try {
        $null = docker info 2>&1
        return $true
    } catch {
        return $false
    }
}

# Arrêter les services
if ($Stop) {
    Write-Header "Arrêt des services"
    Set-Location $InfraDir
    docker compose down
    Write-Success "Services arrêtés"
    exit 0
}

# Reset la DB
if ($Reset) {
    Write-Header "Reset de la base de données"
    Set-Location $InfraDir
    Write-Info "Arrêt des services et suppression des volumes..."
    docker compose down -v
    Write-Success "Base de données réinitialisée"
    Write-Info "Relance des services..."
    # Les migrations seront appliquées après le démarrage
    $env:APPLY_MIGRATIONS = "true"
}

# Logs
if ($Logs) {
    Set-Location $InfraDir
    docker compose logs -f api
    exit 0
}

# Vérifications
Write-Header "🚀 Démarrage de Life Planner (Dev)"

if (-not (Test-Docker)) {
    Write-Error "Docker n'est pas lancé ! Lance Docker Desktop d'abord."
    exit 1
}
Write-Success "Docker est disponible"

# Vérifier les fichiers .env
$backEnv = Join-Path $ProjectRoot "app\back\.env"
$frontEnv = Join-Path $ProjectRoot "app\front\.env.local"

if (-not (Test-Path $backEnv)) {
    Write-Info "Création de app/back/.env depuis le template..."
    Copy-Item (Join-Path $ProjectRoot "app\back\env.template") $backEnv
    Write-Success "Fichier .env backend créé (pense à le configurer !)"
}

if (-not (Test-Path $frontEnv)) {
    Write-Info "Création de app/front/.env.local depuis le template..."
    Copy-Item (Join-Path $ProjectRoot "app\front\env.template") $frontEnv
    Write-Success "Fichier .env.local frontend créé"
}

# Build si demandé
$buildArg = if ($Build) { "--build" } else { "" }

# Lancer les services
Set-Location $InfraDir

# Fonction pour appliquer les migrations
function Apply-Migrations {
    Write-Info "Application des migrations..."
    Start-Sleep -Seconds 5  # Attendre que l'API soit prête
    docker compose exec -T api alembic upgrade head
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Migrations appliquées"
    }
}

if ($Backend) {
    # Mode Backend seulement
    Write-Header "Mode Backend (DB + API)"
    Write-Info "Lance le frontend manuellement avec: cd app/front && pnpm dev"
    Write-Host ""
    Write-Info "URLs:"
    Write-Host "  API:      http://localhost:8000"
    Write-Host "  API Docs: http://localhost:8000/docs"
    Write-Host ""
    
    # Lancer en arrière-plan, appliquer migrations, puis attacher
    if ($buildArg) {
        docker compose up -d db api --build
    } else {
        docker compose up -d db api
    }
    Apply-Migrations
    docker compose logs -f api
} else {
    # Mode complet
    Write-Header "Mode Complet (DB + API + Front)"
    Write-Host ""
    Write-Info "URLs:"
    Write-Host "  Frontend: http://localhost:3000"
    Write-Host "  API:      http://localhost:8000"
    Write-Host "  API Docs: http://localhost:8000/docs"
    Write-Host ""
    Write-Info "Hot-reload activé sur le backend et le frontend"
    Write-Host ""
    
    # Lancer en arrière-plan, appliquer migrations, puis attacher
    if ($buildArg) {
        docker compose up -d --build
    } else {
        docker compose up -d
    }
    Apply-Migrations
    docker compose logs -f
}
