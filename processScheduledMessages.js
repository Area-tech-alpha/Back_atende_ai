import { supabase } from "./src/lib/supabase-backend.js";
import { sendMessageWithRetry } from "./utils/sendMessageWithRetry.js";
import { getCurrentDateTime } from "./utils/getCurrentDateTime.js";

// (D) helper para normalizar números já na criação dos envios
function normalizeNumber(phone) {
  let cleaned = String(phone || "").replace(/\D/g, "");
  if (!cleaned.startsWith("55")) cleaned = "55" + cleaned;
  // regra opcional: se vier 13 dígitos (55 + DDD + 9 + número), remove o 9
  if (cleaned.length === 13 && cleaned.startsWith("55")) {
    cleaned = cleaned.slice(0, 4) + cleaned.slice(5);
  }
  return cleaned;
}

export async function processScheduledMessages() {
  console.log(
    `[${getCurrentDateTime()}] TESTE: Função processScheduledMessages iniciada`
  );
  console.log(
    `[${getCurrentDateTime()}] Iniciando processamento de mensagens agendadas...`
  );

  const { data: messages, error: fetchError } = await supabase
    .from("mensagem_evolution")
    .select("*")
    .or("status.is.null,status.eq.Scheduled"); // <- faltava ;

  if (fetchError) {
    console.error(
      `[${getCurrentDateTime()}] Erro ao buscar campanhas agendadas:`,
      fetchError
    );
    return;
  }

  console.log(
    `[${getCurrentDateTime()}] Encontradas ${
      messages?.length || 0
    } campanhas agendadas`
  );

  if (!messages || messages.length === 0) {
    console.log(
      `[${getCurrentDateTime()}] Nenhuma campanha agendada encontrada`
    );
    return;
  }

  for (const msg of messages) {
    try {
      console.log(
        `[${getCurrentDateTime()}] Processando campanha ID ${msg.id} (${
          msg.name
        })`
      );

      // Buscar envios pendentes já cadastrados
      let { data: enviosPendentes, error: erroEnvio } = await supabase
        .from("envio_evolution")
        .select("*")
        .eq("id_mensagem", msg.id)
        .or("status.is.null,status.eq.Scheduled"); // <- substitui IN por OR + corrige ;

      if (erroEnvio) {
        console.error(
          `[${getCurrentDateTime()}] Erro ao buscar envios pendentes:`,
          erroEnvio
        );
        throw erroEnvio;
      }

      // Se não há envios pendentes, criar automaticamente
      if (!enviosPendentes || enviosPendentes.length === 0) {
        console.log(
          `[${getCurrentDateTime()}] Nenhum envio pendente encontrado para a campanha ${
            msg.id
          }. Criando envios automaticamente...`
        );

        // Buscar contatos da campanha
        const { data: contatosData, error: contatosError } = await supabase
          .from("contato_evolution")
          .select("contatos")
          .eq("id", msg.contatos)
          .single();

        if (contatosError || !contatosData) {
          console.error(
            `[${getCurrentDateTime()}] Erro ao buscar contatos para campanha ${
              msg.id
            }:`,
            contatosError
          );
          continue;
        }

        // Parsear contatos
        let contatos = [];
        try {
          contatos = JSON.parse(contatosData.contatos);
        } catch (error) {
          console.error(
            `[${getCurrentDateTime()}] Erro ao parsear contatos para campanha ${
              msg.id
            }:`,
            error
          );
          continue;
        }

        if (!contatos || contatos.length === 0) {
          console.log(
            `[${getCurrentDateTime()}] Nenhum contato encontrado para campanha ${
              msg.id
            }`
          );
          continue;
        }

        // (D) Criar envios para cada contato **já normalizando** o número
        const enviosParaCriar = contatos.map((contato) => ({
          id_mensagem: msg.id,
          contato: normalizeNumber(contato.phone),
          status: "Scheduled",
        }));

        const { data: novosEnvios, error: criarEnviosError } = await supabase
          .from("envio_evolution")
          .insert(enviosParaCriar)
          .select();

        if (criarEnviosError) {
          console.error(
            `[${getCurrentDateTime()}] Erro ao criar envios para campanha ${
              msg.id
            }:`,
            criarEnviosError
          );
          continue;
        }

        console.log(
          `[${getCurrentDateTime()}] Criados ${
            novosEnvios.length
          } envios para campanha ${msg.id}`
        );
        enviosPendentes = novosEnvios;
      }

      console.log(
        `[${getCurrentDateTime()}] ${
          enviosPendentes.length
        } envios pendentes encontrados`
      );

      let successCount = 0;
      let errorCount = 0;

      // (C) Delay padrão seguro (mínimo 1s)
      const delaySec = Number(msg.delay) > 0 ? Number(msg.delay) : 1;
      console.log(
        `[${getCurrentDateTime()}] Intervalo configurado: ${delaySec} segundos`
      );

      for (const [index, envio] of enviosPendentes.entries()) {
        const contato = envio.contato;
        console.log(
          `[${getCurrentDateTime()}] Processando contato: ${contato}`
        );

        if (index > 0 && delaySec > 0) {
          console.log(
            `[${getCurrentDateTime()}] Aguardando ${delaySec} segundos...`
          );
          await new Promise((resolve) => setTimeout(resolve, delaySec * 1000));
        }

        console.log(
          `[${getCurrentDateTime()}] Enviando mensagem para ${contato} usando device_id: ${
            msg.device_id
          }`
        );

        const result = await sendMessageWithRetry(
          msg.device_id,
          contato,
          msg.texto,
          msg.imagem || null
        );

        console.log(
          `[${getCurrentDateTime()}] Resultado do envio para ${contato}:`,
          result
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

  console.log(
    `[${getCurrentDateTime()}] Processamento de mensagens agendadas concluído`
  );
}

// Executar se chamado diretamente
console.log("Executando processScheduledMessages...");
processScheduledMessages().catch(console.error);
