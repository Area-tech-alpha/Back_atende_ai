import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Chatbot() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAgents = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('/api/mistral/agents');
      setAgents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Erro ao buscar agentes.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Meus Robôs (Agentes Mistral)</h2>
        <button onClick={fetchAgents} className="bg-primary text-white px-4 py-2 rounded">Atualizar</button>
      </div>
      {loading && <div>Carregando...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <ul className="space-y-4">
        {agents.length === 0 && !loading && <li>Nenhum robô encontrado.</li>}
        {agents.map(agent => (
          <li key={agent.id} className="bg-gray-50 p-4 rounded shadow">
            <div className="font-bold text-lg">{agent.name}</div>
            <div className="text-gray-700 mb-2">{agent.description}</div>
            <div className="text-xs text-gray-500">ID: {agent.id}</div>
            <div className="text-xs text-gray-400">Modelo: {agent.model}</div>
            <div className="text-xs text-gray-400">Criado em: {new Date(agent.created_at).toLocaleString()}</div>
            <div className="text-xs text-gray-400">Atualizado em: {new Date(agent.updated_at).toLocaleString()}</div>
            {/* Adicione mais campos relevantes conforme a resposta da API */}
          </li>
        ))}
      </ul>
    </div>
  );
} 