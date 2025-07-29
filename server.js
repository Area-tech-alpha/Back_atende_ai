import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import {
  useMultiFileAuthState,
  DisconnectReason,
  makeWASocket,
  isJidBroadcast,
} from "@whiskeysockets/baileys";
import Boom from "@hapi/boom";
import qrcode from "qrcode";
import fs from "fs";
import path from "path";
import axios from "axios";
import crypto from "crypto";
import { rimraf } from "rimraf";
import mistralService from "./src/services/mistralService.js";
import {
  setChatbot,
  removeChatbot,
  toggleChatbot,
  getChatbot,
  listChatbots,
} from "./src/config/chatbots.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Polyfill para o crypto no ambiente do Railway
if (typeof global.crypto === "undefined") {
  global.crypto = crypto;
}

const app = express();
const port = process.env.PORT || 3001;

// Configuração do CORS
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "*",
      "http://localhost:4000",
      "https://lionchat.tech",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, "dist")));

// Armazenar conexões ativas
const connections = new Map();
const qrCodes = new Map(); // deviceId -> qr string

// Cache para controlar envios em andamento e evitar duplicatas
const pendingSends = new Map(); // deviceId_number -> Promise
const recentSends = new Map(); // deviceId_number -> timestamp

// Sistema de controle de reconexões
const reconnectionAttempts = new Map(); // deviceId -> { count, lastAttempt, backoff }
const MAX_RECONNECTION_ATTEMPTS = 5;
const INITIAL_BACKOFF = 5000; // 5 segundos
const MAX_BACKOFF = 300000; // 5 minutos

function getReconnectionDelay(deviceId) {
  const attempts = reconnectionAttempts.get(deviceId) || { count: 0, backoff: INITIAL_BACKOFF };
  
  if (attempts.count >= MAX_RECONNECTION_ATTEMPTS) {
    console.log(`[WA-RECONNECT] DeviceId=${deviceId} atingiu limite máximo de tentativas. Aguardando 30 minutos...`);
    return 1800000; // 30 minutos
  }
  
  // Backoff exponencial
  const delay = Math.min(attempts.backoff * Math.pow(2, attempts.count), MAX_BACKOFF);
  return delay;
}

function incrementReconnectionAttempt(deviceId) {
  const attempts = reconnectionAttempts.get(deviceId) || { count: 0, backoff: INITIAL_BACKOFF };
  attempts.count++;
  attempts.lastAttempt = Date.now();
  attempts.backoff = Math.min(attempts.backoff * 2, MAX_BACKOFF);
  reconnectionAttempts.set(deviceId, attempts);
  
  console.log(`[WA-RECONNECT] Tentativa ${attempts.count}/${MAX_RECONNECTION_ATTEMPTS} para deviceId=${deviceId}`);
}

function resetReconnectionAttempts(deviceId) {
  reconnectionAttempts.delete(deviceId);
  console.log(`[WA-RECONNECT] Reset de tentativas para deviceId=${deviceId}`);
}

function formatPhoneNumber(phone) {
  // Remove todos os caracteres não numéricos
  let cleaned = phone.replace(/\D/g, "");

  // Se não começar com 55, adiciona
  if (!cleaned.startsWith("55")) {
    cleaned = "55" + cleaned;
  }

  // Se o número tiver 13 dígitos (55 + DDD + 9 + número), remove o 9
  // Mantém os 4 primeiros (55 + DDD) e os últimos 8 dígitos
  if (cleaned.length === 13 && cleaned.startsWith("55")) {
    // 55 + DDD (2) + 9 + número (8)
    // Queremos: 55 + DDD (2) + número (8)
    cleaned = cleaned.slice(0, 4) + cleaned.slice(5);
  }

  return cleaned;
}

