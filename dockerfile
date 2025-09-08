# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

# Evita que npm o Node estén en "production" en el builder
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false

COPY package*.json ./
# Instala con devDeps sí o sí
RUN npm ci --include=dev

COPY . .

# Si querés usar tsc directo:
RUN npx tsc -p tsconfig.build.json
# (o si preferís nest)
# RUN npx nest build

# ---- Runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
# Solo deps de producción
RUN npm ci --omit=dev

# Copiamos artefactos compilados
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
