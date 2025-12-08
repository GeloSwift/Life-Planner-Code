# =============================================================================
# DOCKERFILE FOR NEXT.JS APPLICATION
# =============================================================================
# Build: docker build -t lifeplanner-front ./app/front
# Run:   docker run -p 3000:3000 lifeplanner-front
#
# For development with docker-compose, use target: development
# For production (Vercel, etc.), the default target is production (last stage)
#
# Documentation: https://nextjs.org/docs/app/building-your-application/deploying
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base image with pnpm
# -----------------------------------------------------------------------------
FROM node:20-alpine AS base

# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# -----------------------------------------------------------------------------
# Stage 2: Dependencies
# -----------------------------------------------------------------------------
FROM base AS dependencies

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 3: Development (for docker-compose with hot-reload)
# -----------------------------------------------------------------------------
FROM dependencies AS development

# Copy all files (will be overridden by volume mount in docker-compose)
COPY . .

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Start dev server with hot-reload
CMD ["pnpm", "dev"]

# -----------------------------------------------------------------------------
# Stage 4: Builder (build the production app)
# -----------------------------------------------------------------------------
FROM dependencies AS builder

# Copy source code
COPY . .

# Set production environment for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 5: Production (DEFAULT - optimized for production)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

WORKDIR /app

# Don't run as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built assets from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the server
CMD ["node", "server.js"]

