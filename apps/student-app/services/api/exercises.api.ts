// API Service para Exercises (Ejercicios/Componentes)

import { apiClient } from "./client"
import type { ExerciseInstance, ExerciseProgress, CompletionResult } from "@/types/exercise"

export interface StartExerciseParams {
  estudianteId: string
  cohorteId: string
}

export interface SaveProgressParams {
  estudianteId: string
  cohorteId: string
  datos?: Record<string, any>
  porcentajeCompletitud?: number
  tiempoInvertidoMinutos?: number
}

export interface CompleteExerciseParams {
  estudianteId: string
  cohorteId: string
  datos: Record<string, any>
  tiempoInvertidoMinutos?: number
  scoreFinal?: number
}

export interface CompleteExerciseResponse {
  id: string
  estado: string
  scoreFinal?: number
  feedback?: string
  completado: boolean
  nextExerciseId?: string
  proofPointCompleted?: boolean
}

export interface LessonAssistantMessage {
  role: "user" | "assistant"
  content: string
}

export interface LessonAssistantRequest {
  pregunta: string
  seccionId: string
  seccionTitulo: string
  seccionContenido: string
  historial?: LessonAssistantMessage[]
  perfilComprension?: Record<string, any>
  conceptoFocal?: string
}

export interface LessonAssistantResponse {
  respuesta: string
  referencias?: string[]
  tokensUsados?: number
}

export interface EvaluateLessonQuestionRequest {
  preguntaId: string
  tipoPregunta: "respuesta_corta" | "multiple_choice" | "verdadero_falso"
  enunciado: string
  respuestaEstudiante: string
  criteriosEvaluacion?: string[]
  seccionContenido: string
  seccionTitulo?: string
  perfilComprension?: Record<string, any>
}

export interface EvaluateLessonQuestionResponse {
  preguntaId: string
  score: "correcto" | "parcialmente_correcto" | "incorrecto"
  feedback: string
  sugerencias?: string[]
}

export const exercisesApi = {
  /**
   * Obtener instancia de ejercicio con su contenido
   */
  async getById(exerciseId: string): Promise<ExerciseInstance> {
    return apiClient.get<ExerciseInstance>(`/student/exercises/${encodeURIComponent(exerciseId)}`)
  },

  /**
   * Obtener solo el contenido del ejercicio (optimizado)
   */
  async getContent(exerciseId: string) {
    return apiClient.get(`/student/exercises/${encodeURIComponent(exerciseId)}/content`)
  },

  /**
   * Obtener progreso del ejercicio
   */
  async getProgress(exerciseId: string, params: { estudianteId: string; cohorteId: string }): Promise<ExerciseProgress> {
    const query = `?estudianteId=${encodeURIComponent(params.estudianteId)}&cohorteId=${encodeURIComponent(params.cohorteId)}`
    return apiClient.get<ExerciseProgress>(
      `/student/exercises/${encodeURIComponent(exerciseId)}/progress${query}`
    )
  },

  /**
   * Marcar ejercicio como iniciado
   */
  async start(exerciseId: string, params: StartExerciseParams): Promise<ExerciseProgress> {
    return apiClient.post<ExerciseProgress>(
      `/student/exercises/${encodeURIComponent(exerciseId)}/start`,
      params
    )
  },

  /**
   * Guardar progreso del ejercicio
   */
  async saveProgress(exerciseId: string, params: SaveProgressParams): Promise<ExerciseProgress> {
    return apiClient.put<ExerciseProgress>(
      `/student/exercises/${encodeURIComponent(exerciseId)}/progress`,
      params
    )
  },

  /**
   * Completar ejercicio y obtener evaluación
   */
  async complete(exerciseId: string, params: CompleteExerciseParams): Promise<CompleteExerciseResponse> {
    return apiClient.post<CompleteExerciseResponse>(
      `/student/exercises/${encodeURIComponent(exerciseId)}/complete`,
      params
    )
  },

  /**
   * Auto-guardar progreso (fire-and-forget)
   */
  async autoSave(exerciseId: string, params: SaveProgressParams): Promise<void> {
    // No espera respuesta, solo envía
    try {
      await apiClient.put(`/student/exercises/${encodeURIComponent(exerciseId)}/progress`, params)
    } catch (error) {
      // Log pero no interrumpe la experiencia
      console.warn("Auto-save failed:", error)
    }
  },

  /**
   * Enviar pregunta al asistente contextual
   */
  async sendLessonAssistantMessage(
    exerciseId: string,
    payload: LessonAssistantRequest
  ): Promise<LessonAssistantResponse> {
    return apiClient.post(
      `/student/exercises/${encodeURIComponent(exerciseId)}/assistant/chat`,
      payload
    )
  },

  /**
   * Evaluar pregunta de respuesta corta
   */
  async evaluateLessonQuestion(
    exerciseId: string,
    payload: EvaluateLessonQuestionRequest
  ): Promise<EvaluateLessonQuestionResponse> {
    return apiClient.post(
      `/student/exercises/${encodeURIComponent(exerciseId)}/questions/evaluate`,
      payload
    )
  },
}
