# Etapa 1: Build da aplicação frontend
FROM node:20-alpine AS builder

# Define o diretório de trabalho dentro do container.
WORKDIR /app

# Copia e instala as dependências do frontend.
# O contexto de build agora é a própria pasta do frontend.
COPY package.json ./
COPY package-lock.json ./
RUN npm install --legacy-peer-deps

# Copia o restante do código.
COPY . .

# Para que o Vite leia as variáveis de ambiente do Render,
# é necessário passá-las diretamente para o comando de build.
ARG VITE_API_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_URL

# Executa o build da aplicação Vite, passando as variáveis de ambiente.
RUN VITE_API_URL=$VITE_API_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    npm run build

# Etapa 2: Servir os arquivos estáticos com Nginx
FROM nginx:alpine

# Copia a build do frontend (da etapa 1) para o diretório
# de arquivos estáticos do Nginx.
COPY --from=builder /app/dist /usr/share/nginx/html

# Inicia o Nginx.
CMD ["nginx", "-g", "daemon off;"]
