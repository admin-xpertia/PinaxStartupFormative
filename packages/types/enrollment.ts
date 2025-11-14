export interface Enrollment {
  id: string
  studentId: string
  cohortId: string
  programId: string
  programName: string
  programDescription: string
  instructorName: string
  enrolledAt: Date
  status: "active" | "completed" | "dropped"
  currentPhaseId?: string
  currentProofPointId?: string
  currentExerciseId?: string
  overallProgress: number
  completedProofPoints: number
  totalProofPoints: number
  estimatedCompletionDate?: Date
}

export interface ProgramStructure {
  programId: string
  programName: string
  phases: Phase[]
}

export interface Phase {
  id: string
  nombre: string
  descripcion: string
  orden: number
  duracionSemanas: number
  proofPoints: ProofPoint[]
}

export interface ProofPoint {
  id: string
  nombre: string
  slug: string
  descripcion: string
  preguntaCentral: string
  orden: number
  status: "locked" | "available" | "in_progress" | "completed"
  progress: number
  exercises: ExerciseSummary[]
}

export interface ExerciseSummary {
  id: string
  nombre: string
  tipo: ExerciseType
  orden: number
  duracionEstimada: number
  status: "locked" | "available" | "in_progress" | "completed"
  score?: number
  esObligatorio: boolean
}

export type ExerciseType =
  | "leccion_interactiva"
  | "cuaderno_trabajo"
  | "simulacion_interaccion"
  | "mentor_ia"
  | "herramienta_analisis"
  | "herramienta_creacion"
  | "sistema_tracking"
  | "herramienta_revision"
  | "simulador_entorno"
  | "sistema_progresion"
  | "caso"
  | "instrucciones"
  | "metacognicion"
