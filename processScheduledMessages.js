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

async function sendMessageWithRetry(deviceId, number, message, imagemUrl, maxRetries = 3) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://lionchat.tech/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceId,
          number,
          message,
          imagemUrl
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return { success: true };
    } catch (error) {
      lastError = error;
      console.error(`[TENTATIVA ${attempt}/${maxRetries}] Erro ao enviar mensagem para ${number}:`, error);
      
      // Aguarda um tempo crescente entre as tentativas (1s, 2s, 4s)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  return { 
    success: false, 
    error: lastError instanceof Error ? lastError.message : String(lastError)
  };
}

console.log('🚀 Iniciando CRONJOB de processamento de mensagens agendadas...');

// Função para formatar a data atual
function getCurrentDateTime() {
  const now = new Date();
  return now.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour12: false
  });
}

async function processScheduledMessages() {
  console.log(`\n[${getCurrentDateTime()}] 🔍 Verificando mensagens agendadas...`);
  
  const now = new Date().toISOString();
  const { data: messages, error } = await supabase
    .from('mensagem_evolution')
    .select('*')
    .lte('data_de_envio', now)
    .or('status.is.null,status.eq.Scheduled');

  if (error) {
    console.error('❌ Erro ao buscar mensagens agendadas:', error);
    return;
  }

  if (!messages || messages.length === 0) {
    console.log(`[${getCurrentDateTime()}] ℹ️ Nenhuma mensagem agendada encontrada para envio.`);
    return;
  }

  console.log(`[${getCurrentDateTime()}] 📨 Encontradas ${messages.length} mensagens para processar.`);

  for (const msg of messages) {
    console.log(`\n[${getCurrentDateTime()}] 📝 Processando campanha ${msg.id} - "${msg.name || 'Sem nome'}"`);
    
    try {
      const { data: contatosData, error: contatosError } = await supabase
        .from('contato_evolution')
        .select('*')
        .eq('id', msg.contatos)
        .single();
      
      if (contatosError) throw contatosError;
      const contatos = JSON.parse(contatosData.contatos);
      console.log(`[${getCurrentDateTime()}] 👥 Campanha possui ${contatos.length} contatos para envio.`);

      let successCount = 0;
      let errorCount = 0;

      for (const contact of contatos) {
        // Verifica se já existe um envio para este contato nesta campanha
        const isDuplicate = await checkDuplicateSend(msg.id, contact.phone);
        if (isDuplicate) {
          console.log(`[${getCurrentDateTime()}] ⚠️ Envio duplicado detectado para ${contact.phone} na campanha ${msg.id}`);
          continue;
        }

        const formattedPhone = formatPhoneNumber(contact.phone);
        console.log(`[${getCurrentDateTime()}] 📱 Enviando mensagem para ${formattedPhone}...`);
        
        const result = await sendMessageWithRetry(
          msg.device_id,
          formattedPhone,
          msg.texto,
          msg.imagem || null
        );

        await supabase
          .from('envio_evolution')
          .insert([{
            id_mensagem: msg.id,
            contato: contact.phone,
            status: result.success ? 'success' : 'error',
            erro: result.success ? null : result.error
          }]);

        if (result.success) {
          successCount++;
          console.log(`[${getCurrentDateTime()}] ✅ Mensagem enviada com sucesso para ${formattedPhone}`);
        } else {
          errorCount++;
          console.error(`[${getCurrentDateTime()}] ❌ Falha ao enviar mensagem para ${formattedPhone}: ${result.error}`);
        }
      }

      // Atualiza o status da campanha baseado no resultado dos envios
      const status = errorCount === 0 ? 'Completed' : 
                    successCount === 0 ? 'Failed' : 'Partially Completed';
      
      await supabase
        .from('mensagem_evolution')
        .update({ status })
        .eq('id', msg.id);

      console.log(`[${getCurrentDateTime()}] 📊 Campanha ${msg.id} finalizada: ${status}`);
      console.log(`[${getCurrentDateTime()}] 📈 Estatísticas: ${successCount} sucessos, ${errorCount} erros`);
    } catch (err) {
      console.error(`[${getCurrentDateTime()}] ❌ Erro ao processar campanha ${msg.id}:`, err);
      await supabase
        .from('mensagem_evolution')
        .update({ status: 'Failed' })
        .eq('id', msg.id);
    }
  }
}

// Configura o intervalo de verificação (a cada 1 minuto)
const CHECK_INTERVAL = 60000; // 1 minuto em milissegundos

// Função para iniciar o loop de verificação
async function startScheduler() {
  console.log(`[${getCurrentDateTime()}] ⏰ Iniciando agendador de mensagens...`);
  console.log(`[${getCurrentDateTime()}] ⏱️ Verificando mensagens a cada ${CHECK_INTERVAL/1000} segundos`);
  
  // Executa imediatamente na primeira vez
  await processScheduledMessages();
  
  // Configura o intervalo para execuções subsequentes
  setInterval(processScheduledMessages, CHECK_INTERVAL);
}

// Inicia o agendador
startScheduler().catch(error => {
  console.error(`[${getCurrentDateTime()}] ❌ Erro fatal ao iniciar agendador:`, error);
  process.exit(1);
}); 