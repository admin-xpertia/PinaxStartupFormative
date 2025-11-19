// Tipos para Progress Tracking

export interface ProofPointProgress {
  proofPointId: string
  studentId: string
  status: "locked" | "available" | "in_progress" | "completed"
  progress: number // 0-100
  completedExercises: number
  totalExercises: number
  requiredExercises: number
  averageScore: number
  startedAt?: Date
  completedAt?: Date
  exercises: ExerciseProgressSummary[]
}

export interface ExerciseProgressSummary {
  exerciseId: string
  status:
    | "not_started"
    | "in_progress"
    | "pending_review"
    | "submitted_for_review"
    | "requires_iteration"
    | "approved"
    | "graded"
  progress: number
  score?: number
  lastAccessed?: Date
}

export interface ActivityLog {
  id: string
  studentId: string
  type: "exercise_started" | "exercise_completed" | "proof_point_completed" | "phase_completed"
  entityId: string
  entityName: string
  timestamp: Date
  metadata: any
}

export interface ContinuePoint {
  exerciseId: string
  exerciseName: string
  proofPointName: string
  phaseName: string
  progress: number
  estimatedTimeRemaining: number
  lastAccessedAt: Date
}
