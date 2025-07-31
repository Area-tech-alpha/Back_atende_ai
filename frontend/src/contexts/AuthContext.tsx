import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  nome_da_instancia: string;
  apikey: string;
  id_instancia: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data, error } = await supabase
        .from('login_evolution')
        .select('*')
        .single();

      if (error) {
        console.error('Error checking user:', error);
        return;
      }

      if (data) {
        setUser({
          id: data.id.toString(),
          email: data.email,
          nome_da_instancia: data.nome_da_instancia,
          apikey: data.apikey,
          id_instancia: data.id_instancia
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('login_evolution')
        .select('*')
        .eq('email', email)
        .eq('senha', password)
        .single();

      if (error) {
        throw new Error('Invalid login credentials');
      }

      if (data) {
        setUser({
          id: data.id.toString(),
          email: data.email,
          nome_da_instancia: data.nome_da_instancia,
          apikey: data.apikey,
          id_instancia: data.id_instancia
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('login_evolution')
        .insert([
          {
            email,
            senha: password,
            nome_da_instancia: name
          }
        ])
        .select()
        .single();

      if (error) {
        throw new Error('Error creating account');
      }

      if (data) {
        setUser({
          id: data.id.toString(),
          email: data.email,
          nome_da_instancia: data.nome_da_instancia,
          apikey: data.apikey,
          id_instancia: data.id_instancia
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};