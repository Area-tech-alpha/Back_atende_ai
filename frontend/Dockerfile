# Etapa 1: Build da aplicação frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copia e instala as dependências do frontend
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copia o restante do código e faz o build
COPY . .
RUN npm run build

# Etapa 2: Servir os arquivos estáticos com Nginx
FROM nginx:alpine

# Copia a build do frontend para o diretório de arquivos estáticos do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Remove a configuração padrão do Nginx e copia a sua, se houver
# Se você tiver uma configuração personalizada (nginx.conf), descomente e ajuste:
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80, padrão para o Nginx
EXPOSE 80