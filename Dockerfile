
# ============================================================
# MARTECH ENGINEER DYNAMIC MEDIA AJO
# Runtime: Agent Hub + MCP Server + Flow Studio + PhotoCraft
# No Docker Hub credentials required to build
# ============================================================

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Runtime dependencies
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  curl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install Node.js dependencies
COPY package.json ./

# Reproducible installation when package-lock.json exists
COPY package-lock.json* ./

RUN if [ -f package-lock.json ]; then \
  npm ci --omit=dev; \
  else \
  npm install --omit=dev; \
  fi \
  && npm cache clean --force

# Application services
COPY agent-hub ./agent-hub
COPY mcp-server ./mcp-server
COPY flow_studio ./flow_studio
COPY resources ./resources
COPY photocraft ./photocraft

# Runtime directory
RUN mkdir -p /app/photocraft/jobs

# Agent Hub, MCP and Flow Studio
EXPOSE 3000 3001 3002

HEALTHCHECK --interval=30s \
  --timeout=5s \
  --start-period=10s \
  --retries=3 \
  CMD curl -fsS http://localhost:3000/api/health || exit 1

CMD ["node", "agent-hub/server.mjs"]
