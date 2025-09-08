# syntax=docker/dockerfile:1.7
FROM node:20-alpine

WORKDIR /app

# Fuerza modo dev para instalar devDependencies
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false

COPY package*.json ./

# Instalar con devDeps (cachea el directorio de npm)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev

# Copiar el resto del código
COPY . .

# (opcional) normalizar finales de línea y permisos en bins
RUN apk add --no-cache dos2unix \
 && find node_modules/.bin -type f -print0 | xargs -0 -I{} dos2unix "{}" || true \
 && chmod -R +x node_modules/.bin || true

# Diagnóstico útil en logs (debería mostrar production=false y typescript presente)
RUN node -v && npm -v && echo "npm production=$(npm config get production)" && npm ls typescript || true

# Compilar (usa el script modificado que llama a tsc vía node)
RUN npm run build

# Pasar a prod y podar devDeps
ENV NODE_ENV=production
RUN npm prune --omit=dev

EXPOSE 3000
CMD ["node", "dist/main.js"]
