import React, { useState, useEffect, useRef } from 'react';
import { Plus, Upload, Download, Search, User, Loader2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';

// Interfaces para tipagem dos dados
interface Contact {
  name: string;
  phone: string;
}

interface ContactList {
  id: number;
  name: string;
  contatos: Contact[];
  created_at: string;
}

const ContactsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'import' | 'export' | null>(null);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importListName, setImportListName] = useState('');
  const [importContacts, setImportContacts] = useState<Contact[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [exportListId, setExportListId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchContactLists();
    }
  }, [user]);

  const fetchContactLists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contato_evolution')
        .select('*')
        .eq('relacao_login', user?.id);

      if (error) throw error;
      
      const formattedLists = data.map(list => ({
        id: list.id,
        name: list.name || `Lista de ${new Date(list.created_at).toLocaleDateString()}`,
        contatos: JSON.parse(list.contatos || '[]'),
        created_at: list.created_at,
      }));

      setContactLists(formattedLists);
    } catch (error) {
      toast.error('Erro ao buscar listas de contatos.');
      console.error('Error fetching contact lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').slice(1); // Pula o cabeçalho
      const parsedContacts: Contact[] = lines
        .filter(line => line.trim())
        .map(line => {
          const [name, phone] = line.split(',').map(item => item.trim());
          return { name, phone };
        });
      setImportContacts(parsedContacts);
    };
    reader.readAsText(file);
  };
  
  const handleSaveImportedList = async () => {
    if (!importListName || importContacts.length === 0 || !user) {
        toast.warn('Nome da lista e contatos são obrigatórios.');
        return;
    }
    setIsSubmitting(true);
    try {
        await supabase.from('contato_evolution').insert([{
            contatos: JSON.stringify(importContacts),
            relacao_login: user.id,
            name: importListName
        }]);
        toast.success(`Lista "${importListName}" importada com sucesso!`);
        closeModal();
        fetchContactLists();
    } catch (err) {
        toast.error('Erro ao importar lista.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone || !user) {
        toast.warn('Nome e telefone são obrigatórios.');
        return;
    }
    setIsSubmitting(true);
    try {
      await supabase.from('contato_evolution').insert([{
        contatos: JSON.stringify([newContact]),
        relacao_login: user.id,
        name: `Contato: ${newContact.name}`
      }]);
      toast.success("Contato adicionado com sucesso!");
      closeModal();
      fetchContactLists();
    } catch (err) {
      toast.error('Erro ao adicionar contato.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteList = async (listId: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta lista?')) {
      try {
        await supabase.from('contato_evolution').delete().eq('id', listId);
        toast.success("Lista excluída!");
        setContactLists(prev => prev.filter(l => l.id !== listId));
      } catch (error) {
        toast.error("Erro ao excluir lista.");
      }
    }
  };

  const handleExportList = () => {
    if (!exportListId) return;
    const listToExport = contactLists.find(l => l.id === exportListId);
    if (!listToExport) {
        toast.error("Lista não encontrada.");
        return;
    }

    const csvHeader = "name,phone\n";
    const csvRows = listToExport.contatos.map(c => `${c.name},${c.phone}`).join("\n");
    const csvContent = csvHeader + csvRows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${listToExport.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    closeModal();
  };

  const filteredLists = contactLists.filter(list => 
    list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    list.contatos.some(contact => 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        contact.phone.includes(searchQuery)
    )
  );

  const openModal = (type: 'add' | 'import' | 'export') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    // Limpa estados dos modais
    setNewContact({ name: '', phone: '' });
    setImportContacts([]);
    setImportListName('');
    setCsvFileName('');
    setExportListId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-accent">Contatos</h1>
        <div className="flex gap-2">
          <button onClick={() => openModal('import')} className="btn-secondary flex items-center gap-2">
            <Upload size={16} /> Importar
          </button>
          <button onClick={() => openModal('export')} className="btn-secondary flex items-center gap-2">
            <Download size={16} /> Exportar
          </button>
          <button onClick={() => openModal('add')} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Novo Contato
          </button>
        </div>
      </div>

      <div className="card">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent/60" />
          <input
            type="text"
            placeholder="Buscar por nome da lista, nome do contato ou telefone..."
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLists.map((list) => (
          <div key={list.id} className="card flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-accent  pr-2">{list.name}</h3>
                <button onClick={() => handleDeleteList(list.id)} className="text-accent/60 hover:text-red-500 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {list.contatos.slice(0, 3).map((contact, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-secondary-dark rounded-lg flex items-center justify-center ring--secondary-darker">
                      <User size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-accent font-medium truncate">{contact.name}</p>
                      <p className="text-accent/60 truncate">{contact.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border text-sm text-accent/60">
              {list.contatos.length > 3 && <p>+{list.contatos.length - 3} outros contatos</p>}
              <p>{list.contatos.length} contato(s) no total</p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-accent/75 backdrop-blur-sm">
          <div className="card w-full max-w-lg relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-accent/60 hover:text-primary">
              <X size={24} />
            </button>
            
            {modalType === 'add' && (
              <form onSubmit={handleAddContact} className="space-y-6">
                <h2 className="text-xl font-bold text-accent">Novo Contato</h2>
                <div>
                  <label className="block text-sm font-medium text-accent/60 mb-1">Nome</label>
                  <input type="text" className="input" value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent/60 mb-1">Telefone</label>
                  <input type="tel" className="input" value={newContact.phone} onChange={(e) => setNewContact({...newContact, phone: e.target.value})} required />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Adicionar'}
                  </button>
                </div>
              </form>
            )}

            {modalType === 'import' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-accent">Importar Lista de Contatos</h2>
                <div>
                  <label className="block text-sm font-medium text-accent/60 mb-1">Nome da Nova Lista</label>
                  <input type="text" className="input" value={importListName} onChange={(e) => setImportListName(e.target.value)} placeholder="Ex: Clientes VIP" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent/60mb-1">Arquivo CSV</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input type="file" accept=".csv" onChange={handleCSVUpload} ref={fileInputRef} className="hidden"/>
                    <Upload className="h-10 w-10 text-accent/60 mx-auto mb-2"/>
                    <p className="text-sm text-accent/60">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="font-semibold text-primary hover:underline">Clique para enviar</button>
                    </p>
                    {csvFileName && <p className="text-xs text-green-500 mt-2">Arquivo: {csvFileName}</p>}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={closeModal} className="btn-secondary">Cancelar</button>
                  <button onClick={handleSaveImportedList} disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Importar Lista'}
                  </button>
                </div>
              </div>
            )}

            {modalType === 'export' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-accent">Exportar Lista de Contatos</h2>
                <div>
                  <label className="block text-sm font-medium text-accent/60 mb-1">Selecione a Lista para Exportar</label>
                  <select
                    className="input"
                    value={exportListId || ''}
                    onChange={(e) => setExportListId(Number(e.target.value))}
                  >
                    <option value="" disabled>-- Escolha uma lista --</option>
                    {contactLists.map(list => (
                      <option key={list.id} value={list.id}>{list.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={closeModal} className="btn-secondary">Cancelar</button>
                  <button onClick={handleExportList} disabled={!exportListId} className="btn-primary">
                    Exportar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsPage;
