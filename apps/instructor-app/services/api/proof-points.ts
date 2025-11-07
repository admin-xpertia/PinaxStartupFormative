/**
 * Proof Points API Service
 * Handles all proof point-related API calls
 */

import { apiClient } from './client'
import type { ProofPointResponse, AddProofPointRequest } from '@/types/api'

export const proofPointsApi = {
  /**
   * Get all proof points for a fase
   */
  getByFase: (faseId: string) =>
    apiClient.get<ProofPointResponse[]>(`/fases/${faseId}/proof-points`),

  /**
   * Get proof point by ID
   */
  getById: (id: string) =>
    apiClient.get<ProofPointResponse>(`/proof-points/${id}`),

  /**
   * Add proof point to fase
   */
  create: (faseId: string, data: AddProofPointRequest) =>
    apiClient.post<ProofPointResponse>(`/fases/${faseId}/proof-points`, data),

  /**
   * Update proof point
   */
  update: (id: string, data: Partial<AddProofPointRequest>) =>
    apiClient.put<ProofPointResponse>(`/proof-points/${id}`, data),

  /**
   * Delete proof point
   */
  delete: (id: string) => apiClient.delete<void>(`/proof-points/${id}`),

  /**
   * Reorder proof points in a fase
   */
  reorder: (faseId: string, proofPointIds: string[]) =>
    apiClient.put<ProofPointResponse[]>(
      `/fases/${faseId}/proof-points/reorder`,
      { proofPointIds }
    ),

  /**
   * Generate slug from name
   */
  generateSlug: (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
  },
}
