export type StudentStatus = "activo" | "en_riesgo" | "inactivo"
export type ComponentStatus = "no_iniciado" | "en_progreso" | "completado" | "con_dificultad"
export type FrictionSeverity = "critico" | "importante" | "menor"
export type NotificationType =
  | "alerta_punto_friccion"
  | "estudiante_riesgo"
  | "completacion_proof_point"
  | "mensaje_estudiante"
  | "mejora_detectada"

export interface CohorteMetrics {
  tasa_completacion: number
  tiempo_promedio_componente: number
  score_promedio: number
  estudiantes_riesgo: number
}

export interface Cohorte {
  id: string
  nombre: string
  programa: string
  programa_id: string
  fecha_inicio: string
  fecha_fin: string
  num_estudiantes: number
  progreso_general: number
  estado: "activa" | "finalizada" | "proxima"
  metricas: CohorteMetrics
}

export interface ComponentProgress {
  id: string
  estado: ComponentStatus
  score?: number
  tiempo_min?: number
  progreso?: number
  fecha_completacion?: string
  intentos?: number
}

export interface Student {
  id: string
  nombre: string
  email: string
  avatar?: string
  estado: StudentStatus
  progreso_general: number
  componentes_completados: number
  componentes_totales: number
  score_promedio: number
  ultima_actividad: string
  tiempo_total_horas: number
  alertas?: string[]
  componentes: ComponentProgress[]
}

export interface FrictionPoint {
  id: string
  severidad: FrictionSeverity
  componente_id: string
  componente_nombre: string
  estudiantes_impactados: number
  estudiantes_totales: number
  tasa_abandono: number
  tiempo_promedio: number
  tiempo_esperado: number
  detectado: string
  analisis_ia: string
  sugerencias: string[]
}

export interface QualitativeTheme {
  tema: string
  frecuencia: number
  sentimiento: "positivo" | "neutral" | "negativo"
  ejemplos?: string[]
}

export interface Misconception {
  concepto: string
  frecuencia: number
  descripcion: string
  ejemplos: Array<{
    texto: string
    estudiante: string
    highlight?: string
  }>
  impacto: {
    score_promedio_afectados: number
    score_promedio_no_afectados: number
  }
}

export interface ActivityEvent {
  timestamp: string
  tipo: "completado" | "guardado" | "iniciado" | "mensaje"
  descripcion: string
  detalles?: Record<string, any>
}

export interface Notification {
  id: string
  tipo: NotificationType
  titulo: string
  timestamp: string
  leida: boolean
  accion?: string
  link?: string
}
