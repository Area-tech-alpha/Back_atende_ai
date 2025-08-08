import React, { useEffect, useState, useCallback } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Envio {
  id: number;
  contato: string;
  status: string;
  data_envio: string;
  erro: string | null;
}

interface CampaignDetailsModalProps {
  campaignId: number;
  open: boolean;
  onClose: () => void;
}

const statusMap: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  success: {
    color: 'text-green-500',
    icon: <CheckCircle className="w-4 h-4 mr-1" />, label: 'Enviado'
  },
  error: {
    color: 'text-red-500',
    icon: <AlertCircle className="w-4 h-4 mr-1" />, label: 'Erro'
  },
  read: {
    color: 'text-blue-500',
    icon: <Eye className="w-4 h-4 mr-1" />, label: 'Lido'
  },
};

const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({ campaignId, open, onClose }) => {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);

  // A função fetchEnvios foi encapsulada em useCallback para evitar
  // que ela seja recriada em cada render, o que causaria um loop infinito
  // no useEffect.
  const fetchEnvios = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('envio_evolution')
      .select('*')
      .eq('id_mensagem', campaignId)
      .order('data_envio', { ascending: true });
    if (!error && data) setEnvios(data);
    setLoading(false);
  }, [campaignId]); // campaignId é a única dependência da função

  useEffect(() => {
    if (open) {
      fetchEnvios();
    }
  }, [open, fetchEnvios]); // fetchEnvios foi adicionado como dependência do useEffect.

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-secondary-dark w-full max-w-2xl relative p-0 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-secondary-dark bg-gradient-to-r from-primary/10 to-yellow-50">
          <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            Detalhes dos Envios
          </h2>
          <button
            className="text-accent/60 hover:text-primary transition-colors duration-200 p-2 rounded-full hover:bg-primary/10"
            onClick={onClose}
            title="Fechar"
          >
            <X size={22} />
          </button>
        </div>
        {/* Conteúdo */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : envios.length === 0 ? (
            <div className="text-accent/60 text-center py-8">Nenhum envio encontrado para esta campanha.</div>
          ) : (
            <div className="overflow-x-auto max-h-[400px]">
              <table className="min-w-full text-sm rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-primary/5 text-accent/60 uppercase text-xs">
                    <th className="py-3 px-4 text-left font-semibold">Contato</th>
                    <th className="py-3 px-4 text-left font-semibold">Status</th>
                    <th className="py-3 px-4 text-left font-semibold">Data de Envio</th>
                    <th className="py-3 px-4 text-left font-semibold">Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {envios.map((envio) => {
                    const status = statusMap[envio.status] || { color: 'text-accent/60', icon: null, label: envio.status };
                    return (
                      <tr key={envio.id} className="border-b border-secondary-dark hover:bg-primary/5 transition-colors duration-200">
                        <td className="py-2 px-4 font-medium text-accent whitespace-nowrap">{envio.contato || <span className="text-accent/40">-</span>}</td>
                        <td className={`py-2 px-4 flex items-center font-semibold ${status.color}`}>
                          {status.icon}
                          {status.label}
                        </td>
                        <td className="py-2 px-4 text-accent/80 whitespace-nowrap">{new Date(envio.data_envio).toLocaleString('pt-BR')}</td>
                        <td className="py-2 px-4">
                          {envio.erro ? (
                            <span className="text-red-500" title={envio.erro}>
                              {envio.erro.slice(0, 40)}...
                            </span>
                          ) : (
                            <span className="text-green-500">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailsModal;
