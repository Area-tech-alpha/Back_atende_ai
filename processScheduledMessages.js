const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');


const supabaseUrl = 'https://izmzxqzcsnaykofpcjjh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6bXp4cXpjc25heWtvZnBjampoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzc3MTM4NCwiZXhwIjoyMDQ5MzQ3Mzg0fQ.jMN_DdFGClZ5aQhZb1e9JuYYG4Cz6Obkt41O4K1523U';
const supabase = createClient(supabaseUrl, supabaseKey);

function formatPhoneNumber(phone) {
  // Remove todos os caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '');
  
  // Se não começar com 55, adiciona
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  // Se o número tiver 13 dígitos (55 + DDD + 9 + número), remove o 9
  // Mantém os 4 primeiros (55 + DDD) e os últimos 8 dígitos
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    // 55 + DDD (2) + 9 + número (8)
    // Queremos: 55 + DDD (2) + número (8)
    cleaned = cleaned.slice(0, 4) + cleaned.slice(5);
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

async function getActiveDevice(deviceId) {
  try {
    // Verifica se existe o diretório de autenticação
    const authFolder = path.join(__dirname, 'auth', deviceId);
    if (!fs.existsSync(authFolder)) {
      console.log(`[${getCurrentDateTime()}] ⚠️ Diretório de autenticação não encontrado para ${deviceId}`);
      return null;
    }

    // Verifica se a instância está ativa
    const response = await fetch(`https://lionchat.tech/api/whatsapp/status/${deviceId}`);
    if (!response.ok) {
      console.log(`[${getCurrentDateTime()}] ⚠️ Instância ${deviceId} não está ativa`);
      return null;
    }

    const { status } = await response.json();
    if (status !== 'connected') {
      console.log(`[${getCurrentDateTime()}] ⚠️ Instância ${deviceId} não está conectada (estado: ${status})`);
      return null;
    }

    return deviceId;
  } catch (error) {
    console.error(`[${getCurrentDateTime()}] ❌ Erro ao verificar instância ${deviceId}:`, error);
    return null;
  }
}

async function sendMessageWithRetry(deviceId, number, message, imagemUrl, maxRetries = 3) {
  // Verifica se o dispositivo está ativo antes de tentar enviar
  const activeDevice = await getActiveDevice(deviceId);
  if (!activeDevice) {
    return { 
      success: false, 
      error: `Dispositivo ${deviceId} não está disponível ou não está conectado`
    };
  }

  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${getCurrentDateTime()}] 📤 Tentativa ${attempt}/${maxRetries} - Enviando mensagem para ${number}...`);
      
      const response = await fetch('https://lionchat.tech/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceId: activeDevice,
          number,
          message,
          imagemUrl
        })
      });

      console.log(`[${getCurrentDateTime()}] 📥 Resposta recebida: HTTP ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Aguarda a resposta completa e verifica se foi realmente um sucesso
      const responseData = await response.json();
      console.log(`[${getCurrentDateTime()}] ✅ Confirmação de envio recebida:`, responseData);

      return { success: true, data: responseData };
    } catch (error) {
      lastError = error;
      console.error(`[${getCurrentDateTime()}] [TENTATIVA ${attempt}/${maxRetries}] Erro ao enviar mensagem para ${number}:`, error);
      
      // Aguarda um tempo crescente entre as tentativas (1s, 2s, 4s)
      if (attempt < maxRetries) {
        console.log(`[${getCurrentDateTime()}] ⏳ Aguardando ${Math.pow(2, attempt - 1)} segundos antes da próxima tentativa...`);
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

// Função para remover números duplicados de uma lista de contatos
function removeDuplicateContacts(contatos) {
  const uniqueContacts = new Map();
  
  for (const contact of contatos) {
    const formattedPhone = formatPhoneNumber(contact.phone);
    if (!uniqueContacts.has(formattedPhone)) {
      uniqueContacts.set(formattedPhone, contact);
    }
  }
  
  return Array.from(uniqueContacts.values());
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
    console.error(`[${getCurrentDateTime()}] ❌ Erro ao buscar mensagens agendadas:`, error);
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
      // Verifica se o dispositivo está disponível antes de processar a campanha
      const activeDevice = await getActiveDevice(msg.device_id);
      if (!activeDevice) {
        console.log(`[${getCurrentDateTime()}] ⚠️ Pulando campanha ${msg.id} - dispositivo ${msg.device_id} não está disponível`);
        continue;
      }

      const { data: contatosData, error: contatosError } = await supabase
        .from('contato_evolution')
        .select('*')
        .eq('id', msg.contatos)
        .single();
      
      if (contatosError) throw contatosError;
      
      // Remove números duplicados da lista de contatos
      const contatos = JSON.parse(contatosData.contatos);
      const uniqueContatos = removeDuplicateContacts(contatos);
      
      if (uniqueContatos.length < contatos.length) {
        console.log(`[${getCurrentDateTime()}] ℹ️ Removidos ${contatos.length - uniqueContatos.length} números duplicados da campanha ${msg.id}`);
      }
      
      console.log(`[${getCurrentDateTime()}] 👥 Campanha possui ${uniqueContatos.length} contatos únicos para envio.`);

      let successCount = 0;
      let errorCount = 0;
      const messageDelay = msg.delay || 60; // Usa o campo 'delay' configurado ou 60 segundos por padrão

      console.log(`[${getCurrentDateTime()}] ⏱️ Intervalo configurado: ${messageDelay} segundos`);

      for (const [index, contact] of uniqueContatos.entries()) {
        const formattedPhone = formatPhoneNumber(contact.phone);

        // Verifica se já existe um envio para este contato nesta campanha
        const { data: existingSend } = await supabase
          .from('envio_evolution')
          .select('id')
          .eq('id_mensagem', msg.id)
          .eq('contato', formattedPhone)
          .single();

        if (existingSend) {
          console.log(`[${getCurrentDateTime()}] ⚠️ Envio duplicado detectado para ${formattedPhone} na campanha ${msg.id}`);
          continue;
        }

        if (index > 0 && messageDelay > 0) {
          console.log(`[${getCurrentDateTime()}] ⏳ Aguardando ${messageDelay} segundos antes do próximo envio...`);
          await new Promise(resolve => setTimeout(resolve, messageDelay * 1000));
        }

        console.log(`[${getCurrentDateTime()}] 📱 Enviando mensagem ${index + 1}/${uniqueContatos.length} para ${formattedPhone}...`);
        
        // Envia a mensagem e aguarda a confirmação
        const result = await sendMessageWithRetry(
          msg.device_id,
          formattedPhone,
          msg.texto,
          msg.imagem || null
        );

        // Só registra no banco após receber a confirmação
        await supabase
          .from('envio_evolution')
          .insert([{
            id_mensagem: msg.id,
            contato: formattedPhone,
            status: result.success ? 'success' : 'error',
            erro: result.success ? null : result.error
          }]);

        if (result.success) {
          successCount++;
          console.log(`[${getCurrentDateTime()}] ✅ Mensagem ${index + 1}/${uniqueContatos.length} enviada com sucesso para ${formattedPhone}`);
        } else {
          errorCount++;
          console.error(`[${getCurrentDateTime()}] ❌ Falha ao enviar mensagem ${index + 1}/${uniqueContatos.length} para ${formattedPhone}: ${result.error}`);
        }

        console.log(`[${getCurrentDateTime()}] ⏸️ Aguardando confirmação antes de prosseguir para a próxima mensagem...`);
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