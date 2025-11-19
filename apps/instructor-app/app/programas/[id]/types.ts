export interface CohortAnalyticsResponse {
  phases: {
    id: string
    nombre: string
    progreso: number
    promedioScore?: number
  }[]
  proofPoints: {
    id: string
    nombre: string
    faseNombre?: string
    ejercicios: {
      id: string
      nombre: string
      estadoContenido?: string
      esObligatorio?: boolean
    }[]
  }[]
  atRiskStudents: {
    id: string
    nombre: string
    progreso: number
    diasInactivo: number
    ejercicioActual?: string
  }[]
  submissions: {
    progressId: string
    estudiante: string
    ejercicio: string
    entregadoEl: string
    status:
      | "submitted_for_review"
      | "pending_review"
      | "requires_iteration"
      | "approved"
      | "graded"
      | "in_progress"
    aiScore?: number | null
  }[]
  hasPublishedExercises: boolean
  publishedExercisesCount: number
  totalStudents: number
}
