import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import apiRoutes from './routes/api.js';
import { ensureAuthDirExists } from './utils.js';

dotenv.config();

const app = express();

// Variáveis de ambiente
const port = process.env.PORT || 3001;
const frontendURL = process.env.FRONTEND_URL || 'http://localhost:4000';

// Middleware
app.use(cors({
  origin: frontendURL,
  credentials: true
}));
app.use(express.json());
app.use('/auth', express.static('auth'));

// Rotas da API
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Criar diretório "auth" se não existir
ensureAuthDirExists();

// Iniciar o servidor
app.listen(port, () => {
  console.log(`✅ API rodando na porta ${port}`);
});

// Tratamento global de erros não tratados
process.on('uncaughtException', (err) => {
  console.error('❌ Erro não tratado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promessa rejeitada não tratada:', reason);
});
