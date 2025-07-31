# ========================
# Etapa 1: build do frontend
# ========================
FROM node:20-alpine AS frontend

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./
RUN npm run build


# ========================
# Etapa 2: backend + servir frontend
# ========================
FROM node:20-slim

WORKDIR /app

# Dependências do sistema (se Baileys ou QRCode precisar)
RUN apt-get update && apt-get install -y python3 make g++ curl && rm -rf /var/lib/apt/lists/*

# Copia pacotes do backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --legacy-peer-deps

# Copia código do backend
COPY backend/ ./

# Copia build do frontend
COPY --from=frontend /app/frontend/dist ./dist

# Copia a pasta da API
COPY api/ /app/api/

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
