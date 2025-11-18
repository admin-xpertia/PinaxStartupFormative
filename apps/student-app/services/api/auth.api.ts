// API Service para Authentication

import { apiClient } from "./client"

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  nombre: string
  apellido: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    nombre: string
    apellido: string
    rol: "estudiante"
    studentId?: string
  }
}

export interface User {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: "estudiante"
  avatar?: string
  studentId?: string
}

export const authApi = {
  /**
   * Iniciar sesión
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/auth/login", credentials)
  },

  /**
   * Registrarse
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/auth/register", data)
  },

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    return apiClient.post("/auth/logout", {})
  },

  /**
   * Obtener perfil del usuario actual
   */
  async getProfile(): Promise<User> {
    return apiClient.get<User>("/auth/me")
  },

  /**
   * Actualizar perfil
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.patch<User>("/auth/me", data)
  },

  /**
   * Cambiar contraseña
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return apiClient.post("/auth/change-password", { oldPassword, newPassword })
  },

  /**
   * Solicitar recuperación de contraseña
   */
  async requestPasswordReset(email: string): Promise<void> {
    return apiClient.post("/auth/forgot-password", { email })
  },

  /**
   * Resetear contraseña con token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    return apiClient.post("/auth/reset-password", { token, newPassword })
  },
}
