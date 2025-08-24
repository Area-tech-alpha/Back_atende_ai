import { getSupabase, sendMessage } from '../src/services/whatsappService.js';
import dotenv from 'dotenv';
dotenv.config();

const apiUrl = process.env.INTERNAL_API_URL || 'http://localhost:3000';
const supabase = getSupabase();

function normalizeNumber(phone) {
  let cleaned = String(phone || '').replace(/\D/g, '');
  if (!cleaned.startsWith('55')) cleaned = '55' + cleaned;
  return cleaned;
}

export async function processScheduledMessages() {
  console.log(`[WORKER] Iniciando processamento de mensagens agendadas`);

  const { data: messages, error: fetchError } = await supabase
    .from('mensagem_evolution')
    .select('*')
    .in('status', ['Scheduled', 'Rascunho']);

  if (fetchError) {
    console.error(`[WORKER] Erro ao buscar campanhas:`, fetchError);
    return;
  }

  if (!messages || messages.length === 0) {
    console.log(`[WORKER] Nenhuma campanha agendada encontrada.`);
    return;
  }

  for (const msg of messages) {
    try {
      console.log(`[WORKER] ➤ Processando Campanha ${msg.id} (${msg.name})`);

      await supabase.from('mensagem_evolution').update({ status: 'Em Andamento' }).eq('id', msg.id);

      const { data: contatosData, error: contatosError } = await supabase
        .from('contato_evolution')
        .select('contatos')
        .eq('id', msg.contatos)
        .single();

      if (contatosError || !contatosData) {
        throw new Error(`Erro ao buscar contatos: ${contatosError?.message}`);
      }

      const contatos = JSON.parse(contatosData.contatos);
      if (!contatos.length) {
        console.log(`[WORKER] Campanha ${msg.id} sem contatos. Finalizando.`);
        await supabase.from('mensagem_evolution').update({ status: 'Concluída' }).eq('id', msg.id);
        continue;
      }

      let successCount = 0;
      let errorCount = 0;
      const delaySec = Math.max(1, parseInt(msg.delay) || 5);

      for (const [index, contato] of contatos.entries()) {
        const numero = normalizeNumber(contato.phone);

        if (index > 0) {
          await new Promise(res => setTimeout(res, delaySec * 1000));
        }

        console.log(`[WORKER] Enviando para ${numero} via device ${msg.device_id}`);

        let result = { sucess: false, error: 'Erro desconhecido' };
        try {
          const response = await fetch(`${apiUrl}/api/whatsapp/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              deviceId: msg.device_id,
              number: numero,
              message: msg.texto,
              imageUrl: msg.imagem || null
            })
          });

          result = await response.json();
        } catch (e) {
          result.error = e.message;
          console.error(`[WORKER] Erro ao chamar a API de envio:`, e);
        }

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
        console.log(`[WORKER] [${result.success ? '✔' : '✖'}] ${numero}: ${result.success ? 'Enviado' : result.error}`);
      }

      const finalStatus = errorCount === 0 ? 'Concluída' : 'Concluída com erros';
      await supabase.from('mensagem_evolution').update({ status: finalStatus }).eq('id', msg.id);

      console.log(`[WORKER] ✅ Campanha ${msg.id} finalizada. Sucessos: ${successCount}, Falhas: ${errorCount}`);
    } catch (error) {
      console.error(`[WORKER] Erro grave no processamento da campanha ${msg.id}:`, error.message);
      await supabase.from('mensagem_evolution').update({ status: 'Falhou' }).eq('id', msg.id);
    }
  }
  console.log(`[WORKER] ✅ Processamento de campanhas finalizado.`);
}

processScheduledMessages();
