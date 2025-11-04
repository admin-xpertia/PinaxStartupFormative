export type EventType = "desbloqueo_fase" | "deadline_proof_point" | "sesion_sincronica" | "recordatorio"

export interface CalendarEvent {
  id: string
  tipo: EventType
  titulo: string
  descripcion?: string
  fecha: string
  hora?: string
  duracion_minutos?: number
  estudiantes_afectados?: number
  estudiantes_completados?: number
  estudiantes_totales?: number
  plataforma?: string
  link?: string
  notificaciones_enviadas?: boolean
}
