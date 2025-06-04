import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { MoreVertical } from 'lucide-react';

interface WhatsAppConnection {
  id: string;
  phone_number: string;
  connection_name: string;
  status: 'connected' | 'disconnected' | 'pending';
  last_connected_at: string;
  created_at: string;
  deviceId?: string;
}

const WhatsAppConnections: React.FC = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchConnections = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.whatsapp.devices);
      if (!response.ok) {
        throw new Error('Erro ao buscar conexões');
      }
      const data = await response.json();
      setConnections(data.devices);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao buscar conexões');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchConnections, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-500';
      case 'disconnected':
        return 'text-red-500';
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'disconnected':
        return 'Desconectado';
      case 'pending':
        return 'Aguardando conexão';
      default:
        return status;
    }
  };

  // Função para excluir/desconectar conexão
  const handleDeleteConnection = async (deviceId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conexão?')) return;
    try {
      const response = await fetch(`/api/whatsapp/session/${deviceId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao excluir conexão');
      fetchConnections();
    } catch (err) {
      alert('Erro ao excluir conexão');
    }
  };

  const handleDisconnectConnection = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/session/${deviceId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao desconectar');
      fetchConnections();
    } catch (err) {
      alert('Erro ao desconectar');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Conexões WhatsApp</h1>

      <div className="bg-secondary rounded-xl p-6 shadow-soft border border-secondary-dark">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-primary text-center py-4">{error}</div>
        ) : connections.length === 0 ? (
          <div className="text-accent/80 text-center py-4">
            Nenhuma conexão encontrada
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => (
              <div
                key={connection.deviceId || connection.id}
                className="bg-secondary-dark rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-medium text-accent text-lg">{connection.connection_name || 'Sem nome'}</h3>
                  <p className="text-accent/60 text-sm">{connection.deviceId || connection.id}</p>
                </div>
                <div className="flex items-center space-x-4 relative">
                  <span className={`${getStatusColor(connection.status)} font-medium`}>
                    {getStatusText(connection.status)}
                  </span>
                  <button
                    className="ml-2 p-1 rounded-full hover:bg-gray-200 transition"
                    onClick={() => setOpenMenuId(openMenuId === (connection.deviceId || connection.id) ? null : (connection.deviceId || connection.id))}
                  >
                    <MoreVertical size={22} />
                  </button>
                  {openMenuId === (connection.deviceId || connection.id) && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-[120px]">
                      <button
                        className="block w-full text-left px-4 py-2 text-yellow-700 hover:bg-yellow-50"
                        onClick={() => { setOpenMenuId(null); handleDisconnectConnection(connection.deviceId || connection.id); }}
                      >
                        Desconectar
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                        onClick={() => { setOpenMenuId(null); handleDeleteConnection(connection.deviceId || connection.id); }}
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                  <button
                    className="ml-2 text-red-600 hover:text-red-800 text-sm font-medium"
                    onClick={() => handleDeleteConnection(connection.deviceId || connection.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppConnections; 