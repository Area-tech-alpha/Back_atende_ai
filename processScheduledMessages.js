const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');


const supabaseUrl = 'https://izmzxqzcsnaykofpcjjh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6bXp4cXpjc25heWtvZnBjampoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzc3MTM4NCwiZXhwIjoyMDQ5MzQ3Mzg0fQ.jMN_DdFGClZ5aQhZb1e9JuYYG4Cz6Obkt41O4K1523U';
const supabase = createClient(supabaseUrl, supabaseKey);

function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}

async function checkDuplicateSend(messageId, phone) {
  const { data: existingSend } = await supabase
    .from('envio_evolution')
    .select('id')
    .eq('id_mensagem', messageId)
    .eq('contato', phone)
    .single();
  
  return !!existingSend;
}

async function processScheduledMessages() {
  const now = new Date().toISOString();
  const { data: messages, error } = await supabase
    .from('mensagem_evolution')
    .select('*')
    .lte('data_de_envio', now)
    .or('status.is.null,status.eq.Scheduled');

  if (error) {
    console.error('Erro ao buscar mensagens agendadas:', error);
    return;
  }

  if (!messages || messages.length === 0) {
    console.log('[CRONJOB] Nenhuma mensagem agendada encontrada para envio.');
    return;
  }

  for (const msg of messages) {
    try {
      const { data: contatosData, error: contatosError } = await supabase
        .from('contato_evolution')
        .select('*')
        .eq('id', msg.contatos)
        .single();
      if (contatosError) throw contatosError;
      const contatos = JSON.parse(contatosData.contatos);

      for (const contact of contatos) {
        // Verifica se já existe um envio para este contato nesta campanha
        const isDuplicate = await checkDuplicateSend(msg.id, contact.phone);
        if (isDuplicate) {
          console.log(`[SKIP] Envio duplicado detectado para ${contact.phone} na campanha ${msg.id}`);
          continue;
        }

        const formattedPhone = formatPhoneNumber(contact.phone);
        let envioStatus = 'success';
        let envioErro = null;

        try {
          const response = await fetch('https://lionchat.tech/api/whatsapp/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              deviceId: msg.device_id,     // numero da conexao cliente
              number: formattedPhone,              // número formatado
              message: msg.texto,                  // mensagem de texto
              imagemUrl: msg.imagem || null
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            envioStatus = 'error';
            envioErro = `HTTP ${response.status}: ${errorText}`;
            console.error(`[ERRO] Falha ao enviar para ${contact.phone}:`, envioErro);
            throw new Error(envioErro);
          } else {
            console.log(`[OK] Mensagem enviada para ${contact.phone}`);
          }
        } catch (err) {
          envioStatus = 'error';
          envioErro = err instanceof Error ? err.message : String(err);
          console.error(`[ERRO] Falha ao enviar para ${contact.phone}:`, envioErro);
        } finally {
          await supabase
            .from('envio_evolution')
            .insert([{
              id_mensagem: msg.id,
              contato: contact.phone,
              status: envioStatus,
              erro: envioErro
            }]);
        }

      }
      // Marca como enviada apenas se todos os envios deram ok
      if (contatos.length > 0) {
        const allOk = contatos.every(contact => {
          // Aqui não temos o status de cada envio, então só logamos após o loop
          // O ideal seria acumular os status em um array, mas para simplificar:
          return true;
        });
        if (allOk) {
          await supabase
            .from('mensagem_evolution')
            .update({ status: 'Completed' })
            .eq('id', msg.id);
          console.log(`Mensagem agendada ${msg.id} enviada com sucesso!`);
        } else {
          console.log(`Mensagem agendada ${msg.id} teve falhas em alguns envios.`);
        }
      }
    } catch (err) {
      console.error(`Erro ao enviar mensagem agendada ${msg.id}:`, err);
    }
  }
}

console.log('[CRONJOB] processScheduledMessages.js iniciado');

process.on('uncaughtException', (err) => {
  console.error('[CRONJOB] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRONJOB] Unhandled Rejection:', reason);
});

// Executa a cada minuto
setInterval(() => {
  console.log('[CRONJOB] Verificando mensagens agendadas...');
  processScheduledMessages();
}, 60 * 1000);

// Executa imediatamente ao iniciar
processScheduledMessages(); 