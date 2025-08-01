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

COPY api/ ./api/

ENV NODE_ENV=production
ENV PORT=3000
