# =============================================================================
# DOCKERFILE FOR FASTAPI APPLICATION
# =============================================================================
# Build: docker build -t lifeplanner-api ./app/back
# Run:   docker run -p 8000:8000 lifeplanner-api
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
# Stage 3: Production
# -----------------------------------------------------------------------------
FROM dependencies AS production

COPY . .

# Make startup script executable
RUN chmod +x scripts/start.sh

RUN chown -R appuser:appgroup /app

USER appuser

# Railway uses PORT env var, default to 8000
ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-8000}/health')" || exit 1

# Use startup script that runs migrations then starts the server
CMD ["./scripts/start.sh"]

# -----------------------------------------------------------------------------
# Stage 4: Development (hot-reload)
# -----------------------------------------------------------------------------
FROM dependencies AS development

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

