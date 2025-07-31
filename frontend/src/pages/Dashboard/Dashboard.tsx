import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, MessageCircle, Users, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import StatCard from './components/StatCard';
import CampaignTable from './components/CampaignTable';
import OverviewChart from './components/OverviewChart';

interface DashboardStats {
  totalMessages: number;
  totalContacts: number;
  deliveryRate: number;
  avgResponseTime: number;
  messageChange: number;
  contactChange: number;
  deliveryChange: number;
  responseChange: number;
}

interface Campaign {
  id: number;
  name: string;
  status: string;
  messages: number;
  delivered: number;
  deliveryRate: number;
  date: string;
  nome_da_instancia?: string;
}

interface InstanceItem {
  id: string;
  name: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalMessages: 0,
    totalContacts: 0,
    deliveryRate: 0,
    avgResponseTime: 0,
    messageChange: 0,
    contactChange: 0,
    deliveryChange: 0,
    responseChange: 0
  });
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [instances, setInstances] = useState<InstanceItem[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Buscar instâncias do usuário
  useEffect(() => {
    const fetchInstances = async () => {
      if (!user) return;
      // Buscar todas as campanhas do usuário para extrair as instâncias usadas
      const { data: contactsData } = await supabase
        .from('contato_evolution')
        .select('id')
        .eq('relacao_login', user.id);
      const contactIds = contactsData?.map((c: any) => c.id) || [];
      const { data: messagesData } = await supabase
        .from('mensagem_evolution')
        .select('nome_da_instancia')
        .in('contatos', contactIds);
      // Extrair nomes únicos de instância
      const uniqueInstances = Array.from(new Set((messagesData || []).map((m: any) => m.nome_da_instancia).filter(Boolean)));
      setInstances(uniqueInstances.map((name: string, idx: number) => ({ id: String(idx), name })));
    };
    fetchInstances();
  }, [user]);

  const fetchDashboardData = async (campaignId?: number, instanceName?: string) => {
    try {
      if (!user) return;

      // Buscar contatos do usuário
      const { data: contactsData, error: contactsError } = await supabase
        .from('contato_evolution')
        .select('id')
        .eq('relacao_login', user.id);

      if (contactsError) throw contactsError;

      const contactIds = contactsData?.map(contact => contact.id) || [];

      // Buscar mensagens
      let messagesQuery = supabase
        .from('mensagem_evolution')
        .select('*')
        .in('contatos', contactIds)
        .order('created_at', { ascending: false });

      if (campaignId) {
        messagesQuery = messagesQuery.eq('id', campaignId);
      }
      if (instanceName) {
        messagesQuery = messagesQuery.eq('nome_da_instancia', instanceName);
      }

      const { data: messagesData, error: messagesError } = await messagesQuery;

      if (messagesError) throw messagesError;

      // Buscar dados de envio
      const messageIds = messagesData?.map(msg => msg.id) || [];
      const { data: enviosData, error: enviosError } = await supabase
        .from('envio_evolution')
        .select('*')
        .in('id_mensagem', messageIds);

      if (enviosError) throw enviosError;

      // Calcular estatísticas
      const totalMessages = enviosData?.length || 0;
      let totalContacts = contactsData?.length || 0;
      if (campaignId && messagesData && messagesData.length > 0) {
        // Se uma campanha está selecionada, buscar a lista de contatos da campanha
        const campanha = messagesData[0];
        if (campanha && campanha.contatos) {
          const { data: listaContatos, error: errorLista } = await supabase
            .from('contato_evolution')
            .select('contatos')
            .eq('id', campanha.contatos)
            .single();
          if (!errorLista && listaContatos && listaContatos.contatos) {
            try {
              const contatosArray = JSON.parse(listaContatos.contatos);
              totalContacts = contatosArray.length;
            } catch {
              totalContacts = 0;
            }
          } else {
            totalContacts = 0;
          }
        } else {
          totalContacts = 0;
        }
      }
      const deliveredMessages = enviosData?.filter(e => e.status === 'success' || e.status === 'read').length || 0;
      const deliveryRate = totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;

      // Calcular mudanças (comparação com período anterior)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const recentMessages = enviosData?.filter(e => new Date(e.created_at) > thirtyDaysAgo).length || 0;
      const oldMessages = totalMessages - recentMessages;
      const messageChange = oldMessages > 0 ? ((recentMessages - oldMessages) / oldMessages) * 100 : 0;

      // Calcular tempo médio entre mensagens (em minutos)
      let avgResponseTime = 0;
      if (enviosData && enviosData.length > 1) {
        // Ordenar por data_envio
        const sortedEnvios = [...enviosData].sort((a, b) => new Date(a.data_envio) - new Date(b.data_envio));
        let totalDiff = 0;
        for (let i = 1; i < sortedEnvios.length; i++) {
          const prev = new Date(sortedEnvios[i - 1].data_envio).getTime();
          const curr = new Date(sortedEnvios[i].data_envio).getTime();
          totalDiff += (curr - prev);
        }
        const avgDiffMs = totalDiff / (sortedEnvios.length - 1);
        avgResponseTime = avgDiffMs / 1000 / 60; // minutos
      }

      // Atualizar estado
      setStats({
        totalMessages,
        totalContacts,
        deliveryRate,
        avgResponseTime: Number(avgResponseTime.toFixed(1)),
        messageChange,
        contactChange: 5.2, // Placeholder - implementar cálculo real
        deliveryChange: -0.5, // Placeholder - implementar cálculo real
        responseChange: -8.1 // Placeholder - implementar cálculo real
      });

      // Formatar campanhas recentes
      const formattedCampaigns = messagesData?.map(message => {
        const messageEnvios = enviosData?.filter(e => e.id_mensagem === message.id) || [];
        const delivered = messageEnvios.filter(e => e.status === 'success' || e.status === 'read').length;
        const deliveryRate = messageEnvios.length > 0 ? (delivered / messageEnvios.length) * 100 : 0;

        return {
          id: message.id,
          name: message.name || `Campaign ${message.id}`,
          status: determineStatus(message.data_de_envio),
          messages: messageEnvios.length,
          delivered,
          deliveryRate,
          date: message.data_de_envio || message.created_at,
          nome_da_instancia: message.nome_da_instancia
        };
      }) || [];

      setRecentCampaigns(formattedCampaigns);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const determineStatus = (scheduledDate: string | null) => {
    if (!scheduledDate) return 'Concluída';
    
    const now = new Date();
    const scheduled = new Date(scheduledDate);
    
    if (scheduled > now) return 'Agendada';
    if (scheduled <= now) return 'Concluída';
    return 'Rascunho';
  };

  useEffect(() => {
    fetchDashboardData(selectedCampaign || undefined, selectedInstance || undefined);
  }, [user, selectedCampaign, selectedInstance]);

  const handleCampaignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const campaignId = e.target.value ? Number(e.target.value) : null;
    setSelectedCampaign(campaignId);
  };

  const handleInstanceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedInstance(e.target.value);
  };

  const statCards = [
    { 
      title: 'Mensagens Enviadas', 
      value: stats.totalMessages.toLocaleString(), 
      change: `${stats.messageChange >= 0 ? '+' : ''}${stats.messageChange.toFixed(1)}%`, 
      isIncrease: stats.messageChange >= 0,
      icon: <MessageCircle className="text-primary" size={20} />,
      iconBg: 'bg-primary/10' 
    },
    { 
      title: 'Contatos', 
      value: stats.totalContacts.toLocaleString(), 
      change: `${stats.contactChange >= 0 ? '+' : ''}${stats.contactChange.toFixed(1)}%`, 
      isIncrease: stats.contactChange >= 0,
      icon: <Users className="text-primary" size={20} />,
      iconBg: 'bg-primary/10'
    },
    { 
      title: 'Taxa de Entrega', 
      value: `${stats.deliveryRate.toFixed(1)}%`, 
      change: `${stats.deliveryChange >= 0 ? '+' : ''}${stats.deliveryChange.toFixed(1)}%`, 
      isIncrease: stats.deliveryChange >= 0,
      icon: <ArrowUpRight className="text-primary" size={20} />,
      iconBg: 'bg-primary/10' 
    },
    { 
      title: 'Intervalo Médio entre Mensagens', 
      value: `${stats.avgResponseTime} min`, 
      change: `${stats.responseChange >= 0 ? '+' : ''}${stats.responseChange.toFixed(1)}%`, 
      isIncrease: stats.responseChange < 0,
      icon: <Clock className="text-primary" size={20} />, 
      iconBg: 'bg-primary/10' 
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
          Painel de Controle
        </h1>
        <div className="flex items-center space-x-4">
          <select 
            value={selectedCampaign || ''} 
            onChange={handleCampaignChange}
            className="input py-2 px-3"
          >
            <option value="">Todas as Campanhas</option>
            {recentCampaigns.map(campaign => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
          {/* <select
            value={selectedInstance}
            onChange={handleInstanceChange}
            className="input py-2 px-3"
          >
            <option value="">Todas as Instâncias</option>
            {instances.map(inst => (
              <option key={inst.id} value={inst.name}>{inst.name}</option>
            ))}
          </select> */}
          <button 
            onClick={() => fetchDashboardData(selectedCampaign || undefined, selectedInstance || undefined)}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw size={16} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts and tables section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message activity chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold text-accent">Atividade de Mensagens</h2>
          </div>
          <OverviewChart campaignId={selectedCampaign} instanceName={selectedInstance} />
        </div>

        {/* Campaign status summary */}
        <div className="card">
          <h2 className="text-xl font-display font-bold text-accent mb-6">Status das Campanhas</h2>
          <div className="space-y-5">
            {['Concluída', 'Em Andamento', 'Agendada', 'Rascunho'].map((status) => {
              const count = recentCampaigns.filter(c => c.status === status).length;
              const percentage = recentCampaigns.length > 0 ? (count / recentCampaigns.length) * 100 : 0;
              
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-accent/60">{status}</span>
                    <span className="text-accent/60">{count}</span>
                  </div>
                  <div className="w-full bg-secondary-dark rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary to-primary-dark h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-secondary-dark">
            <h3 className="font-display font-bold text-accent mb-3">Taxa de Entrega</h3>
            <div className="relative h-[120px] w-[120px] mx-auto">
              <svg className="h-full w-full" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#F5F5F5"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#FFD700"
                  strokeWidth="3"
                  strokeDasharray={`${stats.deliveryRate}, 100`}
                  className="transition-all duration-1000 ease-in-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-display font-bold text-accent">
                  {stats.deliveryRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent campaigns table */}
      <div className="card">
        <h2 className="text-xl font-display font-bold text-accent mb-6">Campanhas Recentes</h2>
        <CampaignTable campaigns={recentCampaigns} />
      </div>
    </div>
  );
};

export default Dashboard;