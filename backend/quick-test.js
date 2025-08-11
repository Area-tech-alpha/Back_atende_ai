// Teste rápido para verificar se o servidor inicia
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Teste básico
app.get('/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Servidor funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Simular o servidor principal
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0'
  });
});

app.listen(port, () => {
  console.log(`✅ Servidor de teste rodando na porta ${port}`);
  console.log(`🌐 Testes disponíveis:`);
  console.log(`   - http://localhost:${port}/test`);
  console.log(`   - http://localhost:${port}/health`);
  console.log(`   - http://localhost:${port}/api/health`);
  
  // Parar após 5 segundos
  setTimeout(() => {
    console.log('⏰ Teste concluído - servidor funcionando!');
    process.exit(0);
  }, 5000);
});

// Tratamento de erros
process.on('uncaughtException', (err) => {
  console.error('❌ Erro não tratado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promessa rejeitada não tratada:', reason);
  process.exit(1);
}); 