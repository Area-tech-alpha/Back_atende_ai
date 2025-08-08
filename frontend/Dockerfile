# Etapa 1: Build da aplicação frontend
# Usa a imagem oficial do Node.js 20 em Alpine, uma versão leve do Linux.
FROM node:20-alpine AS builder

# Define o diretório de trabalho dentro do container.
WORKDIR /app

# Copia e instala as dependências do frontend.
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copia o restante do código.
COPY . .

# --- INÍCIO DA ATUALIZAÇÃO ---
# Para que o Vite leia as variáveis de ambiente do Render,
# precisamos criá-las no momento do build.
# A instrução `ARG` define uma variável que pode ser passada
# durante o comando `docker build`.
ARG VITE_API_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_URL

# A instrução `ENV` cria uma variável de ambiente que estará
# disponível durante a execução do comando `npm run build`.
# O Vite usará essas variáveis para gerar o código final.
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
# --- FIM DA ATUALIZAÇÃO ---

# Executa o build da aplicação Vite.
RUN npm run build

# Etapa 2: Servir os arquivos estáticos com Nginx
# Usa a imagem oficial do Nginx em Alpine, que é leve.
FROM nginx:alpine

# Copia a build do frontend (da etapa 1) para o diretório
# de arquivos estáticos do Nginx.
COPY --from=builder /app/dist /usr/share/nginx/html

# A instrução 'COPY' abaixo é opcional.
# Se você tiver um arquivo de configuração nginx.conf personalizado,
# descomente a linha abaixo e coloque o arquivo na pasta 'frontend'.
# Por padrão, o Nginx já serve arquivos estáticos corretamente.
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80, padrão para o Nginx.
EXPOSE 80

# Inicia o Nginx.
CMD ["nginx", "-g", "daemon off;"]
