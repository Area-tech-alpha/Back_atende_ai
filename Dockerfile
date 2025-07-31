# ========================
# Etapa 1: build do frontend
# ========================
FROM node:20-alpine AS frontend

WORKDIR /app/frontend

# Copia apenas o package para cache inteligente
COPY frontend/package*.json ./

RUN npm install --legacy-peer-deps

# Copia todo o frontend
COPY frontend/ ./

# Gera build do frontend (Vite)
RUN npm run build

# ========================
# Etapa 2: backend + servir frontend
# ========================
FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema necessárias para o Baileys
RUN apk add --no-cache python3 make g++ libc6-compat curl

# Copiar apenas os arquivos do backend
COPY backend/package*.json ./backend/

WORKDIR /app/backend
RUN npm install --legacy-peer-deps

# Copiar o restante do backend
COPY backend/ ./

# Copiar build do frontend gerado na etapa anterior para dentro do backend
COPY --from=frontend /app/frontend/dist ./dist

# Criar pasta auth com permissões adequadas
RUN mkdir -p auth && chmod 755 auth

# Configurar variáveis de ambiente (pode ser sobrescrito em tempo de execução)
ENV NODE_ENV=production
ENV PORT=3000

# Expor a porta da API
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Iniciar o servidor (assumindo que server.js serve frontend também por ./dist)
CMD ["node", "server.js"]
