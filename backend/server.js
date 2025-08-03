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
const port = process.env.PORT || 3001;
const frontendURL = process.env.FRONTEND_URL || 'http://localhost:4000';

// Configuração completa do CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "*",
    "http://localhost:4000",
    "https://lionchat.tech",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());


app.use(express.static(path.join(__dirname, "..", "dist")));


app.use('/auth', express.static('auth'));

app.use('/api', apiRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

ensureAuthDirExists();

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`API rodando na porta ${port}`);
  console.log(`Memória inicial: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
});

// Monitoramento de memória
setInterval(() => {
  const memUsage = process.memoryUsage();
  const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024);
  
  if (heapUsed > 500) { // Alertar se usar mais de 500MB
    console.warn(`⚠️ Alto uso de memória: ${heapUsed}MB / ${heapTotal}MB`);
  }
}, 5 * 60 * 1000); // Verificar a cada 5 minutos

// Tratamento global de erros não tratados
process.on('uncaughtException', (err) => {
  console.error('❌ Erro não tratado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promessa rejeitada não tratada:', reason);
});
