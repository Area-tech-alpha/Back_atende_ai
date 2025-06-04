import React, { useState, useEffect, useRef } from 'react';
import { Plus, Upload, Download, Search, User, Loader2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Contact {
  id: number;
  name: string;
  phone: string;
  created_at: string;
}

interface ContactList {
  id: number;
  contatos: Contact[];
  created_at: string;
  name?: string;
}

interface Modal {
  isOpen: boolean;
  type: 'contact' | 'list' | null;
  data?: ContactList;
}

const Contacts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Modal>({ isOpen: false, type: null });
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importListName, setImportListName] = useState('');
  const [importContacts, setImportContacts] = useState<{ name: string; phone: string }[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportListId, setExportListId] = useState<number | null>(null);
  const [importJson, setImportJson] = useState('');

  useEffect(() => {
    if (user) {
      fetchContacts();
      fetchContactLists();
    }
  }, [user]);

  const fetchContactLists = async () => {
    try {
      const { data, error } = await supabase
        .from('contato_evolution')
        .select('*');

      if (error) throw error;

      const formattedLists = data.map(list => ({
        id: list.id,
        contatos: JSON.parse(list.contatos || '[]'),
        created_at: list.created_at,
        name: list.name || ''
      }));

      setContactLists(formattedLists);
    } catch (error) {
      console.error('Error fetching contact lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contato_evolution')
        .select('*')
        .eq('relacao_login', user?.id);

      if (error) throw error;

      const formattedContacts = data.map(contact => ({
        id: contact.id,
        name: contact.name || '',
        phone: contact.phone || '',
        created_at: contact.created_at
      }));

      setContacts(formattedContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('contato_evolution')
        .insert([
          {
            name: newContact.name,
            phone: newContact.phone,
            relacao_login: user?.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setContacts([...contacts, {
        id: data.id,
        name: data.name,
        phone: data.phone,
        created_at: data.created_at
      }]);

      setModal({ isOpen: false, type: null });
      setNewContact({ name: '', phone: '' });
    } catch (error) {
      console.error('Error adding contact:', error);
      setError('Failed to add contact. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredContactLists = contactLists.filter(list => {
    const contactsInList = list.contatos.some(contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery)
    );
    return contactsInList;
  });

  // Função para importar CSV (igual ao formulário de nova campanha)
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const parsedContacts = lines
        .filter(line => line.trim())
        .map(line => {
          const [name, phone] = line.split(',').map(item => item.trim());
          return { name, phone };
        });
      setImportContacts(parsedContacts);
    };
    reader.readAsText(file);
  };

  // Função para importar JSON
  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(importJson);
      if (Array.isArray(parsed) && parsed.every(c => c.name && c.phone)) {
        setImportContacts(parsed);
      } else {
        setError('Formato inválido. Use: [{"name":"nome","phone":"telefone"}, ...]');
      }
    } catch {
      setError('JSON inválido.');
    }
  };

  // Salvar lista importada
  const handleSaveImportList = async () => {
    if (!importListName || importContacts.length === 0) return;
    setIsSubmitting(true);
    try {
      await supabase.from('contato_evolution').insert([
        {
          contatos: JSON.stringify(importContacts),
          relacao_login: user?.id,
          name: importListName
        }
      ]);
      setShowImportModal(false);
      setImportListName('');
      setImportContacts([]);
      setImportJson('');
      fetchContactLists();
    } catch (err) {
      setError('Erro ao importar lista.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Exportar lista selecionada
  const handleExportList = () => {
    if (!exportListId) return;
    const list = contactLists.find(l => l.id === exportListId);
    if (!list) return;
    const csv = [
      ['Nome', 'Telefone'],
      ...list.contatos.map(c => [c.name, c.phone])
    ].map(e => e.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${list.id}_${list.created_at}_contatos.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShowExportModal(false);
    setExportListId(null);
  };

  // Adicionar contato manualmente
  const handleAddContactManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await supabase.from('contato_evolution').insert([
        {
          contatos: JSON.stringify([{ name: newContact.name, phone: newContact.phone }]),
          relacao_login: user?.id,
          name: `Contato manual - ${newContact.name}`
        }
      ]);
      setModal({ isOpen: false, type: null });
      setNewContact({ name: '', phone: '' });
      fetchContactLists();
    } catch (err) {
      setError('Erro ao adicionar contato.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          Contatos
        </h1>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowImportModal(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Upload size={16} />
            <span>Importar</span>
          </button>
          <button 
            onClick={() => setShowExportModal(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Exportar</span>
          </button>
          <button 
            onClick={() => setModal({ isOpen: true, type: 'contact' })}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Novo Contato</span>
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="card">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-accent/40" />
          </div>
          <input
            type="text"
            placeholder="Buscar contatos..."
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Contact lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContactLists.map((list) => (
          <div key={list.id} className="card group hover:shadow-glow transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-accent truncate">
                {list.name || `Lista ${list.id}`}
              </h3>
              <span className="text-sm text-accent/60">
                {list.contatos.length} contatos
              </span>
            </div>
            <div className="space-y-3">
              {list.contatos.slice(0, 3).map((contact, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <User size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-accent truncate">{contact.name}</p>
                    <p className="text-accent/60 truncate">{contact.phone}</p>
                  </div>
                </div>
              ))}
              {list.contatos.length > 3 && (
                <p className="text-sm text-accent/60">
                  +{list.contatos.length - 3} contatos
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-accent/75 backdrop-blur-sm">
          <div className="card w-full max-w-lg relative">
            <button
              className="absolute top-4 right-4 text-accent/60 hover:text-primary transition-colors duration-200"
              onClick={() => setShowImportModal(false)}
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-6">
              Importar Contatos
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-accent mb-2">
                  Nome da Lista
                </label>
                <input
                  type="text"
                  className="input"
                  value={importListName}
                  onChange={(e) => setImportListName(e.target.value)}
                  placeholder="Digite o nome da lista"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-accent mb-2">
                  Importar CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary w-full"
                >
                  <Upload size={16} className="mr-2" />
                  Selecionar Arquivo CSV
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-accent mb-2">
                  Ou cole o JSON
                </label>
                <textarea
                  className="input h-32"
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='[{"name":"nome","phone":"telefone"}, ...]'
                />
              </div>
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveImportList}
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Importando...
                    </>
                  ) : (
                    'Importar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-accent/75 backdrop-blur-sm">
          <div className="card w-full max-w-lg relative">
            <button
              className="absolute top-4 right-4 text-accent/60 hover:text-primary transition-colors duration-200"
              onClick={() => setShowExportModal(false)}
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-6">
              Exportar Lista
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-accent mb-2">
                  Selecione a Lista
                </label>
                <select
                  className="input"
                  value={exportListId || ''}
                  onChange={(e) => setExportListId(Number(e.target.value))}
                >
                  <option value="">Selecione uma lista</option>
                  {contactLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name || `Lista ${list.id}`} ({list.contatos.length} contatos)
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExportList}
                  disabled={!exportListId}
                  className="btn-primary"
                >
                  Exportar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {modal.isOpen && modal.type === 'contact' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-accent/75 backdrop-blur-sm">
          <div className="card w-full max-w-lg relative">
            <button
              className="absolute top-4 right-4 text-accent/60 hover:text-primary transition-colors duration-200"
              onClick={() => setModal({ isOpen: false, type: null })}
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-6">
              Novo Contato
            </h2>
            <form onSubmit={handleAddContactManual} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-accent mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  className="input"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Digite o nome"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-accent mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  className="input"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="Digite o telefone"
                  required
                />
              </div>
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setModal({ isOpen: false, type: null })}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Adicionando...
                    </>
                  ) : (
                    'Adicionar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;