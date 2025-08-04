# Dockerfile para o FRONTEND (Vite + build estática)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Etapa final: servir com um servidor estático (como nginx)
FROM nginx:alpine

# Copia o build para o diretório público do nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Remove configuração default e adiciona a sua se quiser
EXPOSE 80
