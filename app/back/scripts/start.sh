#!/bin/bash
# =============================================================================
# STARTUP SCRIPT FOR PRODUCTION
# =============================================================================
# This script:
# 1. Runs Alembic migrations to ensure the database schema is up to date
# 2. Starts the FastAPI application with Uvicorn
#
# Usage: ./scripts/start.sh
# =============================================================================

set -e  # Exit on error

echo "🚀 Starting Life Planner API..."

# -----------------------------------------------------------------------------
# Step 1: Run database migrations
# -----------------------------------------------------------------------------
echo "📦 Running database migrations..."

# Wait a few seconds for the database to be ready (useful in container orchestration)
sleep 3

# Run Alembic migrations
# - upgrade head: applies all pending migrations
# - If no migrations pending, this is a no-op
alembic upgrade head

echo "✅ Database migrations completed!"

# -----------------------------------------------------------------------------
# Step 2: Start the API server
# -----------------------------------------------------------------------------
echo "🌐 Starting Uvicorn server..."

# Start Uvicorn with production settings
# - host 0.0.0.0: listen on all interfaces
# - port 8000: standard API port (Railway will map this)
# - workers: number of worker processes (1 for containers, scale via replicas)
exec uvicorn app:app --host 0.0.0.0 --port "${PORT:-8000}"

