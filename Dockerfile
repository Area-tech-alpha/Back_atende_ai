# ========================
# Etapa 1: build do frontend
# ========================
FROM node:20-alpine AS frontend

WORKDIR /app/frontend

# Copia package.json e lock para cache inteligente
COPY ./frontend/package*.json ./

# Instala dependências do frontend
RUN npm install --legacy-peer-deps

# Copia todo o código-fonte do frontend
COPY ./frontend/ ./

# Gera build do Vite
RUN npm run build


# ========================
# Etapa 2: backend + servir frontend
# ========================
FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema necessárias para o Baileys
RUN apk add --no-cache python3 make g++ libc6-compat curl

# Copiar arquivos do backend
COPY ./backend/package*.json ./backend/

WORKDIR /app/backend

# Instalar dependências do backend
RUN npm install --legacy-peer-deps

# Copiar código-fonte do backend
COPY ./backend/ ./

# Copiar build do frontend gerado anteriormente
COPY --from=frontend /app/frontend/dist ./dist

# Criar pasta auth com permissões
RUN mkdir -p auth && chmod 755 auth

# Variáveis de ambiente padrão (podem ser sobrescritas em produção)
ENV NODE_ENV=production
ENV PORT=3000

# Expor a porta da API
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Comando padrão
CMD ["node", "server.js"]
