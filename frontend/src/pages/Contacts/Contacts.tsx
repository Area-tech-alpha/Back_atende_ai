import React, { useState } from 'react';
import { ChevronRight, Mail, Phone } from 'lucide-react';

// Importa a imagem fornecida para o perfil dos contatos
const contactImage = `uploaded:image_85aa49.png-810e788f-67e2-4256-a230-2f52b8fc902b`;

interface Contact {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
}

const Contacts: React.FC = () => {
  // Dados de exemplo para a lista de contatos
  const [contacts] = useState<Contact[]>([
    { id: 1, name: 'João Silva', role: 'Gerente de Vendas', email: 'joao.s@exemplo.com', phone: '(11) 98765-4321' },
    { id: 2, name: 'Maria Souza', role: 'Designer UX/UI', email: 'maria.s@exemplo.com', phone: '(11) 91234-5678' },
    { id: 3, name: 'Pedro Santos', role: 'Desenvolvedor Full-Stack', email: 'pedro.s@exemplo.com', phone: '(11) 99876-5432' },
    { id: 4, name: 'Ana Costa', role: 'Analista de Marketing', email: 'ana.c@exemplo.com', phone: '(11) 95555-1111' },
  ]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg font-sans">
      <ul className="divide-y divide-gray-200">
        {contacts.map((contact) => (
          <li key={contact.id} className="py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Imagem de perfil do contato */}
              <div className="flex-shrink-0">
                <img
                  className="h-12 w-12 rounded-full object-cover"
                  src={contactImage}
                  alt={`Imagem de perfil de ${contact.name}`}
                  // Adiciona um fallback simples se a imagem não carregar
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = "https://placehold.co/48x48/F3F4F6/6B7280?text=👤";
                  }}
                />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{contact.name}</p>
                <p className="text-sm text-gray-500">{contact.role}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a href={`mailto:${contact.email}`} className="text-blue-600 hover:text-blue-800">
                <Mail size={20} />
              </a>
              <a href={`tel:${contact.phone}`} className="text-green-600 hover:text-green-800">
                <Phone size={20} />
              </a>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Contacts;
