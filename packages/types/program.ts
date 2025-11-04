export type ProgramStatus = "publicado" | "draft" | "archivado"

export interface Program {
  id: string
  nombre: string
  descripcion: string
  estado: ProgramStatus
  estadisticas: {
    fases: string
    proof_points: string
    duracion: string
    estudiantes: string
  }
  ultima_actividad: string
  progreso_creacion: number
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
