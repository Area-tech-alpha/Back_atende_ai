import { getCurrentDateTime } from "./getCurrentDateTime.js";

// Função que verifica se o device está online antes de enviar
async function checkDeviceStatus(deviceId) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/whatsapp/status/${deviceId}`
    );
    const data = await response.json();
    return data.connected === true;
  } catch (error) {
    console.error(
      `[${getCurrentDateTime()}] Erro ao verificar status do device ${deviceId}:`,
      error
    );
    return false;
  }
}

export async function sendMessageWithRetry(
  deviceId,
  phone,
  message,
  image = null
) {
  const maxRetries = 3;
  const retryDelay = 2000; // 2 segundos

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const isConnected = await checkDeviceStatus(deviceId);

      if (!isConnected) {
        console.error(
          `[${getCurrentDateTime()}] Dispositivo ${deviceId} desconectado`
        );
        return { success: false, error: "Dispositivo desconectado" };
      }

      const response = await fetch(`http://localhost:3000/api/whatsapp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, phone, message, image }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        console.warn(
          `[${getCurrentDateTime()}] Erro no envio para ${phone}, tentativa ${attempt}:`,
          result.error || result.message || "Erro desconhecido"
        );

        if (attempt < maxRetries) {
          await new Promise((res) => setTimeout(res, retryDelay));
          continue;
        }

        return {
          success: false,
          error: result.error || result.message || "Erro desconhecido",
        };
      }

      return { success: true };
    } catch (error) {
      console.error(
        `[${getCurrentDateTime()}] Erro inesperado no envio para ${phone}, tentativa ${attempt}:`,
        error
      );

      if (attempt < maxRetries) {
        await new Promise((res) => setTimeout(res, retryDelay));
      } else {
        return { success: false, error: error.message };
      }
    }
  }
}
