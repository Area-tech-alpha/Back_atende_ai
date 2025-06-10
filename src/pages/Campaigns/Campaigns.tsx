import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, ChevronDown, Loader2, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import CampaignCard from './components/CampaignCard';

interface Campaign {
  id: number;
  name: string;
  texto: string;
  imagem: string | null;
  data_de_envio: string | null;
  contatos: number;
  status: 'Completed' | 'In Progress' | 'Scheduled' | 'Draft';
  created_at: string;
  sentCount?: number;
  deliveredCount?: number;
  readCount?: number;
  errorCount?: number;
  nome_da_instancia: string;
}

const Campaigns = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      if (!user) return;

      const { data: messagesData, error: messagesError } = await supabase
        .from('mensagem_evolution')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Buscar dados de envio_evolution para cada campanha
      const campaignIds = messagesData.map(msg => msg.id);
      let envioStats: Record<number, { sent: number; delivered: number; read: number; error: number }> = {};
      
      if (campaignIds.length > 0) {
        const { data: envios } = await supabase
          .from('envio_evolution')
          .select('id_mensagem, status')
          .in('id_mensagem', campaignIds);
          
        if (envios) {
          for (const id of campaignIds) {
            const enviosCampanha = envios.filter(e => e.id_mensagem === id);
            envioStats[id] = {
              sent: enviosCampanha.length,
              delivered: enviosCampanha.filter(e => e.status === 'success').length,
              read: enviosCampanha.filter(e => e.status === 'read').length,
              error: enviosCampanha.filter(e => e.status === 'error').length,
            };
          }
        }
      }

      const formattedCampaigns = messagesData.map(message => ({
        id: message.id,
        name: message.name || `Campanha ${message.id}`,
        texto: message.texto,
        imagem: message.imagem,
        data_de_envio: message.data_de_envio,
        contatos: message.contatos,
        status: message.status === 'Draft' ? 'Draft' : determineStatus(message.data_de_envio),
        created_at: message.created_at,
        sentCount: envioStats[message.id]?.sent || 0,
        deliveredCount: envioStats[message.id]?.delivered || 0,
        readCount: envioStats[message.id]?.read || 0,
        errorCount: envioStats[message.id]?.error || 0,
        nome_da_instancia: message.nome_da_instancia,
      }));

      setCampaigns(formattedCampaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const determineStatus = (scheduledDate: string | null): Campaign['status'] => {
    if (!scheduledDate) return 'Completed';
    
    const now = new Date();
    const scheduled = new Date(scheduledDate);
    
    if (scheduled > now) return 'Scheduled';
    if (scheduled <= now) return 'Completed';
    return 'Draft';
  };

  // Filter campaigns based on search query and status filter
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = 
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.texto.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || campaign.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
        <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
          Campanhas
        </h1>
        <button 
          onClick={() => navigate('/campaigns/new')}
          className="btn-primary flex items-center space-x-2 w-full sm:w-auto justify-center"
        >
          <Plus size={16} />
          <span>Nova Campanha</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-accent/40" />
            </div>
            <input
              type="text"
              placeholder="Buscar campanhas..."
              className="input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-4">
            <div className="relative">
              <div className="flex items-center border-2 border-secondary-dark rounded-lg bg-secondary">
                <div className="px-3 py-2 flex items-center gap-2">
                  <Filter size={16} className="text-accent/40" />
                  <span className="text-sm text-accent">Status:</span>
                </div>
                <select
                  className="appearance-none bg-transparent pr-8 py-2 w-40 focus:outline-none text-sm text-accent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">Todos</option>
                  <option value="Draft">Rascunho</option>
                  <option value="Scheduled">Agendada</option>
                  <option value="In Progress">Em Andamento</option>
                  <option value="Completed">Concluída</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                  <ChevronDown size={16} className="text-accent/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.length > 0 ? (
          filteredCampaigns.map(c => (
            <CampaignCard 
              key={c.id} 
              campaign={{
                id: c.id,
                name: c.name,
                description: c.texto,
                status: c.status,
                sentCount: c.sentCount ?? 0,
                deliveredCount: c.deliveredCount ?? 0,
                readCount: c.readCount ?? 0,
                errorCount: c.errorCount ?? 0,
                date: c.data_de_envio || c.created_at,
                template: c.imagem ? 'Com Imagem' : 'Apenas Texto',
                nome_da_instancia: c.nome_da_instancia
              }}
              reuseCampaign={c}
            />
          ))
        ) : (
          <div className="col-span-full card py-16 flex flex-col items-center justify-center">
            <div className="w-16 h-16 mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Search size={24} className="text-primary" />
            </div>
            <h3 className="text-lg font-display font-bold text-accent mb-2">Nenhuma campanha encontrada</h3>
            <p className="text-accent/60 mb-6">Tente ajustar sua busca ou critérios de filtro</p>
            <button 
              onClick={() => navigate('/campaigns/new')}
              className="btn-primary"
            >
              Criar Nova Campanha
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-4 pt-4 border-t border-secondary-dark">
        <button
          className="text-accent/60 text-sm font-medium hover:text-primary transition-colors duration-200 flex items-center"
          onClick={() => setShowDetails(true)}
        >
          <ArrowUpRight size={16} className="mr-1" />
          Ver Detalhes
        </button>
        {(c.status === 'Completed' || c.status === 'Draft') && (
          <button
            className="text-accent/60 text-sm font-medium hover:text-primary transition-colors duration-200 ml-2"
            onClick={() => navigate('/campaigns/new', { state: { reuseCampaign: c } })}
          >
            Reutilizar
          </button>
        )}
        {c.status === 'In Progress' && (
          <button
            className="text-red-500 text-sm font-medium hover:text-red-700 transition-colors duration-200 ml-2"
            onClick={async () => {
              try {
                const { error } = await supabase
                  .from('campanhas')
                  .update({ status: 'Paused' })
                  .eq('id', c.id);
                if (error) throw error;
                setCampaigns(prev => prev.map(c => c.id === c.id ? { ...c, status: 'Paused' } : c));
              } catch (error) {
                console.error('Erro ao pausar campanha:', error);
                alert('Erro ao pausar campanha. Por favor, tente novamente.');
              }
            }}
          >
            Pausar
          </button>
        )}
      </div>
    </div>
  );
};

export default Campaigns;