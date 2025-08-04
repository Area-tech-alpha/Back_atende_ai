import { supabase } from "../supabase-backend.js";
import { sendMessageWithRetry } from "./sendMessageWithRetry.js";
import { getCurrentDateTime } from "./getCurrentDateTime.js";

// (D) helper para normalizar números já na criação dos envios
function normalizeNumber(phone) {
  let cleaned = String(phone || "").replace(/\D/g, "");
  if (!cleaned.startsWith("55")) cleaned = "55" + cleaned;
  if (cleaned.length === 13 && cleaned.startsWith("55")) {
    cleaned = cleaned.slice(0, 4) + cleaned.slice(5); // remove o 9
  }
  return cleaned;
}

export async function processScheduledMessages() {
  console.log(`[${getCurrentDateTime()}] Iniciando processamento de mensagens agendadas`);

  const { data: messages, error: fetchError } = await supabase
    .from("mensagem_evolution")
    .select("*")
    .or("status.is.null,status.eq.Scheduled");

  if (fetchError) {
    console.error(`[${getCurrentDateTime()}] Erro ao buscar campanhas:`, fetchError);
    return;
  }

  if (!messages || messages.length === 0) {
    console.log(`[${getCurrentDateTime()}] Nenhuma campanha agendada encontrada`);
    return;
  }

  for (const msg of messages) {
    try {
      console.log(`[${getCurrentDateTime()}] ➤ Campanha ${msg.id} (${msg.name})`);

      let { data: enviosPendentes, error: erroEnvio } = await supabase
        .from("envio_evolution")
        .select("*")
        .eq("id_mensagem", msg.id)
        .or("status.is.null,status.eq.Scheduled");

      if (erroEnvio) {
        console.error(`[${getCurrentDateTime()}] Erro ao buscar envios:`, erroEnvio);
        continue;
      }

      // Criar envios se não existirem
      if (!enviosPendentes || enviosPendentes.length === 0) {
        const { data: contatosData, error: contatosError } = await supabase
          .from("contato_evolution")
          .select("contatos")
          .eq("id", msg.contatos)
          .single();

        if (contatosError || !contatosData) {
          console.error(`[${getCurrentDateTime()}] Erro ao buscar contatos:`, contatosError);
          continue;
        }

        let contatos = [];
        try {
          contatos = JSON.parse(contatosData.contatos);
        } catch (error) {
          console.error(`[${getCurrentDateTime()}] Erro no parse de contatos:`, error);
          continue;
        }

        if (!contatos.length) {
          console.log(`[${getCurrentDateTime()}] Nenhum contato encontrado`);
          continue;
        }

        const enviosParaCriar = contatos.map((c) => ({
          id_mensagem: msg.id,
          contato: normalizeNumber(c.phone),
          status: "Scheduled",
        }));

        const { data: novosEnvios, error: criarEnviosError } = await supabase
          .from("envio_evolution")
          .insert(enviosParaCriar)
          .select();

        if (criarEnviosError) {
          console.error(`[${getCurrentDateTime()}] Erro ao criar envios:`, criarEnviosError);
          continue;
        }

        enviosPendentes = novosEnvios;
        console.log(`[${getCurrentDateTime()}] ${novosEnvios.length} envios criados`);
      }

      let successCount = 0;
      let errorCount = 0;
      const delaySec = Math.max(1, parseInt(msg.delay) || 1);

      for (const [index, envio] of enviosPendentes.entries()) {
        const contato = envio.contato;

        if (index > 0) {
          console.log(`[${getCurrentDateTime()}] Aguardando ${delaySec}s...`);
          await new Promise((res) => setTimeout(res, delaySec * 1000));
        }

        const result = await sendMessageWithRetry(
          msg.device_id,
          contato,
          msg.texto,
          msg.imagem || null
        );

        await supabase
          .from("envio_evolution")
          .update({
            status: result.success ? "success" : "error",
            erro: result.success ? null : result.error,
            data_envio: new Date().toISOString(),
          })
          .eq("id", envio.id);

        console.log(
          `[${getCurrentDateTime()}] [${result.success ? "✔" : "✖"}] ${contato}: ${result.success ? "Enviado" : result.error}`
        );

        result.success ? successCount++ : errorCount++;
      }

      const status =
        errorCount === 0
          ? "Completed"
          : successCount === 0
          ? "Failed"
          : "Partially Completed";

      await supabase.from("mensagem_evolution").update({ status }).eq("id", msg.id);

      console.log(
        `[${getCurrentDateTime()}] ✅ Campanha ${msg.id} finalizada. Sucessos: ${successCount}, Falhas: ${errorCount}`
      );
    } catch (error) {
      console.error(`[${getCurrentDateTime()}] Erro no processamento da campanha ${msg.id}:`, error);
    }
  }

  console.log(`[${getCurrentDateTime()}] ✅ Todas as campanhas processadas`);
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  processScheduledMessages().catch(console.error);
}
