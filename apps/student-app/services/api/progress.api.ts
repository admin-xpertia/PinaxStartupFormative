// API Service para Progress Tracking

import { apiClient } from "./client"
import type { ProofPointProgress, ActivityLog, ContinuePoint } from "@/types/progress"

/**
 * Types for Progress Summary
 */
export interface ProofPointProgressStats {
  proofPointId: string
  proofPointName: string
  totalExercises: number
  completedExercises: number
  completionPercentage: number
  averageScore: number | null
  timeInvestedMinutes: number
}

export interface CompletedExercise {
  exerciseId: string
  exerciseName: string
  exerciseTemplate: string
  completedAt: string
  score: number | null
  timeInvestedMinutes: number
}

export interface StudentProgressSummary {
  totalExercises: number
  completedExercises: number
  inProgressExercises: number
  completionPercentage: number
  totalTimeInvestedMinutes: number
  averageScore: number | null
  proofPointStats: ProofPointProgressStats[]
  recentCompletedExercises: CompletedExercise[]
}

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

  /**
   * Get student progress summary
   */
  async getProgressSummary(
    estudianteId: string,
    cohorteId: string
  ): Promise<StudentProgressSummary> {
    return apiClient.get<StudentProgressSummary>("/student/progress/summary", {
      estudianteId,
      cohorteId,
    })
  },
}
