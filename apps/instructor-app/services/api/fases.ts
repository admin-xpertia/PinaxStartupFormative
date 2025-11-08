/**
 * Fases API Service
 * Handles all fase-related API calls
 */

import { apiClient } from './client'
import type { FaseResponse, AddFaseRequest } from '@/types/api'

export const fasesApi = {
  /**
   * Get all fases for a program
   */
  getByProgram: (programId: string) =>
    apiClient.get<FaseResponse[]>(`/programs/${programId}/fases`),

  /**
   * Get fase by ID
   */
  getById: (id: string) => apiClient.get<FaseResponse>(`/fases/${id}`),

  /**
   * Add fase to program
   */
  create: (programId: string, data: AddFaseRequest) =>
    apiClient.post<FaseResponse>(`/programs/${programId}/fases`, data),

  /**
   * Update fase
   */
  update: (id: string, data: Partial<AddFaseRequest>) =>
    apiClient.put<FaseResponse>(`/fases/${id}`, data),

  /**
   * Delete fase
   */
  delete: (id: string) => apiClient.delete<void>(`/fases/${id}`),

  /**
   * Reorder fases in a program
   */
  reorder: (programId: string, faseIds: string[]) =>
    apiClient.put<FaseResponse[]>(`/programs/${programId}/fases/reorder`, {
      faseIds,
    }),
}
