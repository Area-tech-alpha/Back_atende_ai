import express from "express";
import {
  startConnection,
  sendMessage,
  connections,
  qrCodes,
  getSupabaseClient,
} from "../src/services/whatsappService.js";
import { rimraf } from "rimraf";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { useSupabaseAuthState } from "../utils/useSupabaseAuthState.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.post("/whatsapp/connect", async (req, res) => {
  const { deviceId, connectionName } = req.body;
  if (!deviceId) {
    return res.status(400).json({ error: "deviceId é obrigatório." });
  }

  try {
    console.log(`[API] Recebida solicitação para conectar o deviceId: ${deviceId}`);

    if (connections.has(deviceId)) {
      console.log(`[API] Limpando conexão em memória para ${deviceId}...`);
      const oldConnection = connections.get(deviceId);
      if (oldConnection && oldConnection.client) {
        try {
          await oldConnection.client.logout();
        } catch (e) {}
      }
      connections.delete(deviceId);
      qrCodes.delete(deviceId);
    }

    console.log(`[API] Forçando a limpeza da sessão no Supabase para ${deviceId}...`);
    const supabase = getSupabaseClient();
    const { clearState } = await useSupabaseAuthState(supabase, deviceId);
    await clearState();
    console.log(`[API] Sessão no Supabase para ${deviceId} limpa com sucesso.`);

    console.log(`[API] Iniciando uma nova conexão limpa para ${deviceId}...`);
    await startConnection(deviceId, connectionName);

    res.status(200).json({ message: "Iniciando nova conexão, aguarde o QR code." });
  } catch (err) {
    console.error(`[API] Erro CRÍTICO ao iniciar conexão para ${deviceId}:`, err);
    res.status(500).json({ error: "Erro ao iniciar conexão.", details: err.message });
  }
});

router.get("/whatsapp/qr/:deviceId", (req, res) => {
  const { deviceId } = req.params;
  const qr = qrCodes.get(deviceId);
  console.log("Cheguei aqui", deviceId);
  if (qr) {
    return res.status(200).json({ qr });
  }
  return res.status(404).json({ error: "QR code não encontrado ou conexão já estabelecida." });
});

router.get("/whatsapp/status/:deviceId", (req, res) => {
  try {
    const { deviceId } = req.params;
    if (!deviceId) {
      return res.status(400).json({ error: "ID do dispositivo não fornecido" });
    }
    const connection = connections.get(deviceId);
    if (!connection) {
      return res.status(404).json({ status: "disconnected", message: "Conexão não encontrada" });
    }
    return res.status(200).json({
      status: connection.status,
      deviceId: connection.deviceId,
    });
  } catch (error) {
    console.error("Erro ao verificar status:", error);
    return res.status(500).json({ error: "Erro ao verificar status da conexão" });
  }
});

router.get("/whatsapp/devices", (req, res) => {
  const devices = Array.from(connections.values()).map((conn) => ({
    deviceId: conn.deviceId,
    status: conn.status,
    connection_name: conn.connection_name,
  }));
  res.status(200).json({ devices });
});

router.delete("/whatsapp/devices/:deviceId/auth", (req, res) => {
  const { deviceId } = req.params;
  const connection = connections.get(deviceId);

  if (connection && connection.client) {
    connection.client.logout();
  }
  connections.delete(deviceId);
  qrCodes.delete(deviceId);

  const authFolder = path.join(__dirname, "..", "..", "auth", deviceId);
  if (fs.existsSync(authFolder)) {
    rimraf.sync(authFolder);
  }

  res.status(200).json({ message: "Conexão e dados de autenticação removidos." });
});

router.post("/whatsapp/send", async (req, res) => {
  const { deviceId, number, message, imagemUrl } = req.body; //TODO passar o messageId para a função sendMessage
  const result = await sendMessage(deviceId, number, message, imagemUrl);
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
});

router.get("/campaigns", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "O userId é obrigatório." });
  }
  const supabase = getSupabaseClient();
  try {
    const { data, error } = await supabase
      .from("mensagem_evolution")
      .select()
      .eq("user_id", userId)
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao buscar campanhas:", error);
      return res.status(500).json({ message: "Erro ao buscar campanhas", error });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Erro ao buscar campanhas:", error);
    return res.status(500).json({ message: "Erro ao buscar campanhas", error });
  }
});

router.post("/campaigns", async (req, res) => {
  const { userId, ...campaignData } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "O userId é obrigatório." });
  }

  const supabase = getSupabaseClient();
  try {
    const { data, error } = await supabase
      .from("mensagem_evolution")
      .insert([
        {
          ...campaignData,
          user_id: userId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar campanha:", error);
      return res.status(500).json({ message: "Erro ao criar campanha", error });
    }

    return res.status(201).json(data);
  } catch (error) {
    console.error("Erro ao criar campanha:", error);
    return res.status(500).json({ message: "Erro ao criar campanha", error });
  }
});

router.put("/campaigns/:id", async (req, res) => {
  const { id: campaignId } = req.params;
  const { userId } = req.query;
  const campaignDataToUpdate = req.body;

  if (!userId) {
    return res.status(400).json({ message: "O userId é obrigatório." });
  }

  delete campaignDataToUpdate.user_id;

  const supabase = getSupabaseClient();
  try {
    const { data, error, count } = await supabase
      .from("mensagem_evolution")
      .update(campaignDataToUpdate, { count: "exact" })
      .eq("id", campaignId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar campanha:", error);
      return res.status(500).json({ message: "Erro ao atualizar campanha", error });
    }

    if (count === 0) {
      return res.status(404).json({ message: "Campanha não encontrada ou não pertence a este usuário." });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Erro inesperado ao atualizar campanha:", error);
    return res.status(500).json({ message: "Erro inesperado ao atualizar campanha", error });
  }
});

router.delete("/campaigns/:id", async (req, res) => {
  const { id: campaignId } = req.params;
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "O userId é obrigatório." });
  }

  const supabase = getSupabaseClient();
  try {
    const { error, count } = await supabase
      .from("mensagem_evolution")
      .delete({ count: "exact" })
      .eq("id", campaignId)
      .eq("user_id", userId);

    if (error) {
      console.error("Erro ao deletar campanha:", error);
      return res.status(500).json({ message: "Erro ao deletar campanha", error });
    }

    if (count === 0) {
      return res.status(404).json({ message: "Campanha não encontrada ou não pertence a este usuário." });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar uma campanha", error);
    return res.status(500).json({ message: "Erro inesperado ao deletar campanha", error });
  }
});

export default router;
