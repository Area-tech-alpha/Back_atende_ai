// utils/sendMessageWithRetry.js
import axios from "axios";

const BACKEND_BASE_URL =
  process.env.BACKEND_BASE_URL || "http://localhost:3001"; // só serve para ambiente local

function normalizeNumber(phone) {
  let cleaned = String(phone || "").replace(/\D/g, "");
  if (!cleaned.startsWith("55")) cleaned = "55" + cleaned;
  // se houver 13 dígitos (55 + DDD + 9 + número), removemos o 9
  if (cleaned.length === 13 && cleaned.startsWith("55")) {
    cleaned = cleaned.slice(0, 4) + cleaned.slice(5);
  }
  return cleaned;
}

async function getDeviceStatus(deviceId) {
  try {
    const url = `${BACKEND_BASE_URL}/api/whatsapp/status/${encodeURIComponent(
      deviceId
    )}`;
    const { data } = await axios.get(url, { timeout: 15000 });
    return data?.status; // 'connected' | 'connecting' | etc.
  } catch (e) {
    console.error("[sendMessageWithRetry] Falha ao checar status:", e?.message);
    return null;
  }
}

/**
 * Envia mensagem via API do server (server.js). Faz retries e trata erros transientes.
 * @param {string} deviceId
 * @param {string} number - número cru (será normalizado)
 * @param {string} message - texto opcional
 * @param {string|null} imagemUrl - URL da imagem opcional
 * @param {number} maxRetries
 */
export async function sendMessageWithRetry(
  deviceId,
  number,
  message,
  imagemUrl = null,
  maxRetries = 3
) {
  const status = await getDeviceStatus(deviceId);
  if (status !== "connected") {
    const msg = `Dispositivo ${deviceId} não está conectado (status=${
      status ?? "indisponível"
    })`;
    console.error("[sendMessageWithRetry]", msg);
    return { success: false, error: msg };
  }

  const normalized = normalizeNumber(number);
  const payload = { deviceId, number: normalized, message, imagemUrl };
  const url = `${BACKEND_BASE_URL}/api/whatsapp/send`;

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[sendMessageWithRetry] POST ${url} tentativa ${attempt}/${maxRetries} | device=${deviceId} num=${normalized}`
      );

      const res = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      });

      if (res.status !== 200) {
        throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
      }

      const data = res.data;
      console.log("[sendMessageWithRetry] Resposta OK:", data);

      if (data?.success === false) {
        throw new Error(data?.error || "Erro desconhecido no envio");
      }

      return { success: true, data, messageId: data?.messageId };
    } catch (err) {
      lastError = err;
      const statusCode = err?.response?.status;
      const detail = err?.response?.data || err.message;
      console.error(
        `[sendMessageWithRetry] Erro tentativa ${attempt}/${maxRetries}:`,
        statusCode,
        detail
      );

      // 4xx (exceto 429) geralmente não adianta retentar
      if (
        statusCode &&
        statusCode >= 400 &&
        statusCode < 500 &&
        statusCode !== 429
      ) {
        break;
      }

      if (attempt < maxRetries) {
        const delay = 1000 * attempt; // 1s, 2s, 3s...
        console.log(
          `[sendMessageWithRetry] Aguardando ${delay / 1000}s para retry...`
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  return {
    success: false,
    error:
      lastError?.response?.data?.details ||
      lastError?.message ||
      "Falha desconhecida no envio",
  };
}
