import React, { createContext, useState, useEffect, useContext } from 'react';
import { ApiService } from '../services/api';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN';
  country: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, passwordPlain: string) => Promise<void>;
  register: (email: string, passwordPlain: string, firstName: string, lastName: string, country?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSession = async () => {
      const savedToken = localStorage.getItem('eco_token');
      if (savedToken) {
        try {
          const profile = await ApiService.get('/auth/me', savedToken);
          setToken(savedToken);
          setUser(profile);
        } catch (err) {
          console.error('Session restoration failed:', err);
          localStorage.removeItem('eco_token');
        }
      }
      setLoading(false);
    };
    loadSession();
  }, []);

  const login = async (email: string, passwordPlain: string) => {
    setLoading(true);
    try {
      const data = await ApiService.post('/auth/login', { email, password: passwordPlain });
      const { user: profile, tokens } = data;
      localStorage.setItem('eco_token', tokens.accessToken);
      setToken(tokens.accessToken);
      setUser(profile);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, passwordPlain: string, firstName: string, lastName: string, country?: string) => {
    setLoading(true);
    try {
      await ApiService.post('/auth/register', { email, password: passwordPlain, firstName, lastName, country });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (token) {
      ApiService.post('/auth/logout', {}, token).catch(console.error);
    }
    localStorage.removeItem('eco_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
