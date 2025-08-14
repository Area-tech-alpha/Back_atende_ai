import {
  useMultiFileAuthState,
  DisconnectReason,
  makeWASocket,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { rimraf } from "rimraf";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// O estado das conexões agora vive aqui, de forma centralizada.
export const connections = new Map();
export const qrCodes = new Map();

function formatPhoneNumber(phone) {
  let cleaned = String(phone || "").replace(/\D/g, "");
  if (!cleaned.startsWith("55")) {
    cleaned = "55" + cleaned;
  }
  return cleaned + "@s.whatsapp.net";
}

export async function startConnection(deviceId, connectionName) {
  console.log(`[SERVICE] Iniciando conexão para: ${deviceId}`);
  const authFolder = path.join(__dirname, "..", "..", "auth", deviceId);

  if (!fs.existsSync(authFolder)) {
    fs.mkdirSync(authFolder, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  const client = makeWASocket({
    auth: state,
    browser: ["Atende AI", "Chrome", "1.0.0"],
    printQRInTerminal: false,
  });

  connections.set(deviceId, {
    client,
    status: "connecting",
    deviceId,
    connection_name: connectionName,
  });

  client.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log(`[SERVICE] QR Code recebido para ${deviceId}`);
      qrCodes.set(deviceId, qr);
    }
    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      console.log(`[SERVICE] Conexão fechada para ${deviceId}. Motivo: ${lastDisconnect?.error?.message}. Reconectar: ${shouldReconnect}`);
      
      // Se o erro for 'restart required' ou 'logged out', limpa a sessão para forçar um novo QR code.
      if (statusCode === DisconnectReason.restartRequired || !shouldReconnect) {
          console.log(`[SERVICE] Limpando sessão de ${deviceId} para forçar nova autenticação.`);
          if (connections.has(deviceId)) {
              connections.get(deviceId).client?.logout();
          }
          connections.delete(deviceId);
          qrCodes.delete(deviceId);
          const authFolder = path.join(__dirname, "..", "..", "auth", deviceId);
          if (fs.existsSync(authFolder)) {
              rimraf.sync(authFolder);
          }
      }
      
      connections.delete(deviceId);

    } else if (connection === "open") {
      console.log(`[SERVICE] Conexão aberta e estabelecida para ${deviceId}`);
      connections.set(deviceId, { client, status: "connected", deviceId, connection_name: connectionName });
      qrCodes.delete(deviceId);
    }
  });

  client.ev.on("creds.update", saveCreds);

  return client;
}

export async function sendMessage(deviceId, number, message, imageUrl = null) {
    console.log(`[SERVICE] Tentando enviar mensagem via deviceId: ${deviceId} para ${number}`);
    const connection = connections.get(deviceId);

    if (!connection || connection.status !== "connected") {
        console.error(`[SERVICE] Falha no envio: DeviceId ${deviceId} não está conectado. Status: ${connection?.status}`);
        return { success: false, error: `Dispositivo ${deviceId} não conectado.` };
    }

    try {
        const jid = formatPhoneNumber(number);
        
        const [result] = await connection.client.onWhatsApp(jid.split('@')[0]);
        if (!result?.exists) {
            return { success: false, error: "Número não existe no WhatsApp." };
        }

        let response;
        if (imageUrl) {
            response = await connection.client.sendMessage(jid, {
                image: { url: imageUrl },
                caption: message,
            });
        } else {
            response = await connection.client.sendMessage(jid, { text: message });
        }
        
        console.log(`[SERVICE] Mensagem enviada com sucesso para ${number}. ID: ${response.key.id}`);
        return { success: true, messageId: response.key.id };

    } catch (error) {
        console.error(`[SERVICE] Erro ao enviar mensagem para ${number}:`, error);
        return { success: false, error: error.message };
    }
}
