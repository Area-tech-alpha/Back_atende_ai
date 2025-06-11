import React from 'react';
import { Calendar, BarChart2, ArrowUpRight, Pause, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CampaignDetailsModal from './CampaignDetailsModal';
import { supabase } from '../../../lib/supabase';

interface Campaign {
  id: number;
  name: string;
  description: string;
  status: 'Completed' | 'In Progress' | 'Scheduled' | 'Draft';
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  date: string;
  template: string;
  errorCount?: number;
  nome_da_instancia?: string;
}

interface CampaignCardProps {
  campaign: Campaign;
  reuseCampaign?: any;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, reuseCampaign }) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = React.useState(false);

  // Function to get status badge style
  const getStatusStyle = (status: Campaign['status']) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'Draft':
        return 'bg-zinc-200 text-zinc-600';
      default:
        return 'bg-zinc-200 text-zinc-600';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate delivery rate
  const deliveryRate = campaign.sentCount ? 
    ((campaign.deliveredCount / campaign.sentCount) * 100).toFixed(1) :
    '0';

  // Calculate read rate
  const readRate = campaign.deliveredCount ? 
    ((campaign.readCount / campaign.deliveredCount) * 100).toFixed(1) :
    '0';

  // Handler para pausar campanha
  const handlePause = async () => {
    await supabase
      .from('mensagem_evolution')
      .update({ status: 'Paused' })
      .eq('id', campaign.id);
    window.location.reload();
  };

  // Handler para excluir campanha
  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir esta campanha?')) {
      await supabase
        .from('mensagem_evolution')
        .delete()
        .eq('id', campaign.id);
      window.location.reload();
    }
  };

  return (
    <div className="card group hover:shadow-glow transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-display font-bold text-accent truncate">{campaign.name}</h3>
        <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-lg ${getStatusStyle(campaign.status)}`}>
          {campaign.status === 'Completed' ? 'Concluída' :
           campaign.status === 'In Progress' ? 'Em Andamento' :
           campaign.status === 'Scheduled' ? 'Agendada' : 'Rascunho'}
        </span>
      </div>
      <p className="text-sm text-accent/60 mb-4 line-clamp-2">{campaign.description}</p>
      
      <div className="flex items-center text-sm text-accent/60 mb-4">
        <Calendar size={16} className="mr-1" />
        <span>{formatDate(campaign.date)}</span>
        <span className="mx-2">•</span>
        <span>Template: {campaign.template}</span>
        {campaign.nome_da_instancia && (
          <span className="mx-2">•</span>
        )}
        {campaign.nome_da_instancia && (
          <span>Instância: <span className="text-primary">{campaign.nome_da_instancia}</span></span>
        )}
      </div>
      
      {campaign.status === 'Completed' || campaign.status === 'In Progress' ? (
        <div className="space-y-3 mb-4">
          <div className="flex flex-wrap gap-4 text-xs text-accent/60">
            <span><b>Total:</b> {campaign.sentCount ?? 0}</span>
            <span><b>Enviados:</b> {campaign.deliveredCount ?? 0}</span>
            <span><b>Lidos:</b> {campaign.readCount ?? 0}</span>
            <span><b>Erros:</b> {campaign.errorCount ?? 0}</span>
          </div>
        </div>
      ) : null}
      
      <div className="flex justify-between mt-4 pt-4 border-t border-secondary-dark">
        <button
          className="text-accent/60 text-sm font-medium hover:text-primary transition-colors duration-200 flex items-center"
          onClick={() => setShowDetails(true)}
        >
          <ArrowUpRight size={16} className="mr-1" />
          Ver Detalhes
        </button>
        <div className="flex gap-2">
          {(campaign.status === 'Scheduled' || campaign.status === 'In Progress') && (
            <button
              className="text-yellow-600 text-sm font-medium hover:text-yellow-800 transition-colors duration-200 flex items-center"
              onClick={handlePause}
              title="Pausar Campanha"
            >
              <Pause size={16} className="mr-1" /> Pausar
            </button>
          )}
          {(campaign.status === 'Scheduled' || campaign.status === 'In Progress' || campaign.status === 'Draft') && (
            <button
              className="text-red-600 text-sm font-medium hover:text-red-800 transition-colors duration-200 flex items-center"
              onClick={handleDelete}
              title="Excluir Campanha"
            >
              <Trash2 size={16} className="mr-1" /> Excluir
            </button>
          )}
          {(campaign.status === 'Completed' || campaign.status === 'Draft') && (
            <button
              className="text-accent/60 text-sm font-medium hover:text-primary transition-colors duration-200 ml-2"
              onClick={() => navigate('/campaigns/new', { state: { reuseCampaign: reuseCampaign || campaign } })}
            >
              Reutilizar
            </button>
          )}
        </div>
      </div>

      <CampaignDetailsModal
        campaignId={campaign.id}
        open={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </div>
  );
};

export default CampaignCard;