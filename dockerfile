# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

# Aprovechar caché
COPY package*.json ./
# En build instalamos TODAS las deps (incluye dev)
RUN npm ci

# Copiamos el resto del proyecto
COPY . .

# (opcional) si tuviste el "Permission denied" por permisos/CRLF
# RUN chmod +x node_modules/.bin/* || true

# Compilamos (usa nest CLI)
RUN npm run build
# Alternativa sin nest CLI (si preferís): RUN npx tsc -p tsconfig.build.json

# ---- Runner (producción) ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
# Solo deps de producción
RUN npm ci --omit=dev

# Copiamos artefactos ya construidos
COPY --from=builder /app/dist ./dist

# Copiá otros assets necesarios en runtime si aplica (public, views, etc.)
# COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "dist/main.js"]
