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
import { authMiddleware } from "../middlewares/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.post("/whatsapp/connect", authMiddleware, async (req, res) => {
  const { deviceId, connectionName } = req.body;
  const userId = req.user?.id;
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

router.get("/whatsapp/qr/:deviceId", authMiddleware, (req, res) => {
  const { deviceId } = req.params;
  const qr = qrCodes.get(deviceId);
  console.log("Cheguei aqui", deviceId);
  if (qr) {
    return res.status(200).json({ qr });
  }
  return res.status(404).json({ error: "QR code não encontrado ou conexão já estabelecida." });
});

router.get("/whatsapp/status/:deviceId", authMiddleware, (req, res) => {
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

router.get("/whatsapp/devices", authMiddleware, (req, res) => {
  const devices = Array.from(connections.values()).map((conn) => ({
    deviceId: conn.deviceId,
    status: conn.status,
    connection_name: conn.connection_name,
  }));
  res.status(200).json({ devices });
});

router.delete("/whatsapp/devices/:deviceId/auth", authMiddleware, (req, res) => {
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

router.post("/whatsapp/send", authMiddleware, async (req, res) => {
  const { deviceId, number, message, imagemUrl, messageId } = req.body;
  const result = await sendMessage(deviceId, number, message, imagemUrl, messageId);
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
});

router.get("/campaigns", authMiddleware, async (req, res) => {
  const { id: userId } = req.user;

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

router.post("/campaigns", authMiddleware, async (req, res) => {
  const { id: userId } = req.user;

  const { ...campaignData } = req.body;

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

router.put("/campaigns/:id", authMiddleware, async (req, res) => {
  const { id: campaignId } = req.params;
  const { id: userId } = req.user;
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

router.delete("/campaigns/:id", authMiddleware, async (req, res) => {
  const { id: campaignId } = req.params;
  const { id: userId } = req.user;

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

router.get("/dashboard/stats", authMiddleware, async (req, res) => {
  const { id: userId } = req.user;
  if (!userId) {
    return res.status(400).json({ message: "O userId é obrigatório." });
  }

  const supabase = getSupabaseClient();
  try {
    const { data: contactListsData, error: contactsError } = await supabase
      .from("contato_evolution")
      .select("id, contatos")
      .eq("user_id", userId);
    if (contactsError) throw contactsError;

    const contactIds = contactListsData?.map((list) => list.id) || [];
    const totalContacts =
      contactListsData?.reduce((acc, list) => acc + JSON.parse(list.contatos || "[]").length, 0) || 0;

    const { data: messagesData, error: messagesError } = await supabase
      .from("mensagem_evolution")
      .select("id, name, status, created_at, nome_da_instancia")
      .eq("userId", userId)
      .order("created_at", { ascending: false });
    if (messagesError) throw messagesError;

    const messageIds = messagesData?.map((msg) => msg.id) || [];
    if (messageIds.length === 0) {
      return res.status(200).json({
        stats: {
          totalMessages: 0,
          totalContacts,
          deliveryRate: 0,
          avgSendInterval: 0,
          messageChange: 0,
          contactChange: 0,
          deliveryChange: 0,
          responseChange: 0,
        },
        recentCampaigns: [],
      });
    }

    const { data: enviosData, error: enviosError } = await supabase
      .from("envio_evolution")
      .select("id_mensagem, status, data_envio")
      .in("id_mensagem", messageIds);
    if (enviosError) throw enviosError;

    const now = new Date();
    const thirtyDaysAgo = new Date(new Date().setDate(now.getDate() - 30));
    const sixtyDaysAgo = new Date(new Date().setDate(now.getDate() - 60));

    const enviosLast30Days = enviosData.filter((e) => new Date(e.data_envio) >= thirtyDaysAgo);
    const enviosPrevious30Days = enviosData.filter(
      (e) => new Date(e.data_envio) < thirtyDaysAgo && new Date(e.data_envio) >= sixtyDaysAgo
    );

    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const messageChange = calculateChange(enviosLast30Days.length, enviosPrevious30Days.length);

    const deliveredLast30 = enviosLast30Days.filter((e) => e.status === "success").length;
    const deliveredPrevious30 = enviosPrevious30Days.filter((e) => e.status === "success").length;

    const deliveryRateLast30 = enviosLast30Days.length > 0 ? (deliveredLast30 / enviosLast30Days.length) * 100 : 0;
    const deliveryRatePrevious30 =
      enviosPrevious30Days.length > 0 ? (deliveredPrevious30 / enviosPrevious30Days.length) * 100 : 0;
    const deliveryChange = calculateChange(deliveryRateLast30, deliveryRatePrevious30);

    let avgSendInterval = 0;
    if (enviosData && enviosData.length > 1) {
      const sortedEnvios = [...enviosData].sort(
        (a, b) => new Date(a.data_envio).getTime() - new Date(b.data_envio).getTime()
      );
      const totalDiff = sortedEnvios
        .slice(1)
        .reduce(
          (acc, curr, i) =>
            acc + (new Date(curr.data_envio).getTime() - new Date(sortedEnvios[i].data_envio).getTime()),
          0
        );
      avgSendInterval = totalDiff / (sortedEnvios.length - 1) / 1000 / 60; // em minutos
    }

    const stats = {
      totalMessages: enviosData.length,
      totalContacts,
      deliveryRate: deliveryRateLast30,
      avgSendInterval,
      messageChange,
      contactChange: 0, // Manter 0 por enquanto
      deliveryChange,
      responseChange: 0, // Manter 0 por enquanto
    };

    const recentCampaigns =
      messagesData?.map((message) => {
        const messageEnvios = enviosData?.filter((e) => e.id_mensagem === message.id) || [];
        const delivered = messageEnvios.filter((e) => e.status === "success").length;
        const deliveryRate = messageEnvios.length > 0 ? (delivered / messageEnvios.length) * 100 : 0;
        return {
          id: message.id,
          name: message.name || `Campanha ${message.id}`,
          status: message.status,
          messages: messageEnvios.length,
          delivered,
          deliveryRate,
          date: message.created_at,
          nome_da_instancia: message.nome_da_instancia,
        };
      }) || [];

    return res.status(200).json({ stats, recentCampaigns });
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    return res.status(500).json({ message: "Erro ao buscar dados do dashboard", error });
  }
});

export default router;
