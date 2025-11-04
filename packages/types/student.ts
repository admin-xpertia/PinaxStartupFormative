export interface StudentArtefact {
  id: string
  titulo: string
  tipo: "reporte" | "cuaderno" | "reflexion"
  fecha: string
  score?: number
  thumbnail?: string
}

export interface StudentStrength {
  texto: string
  evidencia: string
}

export interface StudentWeakness {
  texto: string
  evidencia: string
  accion_sugerida?: string
}

export interface StudentDetailedScore {
  componente: string
  tipo: string
  score: number
  percentil: string
  fecha: string
  intentos: number
  feedback?: string
  areas_fuertes?: string[]
  areas_mejora?: string[]
}

export interface EstudianteDetallado {
  id: string
  nombre: string
  email: string
  avatar_url?: string
  estado: StudentStatus
  fecha_invitacion: string
  fecha_primer_acceso: string
  ultima_actividad: string
  progreso_general: number
  componentes_completados: number
  componentes_totales: number
  score_promedio: number
  tiempo_total_horas: number
  alertas: Array<{
    tipo: string
    mensaje: string
    severidad: "high" | "medium" | "low"
  }>
  extensiones_activas: Array<{
    componente: string
    nueva_fecha: string
    razon: string
  }>
  progreso_detallado: ProgresoDetallado
  timeline_actividad: EventoActividad[]
  artefactos: StudentArtefact[]
  scores_detallados: StudentDetailedScore[]
  fortalezas: StudentStrength[]
  debilidades: StudentWeakness[]
  patron_estudio: PatronEstudio
  proximos_pasos: ProximoPaso[]
}

export interface ProgresoDetallado {
  fases: Array<{
    id: string
    numero: number
    nombre: string
    progreso: number
    estado: "completado" | "en_progreso" | "bloqueado"
    proof_points: Array<{
      id: string
      nombre: string
      estado: "completado" | "en_progreso" | "no_iniciado"
      score?: number
      fecha_completacion?: string
      niveles: Array<{
        id: string
        nombre: string
        componentes: Array<{
          id: string
          tipo: "leccion" | "cuaderno" | "simulacion" | "herramienta"
          nombre: string
          estado: ComponentStatus
          score?: number
          tiempo_min?: number
        }>
      }>
    }>
  }>
}

export interface EventoActividad {
  timestamp: string
  tipo: "completado" | "guardado" | "iniciado" | "mensaje"
  descripcion: string
  detalles?: {
    tiempo?: string
    score?: number
    seccion?: string
    palabras?: number
  }
}

export interface PatronEstudio {
  heatmap: Array<{
    dia: number // 0-6 (domingo-sábado)
    hora: number // 0-23
    minutos: number
  }>
  insights: string[]
}

export interface ProximoPaso {
  tipo: "accion_recomendada" | "repaso_sugerido"
  componente: string
  razon: string
  estimado: string
}

// Additional types that might be needed for the new interfaces
type StudentStatus = "activo" | "inactivo" | "pendiente"
type ComponentStatus = "completado" | "en_progreso" | "no_iniciado"
