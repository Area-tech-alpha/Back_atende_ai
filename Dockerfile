# Etapa 1: Build do frontend (Vite)
FROM node:20-alpine AS frontend

WORKDIR /app/frontend

# Copia apenas os arquivos necessários para o build
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./
RUN npm run build


# Etapa 2: Backend + assets do frontend servidos via Express
FROM node:20-slim

WORKDIR /app

# Instala dependências necessárias para node-gyp
RUN apt-get update && apt-get install -y python3 make g++ curl && rm -rf /var/lib/apt/lists/*

# Copia backend package.json e instala dependências
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --legacy-peer-deps

# Copia o código do backend
COPY backend/ ./

# Copia a build do frontend para ser servida pelo Express
COPY --from=frontend /app/frontend/dist ../dist

# Copia pasta da API separada (caso exista)
COPY api/ /app/api/

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Expõe a porta usada pelo Express
EXPOSE 3000

# Healthcheck para Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Comando para iniciar API + worker simultaneamente
CMD ["npm", "--prefix", "backend", "run", "start:all"]
