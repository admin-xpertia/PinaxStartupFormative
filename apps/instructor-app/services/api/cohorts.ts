/**
 * Cohorts API Service
 * Handles instructor cohort management
 */

import { apiClient } from "./client"
import type {
  CohortResponse,
  CreateCohortApiRequest,
  EnrollStudentRequest,
} from "@/types/api"

export const cohortsApi = {
  /**
   * List all cohorts
   */
  list: () => apiClient.get<CohortResponse[]>("/cohortes"),

  /**
   * Get cohort details
   */
  getById: (id: string) =>
    apiClient.get<CohortResponse>(`/cohortes/${id}`),

  /**
   * Create cohort from program
   */
  create: (payload: CreateCohortApiRequest) =>
    apiClient.post<CohortResponse>("/cohortes", payload),

  /**
   * Enroll student into cohort
   */
  enrollStudent: (cohortId: string, payload: EnrollStudentRequest) =>
    apiClient.post<{ inscripcionId: string; estado: string }>(
      `/cohortes/${cohortId}/estudiantes`,
      payload
    ),
}
