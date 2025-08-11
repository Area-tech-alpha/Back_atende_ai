import React, { useState } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Falha ao fazer login. Por favor, verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-secondary-dark to-secondary p-4">
      <div className="max-w-md w-full bg-secondary rounded-2xl shadow-soft overflow-hidden border border-secondary-dark">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <img
                src="https://qbezqfbovuyiphkvvnen.supabase.co/storage/v1/object/public/alpha//logo-alpha.png"
                alt="Logomarca Alpha"
                className="w-48 h-48 object-contain animate-float"
              />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl -z-10"></div>
            </div>
            <p className="text-accent/60">Entre com suas credenciais para acessar o sistema</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/20 text-primary rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-accent mb-2">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/40">
                  <Mail size={18} />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-11"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-accent mb-2">
                Senha
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/40">
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-11"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`btn-primary w-full ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-accent/60">Não tem uma conta? </span>
            <Link to="/signup" className="text-primary hover:text-primary-dark transition-colors duration-200">
              Entre em contato
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;