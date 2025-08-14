import React, { useState, useEffect } from "react";
import {
  ArrowUpRight,
  MessageCircle,
  Users,
  Clock,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import StatCard from "./components/StatCard";
import CampaignTable from "./components/CampaignTable";
import OverviewChart from "./components/OverviewChart";

type CampaignStatus = "Concluída" | "Agendada" | "Em Andamento" | "Rascunho";

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
  status: CampaignStatus;
  messages: number;
  delivered: number;
  deliveryRate: number;
  date: string;
  nome_da_instancia?: string;
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
    responseChange: 0,
  });
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDashboardData = async (campaignId?: number) => {
    try {
      if (!user) return;

      const { data: contactsData, error: contactsError } = await supabase
        .from("contato_evolution")
        .select("id")
        .eq("relacao_login", user.id);

      if (contactsError) throw contactsError;

      const contactIds = contactsData?.map((contact) => contact.id) || [];

      let messagesQuery = supabase
        .from("mensagem_evolution")
        .select("*")
        .in("contatos", contactIds)
        .order("created_at", { ascending: false });

      if (campaignId) {
        messagesQuery = messagesQuery.eq("id", campaignId);
      }

      const { data: messagesData, error: messagesError } = await messagesQuery;

      if (messagesError) throw messagesError;

      const messageIds = messagesData?.map((msg) => msg.id) || [];
      const { data: enviosData, error: enviosError } = await supabase
        .from("envio_evolution")
        .select("*")
        .in("id_mensagem", messageIds);

      if (enviosError) throw enviosError;

      const totalMessages = enviosData?.length || 0;
      let totalContacts = 0;
      if (contactsData) {
        const { data: allContactsData, error: allContactsError } =
          await supabase
            .from("contato_evolution")
            .select("contatos")
            .in("id", contactIds);
        if (!allContactsError) {
          totalContacts = allContactsData.reduce(
            (acc, list) => acc + JSON.parse(list.contatos || "[]").length,
            0
          );
        }
      }

      const deliveredMessages =
        enviosData?.filter((e) => e.status === "success" || e.status === "read")
          .length || 0;
      const deliveryRate =
        totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const recentMessages =
        enviosData?.filter((e) => new Date(e.created_at) > thirtyDaysAgo)
          .length || 0;
      const oldMessages = totalMessages - recentMessages;
      const messageChange =
        oldMessages > 0
          ? ((recentMessages - oldMessages) / oldMessages) * 100
          : 0;

      let avgResponseTime = 0;
      if (enviosData && enviosData.length > 1) {
        const sortedEnvios = [...enviosData].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        let totalDiff = 0;
        for (let i = 1; i < sortedEnvios.length; i++) {
          const prev = new Date(sortedEnvios[i - 1].created_at).getTime();
          const curr = new Date(sortedEnvios[i].created_at).getTime();
          totalDiff += curr - prev;
        }
        const avgDiffMs = totalDiff / (sortedEnvios.length - 1);
        avgResponseTime = avgDiffMs / 1000 / 60;
      }

      setStats({
        totalMessages,
        totalContacts,
        deliveryRate,
        avgResponseTime: Number(avgResponseTime.toFixed(1)),
        messageChange,
        contactChange: 0,
        deliveryChange: 0,
        responseChange: 0,
      });

      const formattedCampaigns: Campaign[] =
        messagesData?.map((message) => {
          const messageEnvios =
            enviosData?.filter((e) => e.id_mensagem === message.id) || [];
          const delivered = messageEnvios.filter(
            (e) => e.status === "success" || e.status === "read"
          ).length;
          const deliveryRate =
            messageEnvios.length > 0
              ? (delivered / messageEnvios.length) * 100
              : 0;

          return {
            id: message.id,
            name: message.name || `Campaign ${message.id}`,
            status: message.status as CampaignStatus,
            messages: messageEnvios.length,
            delivered,
            deliveryRate,
            date: message.scheduled_date || message.created_at,
            nome_da_instancia: message.nome_da_instancia,
          };
        }) || [];

      setRecentCampaigns(formattedCampaigns);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedCampaign || undefined);
  }, [user, selectedCampaign]);

  const handleCampaignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const campaignId = e.target.value ? Number(e.target.value) : null;
    setSelectedCampaign(campaignId);
  };

  // AQUI COMEÇAM AS MUDANÇAS DE ESTILO
  const statCards = [
    {
      title: "Mensagens Enviadas",
      value: stats.totalMessages.toLocaleString(),
      change: `${
        stats.messageChange >= 0 ? "+" : ""
      }${stats.messageChange.toFixed(1)}%`,
      isIncrease: stats.messageChange >= 0,
      icon: <MessageCircle className="text-primary" size={20} />, // Usa a cor primária
      iconBg: "bg-primary/10", // Usa a cor primária com 10% de opacidade
    },
    {
      title: "Contatos Totais",
      value: stats.totalContacts.toLocaleString(),
      change: `${
        stats.contactChange >= 0 ? "+" : ""
      }${stats.contactChange.toFixed(1)}%`,
      isIncrease: stats.contactChange >= 0,
      icon: <Users className="text-primary" size={20} />,
      iconBg: "bg-primary/10",
    },
    {
      title: "Taxa de Entrega",
      value: `${stats.deliveryRate.toFixed(1)}%`,
      change: `${
        stats.deliveryChange >= 0 ? "+" : ""
      }${stats.deliveryChange.toFixed(1)}%`,
      isIncrease: stats.deliveryChange >= 0,
      icon: <ArrowUpRight className="text-primary" size={20} />,
      iconBg: "bg-primary/10",
    },
    {
      title: "Intervalo Médio",
      value: `${stats.avgResponseTime.toFixed(1)} min`,
      change: `${
        stats.responseChange >= 0 ? "+" : ""
      }${stats.responseChange.toFixed(1)}%`,
      isIncrease: stats.responseChange < 0,
      icon: <Clock className="text-primary" size={20} />,
      iconBg: "bg-primary/10",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-accent">Painel de Controle</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedCampaign || ""}
            onChange={handleCampaignChange}
            // Classes atualizadas para o seletor
            className="input w-full md:w-auto"
          >
            <option value="">Todas as Campanhas</option>
            {recentCampaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchDashboardData(selectedCampaign || undefined)}
         className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw size={16} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes atualizadas para o card do gráfico */}
        <div className="lg:col-span-2 card">
          <h2 className="text-xl font-bold text-accent mb-6">
            Atividade de Mensagens
          </h2>
          <OverviewChart campaignId={selectedCampaign} />
        </div>
        {/* Classes atualizadas para o card de status */}
        <div className="card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-bold text-accent mb-6">
            Status das Campanhas
          </h2>
          <div className="space-y-5">
            {["Concluída", "Em Andamento", "Agendada", "Rascunho"].map(
              (status) => {
                const count = recentCampaigns.filter(
                  (c) => c.status === status
                ).length;
                const percentage =
                  recentCampaigns.length > 0
                    ? (count / recentCampaigns.length) * 100
                    : 0;

                return (
                  <div key={status}>
                    {/* Texto secundário para status e contagem */}
                    <div className="flex justify-between text-sm mb-1 text-text-secondary">
                      <span>{status}</span>
                      <span>{count}</span>
                    </div>
                    {/* Fundo da barra de progresso */}
                    <div className="w-full bg-secondary-darker rounded-full h-2">
                      {/* Barra de progresso com a cor primária */}
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* Classes atualizadas para a tabela de campanhas */}
      <div className="card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-bold text-accent mb-6">
          Campanhas Recentes
        </h2>
        <CampaignTable campaigns={recentCampaigns} />
      </div>
    </div>
  );
};

export default Dashboard;