const startConnection = async (deviceId, connection_name) => {
  console.log("[WA-START] Iniciando conexão para deviceId:", deviceId);
  
  const authFolder = path.join(__dirname, "auth", deviceId);
  
  // Verificar se a pasta existe e tem dados válidos
  if (fs.existsSync(authFolder)) {
    console.log("[WA-START] Pasta de autenticação encontrada para deviceId:", deviceId);
    
    // Verificar se há arquivos de credenciais
    const credsFile = path.join(authFolder, "creds.json");
    if (fs.existsSync(credsFile)) {
      try {
        const credsData = JSON.parse(fs.readFileSync(credsFile, 'utf8'));
        if (credsData.me && credsData.me.id) {
          console.log("[WA-START] Credenciais válidas encontradas para deviceId:", deviceId);
        } else {
          console.log("[WA-START] Credenciais inválidas, removendo pasta de autenticação");
          fs.rmSync(authFolder, { recursive: true, force: true });
          fs.mkdirSync(authFolder, { recursive: true });
        }
      } catch (error) {
        console.log("[WA-START] Erro ao ler credenciais, removendo pasta de autenticação");
        fs.rmSync(authFolder, { recursive: true, force: true });
        fs.mkdirSync(authFolder, { recursive: true });
      }
    } else {
      console.log("[WA-START] Arquivo de credenciais não encontrado, criando nova pasta");
      fs.rmSync(authFolder, { recursive: true, force: true });
      fs.mkdirSync(authFolder, { recursive: true });
    }
  } else {
    console.log("[WA-START] Criando nova pasta de autenticação para deviceId:", deviceId);
    fs.mkdirSync(authFolder, { recursive: true });
  }

  try {
    console.log("[WA-START] Carregando estado de autenticação...");
    
    // Verificar se há dados corrompidos antes de carregar
    try {
      const credsFile = path.join(authFolder, 'creds.json');
      if (fs.existsSync(credsFile)) {
        const credsData = JSON.parse(fs.readFileSync(credsFile, 'utf8'));
        if (!credsData.me || !credsData.me.id) {
          console.log("[WA-START] Credenciais corrompidas detectadas, removendo pasta...");
          fs.rmSync(authFolder, { recursive: true, force: true });
          fs.mkdirSync(authFolder, { recursive: true });
        } else {
          console.log("[WA-START] Credenciais válidas encontradas, mantendo pasta...");
        }
      } else {
        console.log("[WA-START] Arquivo de credenciais não encontrado, será criado novo...");
      }
    } catch (error) {
      console.log("[WA-START] Erro ao verificar credenciais, removendo pasta...");
      fs.rmSync(authFolder, { recursive: true, force: true });
      fs.mkdirSync(authFolder, { recursive: true });
    }
    
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    console.log(
      "[WA-START] Estado de autenticação carregado:",
      state.creds ? "Autenticado" : "Não autenticado"
    );

    console.log("[WA-START] Criando cliente Baileys...");
    console.log(`[WA-START] Configurações para deviceId=${deviceId}:`, {
      version: [2, 2323, 4],
      syncFullHistory: false,
      fireInitQueries: true,
      emitOwnEvents: false,
      generateHighQualityLinkPreview: false
    });
    const client = makeWASocket({
      auth: state,
      browser: ["Chrome (Linux)", "", ""],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      retryRequestDelayMs: 250,
      markOnlineOnConnect: false,
      deviceId: deviceId,
      // Configurações otimizadas para versão 6.7.18
      version: [2, 2323, 4], // Versão específica do WhatsApp
      syncFullHistory: false, // Não sincronizar histórico completo
      fireInitQueries: true,
      shouldIgnoreJid: jid => isJidBroadcast(jid),
      // Configurações adicionais para estabilidade
      emitOwnEvents: false,
      generateHighQualityLinkPreview: false,
      // Removido patchMessageBeforeSending - pode causar problemas na versão 6.7.18
    });

    // Sempre tenta preservar o nome já salvo, ou usa o novo
    const prev = connections.get(deviceId);
    const nameToSave = connection_name || (prev && prev.connection_name);
    connections.set(deviceId, {
      client,
      status: "connecting",
      deviceId,
      connection_name: nameToSave,
    });
    console.log("[WA-START] Cliente criado e adicionado ao mapa de conexões");

    client.ev.on("connection.update", async (update) => {
      console.log(`[WA-UPDATE] ${deviceId}:`, update);

      // Recupera o nome salvo, se existir
      const prev = connections.get(deviceId);
      const connection_name =
        prev && prev.connection_name ? prev.connection_name : undefined;

             if (update.connection === "open") {
         console.log(`[WA-CONNECTED] deviceId=${deviceId}`);
         connections.set(deviceId, {
           client,
           status: "connected",
           deviceId,
           connection_name,
         });
         // Reset de tentativas quando conecta com sucesso
         resetReconnectionAttempts(deviceId);
      } else if (update.connection === "close") {
        const statusCode = update.lastDisconnect?.error?.output?.statusCode;
        const reason = update.lastDisconnect?.error?.message || "Desconhecido";
        console.log(`[WA-DISCONNECT] deviceId=${deviceId}, statusCode=${statusCode}, reason=${reason}`);

                 // Se for erro de conexão (405), verificar se é necessário limpar autenticação
         if (statusCode === 405 || statusCode === 401) {
           console.log(`[WA-ERROR] Erro de autenticação detectado (${statusCode}). Verificando necessidade de limpeza...`);
           
           // Incrementar tentativa de reconexão
           incrementReconnectionAttempt(deviceId);
           
           // Verificar se as credenciais estão realmente corrompidas antes de limpar
           let shouldCleanup = false;
           try {
             const authFolder = path.join(__dirname, "auth", deviceId);
             const credsFile = path.join(authFolder, 'creds.json');
             
             if (fs.existsSync(credsFile)) {
               const credsData = JSON.parse(fs.readFileSync(credsFile, 'utf8'));
               if (!credsData.me || !credsData.me.id) {
                 console.log(`[WA-ERROR] Credenciais corrompidas detectadas para deviceId=${deviceId}`);
                 shouldCleanup = true;
               } else {
                 console.log(`[WA-ERROR] Credenciais válidas, mas erro de conexão. Tentando reconexão sem limpeza...`);
               }
             } else {
               console.log(`[WA-ERROR] Arquivo de credenciais não encontrado para deviceId=${deviceId}`);
               shouldCleanup = true;
             }
           } catch (error) {
             console.log(`[WA-ERROR] Erro ao verificar credenciais para deviceId=${deviceId}:`, error.message);
             shouldCleanup = true;
           }
           
           // Só limpar se realmente necessário
           if (shouldCleanup) {
             try {
               const authFolder = path.join(__dirname, "auth", deviceId);
               if (fs.existsSync(authFolder)) {
                 fs.rmSync(authFolder, { recursive: true, force: true });
                 console.log(`[WA-ERROR] Pasta de autenticação removida para deviceId=${deviceId}`);
               }
             } catch (error) {
               console.error(`[WA-ERROR] Erro ao limpar pasta de autenticação:`, error);
             }
           }
           
           // Remover do mapa de conexões
           connections.delete(deviceId);
           qrCodes.delete(deviceId);
           
           const delay = getReconnectionDelay(deviceId);
           const additionalDelay = 5000; // 5 segundos adicionais para estabilizar
           const totalDelay = delay + additionalDelay;
           console.log(`[WA-RECONNECT] Tentando reconectar deviceId=${deviceId} em ${totalDelay/1000} segundos...`);
           setTimeout(() => {
             startConnection(deviceId, connection_name);
           }, totalDelay);
                 } else if (statusCode !== DisconnectReason.loggedOut) {
           // Incrementar tentativa de reconexão para outros erros
           incrementReconnectionAttempt(deviceId);
           
           const delay = getReconnectionDelay(deviceId);
           const additionalDelay = 3000; // 3 segundos adicionais para outros erros
           const totalDelay = delay + additionalDelay;
           console.log(`[WA-RECONNECT] Tentando reconectar deviceId=${deviceId} em ${totalDelay/1000} segundos...`);
           setTimeout(() => {
             startConnection(deviceId, connection_name);
           }, totalDelay);
        } else {
          console.log(
            `[WA-LOGOUT] Sessão do deviceId=${deviceId} desconectada permanentemente. Limpando dados de autenticação...`
          );
          
          // Limpar dados de autenticação quando loggedOut
          try {
            const authFolder = path.join(__dirname, "auth", deviceId);
            if (fs.existsSync(authFolder)) {
              fs.rmSync(authFolder, { recursive: true, force: true });
              console.log(`[WA-LOGOUT] Pasta de autenticação removida para deviceId=${deviceId}`);
            }
          } catch (error) {
            console.error(`[WA-LOGOUT] Erro ao limpar pasta de autenticação:`, error);
          }
          
          // Remover do mapa de conexões
          connections.delete(deviceId);
          qrCodes.delete(deviceId);
          
          console.log(`[WA-LOGOUT] DeviceId=${deviceId} removido dos mapas de conexão`);
        }
      }

      if (update.qr) {
        qrCodes.set(deviceId, update.qr);
        console.log(
          `[WA-QR] QR Code string salvo via connection.update para deviceId=${deviceId}`
        );
      }
    });

    client.ev.on("creds.update", saveCreds);
    console.log("[WA-START] Eventos de conexão e credenciais configurados");

    // Adicionar logs para eventos de estado
    client.ev.on("state", (state) => {
      console.log(`[WA-STATE] ${deviceId}: Estado atualizado:`, state);
    });

    // Adicionar logs para eventos de sincronização
    client.ev.on("sync", (sync) => {
      console.log(`[WA-SYNC] ${deviceId}: Sincronização:`, sync);
    });

    // Sempre tentar gerar o QR code, independente do estado
    client.ev.on("qr", (qr) => {
      qrcode.toDataURL(qr, (err, url) => {
        if (!err) {
          qrCodes.set(deviceId, url); // Salva o base64
          console.log(`[WA-QR] QR Code base64 salvo para deviceId=${deviceId}`);
        } else {
          console.error("[WA-QR] Erro ao gerar QR Code base64:", err);
        }
      });
    });

    client.ev.on("messages.upsert", async ({ messages }) => {
      try {
        const message = messages[0];
        if (!message.key.fromMe && message.message) {
          const messageContent =
            message.message.conversation ||
            message.message.extendedTextMessage?.text ||
            message.message.imageMessage?.caption ||
            "";

          const senderNumber = message.key.remoteJid.split("@")[0];
          const chatbot = getChatbot(senderNumber);

          if (chatbot && chatbot.isActive) {
            const response = await mistralService.generateResponse(
              messageContent,
              chatbot.personality
            );
            await client.sendMessage(message.key.remoteJid, { text: response });
          }
        }
      } catch (error) {
        console.error("Erro ao processar mensagem:", error);
      }
    });

    return client;
  } catch (error) {
    console.error(`[WA-START-ERROR] Erro ao iniciar conexão para deviceId=${deviceId}:`, error);
    
    // Limpar pasta de autenticação em caso de erro
    try {
      if (fs.existsSync(authFolder)) {
        fs.rmSync(authFolder, { recursive: true, force: true });
        console.log(`[WA-START-ERROR] Pasta de autenticação limpa para deviceId=${deviceId}`);
      }
    } catch (cleanupError) {
      console.error(`[WA-START-ERROR] Erro ao limpar pasta de autenticação:`, cleanupError);
    }
    
    throw error;
  }
};

