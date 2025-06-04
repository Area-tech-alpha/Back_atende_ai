require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const rimraf = require('rimraf');

// Polyfill para o crypto no ambiente do Railway
if (typeof global.crypto === 'undefined') {
  global.crypto = crypto;
}

const app = express();
const port = process.env.PORT || 3001;

// Configuração do CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'dist')));

// Armazenar conexões ativas
const connections = new Map();
const qrCodes = new Map(); // deviceId -> qr string

function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  // Remove o nono dígito se for celular do Brasil (ex: 5561999999999 vira 55619999999)
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    // 55 + DDD (2) + 9 + número (8)
    cleaned = cleaned.slice(0, 5) + cleaned.slice(6);
  }
  return cleaned;
}

const startConnection = async (deviceId, connection_name) => {
  console.log('[WA-START] Iniciando conexão para deviceId:', deviceId);
  const authFolder = path.join(__dirname, 'auth', deviceId);
  // Remover pasta de autenticação antes de criar o socket
  if (fs.existsSync(authFolder)) {
    rimraf.sync(authFolder);
    qrCodes.delete(deviceId);
    connections.delete(deviceId);
    console.log('[WA-START] Sessão antiga removida para deviceId:', deviceId);
  }
  fs.mkdirSync(authFolder, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  console.log('[WA-START] Estado de autenticação carregado:', state.creds ? 'Autenticado' : 'Não autenticado');

  // Criar o socket SEM printar QR no terminal
  const client = makeWASocket({
    auth: state,
    printQRInTerminal: true, // Para garantir que o evento 'qr' seja disparado
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

  // Captura o QR Code
  client.ev.on('qr', (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
      if (!err) {
        const prevData = qrCodes.get(deviceId) || {};
        qrCodes.set(deviceId, { ...prevData, qr: url });
        console.log(`[WA-QR] QR Code base64 salvo para deviceId=${deviceId}`);
      } else {
        console.error('[WA-QR] Erro ao gerar QR Code base64:', err);
      }
    });
  });

  // Se não estiver registrado, gere o pairing code imediatamente
  if (!state.creds.registered) {
    try {
      // deviceId é o número do telefone puro (ex: 556199999999)
      const pairingCode = await client.requestPairingCode(deviceId);
      const prevData = qrCodes.get(deviceId) || {};
      qrCodes.set(deviceId, { ...prevData, pairingCode });
      console.log(`[WA-PAIRING] Código de pareamento gerado para ${deviceId}: ${pairingCode}`);
    } catch (error) {
      console.error('[WA-PAIRING] Erro ao gerar código de pareamento:', error);
    }
  } else {
    console.log('[WA-PAIRING] Sessão já autenticada, não é possível gerar novo pairing code.');
  }

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
      qrCodes.set(deviceId, { type: 'qr', code: update.qr });
      console.log(`[WA-QR] QR Code string salvo via connection.update para deviceId=${deviceId}`);
    }
  });

  client.ev.on('creds.update', saveCreds);
  console.log('[WA-START] Eventos de conexão e credenciais configurados');

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
  const { deviceId, connectionName, mode } = req.body; // mode: 'qr' ou 'pairing'
  console.log('[WA-CONNECT] Iniciando conexão para deviceId:', deviceId, 'modo:', mode);

  if (!deviceId) {
    return res.status(400).json({ error: 'Parâmetro deviceId é obrigatório.' });
  }
  if (!mode || (mode !== 'qr' && mode !== 'pairing')) {
    return res.status(400).json({ error: 'Parâmetro mode é obrigatório (qr ou pairing).' });
  }

  try {
    const authFolder = path.join(__dirname, 'auth', deviceId);
    // Se já existe sessão, remove antes de criar nova
    if (fs.existsSync(authFolder)) {
      rimraf.sync(authFolder);
      qrCodes.delete(deviceId);
      connections.delete(deviceId);
      console.log('[WA-CONNECT] Sessão antiga removida para deviceId:', deviceId);
    }
    fs.mkdirSync(authFolder, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const client = makeWASocket({
      auth: state,
      printQRInTerminal: mode === 'qr',
      browser: ['Chrome (Linux)', '', ''],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      retryRequestDelayMs: 250,
      markOnlineOnConnect: false,
      deviceId: deviceId
    });
    const prev = connections.get(deviceId);
    const nameToSave = connectionName || (prev && prev.connection_name);
    connections.set(deviceId, { client, status: 'connecting', deviceId, connection_name: nameToSave });
    console.log('[WA-START] Cliente criado e adicionado ao mapa de conexões');

    if (!state.creds.registered) {
      if (mode === 'pairing') {
        try {
          const pairingCode = await client.requestPairingCode(deviceId);
          qrCodes.set(deviceId, { pairingCode });
          console.log(`[WA-PAIRING] Código de pareamento gerado para ${deviceId}: ${pairingCode}`);
        } catch (error) {
          console.error('[WA-PAIRING] Erro ao gerar código de pareamento:', error);
        }
      }
      // Se for modo QR, não faz nada, só espera o evento 'qr'
    }

    client.ev.on('qr', (qr) => {
      if (mode === 'qr') {
        qrcode.toDataURL(qr, (err, url) => {
          if (!err) {
            qrCodes.set(deviceId, { qr: url });
            console.log(`[WA-QR] QR Code base64 salvo para deviceId=${deviceId}`);
          } else {
            console.error('[WA-QR] Erro ao gerar QR Code base64:', err);
          }
        });
      }
    });

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
        qrCodes.set(deviceId, { type: 'qr', code: update.qr });
        console.log(`[WA-QR] QR Code string salvo via connection.update para deviceId=${deviceId}`);
      }
    });

    client.ev.on('creds.update', saveCreds);
    console.log('[WA-START] Eventos de conexão e credenciais configurados');
    return res.status(200).json({ message: 'Conexão iniciada', deviceId, status: 'connecting' });
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

    // Verifica se o número tem WhatsApp
    const exists = await connection.client.onWhatsApp(formattedNumber);
    console.log('[SEND] Resultado onWhatsApp:', exists);
    if (!exists || !exists[0]?.exists) {
      console.error('[SEND] Número não possui WhatsApp:', formattedNumberRaw);
      return res.status(400).json({ error: 'O número informado não possui WhatsApp.' });
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

    return res.status(200).json({
      success: true,
      messageId: result.key.id
    });
  } catch (error) {
    console.error('[SEND] Erro ao enviar mensagem:', error);
    return res.status(500).json({
      error: 'Erro ao enviar mensagem',
      details: error.message
    });
  }
});

// Endpoint para buscar o QR code ou Pairing Code atual
app.get('/api/whatsapp/qr/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const qrData = qrCodes.get(deviceId) || {};
  if (qrData.qr) {
    return res.json({ qr: qrData.qr });
  }
  if (qrData.pairingCode) {
    return res.json({ pairingCode: qrData.pairingCode });
  }
  return res.status(404).json({ error: 'QR code ou Pairing Code não encontrado' });
});

// Rota para deletar sessão
app.delete('/api/whatsapp/session/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const authFolder = path.join(__dirname, 'auth', deviceId);
  rimraf(authFolder, (err) => {
    if (err) {
      console.error('Erro ao deletar sessão:', err);
      return res.status(500).json({ error: 'Erro ao deletar sessão' });
    }
    qrCodes.delete(deviceId);
    connections.delete(deviceId);
    return res.json({ message: 'Sessão deletada com sucesso' });
  });
});

// Rota para servir o frontend em todas as outras rotas
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
}); 