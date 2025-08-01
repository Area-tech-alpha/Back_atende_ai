# Etapa 1 - Build do frontend
FROM node:20 AS frontend

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Etapa 2 - Build do backend
FROM node:20 AS backend

WORKDIR /app

# Copiar backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copiar código do backend e dist do frontend
COPY backend ./backend
COPY --from=frontend /app/frontend/dist ./dist

# Etapa final - execução baseada na variável SERVICE
FROM node:20 AS final

WORKDIR /app

COPY --from=backend /app/backend ./backend
COPY --from=backend /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3001

# Comando de inicialização dinâmica
CMD if [ "$SERVICE" = "frontend" ]; then \
      npm install -g serve && serve -s dist -l 4000; \
    elif [ "$SERVICE" = "worker" ]; then \
      cd backend && npm run start:worker; \
    else \
      cd backend && npm run start; \
    fi
