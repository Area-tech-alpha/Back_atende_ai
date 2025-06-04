FROM node:18-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache python3 make g++

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o resto dos arquivos
COPY . .

# Configurar variáveis de ambiente
ENV NODE_ENV=production
ENV VITE_API_URL=https://lionchat.tech

# Construir a aplicação
RUN npm run build

# Expor a porta
EXPOSE 3000

# Iniciar a aplicação
CMD ["npm", "start"] 