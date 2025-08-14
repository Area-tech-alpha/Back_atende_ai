import express from 'express';
// Importa as funções do nosso novo serviço centralizado
import { startConnection, sendMessage, connections, qrCodes } from '../src/services/whatsappService.js';
import { rimraf } from "rimraf";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.post("/whatsapp/connect", async (req, res) => {
  const { deviceId, connectionName } = req.body;
  if (!deviceId) {
    return res.status(400).json({ error: "deviceId é obrigatório." });
  }

  try {
    if (connections.has(deviceId)) {
        return res.status(200).json({ message: "Conexão já em andamento ou estabelecida." });
    }
    await startConnection(deviceId, connectionName);
    res.status(200).json({ message: "Iniciando conexão, aguarde o QR code." });
  } catch (err) {
    res.status(500).json({ error: "Erro ao iniciar conexão.", details: err.message });
  }
});

router.get("/whatsapp/qr/:deviceId", (req, res) => {
  const { deviceId } = req.params;
  const qr = qrCodes.get(deviceId);
  if (qr) {
    return res.status(200).json({ qr });
  }
  return res.status(404).json({ error: "QR code não encontrado ou conexão já estabelecida." });
});

router.get("/whatsapp/devices", (req, res) => {
    const devices = Array.from(connections.values()).map(conn => ({
        deviceId: conn.deviceId,
        status: conn.status,
        connection_name: conn.connection_name,
    }));
    res.status(200).json({ devices });
});

router.delete("/whatsapp/devices/:deviceId/auth", (req, res) => {
    const { deviceId } = req.params;
    const connection = connections.get(deviceId);
    
    // Tenta desconectar o cliente se ele estiver ativo
    if (connection && connection.client) {
        connection.client.logout();
    }
    connections.delete(deviceId);
    qrCodes.delete(deviceId);

    // Limpa a pasta de autenticação
    const authFolder = path.join(__dirname, "..", "..", "auth", deviceId);
    if (fs.existsSync(authFolder)) {
        rimraf.sync(authFolder);
    }
    
    res.status(200).json({ message: "Conexão e dados de autenticação removidos." });
});

// A rota de envio agora usa diretamente a função do serviço
router.post("/whatsapp/send", async (req, res) => {
    const { deviceId, number, message, imagemUrl } = req.body;
    const result = await sendMessage(deviceId, number, message, imagemUrl);
    if (result.success) {
        res.status(200).json(result);
    } else {
        res.status(500).json(result);
    }
});

export default router;