/**
 * Programs API Service
 * Handles all program-related API calls
 */

import { apiClient } from './client'
import type {
  ProgramResponse,
  CreateProgramRequest,
  UpdateProgramRequest,
} from '@/types/api'

export const programsApi = {
  /**
   * Get all programs
   */
  getAll: () => apiClient.get<ProgramResponse[]>('/programs'),

  /**
   * Get program by ID
   */
  getById: (id: string) => apiClient.get<ProgramResponse>(`/programs/${id}`),

  /**
   * Create new program
   */
  create: (data: CreateProgramRequest) =>
    apiClient.post<ProgramResponse>('/programs', data),

  /**
   * Update program
   */
  update: (id: string, data: UpdateProgramRequest) =>
    apiClient.put<ProgramResponse>(`/programs/${id}`, data),

  /**
   * Delete program
   */
  delete: (id: string) => apiClient.delete<void>(`/programs/${id}`),

  /**
   * Publish program
   */
  publish: (id: string) =>
    apiClient.post<ProgramResponse>(`/programs/${id}/publish`),

  /**
   * Archive program
   */
  archive: (id: string) =>
    apiClient.post<ProgramResponse>(`/programs/${id}/archive`),

  /**
   * Get programs by status
   */
  getByStatus: (status: 'borrador' | 'publicado' | 'archivado') =>
    apiClient.get<ProgramResponse[]>(`/programs?estado=${status}`),

  /**
   * Get programs by creator
   */
  getByCreator: (creadorId: string) =>
    apiClient.get<ProgramResponse[]>(`/programs?creador=${creadorId}`),
}
