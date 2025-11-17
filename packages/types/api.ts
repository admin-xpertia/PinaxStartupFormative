/**
 * API Type Definitions
 * Matches backend DTOs for all API responses and requests
 */

// ============================================================================
// Program Design - Request DTOs
// ============================================================================

export interface CreateProgramRequest {
  nombre: string
  descripcion: string
  duracionSemanas: number
  creadorId: string
  categoria?: string
  nivelDificultad?: "principiante" | "intermedio" | "avanzado"
  objetivosAprendizaje?: string[]
  prerequisitos?: string[]
  audienciaObjetivo?: string
  tags?: string[]
}

export interface UpdateProgramRequest {
  nombre?: string
  descripcion?: string
  duracionSemanas?: number
  categoria?: string
  nivelDificultad?: "principiante" | "intermedio" | "avanzado"
  imagenPortadaUrl?: string
  objetivosAprendizaje?: string[]
  prerequisitos?: string[]
  audienciaObjetivo?: string
  tags?: string[]
  visible?: boolean
}

export interface AddFaseRequest {
  numeroFase?: number  // Optional, auto-calculated if not provided
  nombre: string
  descripcion: string
  objetivosAprendizaje?: string[]
  duracionSemanasEstimada: number
}

export interface AddProofPointRequest {
  nombre: string
  slug: string
  descripcion: string
  preguntaCentral: string
  duracionEstimadaHoras: number
  tipoEntregableFinal?: string
  documentacionContexto?: string
  prerequisitos?: string[]
}

// ============================================================================
// Exercise Instance - Request DTOs
// ============================================================================

export interface AddExerciseToProofPointRequest {
  templateId: string
  nombre: string
  descripcionBreve?: string
  consideracionesContexto: string
  configuracionPersonalizada: Record<string, any>
  duracionEstimadaMinutos: number
  esObligatorio: boolean
}

export interface UpdateExerciseInstanceRequest {
  nombre?: string
  descripcionBreve?: string
  consideracionesContexto?: string
  configuracionPersonalizada?: Record<string, any>
  duracionEstimadaMinutos?: number
  esObligatorio?: boolean
}

// ============================================================================
// Program Design - Response DTOs
// ============================================================================

export interface ProgramResponse {
  id: string
  nombre: string
  descripcion?: string
  duracionSemanas: number
  estado: "borrador" | "publicado" | "archivado"
  versionActual: string
  categoria?: string
  nivelDificultad?: "principiante" | "intermedio" | "avanzado"
  imagenPortadaUrl?: string
  objetivosAprendizaje?: string[]
  prerequisitos?: string[]
  audienciaObjetivo?: string
  tags?: string[]
  visible: boolean
  creador: string
  createdAt: string
  updatedAt: string
}

export interface FaseResponse {
  id: string
  programa: string
  numeroFase: number
  nombre: string
  descripcion: string
  objetivosAprendizaje?: string[]
  duracionSemanasEstimada: number
  orden: number
  createdAt: string
  updatedAt: string
}

export interface ProofPointResponse {
  id: string
  fase: string
  nombre: string
  slug: string
  descripcion: string
  preguntaCentral: string
  ordenEnFase: number
  duracionEstimadaHoras: number
  tipoEntregableFinal?: string
  documentacionContexto?: string
  prerequisitos: string[]
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Exercise Catalog - Response DTOs
// ============================================================================

export type ExerciseCategory =
  | 'leccion_interactiva'
  | 'cuaderno_trabajo'
  | 'simulacion_interaccion'
  | 'mentor_asesor_ia'
  | 'herramienta_analisis'
  | 'herramienta_creacion'
  | 'herramienta_revision'
  | 'simulador_entorno'
  | 'caso'
  | 'instrucciones'
  | 'metacognicion'

export interface ExerciseTemplateResponse {
  id: string
  nombre: string
  categoria: ExerciseCategory
  descripcion: string
  objetivoPedagogico?: string
  rolIA?: string
  configuracionSchema: Record<string, any>
  configuracionDefault: Record<string, any>
  promptTemplate: string
  outputSchema: Record<string, any>
  previewConfig: Record<string, any>
  icono: string
  color: string
  esOficial: boolean
  activo: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Exercise Instance - Response DTOs
// ============================================================================

export interface ExerciseInstanceResponse {
  id: string
  template: string
  proofPoint: string
  nombre: string
  descripcionBreve?: string
  consideracionesContexto: string
  configuracionPersonalizada: Record<string, any>
  orden: number
  duracionEstimadaMinutos: number
  estadoContenido:
    | 'sin_generar'
    | 'generando'
    | 'generado'
    | 'draft'
    | 'publicado'
    | 'error'
  contenidoActual?: string
  esObligatorio: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Cohorts - Response DTOs
// ============================================================================

export interface CohortProgramInfo {
  id: string
  nombre: string
  version: string
}

export interface CohortResponse {
  id: string
  nombre: string
  descripcion?: string
  estado: "planificado" | "activo" | "finalizado" | "archivado"
  fechaInicio: string
  fechaFinEstimada?: string
  programa: CohortProgramInfo
  configuracion?: Record<string, any>
  snapshotProgramaId?: string
  totalEstudiantes: number
  structure?: Record<string, any>
}

export interface CreateCohortApiRequest {
  programaId: string
  nombre: string
  descripcion?: string
  fechaInicio: string
  fechaFinEstimada?: string
  configuracion?: Record<string, any>
  instructorId?: string
  capacidadMaxima?: number
  autoActivate?: boolean
}

export interface EnrollStudentRequest {
  estudianteId: string
  estado?: "activo" | "completado" | "abandonado" | "suspendido"
}
