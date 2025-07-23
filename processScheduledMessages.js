async function processScheduledMessages() {
  console.log(`\n[${getCurrentDateTime()}] Verificando mensagens agendadas...`);

  const now = new Date().toISOString();
  const { data: messages, error } = await supabase
    .from("mensagem_evolution")
    .select("*")
    .lte("data_de_envio", now)
    .or("status.is.null,status.eq.Scheduled");

  if (error) {
    console.error(
      `[${getCurrentDateTime()}] Erro ao buscar mensagens agendadas:`,
      error
    );
    return;
  }

  if (!messages || messages.length === 0) {
    console.log(
      `[${getCurrentDateTime()}] Nenhuma mensagem agendada encontrada para envio.`
    );
    return;
  }

  console.log(
    `[${getCurrentDateTime()}] Encontradas ${
      messages.length
    } mensagens para processar.`
  );

  for (const msg of messages) {
    if (processingCampaigns.has(msg.id)) {
      console.log(
        `[${getCurrentDateTime()}] Campanha ${
          msg.id
        } já está sendo processada, pulando...`
      );
      continue;
    }

    processingCampaigns.add(msg.id);

    console.log(
      `[${getCurrentDateTime()}] Processando campanha ${msg.id} - "${
        msg.name || "Sem nome"
      }"`
    );

    try {
      const activeDevice = await getActiveDevice(msg.device_id);
      if (!activeDevice) {
        console.log(
          `[${getCurrentDateTime()}] Pulando campanha ${msg.id} - dispositivo ${
            msg.device_id
          } não está disponível`
        );
        continue;
      }

      const { data: contatosData, error: contatosError } = await supabase
        .from("contato_evolution")
        .select("*")
        .eq("id", msg.contatos)
        .single();

      if (contatosError) throw contatosError;

      const contatos = JSON.parse(contatosData.contatos);
      const uniqueContatos = removeDuplicateContacts(contatos);

      if (uniqueContatos.length < contatos.length) {
        console.log(
          `[${getCurrentDateTime()}] Removidos ${
            contatos.length - uniqueContatos.length
          } números duplicados da campanha ${msg.id}`
        );
      }

      console.log(
        `[${getCurrentDateTime()}] Campanha possui ${
          uniqueContatos.length
        } contatos únicos para envio.`
      );

      let successCount = 0;
      let errorCount = 0;
      const messageDelay = msg.delay || 60;

      console.log(
        `[${getCurrentDateTime()}] Intervalo configurado: ${messageDelay} segundos`
      );

      for (const [index, contact] of uniqueContatos.entries()) {
        const formattedPhone = formatPhoneNumber(contact.phone);

        if (index > 0 && messageDelay > 0) {
          console.log(
            `[${getCurrentDateTime()}] Aguardando ${messageDelay} segundos antes do próximo envio...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, messageDelay * 1000)
          );
        }

        console.log(
          `[${getCurrentDateTime()}] Enviando mensagem ${index + 1}/${
            uniqueContatos.length
          } para ${formattedPhone}...`
        );

        const result = await sendMessageWithRetry(
          msg.device_id,
          formattedPhone,
          msg.texto,
          msg.imagem || null
        );

        await supabase.from("envio_evolution").upsert(
          [
            {
              id_mensagem: msg.id,
              contato: formattedPhone,
              status: result.success ? "success" : "error",
              erro: result.success ? null : result.error,
            },
          ],
          {
            onConflict: "id_mensagem,contato",
          }
        );

        if (result.success) {
          successCount++;
          console.log(
            `[${getCurrentDateTime()}] Mensagem ${index + 1}/${
              uniqueContatos.length
            } enviada com sucesso para ${formattedPhone}`
          );
        } else {
          errorCount++;
          console.error(
            `[${getCurrentDateTime()}] Falha ao enviar mensagem ${index + 1}/${
              uniqueContatos.length
            } para ${formattedPhone}: ${result.error}`
          );
        }

        console.log(
          `[${getCurrentDateTime()}] Aguardando confirmação antes de prosseguir para a próxima mensagem...`
        );
      }

      const status =
        errorCount === 0
          ? "Completed"
          : successCount === 0
          ? "Failed"
          : "Partially Completed";

      const { error: updateError } = await supabase
        .from("mensagem_evolution")
        .update({ status })
        .eq("id", msg.id);

      if (updateError) {
        console.error(
          `[${getCurrentDateTime()}] Erro ao atualizar status da campanha ${
            msg.id
          }:`,
          updateError.message
        );
      }

      console.log(
        `[${getCurrentDateTime()}] Campanha ${msg.id} finalizada: ${status}`
      );
      console.log(
        `[${getCurrentDateTime()}] Estatísticas: ${successCount} sucessos, ${errorCount} erros`
      );
    } catch (err) {
      console.error(
        `[${getCurrentDateTime()}] Erro inesperado ao processar campanha ${
          msg.id
        }:`,
        err
      );

      await supabase
        .from("mensagem_evolution")
        .update({ status: "Failed" })
        .eq("id", msg.id);
    } finally {
      processingCampaigns.delete(msg.id);
    }
  }
}

const CHECK_INTERVAL = 60000;

function cleanupRecentSends() {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  for (const [key, timestamp] of recentSends.entries()) {
    if (timestamp < oneHourAgo) {
      recentSends.delete(key);
    }
  }

  console.log(
    `[${getCurrentDateTime()}] Cache limpo. Entradas restantes: ${
      recentSends.size
    }`
  );
}

async function startScheduler() {
  console.log(`[${getCurrentDateTime()}] Iniciando agendador de mensagens...`);
  console.log(
    `[${getCurrentDateTime()}] Verificando mensagens a cada ${
      CHECK_INTERVAL / 1000
    } segundos`
  );

  await processScheduledMessages();

  setInterval(processScheduledMessages, CHECK_INTERVAL);
  setInterval(cleanupRecentSends, 30 * 60 * 1000);
}

startScheduler().catch((error) => {
  console.error(
    `[${getCurrentDateTime()}] Erro fatal ao iniciar agendador:`,
    error
  );
  process.exit(1);
});
