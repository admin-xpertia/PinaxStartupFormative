export type ProgramStatus = "publicado" | "draft" | "archivado" | "borrador" | "revision"

export interface Program {
  id: string
  nombre: string
  descripcion: string
  estado: ProgramStatus

  // Campos opcionales del editor
  categoria?: string
  duracion_semanas?: number
  nivel_dificultad?: "principiante" | "intermedio" | "avanzado"
  imagen_portada_url?: string
  objetivos_aprendizaje?: string[]
  prerequisitos?: string[]
  audiencia_objetivo?: string
  tags?: string[]
  visible?: boolean

  // Estadísticas y metadata
  estadisticas?: {
    fases: string
    proof_points: string
    duracion: string
    estudiantes: string
  }
  ultima_actividad?: string
  progreso_creacion?: number
  alerta?: {
    texto: string
    tipo: "warning" | "error" | "info"
  }

  // Timestamps
  created_at?: string
  updated_at?: string
  creador?: string
}

export interface QuickStat {
  metrica: string
  label: string
  icono: string
  tendencia?: string
  tendencia_positiva?: boolean
}
