// Tipos para Exercises (Ejercicios/Componentes)

import type { ExerciseType } from "@shared-types/enrollment"

export interface ExerciseInstance {
  id: string
  templateId: string
  proofPointId: string
  proofPointName?: string
  nombre: string
  descripcion: string
  tipo: ExerciseType
  orden: number
  duracionEstimada: number
  esObligatorio: boolean
  estadoContenido:
    | "sin_generar"
    | "generando"
    | "generado"
    | "draft"
    | "publicado"
    | "error"
  contenido?: ExerciseContent
  content?: ExerciseContent
  savedData?: any
  configuracion: any
}

export interface ExerciseContent {
  // El contenido varía según el tipo de ejercicio
  // Cada player define su propia estructura de contenido
  [key: string]: any
}

export interface ExerciseProgress {
  exerciseId: string
  studentId: string
  status:
    | "not_started"
    | "in_progress"
    | "pending_review"
    | "submitted_for_review"
    | "requires_iteration"
    | "approved"
    | "graded"
  progress: number // 0-100
  startedAt?: Date
  completedAt?: Date
  submittedAt?: Date
  lastSavedAt?: Date
  timeSpentMinutes: number
  instructorFeedback?: Record<string, string>
  aiScore?: number | null
  instructorScore?: number | null
  scoreFinal?: number | null
  manualFeedback?: string | null
  feedbackJson?: Record<string, any> | null
  datosGuardados?: Record<string, any> | null
  data: any // Progreso específico del tipo de ejercicio
}

export interface CompletionResult {
  exerciseId: string
  completed: boolean
  score: number // 0-10
  feedback: EvaluationFeedback
  nextExerciseUnlocked?: string
  proofPointCompleted?: boolean
}

export interface EvaluationFeedback {
  overallScore: number
  strengths: string[]
  areasToImprove: string[]
  detailedAnalysis: DimensionScore[]
  meetsCriteria: boolean
  nextSteps?: string[]
}

export interface DimensionScore {
  dimension: string
  score: number
  threshold: number
  feedback: string
}
