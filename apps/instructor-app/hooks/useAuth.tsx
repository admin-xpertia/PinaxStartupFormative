'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, User } from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (nombre: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider de autenticación
 *
 * Gestiona el estado global de autenticación y proporciona
 * funciones para login, signup y logout
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  /**
   * Verifica la sesión al cargar la aplicación
   */
  useEffect(() => {
    checkSession();
  }, []);

  /**
   * Verifica si hay una sesión activa
   */
  const checkSession = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        setLoading(false);
        return;
      }

      // Llamar a /auth/me para obtener info del usuario
      const userData = await authApi.getMe();
      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error verificando sesión:', error);
      // Si falla, limpiar datos
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Inicia sesión
   */
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authApi.signin({ email, password });

      // Guardar token y usuario
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      setUser(response.user);

      // Redirigir al dashboard
      router.push('/');
      router.refresh();
    } catch (error: any) {
      console.error('Error en login:', error);
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Registra un nuevo usuario
   */
  const signup = async (nombre: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authApi.signup({ nombre, email, password });

      // Guardar token y usuario
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      setUser(response.user);

      // Redirigir al dashboard
      router.push('/');
      router.refresh();
    } catch (error: any) {
      console.error('Error en signup:', error);
      const message = error.response?.data?.message || 'Error al registrarse';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cierra sesión
   */
  const logout = async () => {
    try {
      setLoading(true);

      // Llamar al endpoint de signout
      await authApi.signout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar datos locales
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setUser(null);
      setLoading(false);

      // Redirigir a login
      router.push('/login');
      router.refresh();
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para acceder al contexto de autenticación
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
