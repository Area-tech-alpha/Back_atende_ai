import { processScheduledMessages } from '../../utils/processScheduledMessages';

export default async function handler(req, res) {
  // Verificação de Segurança (essencial!)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).send('Unauthorized');
  }

  try {
    // Chama a função que faz o trabalho pesado
    await processScheduledMessages();
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Erro no Cron Job:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
}
