// API Service para Exercises (Ejercicios/Componentes)

import { apiClient, APIError } from "./client"
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
  systemPromptOverride?: string
  criteriosExito?: Array<{
    id: string
    descripcion: string
    rubrica_evaluacion?: string
  }>
  criteriosCumplidos?: string[]
  shadowMonitorConfig?: Record<string, any>
  criteriosValidacion?: string[]
  umbralCalidad?: number
  insightCount?: number
}

export interface LessonAssistantResponse {
  respuesta: string
  referencias?: string[]
  tokensUsados?: number
  shadowMonitorResult?: {
    metCriteriaIds: string[]
    qualityScores: Record<string, number>
    internalFeedback: string
  }
  validationResult?: {
    isValid: boolean
    qualityScore: number
    feedback: string
    missingAspects: string[]
  }
  insightsResult?: {
    insightCount: number
    latestInsight: string | null
    detectedInsights: string[]
  }
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

export interface AnalyzeDraftRequest {
  questionId: string
  draftText: string
}

export interface AnalyzeDraftResponse {
  questionId: string
  suggestion: string
  strengths?: string[]
  improvements?: string[]
  rubricAlignment?: number
}

export const exercisesApi = {
  /**
   * Obtener instancia de ejercicio con su contenido
   */
  async getById(
    exerciseId: string,
    context?: { estudianteId?: string | null; cohorteId?: string | null }
  ): Promise<ExerciseInstance> {
    const query = new URLSearchParams()
    if (context?.estudianteId) {
      query.set("estudianteId", context.estudianteId)
    }
    if (context?.cohorteId) {
      query.set("cohorteId", context.cohorteId)
    }

    const suffix = query.toString() ? `?${query.toString()}` : ""

    return apiClient.get<ExerciseInstance>(
      `/student/exercises/${encodeURIComponent(exerciseId)}${suffix}`
    )
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
   * Enviar pregunta al asistente con streaming (SSE)
   * @param exerciseId ID del ejercicio
   * @param payload Datos de la pregunta
   * @param onChunk Callback que se llama con cada fragmento de texto
   * @param onDone Callback que se llama cuando termina el streaming con las referencias
   * @param onError Callback que se llama si hay un error
   */
  async sendLessonAssistantMessageStream(
    exerciseId: string,
    payload: LessonAssistantRequest,
    callbacks: {
      onStart?: () => void
      onChunk: (chunk: string) => void
      onDone: (referencias: string[]) => void
      onError?: (error: string) => void
    }
  ): Promise<void> {
    const configuredUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
    const apiBaseUrl = configuredUrl.endsWith("/api/v1")
      ? configuredUrl
      : `${configuredUrl}/api/v1`
    const url = `${apiBaseUrl}/student/exercises/${encodeURIComponent(exerciseId)}/assistant/chat/stream`

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No se pudo obtener el stream del servidor")
      }

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        // Decodificar el chunk y agregarlo al buffer
        buffer += decoder.decode(value, { stream: true })

        // Procesar mensajes SSE del buffer
        const lines = buffer.split("\n")
        buffer = lines.pop() || "" // Guardar la última línea incompleta

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6) // Remover "data: "
            try {
              const event = JSON.parse(data)

              switch (event.type) {
                case "start":
                  callbacks.onStart?.()
                  break

                case "chunk":
                  callbacks.onChunk(event.content)
                  break

                case "done":
                  callbacks.onDone(event.referencias || [])
                  break

                case "error":
                  callbacks.onError?.(event.error || "Error desconocido")
                  break
              }
            } catch (e) {
              console.error("Error parsing SSE event:", e, data)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error en streaming:", error)
      callbacks.onError?.(
        error instanceof Error ? error.message : "Error de conexión"
      )
    }
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

  /**
   * Analizar borrador contra rúbrica (feedback proactivo)
   */
  async analyzeDraft(
    exerciseId: string,
    payload: AnalyzeDraftRequest
  ): Promise<AnalyzeDraftResponse> {
    try {
      return await apiClient.post(
        `/exercises/${encodeURIComponent(exerciseId)}/analyze-draft`,
        payload
      )
    } catch (error) {
      if (error instanceof APIError && error.statusCode === 404) {
        // Backwards compatibility with older endpoint
        return apiClient.post(
          `/student/exercises/${encodeURIComponent(exerciseId)}/analyze-draft`,
          payload
        )
      }
      throw error
    }
  },
}
