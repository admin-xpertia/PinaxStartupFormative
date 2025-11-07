// API Service para Progress Tracking

import { apiClient } from "./client"
import type { ProofPointProgress, ActivityLog, ContinuePoint } from "@/types/progress"

export const progressApi = {
  /**
   * Obtener progreso de un proof point específico
   */
  async getProofPointProgress(proofPointId: string): Promise<ProofPointProgress> {
    return apiClient.get<ProofPointProgress>(
      `/student/proof-points/${proofPointId}/progress`
    )
  },

  /**
   * Auto-guardar progreso (debounced, fire-and-forget)
   */
  async autoSave(exerciseId: string, data: any): Promise<void> {
    // No espera respuesta, solo envía
    return apiClient.post(`/student/exercises/${exerciseId}/auto-save`, { data })
      .catch((error) => {
        // Log pero no interrumpe la experiencia
        console.warn("Auto-save failed:", error)
      })
  },

  /**
   * Obtener log de actividad reciente
   */
  async getActivityLog(limit: number = 10): Promise<ActivityLog[]> {
    return apiClient.get<ActivityLog[]>(`/student/activity?limit=${limit}`)
  },

  /**
   * Obtener punto de continuación global
   */
  async getContinuePoint(): Promise<ContinuePoint | null> {
    return apiClient.get<ContinuePoint | null>("/student/continue")
  },

  /**
   * Marcar logro como visto (para no mostrar celebración repetida)
   */
  async markAchievementSeen(achievementId: string): Promise<void> {
    return apiClient.post(`/student/achievements/${achievementId}/seen`, {})
  },
}
