import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Loader2, X, QrCode, Trash2, Webhook, MessageSquare } from 'lucide-react';

interface Instance {
  id: string;
  name: string;
  connectionStatus: string;
  ownerJid?: string;
  profileName?: string;
  profilePicUrl?: string;
  integration?: string;
  number?: string;
  token?: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    Message?: number;
    Contact?: number;
    Chat?: number;
  };
  apikey?: string;
  webhook?: {
    enabled: boolean;
    url: string;
  };
  assistant?: any;
  assistantActive?: boolean;
  [key: string]: any;
}

interface EvolutionItem {
  id: number;
  url: string;
  apikey: string;
  created_at: string;
}

interface QrCodeResponse {
  pairingCode: string;
  code: string;
  base64: string;
  count: number;
}

interface Assistant {
  id: string;
  name: string;
  instructions: string;
  model: string;
}

// const API_KEY = 'f5ec3e06222808fab768cfbb1de84a2c'; 
// const FETCH_URL = 'https://evolution2.assessorialpha.com/instance/fetchInstances';
// const CREATE_URL = 'https://evolution2.assessorialpha.com/instance/create';
// const CONNECT_URL = 'https://evolution2.assessorialpha.com/instance/connect/';
// const DELETE_URL = 'https://evolution2.assessorialpha.com/instance/delete/';

const defaultForm = {
  instanceName: '',
  token: '',
  number: '',
  webhook: '',
  evolutionId: '',
};

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const statusColor = (status: string) => {
  if (status === 'open') return 'text-green-400 bg-green-400/10 border-green-400';
  if (status === 'connecting') return 'text-yellow-400 bg-yellow-400/10 border-yellow-400';
  return 'text-red-400 bg-red-400/10 border-red-400';
};

