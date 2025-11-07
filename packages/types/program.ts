export type ProgramStatus = "publicado" | "borrador" | "archivado"

/**
 * Program interface matching backend ProgramResponseDto
 * Uses camelCase to match API responses
 */
export interface Program {
  id: string
  nombre: string
  descripcion?: string
  duracionSemanas: number
  estado: ProgramStatus
  versionActual: string

  // Optional fields
  categoria?: string
  nivelDificultad?: "principiante" | "intermedio" | "avanzado"
  imagenPortadaUrl?: string
  objetivosAprendizaje?: string[]
  prerequisitos?: string[]
  audienciaObjetivo?: string
  tags?: string[]
  visible: boolean
  creador: string

  // Timestamps
  createdAt: string
  updatedAt: string

  // UI-only fields (not from API)
  estadisticas?: {
    fases: string
    proof_points: string
    duracion: string
    estudiantes: string
  }
  progreso_creacion?: number
  alerta?: {
    texto: string
    tipo: "warning" | "error" | "info"
  }
}

export interface QuickStat {
  metrica: string
  label: string
  icono: string
  tendencia?: string
  tendencia_positiva?: boolean
}
