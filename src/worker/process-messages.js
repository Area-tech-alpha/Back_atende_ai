import { processScheduledMessages } from '../../utils/processScheduledMessages';

// Função principal que a Vercel irá chamar
export default async function handler(req, res) {
  // 1. Verificação de Segurança
  // A Vercel chamará a URL com ?cron_secret=...
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Acesso não autorizado' });
  }

  // 2. Executar a Lógica do Worker
  try {
    console.log('[CRON JOB] Iniciando processamento de mensagens agendadas...');
    // Chame sua lógica principal que busca e envia as mensagens
    await processScheduledMessages();
    console.log('[CRON JOB] Processamento finalizado com sucesso.');
    // Responda com sucesso
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[CRON JOB] Erro durante a execução:', error);
    // Em caso de erro, informe que a tarefa falhou
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
