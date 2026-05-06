# ============================================================
# PawPati Backend — Cloud Run Optimized Dockerfile
# Multi-stage build: ~120MB final image (vs ~900MB naive)
# ============================================================

# --- Stage 1: Dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# --- Stage 2: Production Image ---
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root
RUN addgroup -g 1001 -S pawpati && \
    adduser -S pawpati -u 1001 -G pawpati

# Copy dependencies from stage 1
COPY --from=deps --chown=pawpati:pawpati /app/node_modules ./node_modules
COPY --chown=pawpati:pawpati package.json ./
COPY --chown=pawpati:pawpati src ./src

# Cloud Run injects PORT env var — default 8080
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:${PORT}/health || exit 1

# Non-root user
USER pawpati

EXPOSE ${PORT}

# Node.js production best practices
CMD ["node", "src/server.js"]
