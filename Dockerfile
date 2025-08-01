FROM node:20-alpine AS frontend

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./
RUN npm run build



FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ curl && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./backend/
RUN cd backend && npm install --legacy-peer-deps

COPY backend/ ./backend/

COPY --from=frontend /app/frontend/dist ./dist

# remover a parte abaixo quando a build der certo, somente pra debugar se a estrutura ficou correta 
RUN echo "===> Estrutura atual do /app antes de copiar /api" && ls -la /app

COPY api/ ./api/

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "backend/server.js"]