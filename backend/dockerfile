
FROM node:20-slim


RUN apt-get update && apt-get install -y python3 make g++ curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install --legacy-peer-deps --production


COPY src ./src
COPY utils ./utils
COPY routes ./routes
COPY server.js ./



ENV PORT=3000

CMD [ "npm", "run", "start" ]
