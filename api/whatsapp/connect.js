import { createClient } from '@whatsapp/client';
import { generateQR } from '@whatsapp/client/qr';

export const connections = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { userId, phoneNumber, connectionName } = req.body;

    if (!userId || !phoneNumber) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Verificar se já existe uma conexão para este usuário
    if (connections.has(userId)) {
      const existingConnection = connections.get(userId);
      if (existingConnection.status === 'connected') {
        return res.status(200).json({ connected: true });
      }
    }

    // Criar nova conexão
    const client = createClient({
      auth: {
        userId,
        phoneNumber,
        connectionName
      }
    });

    // Listeners de status
    client.on('ready', () => {
      const conn = connections.get(userId);
      if (conn) {
        connections.set(userId, {
          ...conn,
          status: 'connected'
        });
      }
    });

    client.on('disconnected', () => {
      const conn = connections.get(userId);
      if (conn) {
        connections.set(userId, {
          ...conn,
          status: 'disconnected'
        });
      }
    });

    // Gerar QR Code
    const qrCode = await generateQR(client);

    // Armazenar conexão
    connections.set(userId, {
      client,
      status: 'pending',
      phoneNumber,
      connectionName
    });

    return res.status(200).json({ qrCode });
  } catch (error) {
    console.error('Erro ao conectar WhatsApp:', error);
    return res.status(500).json({ error: 'Erro ao conectar WhatsApp' });
  }
}
