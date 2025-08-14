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
import pino from "pino";

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

  // Adiciona um logger mais detalhado para ajudar a depurar
  const logger = pino({ level: 'silent' });

  const client = makeWASocket({
    auth: state,
    browser: ["Atende AI", "Chrome", "1.0.0"],
    printQRInTerminal: false,
    logger,
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
      // Define que não deve reconectar se for logout, conflito ou reinicialização necessária
      const shouldReconnect = 
        statusCode !== DisconnectReason.loggedOut && 
        statusCode !== DisconnectReason.restartRequired &&
        statusCode !== 409; // 409 é o código para conflito (device_removed)

      console.log(`[SERVICE] Conexão fechada para ${deviceId}. Motivo: ${lastDisconnect?.error?.message}. Reconectar: ${shouldReconnect}`);
      
      // Se a desconexão for definitiva (logout, conflito, etc.), limpa a sessão.
      if (!shouldReconnect) {
          console.log(`[SERVICE] Limpando sessão de ${deviceId} para forçar nova autenticação.`);
          // Apenas limpa os arquivos locais. Não tenta mais fazer logout de uma conexão já fechada.
          connections.delete(deviceId);
          qrCodes.delete(deviceId);
          const authFolder = path.join(__dirname, "..", "..", "auth", deviceId);
          if (fs.existsSync(authFolder)) {
              rimraf.sync(authFolder);
          }
      } else {
        // Para outras falhas, apenas removemos da memória para uma possível reconexão futura.
        connections.delete(deviceId);
      }

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
