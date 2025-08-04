# Etapa 1: Build do frontend (Vite)
FROM node:20-alpine AS frontend

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./
RUN npm run build


# Etapa 2: Backend + assets do frontend servidos via Express
FROM node:20-slim

WORKDIR /app

# Instala dependências para node-gyp
RUN apt-get update && apt-get install -y python3 make g++ curl && rm -rf /var/lib/apt/lists/*

# Copia e instala dependências do backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --legacy-peer-deps

# Copia o restante do backend
COPY backend/ ./backend/

# Copia a build do frontend para ser servida pelo Express
COPY --from=frontend /app/frontend/dist ./dist

# Copia a API se houver
COPY api/ ./api/

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Comando final
CMD ["npm", "--prefix", "backend", "run", "start:all"]
