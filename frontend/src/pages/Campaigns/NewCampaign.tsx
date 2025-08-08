import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

interface Contact {
  name: string;
  phone: string;
}

interface ContactList {
  id: number;
  name?: string;
  contatos: Contact[];
}

const API_URL = "https://atende-ai-z2n7.onrender.com/api";

const NewCampaign = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [campaignName, setCampaignName] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [message, setMessage] = useState("");
  const [isImmediate, setIsImmediate] = useState(true);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [messageDelay, setMessageDelay] = useState(0); // Delay in seconds
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [selectedContactListId, setSelectedContactListId] = useState<
    number | null
  >(null);
  const [isDraft, setIsDraft] = useState(false);
  const [devices, setDevices] = useState<
    { deviceId: string; connection_name?: string }[]
  >([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("default");

  // Função para salvar rascunho corretamente
  const formRef = useRef<HTMLFormElement>(null);
  const handleSaveDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraft(true);
    if (formRef.current) {
      handleSubmit(
        {
          ...e,
          preventDefault: () => {},
        } as any,
        true
      );
    }
  };

  // Buscar listas de contatos salvas
  useEffect(() => {
    const fetchContactLists = async () => {
      const { data, error } = await supabase
        .from("contato_evolution")
        .select("*")
        .eq("relacao_login", user?.id);
      if (!error && data) {
        const lists = data.map((list: any) => ({
          id: list.id,
          name: list.name || `Lista #${list.id}`,
          contatos: JSON.parse(list.contatos || "[]"),
        }));
        setContactLists(lists);
      }
    };
    if (user) fetchContactLists();
  }, [user]);

  useEffect(() => {
    // Se vier do botão reutilizar, preencher os campos
    if (location.state && location.state.reuseCampaign) {
      const c = location.state.reuseCampaign;
      setCampaignName(c.name || "");
      setMessage(c.texto || "");
      setSelectedImage(null);
      setImagePreview(c.imagem || "");
      if (c.delay) setMessageDelay(c.delay);
      // Buscar contatos da lista usada
      if (c.contatos) {
        supabase
          .from("contato_evolution")
          .select("contatos")
          .eq("id", c.contatos)
          .single()
          .then(({ data }) => {
            if (data && data.contatos) {
              try {
                setContacts(JSON.parse(data.contatos));
              } catch {}
            }
          });
      }
    }
  }, [location.state]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch(`${API_URL}/whatsapp/devices`);
        if (!response.ok) throw new Error("Erro ao buscar devices");
        const data = await response.json();

        // Agora data.devices é um array de objetos { deviceId, connection_name }
        if (Array.isArray(data.devices)) {
          setDevices(data.devices);
        } else {
          console.error("Formato inesperado:", data);
          setDevices([]);
        }
      } catch (err) {
        console.error("Erro ao buscar conexões:", err);
        setDevices([]);
      }
    };

    fetchDevices();
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview("");
  };

  const handleSubmit = async (e: React.FormEvent, draft = false) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Upload image to Supabase Storage if selected
      let imageUrl = "";
      if (selectedImage) {
        const { data: imageData, error: imageError } = await supabase.storage
          .from("imagemevolution")
          .upload(
            `campaign-images/${Date.now()}-${selectedImage.name}`,
            selectedImage
          );

        if (imageError) throw imageError;
        imageUrl = `${
          supabase.storage.from("imagemevolution").getPublicUrl(imageData.path)
            .data.publicUrl
        }`;
      }

      // Salvar contatos apenas se não houver lista selecionada
      let contatosId = selectedContactListId;
      if (!selectedContactListId) {
        const { data: contactsData, error: contactsError } = await supabase
          .from("contato_evolution")
          .insert([
            {
              contatos: JSON.stringify(contacts),
              relacao_login: user?.id,
            },
          ])
          .select()
          .single();
        if (contactsError) throw contactsError;
        contatosId = contactsData.id;
      }

      // Adicionar 3 horas ao horário local antes de converter para UTC ISO string
      let scheduledDateTime = null;
      if (!isImmediate && scheduledDate && scheduledTime) {
        const localDate = new Date(`${scheduledDate}T${scheduledTime}:00`);
        // Soma 3 horas (em milissegundos)
        const localDatePlus3 = new Date(
          localDate.getTime() + 3 * 60 * 60 * 1000
        );
        scheduledDateTime = new Date(
          localDatePlus3.getTime() - localDatePlus3.getTimezoneOffset() * 60000
        ).toISOString();
      }

      // Salva a campanha no banco normalmente
      const { data: messageData, error: messageError } = await supabase
        .from("mensagem_evolution")
        .insert([
          {
            name: campaignName,
            texto: message,
            imagem: imageUrl,
            data_de_envio: isImmediate
              ? new Date().toISOString()
              : scheduledDateTime,
            contatos: contatosId,
            delay: messageDelay,
            status: draft ? "Draft" : isImmediate ? null : "Scheduled",
            device_id: selectedDevice,
            nome_da_instancia: null,
            apikey_da_instancia: null,
          },
        ])
        .select()
        .single();

      if (messageError) {
        console.error("Erro ao salvar mensagem:", messageError);
        throw messageError;
      }

      console.log("Mensagem salva com sucesso:", messageData);

      // Não faça o envio imediato pelo frontend!
      // O CRONJOB do backend irá processar e enviar as mensagens.

      // Redireciona ou mostra mensagem de sucesso normalmente
      navigate("/campaigns");
    } catch (err) {
      console.error("Error creating campaign:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create campaign. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:space-x-8">
      <div className="flex-1">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/campaigns")}
                className="btn-secondary"
              >
                <ArrowLeft size={16} className="mr-2" />
                Voltar
              </button>
              <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                Nova Campanha
              </h1>
            </div>
          </div>

          <form
            ref={formRef}
            onSubmit={(e) => handleSubmit(e, isDraft)}
            className="space-y-8"
          >
            {/* Configurações Básicas */}
            <div className="card">
              <h2 className="text-xl font-display font-bold text-accent mb-6">
                Configurações Básicas
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-accent mb-2">
                    Nome da Campanha
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="input"
                    placeholder="Digite o nome da campanha"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent mb-2">
                    Conexão WhatsApp
                  </label>
                  <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">Selecione uma conexão...</option>
                    {devices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.connection_name || device.deviceId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Mensagem */}
            <div className="card">
              <h2 className="text-xl font-display font-bold text-accent mb-6">
                Mensagem
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-accent mb-2">
                    Texto da Mensagem
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="input h-32"
                    placeholder="Digite a mensagem que será enviada"
                    required
                  />
                </div>
                {/* Upload de Imagem */}
                <div>
                  <label className="block text-sm font-medium text-accent mb-2">
                    Imagem (opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    onChange={handleImageUpload}
                    className="input"
                  />
                  {imagePreview && (
                    <div className="mt-2 relative w-fit">
                      <img
                        src={imagePreview}
                        alt="Preview da imagem"
                        className="max-h-40 rounded border"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 shadow hover:bg-red-100"
                        title="Remover imagem"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contatos */}
            <div className="card">
              <h2 className="text-xl font-display font-bold text-accent mb-6">
                Contatos
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-accent mb-2">
                    Lista de Contatos
                  </label>
                  <select
                    value={selectedContactListId || ""}
                    onChange={(e) => {
                      const list = contactLists.find(
                        (l) => l.id === Number(e.target.value)
                      );
                      setSelectedContactListId(Number(e.target.value));
                      if (list) setContacts(list.contatos);
                    }}
                    className="input"
                    required
                  >
                    <option value="">Selecione uma lista de contatos...</option>
                    {contactLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name} ({list.contatos.length} contatos)
                      </option>
                    ))}
                  </select>
                </div>
                {contacts.length > 0 && (
                  <div className="bg-primary/5 rounded-xl p-4">
                    <p className="text-sm text-accent/60 mb-2">
                      {contacts.length} contatos selecionados
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {contacts.slice(0, 5).map((contact, index) => (
                        <div key={index} className="text-sm text-accent/80">
                          {contact.name} - {contact.phone}
                        </div>
                      ))}
                      {contacts.length > 5 && (
                        <div className="text-sm text-accent/60">
                          +{contacts.length - 5} contatos
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Agendamento */}
            <div className="card">
              <h2 className="text-xl font-display font-bold text-accent mb-6">
                Agendamento
              </h2>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={isImmediate}
                      onChange={() => setIsImmediate(true)}
                      className="form-radio text-primary"
                    />
                    <span className="text-accent">Envio Imediato</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={!isImmediate}
                      onChange={() => setIsImmediate(false)}
                      className="form-radio text-primary"
                    />
                    <span className="text-accent">Agendar</span>
                  </label>
                </div>

                {!isImmediate && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-accent mb-2">
                        Data
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="input"
                        required={!isImmediate}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-accent mb-2">
                        Hora
                      </label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="input"
                        required={!isImmediate}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-accent mb-2">
                    Intervalo entre mensagens (segundos)
                  </label>
                  <input
                    type="number"
                    value={messageDelay}
                    onChange={(e) => setMessageDelay(Number(e.target.value))}
                    className="input"
                    min="0"
                    placeholder="0"
                  />
                  <span className="text-xs text-accent/60 mt-1 block">
                    Recomendado: 60 segundos
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="btn-secondary"
              >
                Salvar Rascunho
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    {isDraft ? "Salvando..." : "Criando..."}
                  </>
                ) : isDraft ? (
                  "Salvar Rascunho"
                ) : (
                  "Criar Campanha"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="hidden md:block w-[340px] flex-shrink-0">
        <div className="sticky top-8">
          <div className="bg-[#e1f7d5] rounded-2xl border border-zinc-200 shadow-lg overflow-hidden">
            <div className="bg-[#075e54] p-4 flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary/20 mr-3"></div>
              <div>
                <div className="text-white font-medium">Contato Exemplo</div>
                <div className="text-[11px] text-green-100">online</div>
              </div>
            </div>

            <div className="p-4 min-h-[400px] flex flex-col justify-end">
              {(imagePreview || message) && (
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-2 self-start max-w-[280px]">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full object-cover"
                    />
                  )}
                  {message && (
                    <div className="px-4 py-2 text-sm text-zinc-800 whitespace-pre-wrap break-words">
                      {message}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-[#f0f0f0] p-3 flex items-center border-t border-zinc-200">
              <div className="w-8 h-8 rounded-full bg-zinc-300 mr-2"></div>
              <div className="text-sm text-zinc-500">Mensagem</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCampaign;
