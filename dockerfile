# syntax=docker/dockerfile:1.7

########################
# 1) Deps + Build (con devDeps) - Node 18 glibc
########################
FROM node:18-bullseye-slim AS builder
WORKDIR /app

# toolchain para compilar nativos (typescript/bcrypt si hace falta durante build)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev

COPY . .

# Compila TS (script que llama a tsc vía node, como te pasé antes)
RUN npm run build


########################
# 2) Runtime (solo prod) - Node 18 glibc
########################
FROM node:18-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./

RUN npm ls bcrypt || echo "bcrypt NOT installed"
RUN npm ls bcryptjs || true
# Y ver que en /app/dist no quede ningún require('bcrypt'):
RUN grep -R "require('bcrypt')" dist || echo "OK sin require('bcrypt')"

# Instala solo prod deps
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Recompila bcrypt para este sistema (garantiza ABI correcto)
RUN npm rebuild bcrypt --build-from-source

# Copia artefactos compilados
COPY --from=builder /app/dist ./dist

# Si usás archivos estáticos en runtime, copiarlos también
# COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "dist/main.js"]
