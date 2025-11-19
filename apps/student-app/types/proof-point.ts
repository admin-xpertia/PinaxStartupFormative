import type { ExerciseProgressSummary } from "./progress"

export type ExerciseStatus = "completed" | "in_progress" | "available" | "locked"

export interface ProofPointExercise {
  id: string
  nombre: string
  tipo: string
  estimatedMinutes: number
  status: ExerciseStatus
  progress: number
  score?: number | null
  progressStatus?: ExerciseProgressSummary["status"]
}

export interface ProofPointOverview {
  id: string
  nombre: string
  descripcion: string
  nivelId: string
  nivelNombre: string
  phaseNombre: string
  progress: number
  exercises: ProofPointExercise[]
}
