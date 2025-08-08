import React from 'react';
import { TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react';

// Importa a imagem fornecida para o dashboard
const dashboardImage = `uploaded:image_863927.png-efc1fb1f-54dc-4700-a2d3-0a025e061401`;

const Dashboard: React.FC = () => {
  return (
    <div className="bg-gray-100 min-h-screen p-8 font-sans">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium shadow-md hover:bg-blue-700 transition-colors">
          Novo Relatório
        </button>
      </div>

      {/* Grid de cards com dados e ícones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Receita Total</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">R$ 45.678,90</h2>
          </div>
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <DollarSign size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Vendas</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">1.250</h2>
          </div>
          <div className="p-3 bg-green-100 rounded-full text-green-600">
            <ShoppingCart size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Novos Clientes</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">324</h2>
          </div>
          <div className="p-3 bg-purple-100 rounded-full text-purple-600">
            <Users size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Taxa de Crescimento</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">12,4%</h2>
          </div>
          <div className="p-3 bg-red-100 rounded-full text-red-600">
            <TrendingUp size={28} />
          </div>
        </div>
      </div>

      {/* Seção principal com a imagem do dashboard */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Visão Geral</h2>
        <img
          className="w-full h-auto rounded-xl object-cover"
          src={dashboardImage}
          alt="Visão geral do dashboard"
          // Adiciona um fallback simples se a imagem não carregar
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = "https://placehold.co/1200x600/E5E7EB/4B5563?text=Visão+Geral+do+Dashboard";
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
