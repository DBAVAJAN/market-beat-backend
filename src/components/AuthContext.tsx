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

      const { data, error } = await supabase.functions.invoke('auth-custom', {
        body: {
          action: 'signup',
          username,
          password
        }
      });

      if (error) {
        return { error };
      }

      if (data?.error) {
        return { error: data.error };
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-custom', {
        body: {
          action: 'signin',
          username,
          password
        }
      });

      if (error) {
        return { error: { message: 'Invalid username or password' } };
      }

      if (data?.error) {
        return { error: data.error };
      }

      if (!data?.user) {
        return { error: { message: 'Invalid username or password' } };
      }

      const userData: User = {
        id: data.user.id,
        username: data.user.username,
        created_at: data.user.created_at
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