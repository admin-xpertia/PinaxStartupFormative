export type TipoComponente = "leccion" | "cuaderno" | "simulacion" | "herramienta"

export type EstiloNarrativo = "academico" | "conversacional" | "narrativo" | "socratico"

export type TipoPregunta = "reflexion" | "aplicacion" | "analisis" | "sintesis"

export type PersonalidadPersonaje = "cooperativo" | "esceptico" | "ocupado" | "detallista"

// Configuración de generación
export interface GenerationConfig {
  // Contexto
  programa_nombre: string
  fase_nombre: string
  proof_point_nombre: string
  proof_point_pregunta: string
  nivel_nombre: string
  nivel_objetivo: string
  instrucciones_adicionales?: string
  conceptos_enfatizar: string[]
  casos_incluir: string[]

  // Configuración específica por tipo
  tipo_componente: TipoComponente
  nombre_componente: string

  // Para lecciones
  nivel_profundidad?: number
  estilo_narrativo?: EstiloNarrativo
  duracion_target?: number
  elementos_incluir?: string[]
  ejemplos_visuales?: string[]

  // Para cuadernos
  numero_secciones?: number
  tipos_pregunta?: TipoPregunta[]
  incluir_ejemplos_respuesta?: boolean
  nivel_guia?: number

  // Para simulaciones
  personaje?: PersonajeConfig
  escenario?: EscenarioConfig
  habilidades_evaluar?: string[]

  // Avanzado
  modelo_ia?: string
  temperatura?: number
  usar_few_shot?: boolean
}

export interface PersonajeConfig {
  nombre: string
  rol: string
  background: string
  personalidad: PersonalidadPersonaje
  estilo_comunicacion: string
}

export interface EscenarioConfig {
  contexto_situacion: string
  objetivo_conversacion: string
  duracion_estimada: number
  numero_respuestas_generar: number
}

// Contenido generado
export interface ContenidoGenerado {
  id: string
  tipo: TipoComponente
  nombre: string
  config_usada: GenerationConfig
  contenido: LeccionContent | CuadernoContent | SimulacionContent
  metadata: ContenidoMetadata
  analisis_calidad: AnalisisCalidad
  fecha_generacion: string
  estado: "preview" | "aceptado" | "editando"
}

export interface ContenidoMetadata {
  palabras?: number
  tiempo_lectura?: number
  secciones?: number
  ejemplos?: number
  actividades?: number
  preguntas?: number
}

export interface LeccionContent {
  markdown: string
  estructura: SeccionLeccion[]
}

export interface SeccionLeccion {
  tipo: "header" | "paragraph" | "list" | "quote" | "code" | "image" | "activity" | "quiz"
  contenido: string
  nivel?: number
}

export interface CuadernoContent {
  secciones: SeccionCuaderno[]
}

export interface SeccionCuaderno {
  id: string
  numero: number
  titulo: string
  instrucciones: string
  preguntas: PreguntaCuaderno[]
}

export interface PreguntaCuaderno {
  id: string
  pregunta: string
  tipo: TipoPregunta
  es_critica: boolean
  prompt_respuesta?: string
  ejemplo_respuesta_fuerte?: string
}

export interface SimulacionContent {
  personaje: PersonajeSimulacion
  banco_respuestas: RespuestaSimulacion[]
  criterios_evaluacion: CriterioEvaluacionSim[]
}

export interface PersonajeSimulacion {
  nombre: string
  rol: string
  background: string
  personalidad: PersonalidadPersonaje
  avatar_url?: string
  rasgos: string[]
}

export interface RespuestaSimulacion {
  id: string
  contexto_trigger: string
  texto_respuesta: string
  tags: string[]
  uso_stats: number
}

export interface CriterioEvaluacionSim {
  id: string
  nombre: string
  descriptor: string
  peso: number
  indicadores_positivos: string[]
  indicadores_negativos: string[]
}

// Análisis de calidad
export interface AnalisisCalidad {
  score_general: number
  metricas: MetricasCalidad
  sugerencias: Sugerencia[]
  comparacion_objetivos: ComparacionObjetivo[]
}

export interface MetricasCalidad {
  lecturabilidad?: MetricaDetalle
  cobertura_conceptos?: MetricaDetalle
  longitud?: MetricaDetalle
  ejemplos_practicos?: MetricaDetalle
  accesibilidad?: MetricaDetalle
  estructura_pedagogica?: MetricaDetalle
}

export interface MetricaDetalle {
  score: number
  detalles: string[]
  badge: "Excelente" | "Muy bien" | "Aceptable" | "Necesita mejora"
  sugerencia?: string
  nota?: string
}

export interface Sugerencia {
  id: string
  prioridad: "alta" | "media" | "baja"
  tipo: string
  titulo: string
  descripcion: string
  accion_disponible: boolean
}

export interface ComparacionObjetivo {
  objetivo: string
  cumplido: boolean
  nota?: string
}

// Templates
export interface PromptTemplate {
  id: string
  nombre: string
  tipo_componente: TipoComponente
  descripcion: string
  prompt_template: string
  config_default: Partial<GenerationConfig>
  autor: string
  es_oficial: boolean
  usos: number
  rating: number
  fecha_creacion: string
}
