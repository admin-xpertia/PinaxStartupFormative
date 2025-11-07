// Tipos para Exercises (Ejercicios/Componentes)

import { ExerciseType } from "./enrollment"

export interface ExerciseInstance {
  id: string
  templateId: string
  proofPointId: string
  nombre: string
  descripcion: string
  tipo: ExerciseType
  orden: number
  duracionEstimada: number
  esObligatorio: boolean
  estadoContenido: "sin_generar" | "generando" | "draft" | "publicado"
  contenido?: ExerciseContent
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
  status: "not_started" | "in_progress" | "completed"
  progress: number // 0-100
  startedAt?: Date
  completedAt?: Date
  lastSavedAt?: Date
  timeSpentMinutes: number
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
