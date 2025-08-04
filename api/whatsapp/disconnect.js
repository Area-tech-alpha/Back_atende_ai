import { connections } from "./connect.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { deviceId } = req.body;

  const sock = connections.get(deviceId);

  if (!sock) {
    return res.status(400).json({ error: "Dispositivo não conectado" });
  }

  try {
    await sock.logout();
    connections.delete(deviceId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erro ao desconectar:", error);
    res.status(500).json({ error: "Erro ao desconectar" });
  }
}
