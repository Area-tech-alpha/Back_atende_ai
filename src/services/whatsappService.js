import {
  makeWASocket,
  DisconnectReason,
  isJidBroadcast,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";
import { useSupabaseAuthState } from "../../utils/useSupabaseAuthState.js";
import { createClient } from "@supabase/supabase-js";
import qrcode from "qrcode";
import pino from "pino";
import dotenv from "dotenv";
dotenv.config();

export const connections = new Map();
export const qrCodes = new Map();

let supabaseClient = null;

export function getSupabaseClient() {
  if (supabaseClient) {
    console.log("[SERVICE] Entregando cliente Supabase já inicializado.");
    return supabaseClient;
  }
  console.log("[SERVICE] Inicializando cliente Supabase...");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("[SERVICE] Variáveis de ambiente do Supabase não encontradas!");
    throw new Error("Configuração do Supabase ausente");
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  console.log("[SERVICE] Cliente Supabase inicializado com sucesso.");

  return supabaseClient;
}

export const getSupabase = getSupabaseClient;

function formatPhoneNumber(phone) {
  let cleaned = String(phone || "").replace(/\D/g, "");
  if (!cleaned.startsWith("55")) {
    cleaned = "55" + cleaned;
  }
  return cleaned + "@s.whatsapp.net";
}

export async function startConnection(deviceId, connectionName) {
  console.log(`[SERVICE] Iniciando conexão para: ${deviceId}`);

  const supabase = getSupabaseClient();
  const { state, saveCreds, clearState } = await useSupabaseAuthState(supabase, deviceId);

  const { version } = await fetchLatestBaileysVersion();
  console.log(`[SERVICE] Usando a versão do Baileys: ${version.join(".")}`);

  const client = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys),
    },
    browser: ["Chrome (Linux)", "", ""],
    printQRInTerminal: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    retryRequestDelayMs: 250,
    markOnlineOnConnect: false,
    syncFullHistory: false,
    fireInitQueries: true,
    shouldIgnoreJid: (jid) => isJidBroadcast(jid),
    emitOwnEvents: false,
    generateHighQualityLinkPreview: false,
    deviceId: deviceId,
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

      console.log(`[SERVICE] Conexão fechada para ${deviceId}. Motivo: ${lastDisconnect?.error?.message}.`);

      connections.delete(deviceId);
      qrCodes.delete(deviceId);

      if (shouldReconnect) {
        console.log(`[SERVICE] Tentando reconectar ${deviceId} em 5 segundos...`);
        setTimeout(() => startConnection(deviceId, connectionName), 5000);
      } else {
        console.log(`[SERVICE] Desconexão definitiva. Limpando sessão de ${deviceId} do Supabase.`);
        clearState();
      }
    } else if (connection === "open") {
      console.log(`[SERVICE] Conexão aberta e estabelecida para ${deviceId}`);
      connections.set(deviceId, {
        client,
        status: "connected",
        deviceId,
        connection_name: connectionName,
      });
      qrCodes.delete(deviceId);
    }
  });

  client.ev.on("creds.update", saveCreds);

  return client;
}

export async function sendMessage(deviceId, number, message, imageUrl = null, messageId = null) {
  const connection = connections.get(deviceId);
  const supabase = getSupabaseClient();

  if (!connection || connection.status !== "connected") {
    return { success: false, error: `Dispositivo ${deviceId} não conectado.` };
  }

  try {
    const jid = formatPhoneNumber(number);
    const [result] = await connection.client.onWhatsApp(jid.split("@")[0]);
    if (!result?.exists) {
      throw new Error("Número não existe no WhatsApp.");
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

    const { error: insertError } = await supabase.from("envio_evolution").insert([
      {
        id_mensagem: messageId,
        contato: number,
        status: "success",
      },
    ]);

    if (insertError) {
      console.error("[SERVICE] Erro ao salvar LOG de sucesso no Supabase:", insertError);
    }

    return { success: true, messageId: response.key.id };
  } catch (error) {
    console.error(`[SERVICE] Erro ao enviar mensagem para ${number}:`, error.message);

    const { error: insertError } = await supabase.from("envio_evolution").insert([
      {
        id_mensagem: messageId,
        contato: number,
        status: "error",
        erro: error.message,
      },
    ]);

    if (insertError) {
      console.error("[SERVICE] Erro ao salvar LOG de falha no Supabase:", insertError);
    }

    return { success: false, error: error.message };
  }
}
