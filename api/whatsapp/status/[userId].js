import { connections } from '../connect';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário não fornecido' });
    }

    const connection = connections.get(userId);

    if (!connection) {
      return res.status(404).json({ error: 'Conexão não encontrada' });
    }

    return res.status(200).json({
      status: connection.status,
      phoneNumber: connection.phoneNumber,
      connectionName: connection.connectionName
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return res.status(500).json({ error: 'Erro ao verificar status da conexão' });
  }
} 