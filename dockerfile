# syntax=docker/dockerfile:1.7

########################
# 1) Deps (con devDeps)
########################
FROM node:20-alpine AS deps
WORKDIR /app

# Asegura que se instalen devDependencies
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false

COPY package*.json ./

# Cache de npm (no de node_modules) para acelerar
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev

########################
# 2) Build
########################
FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=development

# Reusa node_modules del stage deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# (Opcional pero recomendable) arregla CRLF y permisos en bins
RUN apk add --no-cache dos2unix \
 && find node_modules/.bin -type f -maxdepth 1 -exec dos2unix {} \; || true \
 && chmod -R +x node_modules/.bin || true

# Compila usando npx (no depende del ejecutable en PATH)
RUN --mount=type=cache,target=/app/node_modules/.cache \
    npx tsc -v && npx tsc -p tsconfig.build.json

########################
# 3) Runtime (solo prod)
########################
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
# Solo dependencias de producción
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Copia artefactos ya compilados
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
