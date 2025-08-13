import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Contact {
  name: string;
  phone: string;
}

const Contacts = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [savedContacts, setSavedContacts] = useState<any[]>([]);
  const [selectedContactList, setSelectedContactList] = useState<any>(null);

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const parsedContacts: Contact[] = lines
        .filter(line => line.trim())
        .map(line => {
          const [name, phone] = line.split(',').map(item => item.trim());
          return { name, phone };
        });
      setContacts(parsedContacts);
    };
    reader.readAsText(file);
  };

  const handleAddContact = () => {
    if (contactName && contactPhone) {
      setContacts([...contacts, { name: contactName, phone: contactPhone }]);
      setContactName('');
      setContactPhone('');
    }
  };

  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleSaveContacts = async () => {
    if (contacts.length === 0) return;

    setIsLoading(true);
    setError('');

    try {
     const { error } = await supabase
  .from('contato_evolution')
  .insert([
    {
      contatos: JSON.stringify(contacts),
      relacao_login: user?.id,
      name: `Lista de Contatos ${new Date().toLocaleString()}`
    }
  ]);

      if (error) throw error;

      setContacts([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchSavedContacts();
    } catch (err) {
      console.error('Error saving contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to save contacts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contato_evolution')
        .select('*')
        .eq('relacao_login', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedContacts(data || []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  React.useEffect(() => {
    fetchSavedContacts();
  }, [user?.id]);

  const handleViewContacts = (contactList: any) => {
    setSelectedContactList(contactList);
  };

  const handleCloseView = () => {
    setSelectedContactList(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-yellow-400 drop-shadow-[0_2px_8px_rgba(255,200,0,0.7)] mb-6">Contacts</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-800 mb-6">
        <h2 className="text-lg font-medium text-zinc-100 mb-4">Add New Contact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-zinc-400 mb-1">
              Name
            </label>
            <input
              type="text"
              id="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              placeholder="Enter contact name..."
            />
          </div>
          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium text-zinc-400 mb-1">
              Phone
            </label>
            <input
              type="tel"
              id="contactPhone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              placeholder="Enter phone number..."
            />
          </div>
        </div>
        <button
          onClick={handleAddContact}
          className="w-full px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg hover:bg-yellow-500 transition-colors"
        >
          Add Contact
        </button>
      </div>

      <div className="bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-800 mb-6">
        <h2 className="text-lg font-medium text-zinc-100 mb-4">Import Contacts</h2>
        <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleCSVUpload}
            className="hidden"
          />
          <div className="space-y-2">
            <div className="flex justify-center">
              <Upload className="h-10 w-10 text-zinc-400" />
            </div>
            <div className="text-sm text-zinc-400">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-yellow-400 hover:text-yellow-300 font-medium"
              >
                Click to upload
              </button>
              {' '}or drag and drop
            </div>
            <p className="text-xs text-zinc-500">CSV file with name and phone number columns</p>
          </div>
        </div>
      </div>

      {contacts.length > 0 && (
        <div className="bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-800 mb-6">
          <h2 className="text-lg font-medium text-zinc-100 mb-4">
            Contacts to Save ({contacts.length})
          </h2>
          <div className="max-h-60 overflow-y-auto border border-zinc-800 rounded-lg">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                {contacts.map((contact, index) => (
                  <tr key={index}>
                    <td className="px-6 py-2 text-sm text-zinc-300">{contact.name}</td>
                    <td className="px-6 py-2 text-sm text-zinc-300">{contact.phone}</td>
                    <td className="px-6 py-2 text-sm text-right">
                      <button
                        onClick={() => handleRemoveContact(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveContacts}
              disabled={isLoading}
              className="px-4 py-2 bg-yellow-400 text-zinc-900 rounded-lg hover:bg-yellow-500 transition-colors flex items-center"
            >
              {isLoading && <Loader2 size={16} className="animate-spin mr-2" />}
              Save Contacts
            </button>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-800">
        <h2 className="text-lg font-medium text-zinc-100 mb-4">Saved Contact Lists</h2>
        <div className="space-y-4">
          {savedContacts.map((contactList) => (
            <div
              key={contactList.id}
              className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg"
            >
              <div>
                <h3 className="text-zinc-100 font-medium">{contactList.name}</h3>
                <p className="text-sm text-zinc-400">
                  {JSON.parse(contactList.contatos).length} contacts
                </p>
              </div>
              <button
                onClick={() => handleViewContacts(contactList)}
                className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition-colors"
              >
                View Contacts
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedContactList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-zinc-100">{selectedContactList.name}</h3>
                <button
                  onClick={handleCloseView}
                  className="text-zinc-400 hover:text-zinc-300"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-8rem)]">
              <table className="min-w-full divide-y divide-zinc-800">
                <thead className="bg-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                      Phone
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                  {JSON.parse(selectedContactList.contatos).map((contact: Contact, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-2 text-sm text-zinc-300">{contact.name}</td>
                      <td className="px-6 py-2 text-sm text-zinc-300">{contact.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts; 