import axios from 'axios';

/**
 * Cliente HTTP para la API de Xpertia
 *
 * Configurado con la base URL y manejo automático de tokens
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Para enviar cookies en requests
});

/**
 * Interceptor para agregar token a las requests
 */
apiClient.interceptors.request.use(
  (config) => {
    // Obtener token de localStorage (solo en el cliente)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor para manejar errores de respuesta
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si hay error 401, remover token y recargar (solo en el cliente)
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');

      // Redirigir a login si no estamos ya ahí
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Tipos de respuesta de la API
 */
export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  preferencias?: Record<string, any>;
  activo?: boolean;
}

/**
 * Servicios de API
 */
export const authApi = {
  /**
   * Registra un nuevo instructor
   */
  signup: async (data: { email: string; nombre: string; password: string }) => {
    const response = await apiClient.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  /**
   * Inicia sesión
   */
  signin: async (data: { email: string; password: string }) => {
    const response = await apiClient.post<AuthResponse>('/auth/signin', data);
    return response.data;
  },

  /**
   * Obtiene información del usuario actual
   */
  getMe: async () => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Cierra sesión
   */
  signout: async () => {
    await apiClient.post('/auth/signout');
  },
};
