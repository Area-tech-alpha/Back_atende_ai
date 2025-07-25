require('dotenv').config();
import express from 'express';
import cors from 'cors';
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import Boom from '@hapi/boom';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';
import { rimraf } from 'rimraf';
import mistralService from './src/services/mistralService.js';
import { setChatbot, removeChatbot, toggleChatbot, getChatbot, listChatbots } from './src/config/chatbots.js';

// Polyfill para o crypto no ambiente do Railway
if (typeof global.crypto === 'undefined') {
  global.crypto = crypto;
}

const app = express();
const port = process.env.PORT || 3001;

// Configuração do CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || '*',
    'http://localhost:4000',
    'https://lionchat.tech'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'dist')));

// Armazenar conexões ativas
const connections = new Map();
const qrCodes = new Map(); // deviceId -> qr string

// Cache para controlar envios em andamento e evitar duplicatas
const pendingSends = new Map(); // deviceId_number -> Promise
const recentSends = new Map(); // deviceId_number -> timestamp

function formatPhoneNumber(phone) {
  // Remove todos os caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '');
  
  // Se não começar com 55, adiciona
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  // Se o número tiver 13 dígitos (55 + DDD + 9 + número), remove o 9
  // Mantém os 4 primeiros (55 + DDD) e os últimos 8 dígitos
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    // 55 + DDD (2) + 9 + número (8)
    // Queremos: 55 + DDD (2) + número (8)
    cleaned = cleaned.slice(0, 4) + cleaned.slice(5);
  }
  
  return cleaned;
}

const startConnection = async (deviceId, connection_name) => {
  console.log('[WA-START] Iniciando conexão para deviceId:', deviceId);
  console.log('[DEBUG] Criando pasta de autenticação para deviceId:', deviceId); 
  const authFolder = path.join(__dirname, 'auth', deviceId);
  fs.mkdirSync(authFolder, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  console.log('[WA-START] Estado de autenticação carregado:', state.creds ? 'Autenticado' : 'Não autenticado');

  const client = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: ['Chrome (Linux)', '', ''],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    retryRequestDelayMs: 250,
    markOnlineOnConnect: false,
    deviceId: deviceId
  });

  // Sempre tenta preservar o nome já salvo, ou usa o novo
  const prev = connections.get(deviceId);
  const nameToSave = connection_name || (prev && prev.connection_name);
  connections.set(deviceId, { client, status: 'connecting', deviceId, connection_name: nameToSave });
  console.log('[WA-START] Cliente criado e adicionado ao mapa de conexões');

  client.ev.on('connection.update', async (update) => {
    console.log(`[WA-UPDATE] ${deviceId}:`, update);

    // Recupera o nome salvo, se existir
    const prev = connections.get(deviceId);
    const connection_name = prev && prev.connection_name ? prev.connection_name : undefined;

    if (update.connection === 'open') {
      console.log(`[WA-CONNECTED] deviceId=${deviceId}`);
      connections.set(deviceId, { client, status: 'connected', deviceId, connection_name });

    } else if (update.connection === 'close') {
      const statusCode = update.lastDisconnect?.error?.output?.statusCode;
      const reason = update.lastDisconnect?.error?.message || 'Desconhecido';

      console.warn(`[WA-DISCONNECTED] deviceId=${deviceId} - Motivo: ${reason}`);

      if (statusCode !== DisconnectReason.loggedOut) {
        console.log(`[WA-RECONNECT] Tentando reconectar deviceId=${deviceId}`);
        connections.set(deviceId, { client, status: 'reconnecting', deviceId, connection_name });
        setTimeout(() => {
          startConnection(deviceId, connection_name);
        }, 5000);
      } else {
        console.log(`[WA-LOGOUT] Sessão do deviceId=${deviceId} desconectada permanentemente.`);
        connections.set(deviceId, { client, status: 'loggedOut', deviceId, connection_name });
      }
    }

    if (update.qr) {
      qrCodes.set(deviceId, update.qr);
      console.log(`[WA-QR] QR Code string salvo via connection.update para deviceId=${deviceId}`);
    }
  });

  client.ev.on('creds.update', saveCreds);
  console.log('[WA-START] Eventos de conexão e credenciais configurados');

  // Sempre tentar gerar o QR code, independente do estado
  client.ev.on('qr', (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
      if (!err) {
        qrCodes.set(deviceId, url); // Salva o base64
        console.log(`[WA-QR] QR Code base64 salvo para deviceId=${deviceId}`);
      } else {
        console.error('[WA-QR] Erro ao gerar QR Code base64:', err);
      }
    });
  });

  client.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const message = messages[0];
      if (!message.key.fromMe && message.message) {
        const messageContent = message.message.conversation || 
                             message.message.extendedTextMessage?.text || 
                             message.message.imageMessage?.caption || 
                             '';
        
        const senderNumber = message.key.remoteJid.split('@')[0];
        const chatbot = getChatbot(senderNumber);

        if (chatbot && chatbot.isActive) {
          const response = await mistralService.generateResponse(messageContent, chatbot.personality);
          await client.sendMessage(message.key.remoteJid, { text: response });
        }
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  });

  return client;
};

