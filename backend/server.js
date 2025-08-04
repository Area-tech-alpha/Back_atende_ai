import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// import apiRoutes from './routes/api.js'; // Comentado para isolar
import { ensureAuthDirExists } from './utils.js'; // Mantido, pois não deve causar crash

dotenv.config();

// Configuração para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Variáveis de ambiente
const port = process.env.PORT || 3000;
const frontendURL = process.env.FRONTEND_URL || '*';

app.use(cors({
  origin: frontendURL,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// Rota de teste simples na raiz para verificar se o servidor está de pé
app.get('/', (req, res) => {
    res.send('Servidor OK! 🎉');
});

// Comentado para isolar problemas com as rotas da API
// app.use('/api', apiRoutes);

// Healthcheck para Docker (mantido, mas a rota '/' será testada primeiro)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Garante que pasta /auth existe (mantido, pois é uma operação de sistema de arquivos simples)
ensureAuthDirExists();


// Inicializa servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log(`Memória inicial: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
});

// Monitoramento de memória (mantido, não deve causar crash)
setInterval(() => {
  const mem = process.memoryUsage();
  const used = Math.round(mem.heapUsed / 1024 / 1024);
  const total = Math.round(mem.heapTotal / 1024 / 1024);
  if (used > 500) console.warn(`⚠️ Memória alta: ${used}MB / ${total}MB`);
}, 5 * 60 * 1000);

// Tratamento de erros não tratados (mantido, importante para depuração)
process.on('uncaughtException', err => console.error('❌ Erro não tratado:', err));
process.on('unhandledRejection', (reason, promise) => console.error('❌ Promessa rejeitada não tratada:', reason));
app.get('/', (req, res) => { console.log('Rota raiz foi acessada!'); res.send('Servidor OK! 🎉'); });