// API Service para Exercises (Ejercicios/Componentes)

import { apiClient } from "./client"
import type { ExerciseInstance, ExerciseProgress, CompletionResult } from "@/types/exercise"

export const exercisesApi = {
  /**
   * Obtener instancia de ejercicio con su contenido
   */
  async getById(exerciseId: string): Promise<ExerciseInstance> {
    return apiClient.get<ExerciseInstance>(`/student/exercises/${exerciseId}`)
  },

  /**
   * Obtener solo el contenido del ejercicio (optimizado)
   */
  async getContent(exerciseId: string) {
    return apiClient.get(`/student/exercises/${exerciseId}/content`)
  },

  /**
   * Obtener progreso del ejercicio
   */
  async getProgress(exerciseId: string): Promise<ExerciseProgress> {
    return apiClient.get<ExerciseProgress>(
      `/student/exercises/${exerciseId}/progress`
    )
  },

  /**
   * Guardar progreso del ejercicio
   */
  async saveProgress(exerciseId: string, data: any): Promise<void> {
    return apiClient.post(`/student/exercises/${exerciseId}/progress`, { data })
  },

  /**
   * Completar ejercicio y obtener evaluación
   */
  async complete(exerciseId: string, data: any): Promise<CompletionResult> {
    return apiClient.post<CompletionResult>(
      `/student/exercises/${exerciseId}/complete`,
      { data }
    )
  },

  /**
   * Marcar ejercicio como iniciado
   */
  async markAsStarted(exerciseId: string): Promise<void> {
    return apiClient.post(`/student/exercises/${exerciseId}/start`, {})
  },
}
