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

export interface ProofPointDetails {
  id: string
  nombre: string
  slug: string
  descripcion?: string
  preguntaCentral?: string
  ordenEnFase: number
  duracionEstimadaHoras: number
  tipoEntregableFinal?: string
  documentacionContexto?: string
  prerequisitos: string[]
  faseId: string
  faseNombre: string
  faseDescripcion?: string
  faseNumero: number
  programaId: string
  programaNombre: string
  createdAt: string
  updatedAt: string
}

export const proofPointsApi = {
  /**
   * Obtener detalles completos de un proof point
   */
  async getDetails(proofPointId: string): Promise<ProofPointDetails> {
    return apiClient.get<ProofPointDetails>(
      `/student/proof-points/${encodeURIComponent(proofPointId)}`
    )
  },

  /**
   * Obtener ejercicios publicados de un proof point
   */
  async getPublishedExercises(proofPointId: string): Promise<PublishedExercise[]> {
    return apiClient.get<PublishedExercise[]>(
      `/student/proof-points/${encodeURIComponent(proofPointId)}/exercises`
    )
  },
}
