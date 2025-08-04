import { connections } from "./connect.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { deviceId, phone, message, image } = req.body;

  const sock = connections.get(deviceId);

  if (!sock) {
    return res.status(400).json({ error: "Dispositivo não conectado" });
  }

  try {
    if (image) {
      await sock.sendMessage(phone + "@s.whatsapp.net", {
        image: { url: image },
        caption: message,
      });
    } else {
      await sock.sendMessage(phone + "@s.whatsapp.net", { text: message });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    res.status(500).json({ error: "Erro ao enviar mensagem" });
  }
}
