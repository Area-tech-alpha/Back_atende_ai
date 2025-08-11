import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importa o arquivo de rotas da API.
// Este arquivo contém todas as rotas para /api/whatsapp, /api/chatbots, etc.
import apiRoutes from './routes/api.js';

import { ensureAuthDirExists } from './utils.js';

dotenv.config();

// Configuração para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Variáveis de ambiente
console.log(`Valor de PORT vindo do ambiente: ${process.env.PORT}`);
const port = process.env.PORT || 3000;
const frontendURL = process.env.FRONTEND_URL || '*';

console.log('--- Início da configuração do Express ---');

app.use(cors({
  origin: frontendURL,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// Rota de teste simples na raiz
app.get('/', (_req, res) => {
  console.log('Rota raiz foi acessada! 🎉');
  res.send('Servidor OK! 🎉');
});


app.use('/api', apiRoutes);

// Rota de health check. É uma boa prática ter uma na raiz também.
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

console.log('--- Antes de ensureAuthDirExists ---');
ensureAuthDirExists();
console.log('--- Depois de ensureAuthDirExists ---');

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log(`Memória inicial: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
});

// Código de monitoramento e tratamento de erros
setInterval(() => {
  const mem = process.memoryUsage();
  const used = Math.round(mem.heapUsed / 1024 / 1024);
  const total = Math.round(mem.heapTotal / 1024 / 1024);
  if (used > 500) console.warn(`⚠️ Memória alta: ${used}MB / ${total}MB`);
}, 5 * 60 * 1000);

process.on('uncaughtException', err => console.error('❌ Erro não tratado:', err));
process.on('unhandledRejection', (reason, promise) => console.error('❌ Promessa rejeitada não tratada:', reason));