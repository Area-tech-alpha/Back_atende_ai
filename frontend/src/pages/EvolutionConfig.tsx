import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Plus } from 'lucide-react';

interface EvolutionItem {
  id: number;
  url: string;
  apikey: string;
  created_at: string;
}

const Evolution: React.FC = () => {
  const [evolutions, setEvolutions] = useState<EvolutionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ url: '', apikey: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvolutions = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('evolution')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setError('Erro ao buscar evolutions.');
      setEvolutions([]);
    } else {
      setEvolutions(data as EvolutionItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvolutions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from('evolution')
      .insert([{ url: form.url, apikey: form.apikey }]);
    if (error) {
      setError('Erro ao cadastrar evolution.');
    } else {
      setForm({ url: '', apikey: '' });
      fetchEvolutions();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
          Evolution - Cadastro
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-xl font-display font-bold text-accent mb-6">
            Nova Evolution
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                URL (apenas domínio)
              </label>
              <input
                name="url"
                value={form.url}
                onChange={handleChange}
                required
                placeholder="ex: evolution.assessorialpha.com"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-accent mb-2">
                API Key
              </label>
              <input
                name="apikey"
                value={form.apikey}
                onChange={handleChange}
                required
                className="input"
              />
            </div>
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  Cadastrar Evolution
                </>
              )}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="text-xl font-display font-bold text-accent mb-6">
            Evolutions Cadastradas
          </h2>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : evolutions.length === 0 ? (
            <div className="text-accent/60 text-center py-8">
              Nenhuma evolution cadastrada.
            </div>
          ) : (
            <div className="space-y-4">
              {evolutions.map(evo => (
                <div
                  key={evo.id}
                 className="p-4 bg-secondary-dark rounded-xl border border-secondary-darker  hover:border-primary/20 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-bold text-accent">
                      {evo.url}
                    </h3>
                    <span className="text-xs text-accent/60">
                      {new Date(evo.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-accent/60">API Key:</span>
                    <code className="px-2 py-1 bg-secondary-darker rounded text-accent/80 font-mono">
                      {evo.apikey}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Evolution; 