const Instances: React.FC = () => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<{instanceName: string, data: QrCodeResponse} | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [evolutions, setEvolutions] = useState<EvolutionItem[]>([]);
  const [selectedEvolutionId, setSelectedEvolutionId] = useState<string>('');
  const [selectedEvolution, setSelectedEvolution] = useState<EvolutionItem | null>(null);
  const [webhookModal, setWebhookModal] = useState<{instance: Instance} | null>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [isLoadingAssistants, setIsLoadingAssistants] = useState(false);

  const fetchEvolutions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('evolution')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setError('Nenhuma evolution cadastrada.');
        return;
      }
      
      setEvolutions(data as EvolutionItem[]);
    } catch (err) {
      console.error('Erro ao buscar evolutions:', err);
      setError('Erro ao buscar evolutions cadastradas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvolutions();
  }, []);

  useEffect(() => {
    if (selectedEvolutionId) {
      const evo = evolutions.find(e => e.id === Number(selectedEvolutionId));
      setSelectedEvolution(evo || null);
      if (evo) fetchInstances(evo);
    } else {
      setSelectedEvolution(null);
      setInstances([]);
    }
  }, [selectedEvolutionId, evolutions]);

  const fetchInstances = async (evo: EvolutionItem) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`https://${evo.url}/instance/fetchInstances`, {
        headers: { 'apikey': evo.apikey }
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const data = await response.json();
      const insts = (Array.isArray(data) ? data : data.instances || []).map((i: any) => ({ ...i, apikey: i.token }));
      setInstances(insts);
    } catch (err) {
      console.error('Erro ao buscar instâncias:', err);
      setError('Erro ao buscar instâncias. Verifique se a URL e API Key estão corretas.');
      setInstances([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError(null);
    
    const selectedEvolution = evolutions.find(evo => evo.id === Number(form.evolutionId));
    if (!selectedEvolution) {
      setFormError('Selecione uma evolution válida.');
      setCreating(false);
      return;
    }

    try {
      const body = {
        ...form,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
           webhook_by_events: true,
        events: ['APPLICATION_STARTUP'],
        reject_call: true,
        msg_call: '',
        groups_ignore: true,
        always_online: true,
        read_messages: true,
        read_status: true,
        websocket_enabled: true,
        websocket_events: ['APPLICATION_STARTUP'],
        rabbitmq_enabled: true,
        rabbitmq_events: ['APPLICATION_STARTUP'],
        sqs_enabled: true,
        sqs_events: ['APPLICATION_STARTUP'],
        typebot_url: '',
        typebot: '',
        typebot_expire: 123,
        typebot_keyword_finish: '',
        typebot_delay_message: 123,
        typebot_unknown_message: '',
        typebot_listening_from_me: true,
        proxy: {
          host: '',
          port: '',
          protocol: 'http',
          username: '',
          password: ''
        },
        chatwoot_account_id: 123,
        chatwoot_token: '',
        chatwoot_url: '',
        chatwoot_sign_msg: true,
        chatwoot_reopen_conversation: true,
        chatwoot_conversation_pending: true
      };

      const response = await fetch(`https://${selectedEvolution.url}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': selectedEvolution.apikey
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error('Erro ao criar instância');
      }

      setShowModal(false);
      setForm(defaultForm);
      await fetchInstances(selectedEvolution);
    } catch (err) {
      console.error('Erro ao criar instância:', err);
      setFormError('Erro ao criar instância. Verifique os dados.');
    } finally {
      setCreating(false);
    }
  };

  const handleQrCode = async (instance: Instance) => {
    if (!selectedEvolution) return;
    
    setQrLoading(true);
    setQrError(null);
    setQrModal(null);
    
    try {
      const response = await fetch(`https://${selectedEvolution.url}/instance/connect/${instance.name}`, {
        headers: { 'apikey': selectedEvolution.apikey }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao gerar QR Code');
      }
      
      const data = await response.json();
      setQrModal({ instanceName: instance.name, data });
    } catch (err) {
      console.error('Erro ao gerar QR Code:', err);
      setQrError('Erro ao gerar QR Code. Tente novamente.');
    } finally {
      setQrLoading(false);
    }
  };

  const handleDelete = async (instance: Instance) => {
    if (!selectedEvolution) return;
    
    if (!window.confirm(`Tem certeza que deseja excluir a instância "${instance.name}"?`)) return;
    
    try {
      const response = await fetch(`https://${selectedEvolution.url}/instance/delete/${instance.name}`, {
        method: 'DELETE',
        headers: { 'apikey': selectedEvolution.apikey }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir instância');
      }
      
      await fetchInstances(selectedEvolution);
    } catch (err) {
      console.error('Erro ao excluir instância:', err);
      alert('Erro ao excluir instância. Tente novamente.');
    }
  };

  const handleWebhook = async (instance: Instance) => {
    if (!selectedEvolution) return;
    
    if (!webhookUrl) {
      setWebhookError('Por favor, informe a URL do webhook');
      return;
    }
    
    setWebhookLoading(true);
    setWebhookError(null);
    
    try {
      const response = await fetch(`https://${selectedEvolution.url}/webhook/set/${instance.name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': selectedEvolution.apikey
        },
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: webhookUrl,
            headers: {
              "autorization": "Bearer TOKEN",
              "Content-Type": "application/json"
            },
            byEvents: false,
            base64: true,
            events: ["MESSAGES_UPSERT"]
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.response?.message?.[0]?.[0] || 'Erro ao configurar webhook');
      }
      
      setWebhookModal(null);
      setWebhookUrl('');
      alert('Webhook configurado com sucesso!');
    } catch (err) {
      console.error('Erro ao configurar webhook:', err);
      setWebhookError(err instanceof Error ? err.message : 'Erro ao configurar webhook. Tente novamente.');
    } finally {
      setWebhookLoading(false);
    }
  };

  // Função para listar assistentes da Mistral AI
  const listAssistants = async (): Promise<Assistant[]> => {
    try {
      const response = await fetch('/api/mistral/agents');
      if (!response.ok) {
        throw new Error('Erro ao buscar assistentes');
      }
      const data = await response.json();
      
      // Se retornou dados mock, usar eles
      if (data.mock) {
        return data.agents || [];
      }
      
      // Se retornou dados reais da Mistral
      return data.data || data.agents || [];
    } catch (error) {
      console.error('Erro ao listar assistentes:', error);
      // Retornar array vazio em caso de erro
      return [];
    }
  };

  const loadAssistants = async () => {
    setIsLoadingAssistants(true);
    try {
      const assistantsList = await listAssistants();
      setAssistants(assistantsList);

      // Atualizar nomes dos assistentes vinculados
      setInstances(prevInstances => 
        prevInstances.map(instance => {
          if (instance.assistant) {
            const assistantInfo = assistantsList.find(a => a.id === instance.assistant?.id);
            return {
              ...instance,
              assistant: assistantInfo ? {
                ...instance.assistant,
                name: assistantInfo.name,
                instructions: assistantInfo.instructions,
                model: assistantInfo.model
              } : instance.assistant
            };
          }
          return instance;
        })
      );
    } catch (err) {
      console.error('Erro ao carregar assistentes:', err);
      setError('Erro ao carregar assistentes. Por favor, tente novamente.');
    } finally {
      setIsLoadingAssistants(false);
    }
  };

  const handleInstanceSelect = async (instance: Instance) => {
    setSelectedInstance(instance);
    if (assistants.length === 0) {
      await loadAssistants();
    }
  };

  const handleAssistantSelect = async (assistant: Assistant) => {
    if (!selectedInstance) return;

    try {
      const { error } = await supabase
        .from('instance_assistants')
        .upsert({
          instance_name: selectedInstance.name,
          assistant_id: assistant.id,
          is_active: true
        });

      if (error) throw error;

      // Atualizar estado local
      setInstances(prevInstances =>
        prevInstances.map(instance =>
          instance.name === selectedInstance.name
            ? {
                ...instance,
                assistant: {
                  id: assistant.id,
                  name: assistant.name,
                  instructions: assistant.instructions,
                  model: assistant.model
                },
                assistantActive: true
              }
            : instance
        )
      );

      setSelectedInstance(null);
    } catch (err) {
      console.error('Erro ao vincular assistente:', err);
      setError('Erro ao vincular assistente. Por favor, tente novamente.');
    }
  };

  const handleAssistantToggle = async (instance: Instance) => {
    try {
      const { error } = await supabase
        .from('instance_assistants')
        .update({ is_active: !instance.assistantActive })
        .eq('instance_name', instance.name);

      if (error) throw error;

      // Atualizar estado local
      setInstances(prevInstances =>
        prevInstances.map(inst =>
          inst.name === instance.name
            ? { ...inst, assistantActive: !inst.assistantActive }
            : inst
        )
      );
    } catch (err) {
      console.error('Erro ao atualizar status do assistente:', err);
      setError('Erro ao atualizar status do assistente. Por favor, tente novamente.');
    }
  };

  if (loading && !selectedEvolutionId) {
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
          Evolution
        </h1>
        <button 
          onClick={() => setShowModal(true)} 
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Nova Instância</span>
        </button>
      </div>

      <div className="card">
        {/* Evolution selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-accent mb-2">
            Evolution
          </label>
          <select
            value={selectedEvolutionId}
            onChange={e => setSelectedEvolutionId(e.target.value)}
            className="input"
          >
            <option value="">Selecione uma evolution...</option>
            {evolutions.map(evo => (
              <option key={evo.id} value={evo.id}>{evo.url}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {/* Instances grid */}
        {selectedEvolutionId && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : instances.length === 0 ? (
              <div className="col-span-full text-center py-8 text-accent/60">
                Nenhuma instância encontrada.
              </div>
            ) : (
              instances.map((instance) => (
                <div key={instance.name} className="card group hover:shadow-glow transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <img
                          src={instance.profilePicUrl || 'https://via.placeholder.com/40'}
                          alt={instance.profileName || instance.name}
                          className="w-8 h-8 rounded-lg"
                        />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-accent">
                          {instance.profileName || instance.name}
                        </h3>
                        <p className="text-sm text-accent/60">
                          {instance.number || 'Número não definido'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColor(instance.connectionStatus)}`}>
                      {instance.connectionStatus === 'open' ? 'Conectado' : 
                       instance.connectionStatus === 'connecting' ? 'Conectando' : 'Desconectado'}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="bg-primary/5 rounded-lg p-3">
                        <p className="text-accent/60">Mensagens</p>
                        <p className="font-display font-bold text-accent">
                          {instance._count?.Message || 0}
                        </p>
                      </div>
                      <div className="bg-primary/5 rounded-lg p-3">
                        <p className="text-accent/60">Contatos</p>
                        <p className="font-display font-bold text-accent">
                          {instance._count?.Contact || 0}
                        </p>
                      </div>
                      <div className="bg-primary/5 rounded-lg p-3">
                        <p className="text-accent/60">Chats</p>
                        <p className="font-display font-bold text-accent">
                          {instance._count?.Chat || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-secondary-dark">
                      <div className="text-sm text-accent/60">
                        Criado em {formatDate(instance.createdAt)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setWebhookModal({ instance })}
                          className="p-2 text-accent/60 hover:text-primary transition-colors duration-200"
                          title="Configurar Webhook"
                        >
                          <Webhook size={18} />
                        </button>
                        <button
                          onClick={() => handleQrCode(instance)}
                          className="p-2 text-accent/60 hover:text-primary transition-colors duration-200"
                          title="Gerar QR Code"
                        >
                          <QrCode size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(instance)}
                          className="p-2 text-accent/60 hover:text-red-500 transition-colors duration-200"
                          title="Excluir instância"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={() => handleInstanceSelect(instance)}
                          className="p-2 text-accent/60 hover:text-primary transition-colors duration-200"
                          title="Vincular Assistente"
                        >
                          <MessageSquare size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Instance Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-accent/75 backdrop-blur-sm">
          <div className="card w-full max-w-lg relative">
            <button
              className="absolute top-4 right-4 text-accent/60 hover:text-primary transition-colors duration-200"
              onClick={() => setShowModal(false)}
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-6">
              Nova Instância
            </h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-accent mb-2">
                  Evolution
                </label>
                <select
                  name="evolutionId"
                  value={form.evolutionId}
                  onChange={handleFormChange}
                  className="input"
                  required
                >
                  <option value="">Selecione uma evolution...</option>
                  {evolutions.map(evo => (
                    <option key={evo.id} value={evo.id}>{evo.url}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-accent mb-2">
                  Nome da Instância
                </label>
                <input
                  type="text"
                  name="instanceName"
                  value={form.instanceName}
                  onChange={handleFormChange}
                  className="input"
                  placeholder="Digite o nome da instância"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-accent mb-2">
                  Token
                </label>
                <input
                  type="text"
                  name="token"
                  value={form.token}
                  onChange={handleFormChange}
                  className="input"
                  placeholder="Digite o token"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-accent mb-2">
                  Número
                </label>
                <input
                  type="text"
                  name="number"
                  value={form.number}
                  onChange={handleFormChange}
                  className="input"
                  placeholder="Digite o número"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-accent mb-2">
                  Webhook
                </label>
                <input
                  type="text"
                  name="webhook"
                  value={form.webhook}
                  onChange={handleFormChange}
                  className="input"
                  placeholder="Digite a URL do webhook"
                />
              </div>
              {formError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
                  {formError}
                </div>
              )}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary"
                >
                  {creating ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Criando...
                    </>
                  ) : (
                    'Criar Instância'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-accent/75 backdrop-blur-sm">
          <div className="card w-full max-w-lg relative">
            <button
              className="absolute top-4 right-4 text-accent/60 hover:text-primary transition-colors duration-200"
              onClick={() => setQrModal(null)}
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-6">
              QR Code - {qrModal.instanceName}
            </h2>
            <div className="space-y-6">
              {qrLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : qrError ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
                  {qrError}
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  {(() => {
                    let base64 = qrModal.data.base64;
                    let src = base64.startsWith('data:image') ? base64 : `data:image/png;base64,${base64}`;
                    return (
                      <img
                        src={src}
                        alt="QR Code"
                        className="w-64 h-64 filter grayscale contrast-200"
                        style={{ filter: 'grayscale(1) contrast(200)' }}
                      />
                    );
                  })()}
                  {/* Pairing code */}
                  <PairingCodeDisplay code={qrModal.data.pairingCode} />
                  <p className="text-sm text-accent/60">
                    Escaneie o QR Code com seu WhatsApp ou digite o código acima
                  </p>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={() => setQrModal(null)}
                  className="btn-secondary"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Modal */}
      {webhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-accent/75 backdrop-blur-sm">
          <div className="card w-full max-w-lg relative">
            <button
              className="absolute top-4 right-4 text-accent/60 hover:text-primary transition-colors duration-200"
              onClick={() => {
                setWebhookModal(null);
                setWebhookUrl('');
              }}
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-6">
              Configurar Webhook - {webhookModal.instance.name}
            </h2>
            <div className="space-y-6">
              {webhookLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : webhookError ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
                  {webhookError}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-accent/60">
                    Esta ação irá configurar o webhook para a instância com os seguintes parâmetros:
                  </p>
                  <ul className="list-disc list-inside text-accent/60 space-y-2">
                    <li>Eventos: MESSAGES_UPSERT</li>
                    <li>Webhook Base64: Ativado</li>
                    <li>Webhook por eventos: Desativado</li>
                  </ul>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-accent">
                      URL do Webhook
                    </label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="input w-full"
                      placeholder="https://seu-servidor.com/webhook"
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => {
                        setWebhookModal(null);
                        setWebhookUrl('');
                      }}
                      className="btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleWebhook(webhookModal.instance)}
                      className="btn-primary"
                    >
                      Configurar Webhook
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedInstance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-accent/75 backdrop-blur-sm">
          <div className="card w-full max-w-lg relative">
            <button
              className="absolute top-4 right-4 text-accent/60 hover:text-primary transition-colors duration-200"
              onClick={() => setSelectedInstance(null)}
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-6">
              Vincular Assistente - {selectedInstance.name}
            </h2>
            {selectedInstance.assistant ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-primary bg-primary/5">
                  <h4 className="text-lg font-medium text-accent">{selectedInstance.assistant.name}</h4>
                  <p className="mt-1 text-sm text-accent/60 line-clamp-2">{selectedInstance.assistant.instructions}</p>
                  <p className="mt-2 text-xs text-accent/40">Modelo: {selectedInstance.assistant.model}</p>
                  <div className="flex items-center space-x-2 mt-4">
                    <span className={`text-sm ${selectedInstance.assistantActive ? 'text-green-500' : 'text-red-500'}`}>{selectedInstance.assistantActive ? 'Ativo' : 'Inativo'}</span>
                    <button
                      onClick={() => handleAssistantToggle(selectedInstance)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${selectedInstance.assistantActive ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                    >
                      {selectedInstance.assistantActive ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>
              </div>
            ) : isLoadingAssistants ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="animate-spin h-6 w-6 text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {assistants.map((assistant) => (
                  <div
                    key={assistant.id}
                    className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${selectedInstance.assistant?.id === assistant.id ? 'border-primary bg-primary/5' : 'border-secondary-dark hover:border-primary/50'}`}
                    onClick={() => handleAssistantSelect(assistant)}
                  >
                    <h4 className="text-lg font-medium text-accent">{assistant.name}</h4>
                    <p className="mt-1 text-sm text-accent/60 line-clamp-2">{assistant.instructions}</p>
                    <p className="mt-2 text-xs text-accent/40">Modelo: {assistant.model}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para exibir e copiar o código de pareamento
const PairingCodeDisplay: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  if (!code) return null;
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="font-mono text-2xl tracking-widest bg-primary/10 text-primary rounded-lg px-6 py-2 select-all border border-primary/20">
        {code}
      </div>
      <button
        className="btn-secondary text-xs px-3 py-1"
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? 'Copiado!' : 'Copiar código'}
      </button>
    </div>
  );
};

export default Instances; 