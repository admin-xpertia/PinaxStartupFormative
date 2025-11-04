export type CommunicationType = "anuncio" | "mensaje_individual" | "recordatorio_automatico"
export type RecipientType = "toda_cohorte" | "filtrados" | "seleccionados" | "individual"
export type StudentStatus = "activo" | "inactivo" | "pendiente"

export interface Communication {
  id: string
  tipo: CommunicationType
  asunto: string
  contenido: string
  fecha_envio: string
  fecha_programada?: string
  remitente: string
  destinatarios: number
  destinatario_especifico?: string
  abierto_por: number
  respondido_por?: number
  adjuntos?: Attachment[]
}

export interface Attachment {
  id: string
  nombre: string
  tipo: string
  size_mb: number
  url: string
}

export interface MessageTemplate {
  id: string
  titulo: string
  asunto: string
  contenido: string
  categoria: "bienvenida" | "recordatorio" | "felicitacion" | "anuncio"
  variables: string[]
}

export interface MessageDraft {
  destinatarios: RecipientType
  estudiantes_seleccionados?: string[]
  filtros?: RecipientFilters
  asunto: string
  contenido: string
  enviar_email: boolean
  notificacion_plataforma: boolean
  programar_envio: boolean
  fecha_programada?: string
  adjuntos: Attachment[]
}

export interface RecipientFilters {
  estados?: StudentStatus[]
  progreso_min?: number
  progreso_max?: number
  ultima_actividad?: "24h" | "7d" | "30d" | "mas"
}
