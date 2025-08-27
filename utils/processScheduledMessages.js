import { getSupabase, sendMessage } from "../src/services/whatsappService.js";
import dotenv from "dotenv";
dotenv.config();

const supabase = getSupabase();

let isProcessing = false;

async function processCampaigns() {
  if (isProcessing) {
    console.log("[WORKER] Processamento já em andamento. Pulando esta execução.");
    return;
  }

  isProcessing = true;
  console.log("[WORKER] Iniciando verificação de mensagens agendadas...");

  try {
    const now = new Date().toISOString();

    const { data: messages, error: fetchError } = await supabase
      .from("mensagem_evolution")
      .select("*")
      .in("status", ["Agendada", "Imediata"])
      .lte("data_de_envio", now);

    if (fetchError) {
      console.error("[WORKER] Erro ao buscar campanhas:", fetchError);
      return;
    }

    if (!messages || messages.length === 0) {
      console.log("[WORKER] Nenhuma campanha agendada encontrada.");
      return;
    }

    for (const msg of messages) {
      try {
        console.log(`[WORKER] ➤ Processando Campanha ${msg.id} (${msg.name})`);

        await supabase.from("mensagem_evolution").update({ status: "Em Andamento" }).eq("id", msg.id);

        const { data: contatosData, error: contatosError } = await supabase
          .from("contato_evolution")
          .select("contatos")
          .eq("id", msg.contatos)
          .single();

        if (contatosError || !contatosData) {
          throw new Error(`Erro ao buscar contatos: ${contatosError?.message}`);
        }

        const contatos = JSON.parse(contatosData.contatos || "[]");
        if (!contatos.length) {
          console.log(`[WORKER] Campanha ${msg.id} sem contatos. Finalizando.`);
          await supabase.from("mensagem_evolution").update({ status: "Concluída" }).eq("id", msg.id);
          continue;
        }

        let successCount = 0;
        let errorCount = 0;
        const delaySec = Math.max(1, parseInt(msg.delay) || 5);
        for (const [index, contato] of contatos.entries()) {
          const numero = String(contato.phone || "").replace(/\D/g, "");

          if (index > 0) {
            await new Promise((res) => setTimeout(res, delaySec * 1000));
          }

          console.log(`[WORKER] Delegando envio para ${numero} via device ${msg.device_id}`);

          let result = { success: false, error: "Erro desconhecido" };
          try {
            const response = await sendMessage(msg.device_id, numero, msg.texto, msg.imagem || null, msg.id);
            if (response.success) {
              result = { success: true };
            }
          } catch (e) {
            result.error = e.message;
            console.error(`[WORKER] Erro ao chamar a API de envio:`, e);
          }

          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
          console.log(
            `[WORKER-LOG] [${result.success ? "✔" : "✖"}] ${numero}: ${result.success ? "Enviado" : result.error}`
          );
        }

        const finalStatus = errorCount === 0 ? "Concluída" : "Concluída com erros";
        await supabase.from("mensagem_evolution").update({ status: finalStatus }).eq("id", msg.id);

        console.log(`[WORKER] ✅ Campanha ${msg.id} finalizada. Sucessos: ${successCount}, Falhas: ${errorCount}`);
      } catch (error) {
        console.error(`[WORKER] Erro grave no processamento da campanha ${msg.id}:`, error.message);
        await supabase.from("mensagem_evolution").update({ status: "Não concluida" }).eq("id", msg.id);
      }
    }
  } catch (e) {
    console.error("[WORKER] Erro inesperado durante o processamento:", e);
  } finally {
    isProcessing = false;
    console.log("[WORKER] ✅ Verificação de campanhas finalizada.");
  }
}

export function startWorker() {
  const INTERVALO_EM_MINUTOS = 1;
  const intervalMs = INTERVALO_EM_MINUTOS * 60 * 1000;

  console.log(`[WORKER-INIT] Worker configurado para rodar a cada ${INTERVALO_EM_MINUTOS} minuto(s).`);

  processCampaigns();

  setInterval(processCampaigns, intervalMs);
}
