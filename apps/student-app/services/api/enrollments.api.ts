// API Service para Enrollments (Inscripciones del estudiante)

import { apiClient } from "./client"
import type { Enrollment, ProgramStructure } from "@/types/enrollment"

export const enrollmentsApi = {
  /**
   * Obtener todas las inscripciones del estudiante actual
   */
  async getMy(): Promise<Enrollment[]> {
    return apiClient.get<Enrollment[]>("/student/enrollments")
  },

  /**
   * Obtener detalle de una inscripción específica
   */
  async getById(enrollmentId: string): Promise<Enrollment> {
    return apiClient.get<Enrollment>(`/student/enrollments/${enrollmentId}`)
  },

  /**
   * Obtener la estructura completa del programa (fases, proof points, ejercicios)
   */
  async getStructure(enrollmentId: string): Promise<ProgramStructure> {
    return apiClient.get<ProgramStructure>(
      `/student/enrollments/${enrollmentId}/structure`
    )
  },

  /**
   * Obtener el punto de continuación (último ejercicio accedido)
   */
  async getContinuePoint(enrollmentId: string) {
    return apiClient.get(`/student/enrollments/${enrollmentId}/continue`)
  },
}
