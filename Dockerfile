FROM node:18-alpine

WORKDIR /app

# Instalar dependências do sistema necessárias para o Baileys
RUN apk add --no-cache python3 make g++ libc6-compat

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies para o build)
RUN npm ci

# Copiar o resto dos arquivos
COPY . .

# Criar pasta auth com permissões adequadas
RUN mkdir -p auth && chmod 755 auth

# Configurar variáveis de ambiente
ENV NODE_ENV=production
ENV VITE_API_URL=https://lionchat.tech

# Construir a aplicação
RUN npm run build

# Remover devDependencies para otimizar a imagem
RUN npm prune --production

# Expor a porta
EXPOSE 3000

# Iniciar a aplicação
CMD ["node", "server.js"] 