// Função para gerar QR Code
const generateQR = async (client) => {
  return new Promise((resolve, reject) => {
    client.ev.on('qr', (qr) => {
      console.log('QR Code gerado');
      qrcode.toDataURL(qr, (err, url) => {
        if (err) {
          console.error('Erro ao gerar QR Code:', err);
          reject(err);
        }
        resolve(url);
      });
    });
  });
};

// Função para criar nova conexão
const createNewConnection = async (deviceId, authFolder) => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);

    const client = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      browser: ['Chrome (Linux)', '', ''],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      retryRequestDelayMs: 250,
      markOnlineOnConnect: false,
      deviceId: deviceId
    });

    return { client, saveCreds };
  } catch (error) {
    console.error('Erro ao criar nova conexão:', error);
    throw error;
  }
};

// Rota para conectar ao WhatsApp
app.post('/api/whatsapp/connect', async (req, res) => {
  const { deviceId, connectionName } = req.body;
  console.log('[WA-CONNECT] Iniciando conexão para deviceId:', deviceId);

  if (!deviceId) {
    return res.status(400).json({ error: 'Parâmetro deviceId é obrigatório.' });
  }

  try {
    const existing = connections.get(deviceId);
    if (existing && (existing.status === 'connected' || existing.status === 'connecting')) {
      console.log('[WA-CONNECT] Dispositivo já está conectado:', deviceId);
      return res.status(200).json({ message: 'Dispositivo já conectado', deviceId });
    }

    console.log('[WA-CONNECT] Iniciando nova conexão para:', deviceId);
    const client = await startConnection(deviceId, connectionName);

    // Gerar QR code e enviar na resposta
    console.log('[WA-CONNECT] Aguardando geração do QR code...');
    const qrPromise = new Promise((resolve) => {
      client.ev.on('qr', async (qr) => {
        console.log('[WA-CONNECT] QR code recebido');
        resolve({ qr, status: 'pending' });
      });

      // Adicionar timeout para o evento QR
      setTimeout(() => {
        console.log('[WA-CONNECT] Timeout aguardando QR code');
        resolve(null);
      }, 30000);
    });

    const result = await qrPromise;
    console.log('[WA-CONNECT] Resultado da geração do QR code:', result ? 'Sucesso' : 'Falha');

    if (result && result.qr) {
      console.log('[WA-CONNECT] Enviando QR code para o cliente');
      return res.status(200).json({ 
        message: 'QR Code gerado', 
        deviceId,
        qr: result.qr,
        status: result.status
      });
    } else {
      console.log('[WA-CONNECT] Nenhum QR code gerado, enviando resposta padrão');
      return res.status(200).json({ 
        message: 'Conexão iniciada, aguardando QR Code', 
        deviceId,
        status: 'connecting'
      });
    }
  } catch (err) {
    console.error(`[WA-CONNECT-ERROR] Erro ao conectar ${deviceId}:`, err);
    return res.status(500).json({ error: 'Erro ao conectar WhatsApp', details: err.message });
  }
});

