import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import apiRoutes from './routes/api.js';
import { ensureAuthDirExists } from './utils.js';

dotenv.config();

// Configuração para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Variáveis de ambiente
const port = process.env.PORT || 3000; // agora pode rodar na 3000 mesmo
const frontendURL = process.env.FRONTEND_URL || '*';

// CORS (você pode deixar * no Railway se quiser liberar tudo)
app.use(cors({
  origin: [
    frontendURL,
    "http://localhost:4000",
    "https://lionchat.tech"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// Servir arquivos estáticos do frontend (Vite build)
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Diretório estático para arquivos de autenticação
app.use('/auth', express.static('auth'));

// API
app.use('/api', apiRoutes);

// Healthcheck para Docker
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Garante que pasta /auth existe
ensureAuthDirExists();

// Fallback para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Inicializa servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log(`Memória inicial: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
});

// Monitoramento de memória
setInterval(() => {
  const mem = process.memoryUsage();
  const used = Math.round(mem.heapUsed / 1024 / 1024);
  const total = Math.round(mem.heapTotal / 1024 / 1024);
  if (used > 500) console.warn(`⚠️ Memória alta: ${used}MB / ${total}MB`);
}, 5 * 60 * 1000);

// Tratamento de erros não tratados
process.on('uncaughtException', err => console.error('❌ Erro não tratado:', err));
process.on('unhandledRejection', (reason, promise) => console.error('❌ Promessa rejeitada não tratada:', reason));
