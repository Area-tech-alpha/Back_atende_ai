import { getSupabase, sendMessage } from "../src/services/whatsappService.js";
import dotenv from "dotenv";
dotenv.config();

const supabase = getSupabase();

// Função que processa UMA ÚNICA campanha do início ao fim.
async function processSingleCampaign(campaign) {
  try {
    console.log(`[WORKER] ➤ Iniciando trabalho para Campanha ${campaign.id} (${campaign.name})`);

    await supabase.from("mensagem_evolution").update({ status: "Em Andamento" }).eq("id", campaign.id);

    const { data: contatosData, error: contatosError } = await supabase
      .from("contato_evolution")
      .select("contatos")
      .eq("id", campaign.contatos)
      .single();

    if (contatosError || !contatosData) {
      throw new Error(`Erro ao buscar contatos: ${contatosError?.message}`);
    }

    const contatos = JSON.parse(contatosData.contatos || "[]");
    if (!contatos.length) {
      console.log(`[WORKER] Campanha ${campaign.id} sem contatos. Finalizando.`);
      await supabase.from("mensagem_evolution").update({ status: "Concluída" }).eq("id", campaign.id);
      return; // Finaliza o trabalho para esta campanha
    }

    let successCount = 0;
    let errorCount = 0;
    const delaySec = Math.max(1, parseInt(campaign.delay) || 5);

    for (const [index, contato] of contatos.entries()) {
      const numero = String(contato.phone || "").replace(/\D/g, "");

      if (index > 0) {
        await new Promise((res) => setTimeout(res, delaySec * 1000));
      }

      console.log(`[WORKER] Delegando envio para ${numero} via device ${campaign.device_id}`);

      try {
        const result = await sendMessage(
          campaign.device_id,
          numero,
          campaign.texto,
          campaign.imagem || null,
          campaign.id
        );
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
        console.log(
          `[WORKER-LOG] [${result.success ? "✔" : "✖"}] ${numero}: ${result.success ? "Enviado" : result.error}`
        );
      } catch (e) {
        errorCount++;
        console.error(`[WORKER] Erro ao chamar a API de envio:`, e);
      }
    }

    const finalStatus = errorCount === 0 ? "Concluída" : "Concluída com erros";
    await supabase.from("mensagem_evolution").update({ status: finalStatus }).eq("id", campaign.id);

    console.log(`[WORKER] ✅ Campanha ${campaign.id} finalizada. Sucessos: ${successCount}, Falhas: ${errorCount}`);
  } catch (error) {
    console.error(`[WORKER] Erro grave no processamento da campanha ${campaign.id}:`, error.message);
    await supabase.from("mensagem_evolution").update({ status: "Falhou" }).eq("id", campaign.id);
  }
}

async function findAndDispatchCampaigns() {
  console.log("[DISPATCHER] Verificando campanhas para processar...");

  try {

    const { data: messages, error: fetchError } = await supabase
      .from("mensagem_evolution")
      .select("*")
      .in("status", ["Agendada", "Imediata"])
      .lte("data_de_envio", 'now()');

    if (fetchError) {
      console.error("[DISPATCHER] Erro ao buscar campanhas:", fetchError);
      return;
    }

    if (!messages || messages.length === 0) {
      console.log("[DISPATCHER] Nenhuma nova campanha para iniciar.");
      return;
    }

    console.log(`[DISPATCHER] ${messages.length} campanha(s) encontrada(s). Disparando workers...`);

    for (const msg of messages) {
      processSingleCampaign(msg);
    }
  } catch (e) {
    console.error("[DISPATCHER] Erro inesperado durante o despacho:", e);
  }
}

export function startWorker() {
  const INTERVALO_EM_MINUTOS = 1;
  const intervalMs = INTERVALO_EM_MINUTOS * 60 * 1000;

  console.log(`[WORKER-INIT] Despachante configurado para rodar a cada ${INTERVALO_EM_MINUTOS} minuto(s).`);

  findAndDispatchCampaigns();

  setInterval(findAndDispatchCampaigns, intervalMs);
}