// Rota para verificar status da conexão
app.get('/api/whatsapp/status/:deviceId', (req, res) => {
  try {
    const { deviceId } = req.params;
    console.log('Verificando status para dispositivo:', deviceId);

    if (!deviceId) {
      return res.status(400).json({ error: 'ID do dispositivo não fornecido' });
    }

    const connection = connections.get(deviceId);

    if (!connection) {
      console.log('Conexão não encontrada para dispositivo:', deviceId);
      return res.status(404).json({ error: 'Conexão não encontrada' });
    }

    console.log('Status da conexão:', connection.status);
    return res.status(200).json({
      status: connection.status,
      deviceId: connection.deviceId
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return res.status(500).json({
      error: 'Erro ao verificar status da conexão',
      details: error.message
    });
  }
});

// Rota para listar dispositivos conectados
app.get('/api/whatsapp/devices', (req, res) => {
  try {
    const devices = Array.from(connections.entries()).map(([deviceId, connection]) => ({
      deviceId,
      status: connection.status,
      connection_name: connection.connection_name || null
    }));

    return res.status(200).json({ devices });
  } catch (error) {
    console.error('Erro ao listar dispositivos:', error);
    return res.status(500).json({
      error: 'Erro ao listar dispositivos',
      details: error.message
    });
  }
});

// Rota para enviar mensagem
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { deviceId, number, message, imagemUrl, caption } = req.body;
    console.log('[SEND] Requisição recebida:', { deviceId, number, message, imagemUrl, caption });

    if (!deviceId || !number || (!message && !imagemUrl)) {
      console.error('[SEND] Parâmetros inválidos:', { deviceId, number, message, imagemUrl });
      return res.status(400).json({
        error: 'Parâmetros inválidos',
        details: 'deviceId, number e message ou imageUrl são obrigatórios'
      });
    }

    const connection = connections.get(deviceId);
    if (!connection) {
      console.error('[SEND] Dispositivo não encontrado:', deviceId);
      return res.status(404).json({ error: 'Dispositivo não encontrado' });
    }

    // Formata o número para o padrão desejado
    const formattedNumberRaw = formatPhoneNumber(number);
    const formattedNumber = formattedNumberRaw.includes('@s.whatsapp.net')
      ? formattedNumberRaw
      : `${formattedNumberRaw}@s.whatsapp.net`;

    // Chave única para controle de duplicatas
    const sendKey = `${deviceId}_${formattedNumber}`;
    
    // Verifica se já existe um envio em andamento para este número
    if (pendingSends.has(sendKey)) {
      console.log(`[SEND] Envio em andamento para ${formattedNumber}, aguardando...`);
      try {
        const result = await pendingSends.get(sendKey);
        return res.status(200).json(result);
      } catch (error) {
        pendingSends.delete(sendKey);
        console.error(`[SEND] Erro no envio anterior para ${formattedNumber}:`, error);
      }
    }

    // Verifica se houve um envio recente (últimos 5 segundos)
    const now = Date.now();
    const lastSend = recentSends.get(sendKey);
    if (lastSend && (now - lastSend) < 5000) {
      console.log(`[SEND] Envio muito recente para ${formattedNumber}, rejeitando...`);
      return res.status(429).json({
        error: 'Envio muito frequente',
        details: 'Aguarde alguns segundos antes de tentar novamente'
      });
    }

    // Cria uma Promise para controlar o envio
    const sendPromise = (async () => {
      try {
        // Verifica se o número tem WhatsApp
        const exists = await connection.client.onWhatsApp(formattedNumber);
        console.log('[SEND] Resultado onWhatsApp:', exists);
        if (!exists || !exists[0]?.exists) {
          console.error('[SEND] Número não possui WhatsApp:', formattedNumberRaw);
          throw new Error('O número informado não possui WhatsApp.');
        }

        let result;

        if (imagemUrl) {
          // Baixa imagem da URL
          console.log('[SEND] Baixando imagem da URL:', imagemUrl);
          const response = await axios.get(imagemUrl, { responseType: 'arraybuffer' });
          const imageBuffer = Buffer.from(response.data, 'binary');

          result = await connection.client.sendMessage(formattedNumber, {
            image: imageBuffer,
            caption: caption || message || '',
          });
          console.log('[SEND] Mensagem com imagem enviada:', result);
        } else {
          result = await connection.client.sendMessage(formattedNumber, { text: message });
          console.log('[SEND] Mensagem de texto enviada:', result);
        }

        // Registra o envio bem-sucedido
        recentSends.set(sendKey, now);
        
        return {
          success: true,
          messageId: result.key.id
        };
      } catch (error) {
        console.error('[SEND] Erro durante envio:', error);
        throw error;
      } finally {
        // Remove da lista de envios pendentes
        pendingSends.delete(sendKey);
      }
    })();

    // Armazena a Promise para evitar envios duplicados
    pendingSends.set(sendKey, sendPromise);

    // Aguarda o resultado
    const result = await sendPromise;
    return res.status(200).json(result);
  } catch (error) {
    console.error('[SEND] Erro ao enviar mensagem:', error);
    return res.status(500).json({
      error: 'Erro ao enviar mensagem',
      details: error.message
    });
  }
});

