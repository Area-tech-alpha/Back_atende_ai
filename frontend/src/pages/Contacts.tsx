import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import Contacts from './Contacts/Contacts';

// Importa a imagem fornecida para o cabeçalho da página
const headerImage = `uploaded:image_7725c7.png-556f8626-e65f-4cad-9ade-4e5e633936fa`;

const ContactsPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen p-8 font-sans">
      {/* Cabeçalho da página com a imagem de fundo */}
      <div
        className="relative mb-8 p-12 rounded-2xl text-white flex flex-col justify-end items-start"
        style={{
          backgroundImage: `url(${headerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '250px',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-2xl"></div>
        <h1 className="relative z-10 text-4xl font-bold mb-2">Página de Contatos</h1>
        <p className="relative z-10 text-lg">Encontre todas as informações de contato importantes aqui.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card de informações de contato */}
        <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center space-x-4">
          <div className="flex-shrink-0 p-3 bg-blue-100 rounded-full text-blue-600">
            <Mail size={24} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Email</h3>
            <p className="text-gray-600">contato@exemplo.com</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center space-x-4">
          <div className="flex-shrink-0 p-3 bg-green-100 rounded-full text-green-600">
            <Phone size={24} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Telefone</h3>
            <p className="text-gray-600">+55 (11) 98765-4321</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center space-x-4">
          <div className="flex-shrink-0 p-3 bg-purple-100 rounded-full text-purple-600">
            <MapPin size={24} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Endereço</h3>
            <p className="text-gray-600">Rua Exemplo, 123, São Paulo - SP</p>
          </div>
        </div>
      </div>

      {/* Renderiza o componente da lista de contatos */}
      <div className="mt-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Nossa Equipe</h2>
        <Contacts />
      </div>
    </div>
  );
};

export default ContactsPage;
