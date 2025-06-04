import React from 'react';
import { ChevronRight } from 'lucide-react';

interface Campaign {
  id: number;
  name: string;
  status: 'Concluída' | 'Em Andamento' | 'Agendada' | 'Rascunho';
  messages: number;
  delivered: number;
  deliveryRate: number;
  date: string;
}

interface CampaignTableProps {
  campaigns: Campaign[];
}

const CampaignTable: React.FC<CampaignTableProps> = ({ campaigns }) => {
  // Function to get status badge style
  const getStatusStyle = (status: Campaign['status']) => {
    switch (status) {
      case 'Concluída':
        return 'bg-primary/10 text-primary';
      case 'Em Andamento':
        return 'bg-primary/10 text-primary';
      case 'Agendada':
        return 'bg-primary/10 text-primary';
      case 'Rascunho':
        return 'bg-accent/10 text-accent/60';
      default:
        return 'bg-accent/10 text-accent/60';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-secondary-dark">
      <table className="min-w-full divide-y divide-secondary-dark">
        <thead>
          <tr>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-accent/60 uppercase tracking-wider">
              Campanha
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-accent/60 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-accent/60 uppercase tracking-wider">
              Mensagens
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-accent/60 uppercase tracking-wider">
              Taxa de Entrega
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-accent/60 uppercase tracking-wider">
              Data
            </th>
            <th scope="col" className="relative px-6 py-4">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary-dark">
          {campaigns.map((campaign) => (
            <tr key={campaign.id} className="hover:bg-secondary-dark/50 transition-colors duration-200">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-accent">{campaign.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-lg ${getStatusStyle(campaign.status)}`}>
                  {campaign.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-accent/60">
                {campaign.messages.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {campaign.status === 'Rascunho' || campaign.status === 'Agendada' ? (
                  <span className="text-sm text-accent/40">—</span>
                ) : (
                  <div className="flex items-center">
                    <div className="w-16 bg-secondary-dark rounded-full h-2 mr-2">
                      <div 
                        className="bg-gradient-to-r from-primary to-primary-dark h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${campaign.deliveryRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-accent/60">{campaign.deliveryRate}%</span>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-accent/60">
                {formatDate(campaign.date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button className="text-accent/60 hover:text-primary transition-colors duration-200">
                  <ChevronRight size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CampaignTable;