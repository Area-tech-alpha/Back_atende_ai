import React, { useState } from 'react';
import axios from 'axios';


const initialForm = {
  instructions: '',
  name: '',
  description: '',
};

export default function CreateAgent() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Adicionando a tipagem para o evento de mudança (e)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Adicionando a tipagem para o evento de submit do formulário (e)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');
    const payload = {
      ...form,
      model: 'mistral-small-latest',
      completion_args: { temperature: 0 }
    };
    try {
      console.log('Enviando payload para criação de agente:', payload);
      const response = await axios.post('/api/mistral/agents', payload);
      console.log('Resposta da API ao criar agente:', response.data);
      setSuccess(true);
      setForm(initialForm);
    } catch (err) {
      console.error('Erro ao criar agente:', err);
      setError('Erro ao criar robô.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">
      <h2 className="text-2xl font-bold mb-6">Criar Novo Robô (Agente Mistral)</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="border rounded px-3 py-2 w-full" placeholder="Nome do agente" name="name" value={form.name} onChange={handleChange} required />
        <input className="border rounded px-3 py-2 w-full" placeholder="Descrição" name="description" value={form.description} onChange={handleChange} />
        <input className="border rounded px-3 py-2 w-full" placeholder="Instruções" name="instructions" value={form.instructions} onChange={handleChange} />
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Salvando...' : 'Criar Robô'}</button>
        {success && <div className="text-green-600">Robô criado com sucesso!</div>}
        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  );
}
