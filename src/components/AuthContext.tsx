import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  username: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  signUp: (username: string, password: string, confirmPassword: string) => Promise<{ error: any }>;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user in localStorage
    const storedUser = localStorage.getItem('auth-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('auth-user');
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (username: string, password: string, confirmPassword: string) => {
    try {
      if (password !== confirmPassword) {
        return { error: { message: 'Passwords do not match' } };
      }

      if (username.trim().length < 3) {
        return { error: { message: 'Username must be at least 3 characters' } };
      }

      if (password.length < 6) {
        return { error: { message: 'Password must be at least 6 characters' } };
      }

      const { data, error } = await supabase
        .from('users')
        .insert([{ username: username.trim(), password }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // unique_violation
          return { error: { message: 'Username already taken' } };
        }
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.trim())
        .eq('password', password)
        .single();

      if (error || !data) {
        return { error: { message: 'Invalid username or password' } };
      }

      const userData: User = {
        id: data.id,
        username: data.username,
        created_at: data.created_at
      };

      setUser(userData);
      localStorage.setItem('auth-user', JSON.stringify(userData));

      return { error: null };
    } catch (error) {
      return { error: { message: 'Invalid username or password' } };
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      localStorage.removeItem('auth-user');
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    signUp,
    signIn,
    signOut,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}