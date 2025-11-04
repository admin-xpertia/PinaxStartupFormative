export type CohorteStatus = "activa" | "proxima" | "finalizada" | "archivada"
export type StudentStatus = "activo" | "en_riesgo" | "inactivo" | "completado"
export type AccessMode = "abierto" | "secuencial" | "programado"
export type AlertType = "inactividad" | "score_bajo" | "deadline_cercano" | "bloqueado"

export interface Cohorte {
  id: string
  nombre: string
  descripcion?: string
  programa: {
    id: string
    nombre: string
    version: string
  }
  estado: CohorteStatus
  fecha_inicio: string
  fecha_fin_estimada: string
  configuracion: CohorteConfig
  metricas: CohorteMetrics
  alertas?: CohorteAlert[]
}

export interface CohorteConfig {
  modo_acceso: AccessMode
  permitir_saltar_niveles: boolean
  reintentos_ilimitados: boolean
  notificaciones: {
    recordatorio_inactividad: {
      activo: boolean
      dias: number
    }
    recordatorio_deadline: boolean
    celebracion_completacion: boolean
  }
}

export interface CohorteMetrics {
  total_estudiantes: number
  estudiantes_activos: number
  progreso_promedio: number
  score_promedio: number
  tasa_completacion: number
  dias_restantes?: number
}

export interface CohorteAlert {
  tipo: "warning" | "info" | "error"
  texto: string
  count?: number
  link?: string
}

export interface CohorteStudent {
  id: string
  nombre: string
  email: string
  avatar?: string
  estado: StudentStatus
  fecha_invitacion: string
  fecha_primer_acceso?: string
  ultima_actividad: string
  progreso_general: number
  componentes_completados: number
  componentes_totales: number
  score_promedio: number
  alertas: StudentAlert[]
  extensiones_activas?: Extension[]
}

export interface StudentAlert {
  tipo: AlertType
  mensaje: string
  severidad: "high" | "medium" | "low"
}

export interface Extension {
  componente_id: string
  componente_nombre: string
  deadline_original: string
  nueva_deadline: string
  razon?: string
  fecha_otorgada: string
}

export interface ProgramVersion {
  version: string
  estado: "actual" | "anterior" | "beta"
  fecha: string
  cambios: string[]
  cohortes_usando: number
  recomendada?: boolean
  advertencia?: string
}
