import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import { db } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (name: string, email: string, password: string, role: User['role']) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(db.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const current = db.getCurrentUser();
    if (current) {
      setUser(current);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const u = await res.json();
        db.setCurrentUser(u);
        setUser(u);
        return true;
      }
    } catch (e) {
      console.error('Login error:', e);
    }
    return false;
  };

  const logout = () => {
    const current = db.getCurrentUser();
    if (current) {
      db.addLog({
        action: `User ${current.name} logged out`,
        actorName: current.name,
        actorId: current.id,
        type: 'auth'
      }).catch(() => { });
    }
    db.setCurrentUser(null);
    setUser(null);
  };

  const signup = async (name: string, email: string, password: string, role: User['role']): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      if (res.ok) {
        const u = await res.json();
        db.setCurrentUser(u);
        setUser(u);
        return true;
      }
    } catch (e) {
      console.error('Signup error:', e);
    }
    return false;
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
    } catch (e) {
      console.error('Forgot password error:', e);
    }
  };

  return <AuthContext.Provider value={{ user, isLoading, login, logout, signup, forgotPassword }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  React.useEffect(() => { if (!isLoading && !user) navigate('/login', { replace: true }); }, [user, isLoading, navigate]);
  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return null;
  return <>{children}</>;
}
