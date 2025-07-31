import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface Assistant {
  id: string;
  name: string;
  instructions: string;
  model: string;
}

interface Instance {
  name: string;
  webhook?: {
    enabled: boolean;
    url: string;
  };
  assistant?: Assistant;
  assistantActive?: boolean;
}

interface Evolution {
  id: string;
  name: string;
  url: string;
  apikey: string;
  instances: Instance[];
}

interface EvolutionContextData {
  selectedEvolution: Evolution | null;
  setSelectedEvolution: (evolution: Evolution | null) => void;
  updateInstanceAssistant: (instanceName: string, assistant: Assistant, isActive: boolean) => Promise<void>;
  toggleAssistantActive: (instanceName: string, isActive: boolean) => Promise<void>;
}

const EvolutionContext = createContext<EvolutionContextData>({} as EvolutionContextData);

export const EvolutionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedEvolution, setSelectedEvolution] = useState<Evolution | null>(null);

  const updateInstanceAssistant = async (instanceName: string, assistant: Assistant, isActive: boolean) => {
    if (!selectedEvolution) return;

    try {
      // Atualiza ou insere o assistente no banco de dados
      const { error } = await supabase
        .from('instance_assistants')
        .upsert({
          instance_name: instanceName,
          assistant_id: assistant.id,
          is_active: isActive
        });

      if (error) throw error;

      // Atualiza o estado local
      setSelectedEvolution({
        ...selectedEvolution,
        instances: selectedEvolution.instances.map(instance => 
          instance.name === instanceName 
            ? { 
                ...instance, 
                assistant,
                assistantActive: isActive
              } 
            : instance
        )
      });
    } catch (error) {
      console.error('Erro ao atualizar assistente da instância:', error);
      throw error;
    }
  };

  const toggleAssistantActive = async (instanceName: string, isActive: boolean) => {
    if (!selectedEvolution) return;

    try {
      // Atualiza o status no banco de dados
      const { error } = await supabase
        .from('instance_assistants')
        .update({ is_active: isActive })
        .eq('instance_name', instanceName);

      if (error) throw error;

      // Atualiza o estado local
      setSelectedEvolution({
        ...selectedEvolution,
        instances: selectedEvolution.instances.map(instance => 
          instance.name === instanceName 
            ? { 
                ...instance, 
                assistantActive: isActive
              } 
            : instance
        )
      });
    } catch (error) {
      console.error('Erro ao atualizar status do assistente:', error);
      throw error;
    }
  };

  return (
    <EvolutionContext.Provider value={{ 
      selectedEvolution, 
      setSelectedEvolution,
      updateInstanceAssistant,
      toggleAssistantActive
    }}>
      {children}
    </EvolutionContext.Provider>
  );
};

export const useEvolution = () => {
  const context = useContext(EvolutionContext);
  if (!context) {
    throw new Error('useEvolution must be used within an EvolutionProvider');
  }
  return context;
}; 