// Função para gerar QR Code
const generateQR = async (client) => {
  return new Promise((resolve, reject) => {
    client.ev.on("qr", (qr) => {
      console.log("QR Code gerado");
      qrcode.toDataURL(qr, (err, url) => {
        if (err) {
          console.error("Erro ao gerar QR Code:", err);
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
      browser: ["Chrome (Linux)", "", ""],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      retryRequestDelayMs: 250,
      markOnlineOnConnect: false,
      deviceId: deviceId,
    });

    return { client, saveCreds };
  } catch (error) {
    console.error("Erro ao criar nova conexão:", error);
    throw error;
  }
};

// Rota para conectar ao WhatsApp
app.post("/api/whatsapp/connect", async (req, res) => {
  const { deviceId, connectionName } = req.body;
  console.log("[WA-CONNECT] Iniciando conexão para deviceId:", deviceId);

  if (!deviceId) {
    return res.status(400).json({ error: "Parâmetro deviceId é obrigatório." });
  }

  try {
    const existing = connections.get(deviceId);
    if (
      existing &&
      (existing.status === "connected" || existing.status === "connecting")
    ) {
      console.log("[WA-CONNECT] Dispositivo já está conectado:", deviceId);
      return res
        .status(200)
        .json({ message: "Dispositivo já conectado", deviceId });
    }

    console.log("[WA-CONNECT] Iniciando nova conexão para:", deviceId);
    const client = await startConnection(deviceId, connectionName);

    // Gerar QR code e enviar na resposta
    console.log("[WA-CONNECT] Aguardando geração do QR code...");
    const qrPromise = new Promise((resolve) => {
      client.ev.on("qr", async (qr) => {
        console.log("[WA-CONNECT] QR code recebido");
        resolve({ qr, status: "pending" });
      });

      // Adicionar timeout para o evento QR
      setTimeout(() => {
        console.log("[WA-CONNECT] Timeout aguardando QR code");
        resolve(null);
      }, 30000);
    });

    const result = await qrPromise;
    console.log(
      "[WA-CONNECT] Resultado da geração do QR code:",
      result ? "Sucesso" : "Falha"
    );

    if (result && result.qr) {
      console.log("[WA-CONNECT] Enviando QR code para o cliente");
      return res.status(200).json({
        message: "QR Code gerado",
        deviceId,
        qr: result.qr,
        status: result.status,
      });
    } else {
      console.log(
        "[WA-CONNECT] Nenhum QR code gerado, enviando resposta padrão"
      );
      return res.status(200).json({
        message: "Conexão iniciada, aguardando QR Code",
        deviceId,
        status: "connecting",
      });
    }
  } catch (err) {
    console.error(`[WA-CONNECT-ERROR] Erro ao conectar ${deviceId}:`, err);
    return res
      .status(500)
      .json({ error: "Erro ao conectar WhatsApp", details: err.message });
  }
});

// Rota para verificar status da conexão
app.get("/api/whatsapp/status/:deviceId", (req, res) => {
  try {
    const { deviceId } = req.params;
    console.log("Verificando status para dispositivo:", deviceId);

    if (!deviceId) {
      return res.status(400).json({ error: "ID do dispositivo não fornecido" });
    }

    const connection = connections.get(deviceId);

    if (!connection) {
      console.log("Conexão não encontrada para dispositivo:", deviceId);
      return res.status(404).json({ error: "Conexão não encontrada" });
    }

    console.log("Status da conexão:", connection.status);
    return res.status(200).json({
      status: connection.status,
      deviceId: connection.deviceId,
    });
  } catch (error) {
    console.error("Erro ao verificar status:", error);
    return res.status(500).json({
      error: "Erro ao verificar status da conexão",
      details: error.message,
    });
  }
});

// Rota para listar dispositivos conectados
app.get("/api/whatsapp/devices", (req, res) => {
  try {
    const devices = Array.from(connections.entries()).map(
      ([deviceId, connection]) => ({
        deviceId,
        status: connection.status,
        connection_name: connection.connection_name || null,
      })
    );

    return res.status(200).json({ devices });
  } catch (error) {
    console.error("Erro ao listar dispositivos:", error);
    return res.status(500).json({
      error: "Erro ao listar dispositivos",
      details: error.message,
    });
  }
});

// Rota para limpar dados de autenticação de um dispositivo
app.delete("/api/whatsapp/devices/:deviceId/auth", (req, res) => {
  try {
    const { deviceId } = req.params;
    
    if (!deviceId) {
      return res.status(400).json({ error: "ID do dispositivo não fornecido" });
    }

    // Limpar pasta de autenticação
    const authFolder = path.join(__dirname, "auth", deviceId);
    if (fs.existsSync(authFolder)) {
      fs.rmSync(authFolder, { recursive: true, force: true });
      console.log(`[CLEANUP] Pasta de autenticação removida para deviceId=${deviceId}`);
    }

    // Remover dos mapas
    connections.delete(deviceId);
    qrCodes.delete(deviceId);

    return res.status(200).json({ 
      message: "Dados de autenticação limpos com sucesso",
      deviceId 
    });
  } catch (error) {
    console.error("Erro ao limpar dados de autenticação:", error);
    return res.status(500).json({
      error: "Erro ao limpar dados de autenticação",
      details: error.message,
    });
  }
});

// Rota para enviar mensagem
app.post("/api/whatsapp/send", async (req, res) => {
  try {
    const { deviceId, number, message, imagemUrl, caption } = req.body;
    console.log("[SEND] Requisição recebida:", {
      deviceId,
      number,
      message,
      imagemUrl,
      caption,
    });

    if (!deviceId || !number || (!message && !imagemUrl)) {
      console.error("[SEND] Parâmetros inválidos:", {
        deviceId,
        number,
        message,
        imagemUrl,
      });
      return res.status(400).json({
        error: "Parâmetros inválidos",
        details: "deviceId, number e message ou imageUrl são obrigatórios",
      });
    }

    console.log("[SEND] Verificando conexão para deviceId:", deviceId);
    const connection = connections.get(deviceId);
    if (!connection) {
      console.error("[SEND] Dispositivo não encontrado:", deviceId);
      return res.status(404).json({ error: "Dispositivo não encontrado" });
    }

    console.log("[SEND] Status da conexão:", connection.status);
    if (connection.status !== "connected") {
      console.error("[SEND] Conexão não está conectada. Status:", connection.status);
      return res.status(400).json({ 
        error: "Conexão não está pronta", 
        details: `Status atual: ${connection.status}` 
      });
    }

    // Formata o número para o padrão desejado
    console.log("[SEND] Número original:", number);
    const formattedNumberRaw = formatPhoneNumber(number);
    console.log("[SEND] Número formatado:", formattedNumberRaw);
    const formattedNumber = formattedNumberRaw.includes("@s.whatsapp.net")
      ? formattedNumberRaw
      : `${formattedNumberRaw}@s.whatsapp.net`;
    console.log("[SEND] Número final para envio:", formattedNumber);

    // Chave única para controle de duplicatas
    const sendKey = `${deviceId}_${formattedNumber}`;
    console.log("[SEND] Chave de controle:", sendKey);

    // Verifica se já existe um envio em andamento para este número
    if (pendingSends.has(sendKey)) {
      console.log(
        `[SEND] Envio em andamento para ${formattedNumber}, aguardando...`
      );
      try {
        const result = await pendingSends.get(sendKey);
        return res.status(200).json(result);
      } catch (error) {
        pendingSends.delete(sendKey);
        console.error(
          `[SEND] Erro no envio anterior para ${formattedNumber}:`,
          error
        );
      }
    }

    // Verifica se houve um envio recente (últimos 5 segundos)
    const now = Date.now();
    const lastSend = recentSends.get(sendKey);
    if (lastSend && now - lastSend < 5000) {
      console.log(
        `[SEND] Envio muito recente para ${formattedNumber}, rejeitando...`
      );
      return res.status(429).json({
        error: "Envio muito frequente",
        details: "Aguarde alguns segundos antes de tentar novamente",
      });
    }

    // Cria uma Promise para controlar o envio
    const sendPromise = (async () => {
      try {
        console.log("[SEND] Iniciando verificação se número tem WhatsApp...");
        // Verifica se o número tem WhatsApp - compatível com versão 6.7.18
        try {
          const exists = await connection.client.onWhatsApp(formattedNumber);
          console.log("[SEND] Resultado onWhatsApp:", exists);
          if (!exists || !exists[0]?.exists) {
            console.error(
              "[SEND] Número não possui WhatsApp:",
              formattedNumberRaw
            );
            throw new Error("O número informado não possui WhatsApp.");
          }
        } catch (error) {
          console.log("[SEND] Erro ao verificar WhatsApp, continuando envio...", error.message);
          // Em caso de erro na verificação, continua com o envio
        }

        console.log("[SEND] Número possui WhatsApp, preparando envio...");
        let result;

        if (imagemUrl) {
          // Baixa imagem da URL
          console.log("[SEND] Baixando imagem da URL:", imagemUrl);
          const response = await axios.get(imagemUrl, {
            responseType: "arraybuffer",
          });
          const imageBuffer = Buffer.from(response.data, "binary");
          console.log("[SEND] Imagem baixada, tamanho:", imageBuffer.length, "bytes");

          console.log("[SEND] Enviando mensagem com imagem...");
          result = await connection.client.sendMessage(formattedNumber, {
            image: imageBuffer,
            caption: caption || message || "",
          });
          console.log("[SEND] Mensagem com imagem enviada:", result);
        } else {
          console.log("[SEND] Enviando mensagem de texto:", message);
          result = await connection.client.sendMessage(formattedNumber, {
            text: message,
          });
          console.log("[SEND] Mensagem de texto enviada:", result);
        }

        // Registra o envio bem-sucedido
        recentSends.set(sendKey, now);
        console.log("[SEND] Envio registrado como bem-sucedido");

        return {
          success: true,
          messageId: result.key.id,
        };
      } catch (error) {
        console.error("[SEND] Erro durante envio:", error);
        console.error("[SEND] Stack trace:", error.stack);
        throw error;
      } finally {
        // Remove da lista de envios pendentes
        pendingSends.delete(sendKey);
        console.log("[SEND] Removido da lista de envios pendentes");
      }
    })();

    // Armazena a Promise para evitar envios duplicados
    pendingSends.set(sendKey, sendPromise);
    console.log("[SEND] Promise armazenada para controle de duplicatas");

    // Aguarda o resultado
    console.log("[SEND] Aguardando resultado do envio...");
    const result = await sendPromise;
    console.log("[SEND] Resultado final:", result);
    return res.status(200).json(result);
  } catch (error) {
    console.error("[SEND] Erro ao enviar mensagem:", error);
    console.error("[SEND] Stack trace completo:", error.stack);
    return res.status(500).json({
      error: "Erro ao enviar mensagem",
      details: error.message,
    });
  }
});

// Endpoint para buscar o QR code atual
app.get("/api/whatsapp/qr/:deviceId", (req, res) => {
  const { deviceId } = req.params;
  console.log(
    "[DEBUG] Buscando QR para deviceId:",
    deviceId,
    "Map keys:",
    Array.from(qrCodes.keys())
  );
  const qr = qrCodes.get(deviceId);
  if (qr) {
    return res.json({ qr });
  }
  console.log("[DEBUG] QR code não encontrado para deviceId:", deviceId);
  return res.status(404).json({ error: "QR code não encontrado" });
});

// Rota para deletar sessão
app.delete("/api/whatsapp/session/:deviceId", (req, res) => {
  const { deviceId } = req.params;
  const authFolder = path.join(__dirname, "auth", deviceId);

  // Verifica se a pasta existe antes de tentar deletar
  if (!fs.existsSync(authFolder)) {
    qrCodes.delete(deviceId);
    connections.delete(deviceId);
    return res.json({ message: "Sessão já removida (pasta não existe)" });
  }

  rimraf(authFolder, (err) => {
    if (err) {
      console.error("Erro ao deletar sessão:", err, "Pasta:", authFolder);
      return res
        .status(500)
        .json({ error: "Erro ao deletar sessão", details: err.message });
    }
    qrCodes.delete(deviceId);
    connections.delete(deviceId);
    return res.json({ message: "Sessão deletada com sucesso" });
  });
});

// Adicionar novas rotas para gerenciar chatbots
app.post("/api/chatbots", (req, res) => {
  const { phoneNumber, name, personality } = req.body;

  if (!phoneNumber || !name || !personality) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  setChatbot(phoneNumber, { name, personality });
  res.json({ message: "Chatbot configurado com sucesso" });
});

app.delete("/api/chatbots/:phoneNumber", (req, res) => {
  const { phoneNumber } = req.params;
  removeChatbot(phoneNumber);
  res.json({ message: "Chatbot removido com sucesso" });
});

app.patch("/api/chatbots/:phoneNumber/toggle", (req, res) => {
  const { phoneNumber } = req.params;
  const { isActive } = req.body;

  toggleChatbot(phoneNumber, isActive);
  res.json({
    message: `Chatbot ${isActive ? "ativado" : "desativado"} com sucesso`,
  });
});

app.get("/api/chatbots", (req, res) => {
  const chatbots = listChatbots();
  res.json(chatbots);
});

// Rota para listar agentes da Mistral via proxy seguro
app.get("/api/mistral/agents", async (req, res) => {
  try {
    const response = await axios.get("https://api.mistral.ai/v1/agents", {
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error(
      "Erro ao buscar agentes da Mistral:",
      error?.response?.data || error.message
    );
    res.status(500).json({ error: "Erro ao buscar agentes da Mistral" });
  }
});

// Rota para criar um agente na Mistral
app.post("/api/mistral/agents", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.mistral.ai/v1/agents",
      req.body,
      {
        headers: {
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "Erro ao criar agente na Mistral:",
      error?.response?.data || error.message
    );
    res.status(500).json({ error: "Erro ao criar agente na Mistral" });
  }
});

// Rota para listar modelos da Mistral
app.get("/api/mistral/models", async (req, res) => {
  try {
    const response = await axios.get("https://api.mistral.ai/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error(
      "Erro ao buscar modelos da Mistral:",
      error?.response?.data || error.message
    );
    res.status(500).json({ error: "Erro ao buscar modelos da Mistral" });
  }
});

// Função para limpar cache de envios recentes (remove entradas mais antigas que 1 hora)
function cleanupRecentSends() {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  let cleanedCount = 0;
  for (const [key, timestamp] of recentSends.entries()) {
    if (timestamp < oneHourAgo) {
      recentSends.delete(key);
      cleanedCount++;
    }
  }

  console.log(
    `[CLEANUP] Cache limpo. ${cleanedCount} entradas removidas. Restantes: ${recentSends.size}`
  );
}

// Limpa o cache a cada 30 minutos
setInterval(cleanupRecentSends, 30 * 60 * 1000);

// Sistema de monitoramento de reconexões
setInterval(() => {
  const now = Date.now();
  const problematicDevices = [];
  
  for (const [deviceId, attempts] of reconnectionAttempts.entries()) {
    if (attempts.count >= 3) {
      problematicDevices.push({
        deviceId,
        attempts: attempts.count,
        lastAttempt: new Date(attempts.lastAttempt).toISOString()
      });
    }
  }
  
  if (problematicDevices.length > 0) {
    console.log(`[MONITOR] ⚠️ Dispositivos com problemas de reconexão:`, problematicDevices);
  }
  
  // Limpar tentativas antigas (mais de 1 hora)
  for (const [deviceId, attempts] of reconnectionAttempts.entries()) {
    if (now - attempts.lastAttempt > 3600000) { // 1 hora
      reconnectionAttempts.delete(deviceId);
    }
  }
}, 15 * 60 * 1000); // Verificar a cada 15 minutos

// Sistema automático de limpeza de autenticação
setInterval(async () => {
  console.log('[AUTO-CLEANUP] Verificando autenticações corrompidas...');
  
  try {
    const authDir = path.join(__dirname, 'auth');
    if (!fs.existsSync(authDir)) return;
    
    const deviceFolders = fs.readdirSync(authDir);
    let cleanedCount = 0;
    
    for (const deviceId of deviceFolders) {
      const devicePath = path.join(authDir, deviceId);
      const credsFile = path.join(devicePath, 'creds.json');
      
      // Verificar se as credenciais estão corrompidas
      if (fs.existsSync(credsFile)) {
        try {
          const credsData = JSON.parse(fs.readFileSync(credsFile, 'utf8'));
          
          // Se credenciais estão corrompidas, limpar automaticamente
          if (!credsData.me || !credsData.me.id) {
            console.log(`[AUTO-CLEANUP] Credenciais corrompidas detectadas para ${deviceId}, limpando...`);
            
            // Remover do mapa de conexões se estiver conectado
            if (connections.has(deviceId)) {
              connections.delete(deviceId);
              qrCodes.delete(deviceId);
              console.log(`[AUTO-CLEANUP] Dispositivo ${deviceId} removido dos mapas de conexão`);
            }
            
            // Limpar pasta de autenticação
            fs.rmSync(devicePath, { recursive: true, force: true });
            cleanedCount++;
            
            // Reset de tentativas de reconexão
            reconnectionAttempts.delete(deviceId);
          }
        } catch (error) {
          console.log(`[AUTO-CLEANUP] Erro ao ler credenciais de ${deviceId}, limpando...`);
          fs.rmSync(devicePath, { recursive: true, force: true });
          cleanedCount++;
          reconnectionAttempts.delete(deviceId);
        }
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`[AUTO-CLEANUP] ${cleanedCount} dispositivos limpos automaticamente`);
    }
    
  } catch (error) {
    console.error('[AUTO-CLEANUP] Erro durante limpeza automática:', error);
  }
}, 30 * 60 * 1000); // Verificar a cada 30 minutos

// Rota para monitorar sistema automático
app.get("/api/debug/auto-cleanup", (req, res) => {
  try {
    const authDir = path.join(__dirname, 'auth');
    const deviceStatus = [];
    
    if (fs.existsSync(authDir)) {
      const deviceFolders = fs.readdirSync(authDir);
      
      for (const deviceId of deviceFolders) {
        const devicePath = path.join(authDir, deviceId);
        const credsFile = path.join(devicePath, 'creds.json');
        
        let status = 'unknown';
        let isValid = false;
        
        if (fs.existsSync(credsFile)) {
          try {
            const credsData = JSON.parse(fs.readFileSync(credsFile, 'utf8'));
            isValid = !!(credsData.me && credsData.me.id);
            status = isValid ? 'valid' : 'corrupted';
          } catch (error) {
            status = 'error';
          }
        } else {
          status = 'no_creds';
        }
        
        deviceStatus.push({
          deviceId,
          status,
          isValid,
          hasConnection: connections.has(deviceId),
          connectionStatus: connections.get(deviceId)?.status || 'disconnected'
        });
      }
    }
    
    return res.status(200).json({
      autoCleanup: {
        enabled: true,
        interval: '10 minutes',
        lastCheck: new Date().toISOString()
      },
      devices: deviceStatus
    });
  } catch (error) {
    console.error("Erro ao obter status do auto-cleanup:", error);
    return res.status(500).json({
      error: "Erro ao obter status do auto-cleanup",
      details: error.message,
    });
  }
});

// Rota para monitorar status das reconexões
app.get("/api/debug/reconnections", (req, res) => {
  try {
    const reconnectionStatus = Array.from(reconnectionAttempts.entries()).map(
      ([deviceId, attempts]) => ({
        deviceId,
        attempts: attempts.count,
        maxAttempts: MAX_RECONNECTION_ATTEMPTS,
        lastAttempt: new Date(attempts.lastAttempt).toISOString(),
        backoff: attempts.backoff,
        isBlocked: attempts.count >= MAX_RECONNECTION_ATTEMPTS
      })
    );

    return res.status(200).json({
      reconnections: {
        count: reconnectionAttempts.size,
        items: reconnectionStatus
      },
      settings: {
        maxAttempts: MAX_RECONNECTION_ATTEMPTS,
        initialBackoff: INITIAL_BACKOFF,
        maxBackoff: MAX_BACKOFF
      }
    });
  } catch (error) {
    console.error("Erro ao obter status das reconexões:", error);
    return res.status(500).json({
      error: "Erro ao obter status das reconexões",
      details: error.message,
    });
  }
});

// Rota para debug - verificar status dos caches
app.get("/api/debug/caches", (req, res) => {
  try {
    const now = Date.now();
    const pendingSendsArray = Array.from(pendingSends.entries()).map(
      ([key, promise]) => ({
        key,
        status: "pending",
      })
    );

    const recentSendsArray = Array.from(recentSends.entries()).map(
      ([key, timestamp]) => ({
        key,
        timestamp,
        ageSeconds: Math.floor((now - timestamp) / 1000),
      })
    );

    return res.status(200).json({
      pendingSends: {
        count: pendingSends.size,
        items: pendingSendsArray,
      },
      recentSends: {
        count: recentSends.size,
        items: recentSendsArray,
      },
      connections: {
        count: connections.size,
        devices: Array.from(connections.keys()),
      },
    });
  } catch (error) {
    console.error("Erro ao obter status dos caches:", error);
    return res.status(500).json({
      error: "Erro ao obter status dos caches",
      details: error.message,
    });
  }
});

// Rota para servir o frontend em todas as outras rotas
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${port}`);
});