// Endpoint para buscar o QR code atual
app.get('/api/whatsapp/qr/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  console.log('[DEBUG] Buscando QR para deviceId:', deviceId, 'Map keys:', Array.from(qrCodes.keys()));
  const qr = qrCodes.get(deviceId);
  if (qr) {
    return res.json({ qr });
  }
  console.log('[DEBUG] QR code não encontrado para deviceId:', deviceId);
  return res.status(404).json({ error: 'QR code não encontrado' });
});

// Rota para deletar sessão
app.delete('/api/whatsapp/session/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const authFolder = path.join(__dirname, 'auth', deviceId);

  // Verifica se a pasta existe antes de tentar deletar
  if (!fs.existsSync(authFolder)) {
    qrCodes.delete(deviceId);
    connections.delete(deviceId);
    return res.json({ message: 'Sessão já removida (pasta não existe)' });
  }

  rimraf(authFolder, (err) => {
    if (err) {
      console.error('Erro ao deletar sessão:', err, 'Pasta:', authFolder);
      return res.status(500).json({ error: 'Erro ao deletar sessão', details: err.message });
    }
    qrCodes.delete(deviceId);
    connections.delete(deviceId);
    return res.json({ message: 'Sessão deletada com sucesso' });
  });
});

// Adicionar novas rotas para gerenciar chatbots
app.post('/api/chatbots', (req, res) => {
  const { phoneNumber, name, personality } = req.body;
  
  if (!phoneNumber || !name || !personality) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  setChatbot(phoneNumber, { name, personality });
  res.json({ message: 'Chatbot configurado com sucesso' });
});

app.delete('/api/chatbots/:phoneNumber', (req, res) => {
  const { phoneNumber } = req.params;
  removeChatbot(phoneNumber);
  res.json({ message: 'Chatbot removido com sucesso' });
});

app.patch('/api/chatbots/:phoneNumber/toggle', (req, res) => {
  const { phoneNumber } = req.params;
  const { isActive } = req.body;
  
  toggleChatbot(phoneNumber, isActive);
  res.json({ message: `Chatbot ${isActive ? 'ativado' : 'desativado'} com sucesso` });
});

app.get('/api/chatbots', (req, res) => {
  const chatbots = listChatbots();
  res.json(chatbots);
});

// Rota para listar agentes da Mistral via proxy seguro
app.get('/api/mistral/agents', async (req, res) => {
  try {
    const response = await axios.get('https://api.mistral.ai/v1/agents', {
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar agentes da Mistral:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao buscar agentes da Mistral' });
  }
});

// Rota para criar um agente na Mistral
app.post('/api/mistral/agents', async (req, res) => {
  try {
    const response = await axios.post('https://api.mistral.ai/v1/agents', req.body, {
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Erro ao criar agente na Mistral:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao criar agente na Mistral' });
  }
});

// Rota para listar modelos da Mistral
app.get('/api/mistral/models', async (req, res) => {
  try {
    const response = await axios.get('https://api.mistral.ai/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar modelos da Mistral:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao buscar modelos da Mistral' });
  }
});

// Função para limpar cache de envios recentes (remove entradas mais antigas que 1 hora)
function cleanupRecentSends() {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  
  let cleanedCount = 0;
  for (const [key, timestamp] of recentSends.entries()) {
    if (timestamp < oneHourAgo) {
      recentSends.delete(key);
      cleanedCount++;
    }
  }
  
  console.log(`[CLEANUP] Cache limpo. ${cleanedCount} entradas removidas. Restantes: ${recentSends.size}`);
}

// Limpa o cache a cada 30 minutos
setInterval(cleanupRecentSends, 30 * 60 * 1000);

// Rota para debug - verificar status dos caches
app.get('/api/debug/caches', (req, res) => {
  try {
    const now = Date.now();
    const pendingSendsArray = Array.from(pendingSends.entries()).map(([key, promise]) => ({
      key,
      status: 'pending'
    }));
    
    const recentSendsArray = Array.from(recentSends.entries()).map(([key, timestamp]) => ({
      key,
      timestamp,
      ageSeconds: Math.floor((now - timestamp) / 1000)
    }));
    
    return res.status(200).json({
      pendingSends: {
        count: pendingSends.size,
        items: pendingSendsArray
      },
      recentSends: {
        count: recentSends.size,
        items: recentSendsArray
      },
      connections: {
        count: connections.size,
        devices: Array.from(connections.keys())
      }
    });
  } catch (error) {
    console.error('Erro ao obter status dos caches:', error);
    return res.status(500).json({
      error: 'Erro ao obter status dos caches',
      details: error.message
    });
  }
});

// Rota para servir o frontend em todas as outras rotas
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
}); 
