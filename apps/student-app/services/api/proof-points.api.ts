// API Service para Proof Points

import { apiClient } from "./client"

export interface PublishedExercise {
  id: string
  template: string
  proofPoint: string
  nombre: string
  descripcionBreve?: string
  configuracionPersonalizada: Record<string, any>
  orden: number
  duracionEstimadaMinutos: number
  estadoContenido: string
  contenidoActual?: string
  esObligatorio: boolean
  createdAt: string
  updatedAt: string
}

export const proofPointsApi = {
  /**
   * Obtener ejercicios publicados de un proof point
   */
  async getPublishedExercises(proofPointId: string): Promise<PublishedExercise[]> {
    return apiClient.get<PublishedExercise[]>(
      `/student/proof-points/${encodeURIComponent(proofPointId)}/exercises`
    )
  },
}
