# =============================================================================
# DOCKERFILE FOR FASTAPI APPLICATION
# =============================================================================
# Build: docker build -t lifeplanner-api ./app/back
# Run:   docker run -p 8000:8000 lifeplanner-api
#
# For development with docker-compose, use target: development
# For production (Railway, etc.), the default target is production (last stage)
#
# Documentation: https://fastapi.tiangolo.com/deployment/docker/
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base image
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser

WORKDIR /app

# -----------------------------------------------------------------------------
# Stage 2: Dependencies
# -----------------------------------------------------------------------------
FROM base AS dependencies

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# -----------------------------------------------------------------------------
# Stage 3: Development (for docker-compose with volume mounts)
# -----------------------------------------------------------------------------
FROM dependencies AS development

# In dev, code is mounted as volume, no need to COPY
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# -----------------------------------------------------------------------------
# Stage 4: Production (DEFAULT - Railway, Render, etc.)
# -----------------------------------------------------------------------------
# This is the LAST stage, so it's used by default when no target is specified
FROM dependencies AS production

# Copy all application code
COPY . .

# Make startup script executable
RUN chmod +x scripts/start.sh

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Railway uses PORT env var, default to 8000
ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-8000}/health')" || exit 1

# Startup script runs migrations then starts Uvicorn
CMD ["./scripts/start.sh"]
