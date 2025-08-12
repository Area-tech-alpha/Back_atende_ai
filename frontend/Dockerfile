# Etapa 1: Build da aplicação frontend
# Usa a imagem oficial do Node.js 20 em Alpine, uma versão leve do Linux.
FROM node:20-alpine AS builder

# Define o diretório de trabalho dentro do container.
WORKDIR /app

# Copia e instala as dependências do frontend.
# Os caminhos foram corrigidos para a raiz do contexto de build.
COPY package.json ./
COPY package-lock.json ./
RUN npm install --legacy-peer-deps

# Copia o restante do código.
COPY . .

# Para que o Vite leia as variáveis de ambiente do Render,
# é necessário passá-las diretamente para o comando de build.
# A instrução `ARG` define uma variável que pode ser passada
# durante o comando `docker build`.
ARG VITE_API_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_URL

# Executa o build da aplicação Vite, passando a variável de ambiente diretamente.
# Esta abordagem garante que o valor seja injetado no código final.
RUN VITE_API_URL=$VITE_API_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    npm run build

# Etapa 2: Servir os arquivos estáticos com Nginx
# Usa a imagem oficial do Nginx em Alpine, que é leve.
FROM nginx:alpine

# Copia a build do frontend (da etapa 1) para o diretório
# de arquivos estáticos do Nginx.
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe a porta 80, padrão para o Nginx.
EXPOSE 80

# Inicia o Nginx.
CMD ["nginx", "-g", "daemon off;"]
