import { supabase } from "../lib/supabase.js";
import { sendMessageWithRetry } from "../utils/sendMessageWithRetry.js";
import { getCurrentDateTime } from "../utils/getCurrentDateTime.js";

export async function processScheduledMessages() {
  const { data: messages, error: fetchError } = await supabase
    .from("mensagem_evolution")
    .select("*")
    .eq("status", "Scheduled");

  if (fetchError) {
    console.error(
      `[${getCurrentDateTime()}] Erro ao buscar campanhas agendadas:`,
      fetchError
    );
    return;
  }

  for (const msg of messages) {
    try {
      console.log(
        `[${getCurrentDateTime()}] Processando campanha ID ${msg.id} (${
          msg.nome
        })`
      );

      // Buscar envios pendentes já cadastrados
      const { data: enviosPendentes, error: erroEnvio } = await supabase
        .from("envio_evolution")
        .select("*")
        .eq("id_mensagem", msg.id)
        .in("status", [null, "Scheduled"]);

      if (erroEnvio) throw erroEnvio;

      if (!enviosPendentes || enviosPendentes.length === 0) {
        console.log(
          `[${getCurrentDateTime()}] Nenhum envio pendente encontrado para a campanha ${
            msg.id
          }`
        );
        continue;
      }

      console.log(
        `[${getCurrentDateTime()}] ${
          enviosPendentes.length
        } envios pendentes encontrados`
      );

      let successCount = 0;
      let errorCount = 0;

      for (const [index, envio] of enviosPendentes.entries()) {
        const contato = envio.contato;

        if (index > 0 && msg.delay > 0) {
          console.log(
            `[${getCurrentDateTime()}] Aguardando ${msg.delay} segundos...`
          );
          await new Promise((resolve) => setTimeout(resolve, msg.delay * 1000));
        }

        console.log(
          `[${getCurrentDateTime()}] Enviando mensagem para ${contato}`
        );

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

        if (result.success) {
          successCount++;
          console.log(`[${getCurrentDateTime()}] Sucesso: ${contato}`);
        } else {
          errorCount++;
          console.error(
            `[${getCurrentDateTime()}] Erro ao enviar para ${contato}: ${
              result.error
            }`
          );
        }
      }

      // Atualizar status da campanha
      const status =
        errorCount === 0
          ? "Completed"
          : successCount === 0
          ? "Failed"
          : "Partially Completed";

      await supabase
        .from("mensagem_evolution")
        .update({ status })
        .eq("id", msg.id);

      console.log(
        `[${getCurrentDateTime()}] Envio concluído para campanha ${
          msg.id
        }. Sucessos: ${successCount}, Erros: ${errorCount}`
      );
    } catch (error) {
      console.error(
        `[${getCurrentDateTime()}] Erro ao processar campanha ${msg.id}:`,
        error
      );
    }
  }
}
